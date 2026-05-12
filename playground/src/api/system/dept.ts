import { requestClient } from '#/api/request';

export interface SystemDept {
  [key: string]: any;
  children?: SystemDept[];
  createdAt?: string;
  description?: string;
  id: string;
  name: string;
  parentId?: string;
  status: 0 | 1;
}

export interface DeptListResponse {
  list: SystemDept[];
  total: number;
}

type DeptPayload = Omit<SystemDept, 'children' | 'createdAt' | 'id'>;
type DeptUpdatePayload = Partial<DeptPayload>;

let deptApiMode: 'legacy' | 'rbac' | null = null;

function shouldFallbackToLegacy(error: any) {
  const status = error?.response?.status;
  return status === 404 || status === 405;
}

function normalizeFlag(value: unknown): 0 | 1 {
  return value === true || Number(value) === 1 ? 1 : 0;
}

function normalizeOptionalFlag(value: unknown): 0 | 1 | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return normalizeFlag(value);
}

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function normalizeParentId(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 0 ||
    value === '0'
  ) {
    return '';
  }
  return String(value);
}

function getListFromPayload(payload: any): any[] {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.list)) {
    return payload.list;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data?.list)) {
    return payload.data.list;
  }
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
}

function normalizeDept(item: any): SystemDept {
  return {
    ...item,
    children: Array.isArray(item.children)
      ? item.children.map(normalizeDept)
      : undefined,
    createdAt: item.createdAt ?? item.createTime,
    description: item.description ?? item.remark,
    id: String(item.id),
    name: item.name ?? '',
    parentId: normalizeParentId(item.parentId ?? item.pid) || undefined,
    status: normalizeFlag(item.status),
  };
}

function normalizeDeptListResponse(payload: any): DeptListResponse {
  const list = getListFromPayload(payload).map(normalizeDept);
  return {
    list,
    total: Number(payload?.total ?? payload?.data?.total ?? list.length),
  };
}

function normalizeDeptPayload(data: DeptUpdatePayload): DeptUpdatePayload {
  const parentId = normalizeParentId(data.parentId);
  return {
    ...data,
    description: normalizeOptionalText(data.description),
    name: normalizeOptionalText(data.name),
    parentId: parentId || undefined,
    status: normalizeOptionalFlag(data.status),
  };
}

function toLegacyDeptPayload(data: DeptUpdatePayload) {
  const normalizedData = normalizeDeptPayload(data);
  return {
    name: normalizedData.name,
    pid: normalizedData.parentId || 0,
    remark: normalizedData.description,
    status: normalizedData.status,
  };
}

async function withDeptFallback<T>(
  requestRbac: () => Promise<T>,
  requestLegacy: () => Promise<T>,
): Promise<T> {
  if (deptApiMode === 'legacy') {
    return requestLegacy();
  }

  try {
    const response = await requestRbac();
    deptApiMode = 'rbac';
    return response;
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const response = await requestLegacy();
    deptApiMode = 'legacy';
    return response;
  }
}

/**
 * 获取部门列表数据
 */
async function getDeptList() {
  return withDeptFallback(
    async () => {
      const response = await requestClient.get<unknown>('/v1/rbac/depts');
      return normalizeDeptListResponse(response);
    },
    async () => {
      const response = await requestClient.get<unknown>('/system/dept/list');
      return normalizeDeptListResponse(response);
    },
  );
}

/**
 * 创建部门
 * @param data 部门数据
 */
async function createDept(
  data: DeptPayload,
) {
  return withDeptFallback(
    () => requestClient.post('/v1/rbac/depts', normalizeDeptPayload(data)),
    () => requestClient.post('/system/dept', toLegacyDeptPayload(data)),
  );
}

/**
 * 更新部门
 *
 * @param id 部门 ID
 * @param data 部门数据
 */
async function updateDept(
  id: string,
  data: DeptUpdatePayload,
) {
  return withDeptFallback(
    () => requestClient.put(`/v1/rbac/depts/${id}`, normalizeDeptPayload(data)),
    () => requestClient.put(`/system/dept/${id}`, toLegacyDeptPayload(data)),
  );
}

/**
 * 删除部门
 * @param id 部门 ID
 */
async function deleteDept(id: string) {
  return withDeptFallback(
    () => requestClient.delete(`/v1/rbac/depts/${id}`),
    () => requestClient.delete(`/system/dept/${id}`),
  );
}

export { createDept, deleteDept, getDeptList, updateDept };
