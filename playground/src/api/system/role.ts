import { requestClient } from '#/api/request';

import type { MenuTreeNode } from './menu';

import { normalizeMenuTreeResponse } from './menu';

/** 系统角色 */
export interface SystemRole {
  [key: string]: any;
  /** 角色编码 */
  code: string;
  /** 创建时间 */
  createdAt?: string;
  /** 角色描述 */
  description?: string;
  /** 角色ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 排序 */
  sort: number;
  /** 状态: 0禁用 1启用 */
  status: 0 | 1;
  /** 更新时间 */
  updatedAt?: string;
}

/** 角色列表请求参数 */
export interface RoleListParams {
  code?: string;
  name?: string;
  page?: number;
  pageSize?: number;
  status?: number;
}

/** 角色列表响应 */
export interface RoleListResponse {
  list: SystemRole[];
  total: number;
}

/** 角色菜单树响应 */
export interface RoleMenuTreeResponse {
  list: MenuTreeNode[];
}

type RolePayload = Omit<SystemRole, 'createdAt' | 'id' | 'updatedAt'>;
type RoleUpdatePayload = Partial<RolePayload>;

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

function normalizeRole(item: any): SystemRole {
  return {
    ...item,
    code: item.code ?? '',
    createdAt: item.createdAt ?? item.createTime,
    description: item.description ?? item.remark,
    id: String(item.id),
    name: item.name ?? '',
    sort: Number(item.sort ?? 0),
    status: normalizeFlag(item.status),
  };
}

function normalizeRoleListResponse(payload: any): RoleListResponse {
  const list = getListFromPayload(payload).map(normalizeRole);
  return {
    list,
    total: Number(payload?.total ?? payload?.data?.total ?? list.length),
  };
}

function normalizeRolePayload(data: RoleUpdatePayload): RoleUpdatePayload {
  return {
    ...data,
    code: normalizeOptionalText(data.code),
    description: normalizeOptionalText(data.description),
    name: normalizeOptionalText(data.name),
    sort: data.sort === undefined ? undefined : Number(data.sort ?? 0),
    status: normalizeOptionalFlag(data.status),
  };
}

function findRoleById(list: SystemRole[], id: string): SystemRole | undefined {
  return list.find((item) => String(item.id) === String(id));
}

/**
 * 获取角色列表(分页)
 */
async function getRoleList(params?: RoleListParams) {
  try {
    const response = await requestClient.get<unknown>('/v1/rbac/roles', {
      params,
    });
    return normalizeRoleListResponse(response);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const response = await requestClient.get<unknown>('/system/role/list', {
      params,
    });
    return normalizeRoleListResponse(response);
  }
}

/**
 * 获取角色详情
 */
async function getRoleDetail(id: string) {
  try {
    const response = await requestClient.get<unknown>(`/v1/rbac/roles/${id}`);
    return normalizeRole(response);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const { list } = await getRoleList();
    const matchedItem = findRoleById(list, id);
    if (!matchedItem) {
      throw error;
    }
    return matchedItem;
  }
}

/**
 * 获取所有启用的角色
 */
async function getEnabledRoles() {
  try {
    const response = await requestClient.get<unknown>('/v1/rbac/roles/enabled');
    return getListFromPayload(response).map(normalizeRole);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const { list } = await getRoleList({ status: 1 });
    return list.filter((item) => item.status === 1);
  }
}

/**
 * 获取角色菜单树(包含已勾选状态)
 */
async function getRoleMenuTree(id: string) {
  const response = await requestClient.get<unknown>(`/v1/rbac/roles/${id}/menus`);
  return normalizeMenuTreeResponse(response);
}

/**
 * 分配菜单给角色
 */
async function assignRoleMenus(id: string, menuIds: string[]) {
  try {
    return await requestClient.put(`/v1/rbac/roles/${id}/menus`, menuIds);
  } catch (error) {
    const status = (error as any)?.response?.status;
    if (status !== 400 && status !== 422) {
      throw error;
    }
    return requestClient.put(`/v1/rbac/roles/${id}/menus`, { menuIds });
  }
}

/**
 * 创建角色
 */
async function createRole(
  data: RolePayload,
) {
  return requestClient.post('/v1/rbac/roles', normalizeRolePayload(data));
}

/**
 * 更新角色
 */
async function updateRole(
  id: string,
  data: RoleUpdatePayload,
) {
  return requestClient.put(`/v1/rbac/roles/${id}`, normalizeRolePayload(data));
}

/**
 * 删除角色
 */
async function deleteRole(id: string) {
  return requestClient.delete(`/v1/rbac/roles/${id}`);
}

export {
  assignRoleMenus,
  createRole,
  deleteRole,
  getEnabledRoles,
  getRoleDetail,
  getRoleList,
  getRoleMenuTree,
  updateRole,
};
