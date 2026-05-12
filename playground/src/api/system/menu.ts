import { requestClient } from '#/api/request';

/** 菜单类型: 1目录 2菜单 3按钮 4内嵌 5外链 */
export type MenuType = 1 | 2 | 3 | 4 | 5;

/** 系统菜单 */
export interface SystemMenu {
  [key: string]: any;
  /** 子级 */
  children?: SystemMenu[];
  /** 组件路径 */
  component?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 菜单描述 */
  description?: string;
  /** 菜单ID */
  id: string;
  /** 图标 */
  icon?: string;
  /** 是否固定: 0否 1是 */
  isAffix: 0 | 1;
  /** 是否隐藏: 0否 1是 */
  isHidden: 0 | 1;
  /** 是否缓存: 0否 1是 */
  keepAlive: 0 | 1;
  /** 排序 */
  menuOrder: number;
  /** 菜单名称 */
  name: string;
  /** 无需基础布局: 0否 1是 */
  noBasicLayout: 0 | 1;
  /** 父级ID */
  parentId: string;
  /** 路由路径 */
  path: string;
  /** 权限ID */
  permissionId?: string;
  /** 权限信息 */
  permission?: {
    code: string;
    id: string;
    name: string;
  };
  /** 重定向 */
  redirect?: string;
  /** 状态: 0禁用 1启用 */
  status: 0 | 1;
  /** 菜单标题(支持i18n key) */
  title?: string;
  /** 菜单类型 */
  type: MenuType;
  /** 更新时间 */
  updatedAt?: string;
}

/** 菜单树节点 */
export interface MenuTreeNode {
  children?: MenuTreeNode[];
  component?: string;
  icon?: string;
  id: string;
  isAffix: 0 | 1;
  isHidden: 0 | 1;
  keepAlive: 0 | 1;
  name: string;
  noBasicLayout: 0 | 1;
  path: string;
  redirect?: string;
  title?: string;
  type: MenuType;
  checked?: boolean;
}

/** 菜单列表请求参数 */
export interface MenuListParams {
  name?: string;
  page?: number;
  pageSize?: number;
  status?: number;
  type?: MenuType;
}

/** 菜单列表响应 */
export interface MenuListResponse {
  list: SystemMenu[];
  total: number;
}

/** 菜单树响应 */
export interface MenuTreeResponse {
  list: MenuTreeNode[];
}

type LegacyMenuType = 'button' | 'catalog' | 'embedded' | 'link' | 'menu';
type MenuPayload = Omit<
  SystemMenu,
  'children' | 'createdAt' | 'id' | 'permission' | 'updatedAt'
>;
type MenuUpdatePayload = Partial<MenuPayload>;

const menuTypeMap: Record<LegacyMenuType, MenuType> = {
  button: 3,
  catalog: 1,
  embedded: 4,
  link: 5,
  menu: 2,
};

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

function normalizeMenuType(value: unknown): MenuType {
  if (typeof value === 'number' && value >= 1 && value <= 5) {
    return value as MenuType;
  }
  return menuTypeMap[(value as LegacyMenuType) ?? 'menu'] ?? 2;
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

function normalizeMenuNode(item: any): MenuTreeNode {
  return {
    checked: item.checked === true,
    children: Array.isArray(item.children)
      ? item.children.map(normalizeMenuNode)
      : undefined,
    component: item.component ?? '',
    icon: item.icon ?? item.meta?.icon ?? '',
    id: String(item.id),
    isAffix: normalizeFlag(item.isAffix ?? item.meta?.affixTab),
    isHidden: normalizeFlag(item.isHidden ?? item.meta?.hideInMenu),
    keepAlive: normalizeFlag(item.keepAlive ?? item.meta?.keepAlive),
    name: item.name ?? item.meta?.title ?? '',
    noBasicLayout: normalizeFlag(
      item.noBasicLayout ?? item.meta?.noBasicLayout,
    ),
    path: item.path ?? '',
    redirect: item.redirect ?? item.meta?.activePath,
    title: item.title ?? item.meta?.title ?? item.name ?? '',
    type: normalizeMenuType(item.type),
  };
}

export function normalizeMenuTreeResponse(payload: any): MenuTreeResponse {
  return {
    list: getListFromPayload(payload).map(normalizeMenuNode),
  };
}

function normalizeMenu(item: any): SystemMenu {
  const normalizedNode = normalizeMenuNode(item);
  return {
    children: Array.isArray(item.children)
      ? item.children.map(normalizeMenu)
      : undefined,
    component: normalizedNode.component,
    createdAt: item.createdAt ?? item.createTime,
    description: item.description ?? item.remark,
    icon: normalizedNode.icon,
    id: normalizedNode.id,
    isAffix: normalizedNode.isAffix,
    isHidden: normalizedNode.isHidden,
    keepAlive: normalizedNode.keepAlive,
    menuOrder: Number(item.menuOrder ?? item.meta?.order ?? 0),
    name: normalizedNode.name,
    noBasicLayout: normalizedNode.noBasicLayout,
    parentId: normalizeParentId(item.parentId ?? item.pid),
    path: normalizedNode.path,
    permission:
      item.permission ??
      (item.authCode
        ? {
            code: item.authCode,
            id: '',
            name: item.authCode,
          }
        : undefined),
    permissionId: item.permissionId ?? item.permission?.id ?? item.authCode,
    redirect: normalizedNode.redirect,
    status: normalizeFlag(item.status),
    title: normalizedNode.title,
    type: normalizedNode.type,
  };
}

function normalizeMenuListResponse(payload: any): MenuListResponse {
  const list = getListFromPayload(payload).map(normalizeMenu);
  return {
    list,
    total: Number(payload?.total ?? payload?.data?.total ?? list.length),
  };
}

function normalizeMenuPayload(data: MenuUpdatePayload): MenuUpdatePayload {
  const parentId = normalizeParentId(data.parentId);

  return {
    ...data,
    component: normalizeOptionalText(data.component),
    description: normalizeOptionalText(data.description),
    icon: normalizeOptionalText(data.icon),
    isAffix: normalizeOptionalFlag(data.isAffix),
    isHidden: normalizeOptionalFlag(data.isHidden),
    keepAlive: normalizeOptionalFlag(data.keepAlive),
    menuOrder:
      data.menuOrder === undefined ? undefined : Number(data.menuOrder ?? 0),
    name: normalizeOptionalText(data.name),
    noBasicLayout: normalizeOptionalFlag(data.noBasicLayout),
    parentId: parentId || undefined,
    path: normalizeOptionalText(data.path),
    permissionId: normalizeOptionalText(data.permissionId),
    redirect: normalizeOptionalText(data.redirect),
    status: normalizeOptionalFlag(data.status),
    title: normalizeOptionalText(data.title),
    type: data.type === undefined ? undefined : normalizeMenuType(data.type),
  };
}

function findMenuById(list: SystemMenu[], id: string): SystemMenu | undefined {
  for (const item of list) {
    if (String(item.id) === String(id)) {
      return item;
    }
    if (item.children?.length) {
      const matchedItem = findMenuById(item.children, id);
      if (matchedItem) {
        return matchedItem;
      }
    }
  }
  return undefined;
}

/**
 * 获取菜单列表(分页)
 */
async function getMenuList(params?: MenuListParams) {
  try {
    const response = await requestClient.get<unknown>('/v1/rbac/menus', {
      params,
    });
    return normalizeMenuListResponse(response);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const response = await requestClient.get<unknown>('/system/menu/list');
    return normalizeMenuListResponse(response);
  }
}

/**
 * 获取菜单树
 */
async function getMenuTree() {
  try {
    const response = await requestClient.get<unknown>('/v1/rbac/menus/tree');
    return normalizeMenuTreeResponse(response);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const response = await requestClient.get<unknown>('/system/menu/list');
    return normalizeMenuTreeResponse(response);
  }
}

/**
 * 获取菜单详情
 */
async function getMenuDetail(id: string) {
  try {
    const response = await requestClient.get<unknown>(`/v1/rbac/menus/${id}`);
    return normalizeMenu(response);
  } catch (error) {
    if (!shouldFallbackToLegacy(error)) {
      throw error;
    }
    const { list } = await getMenuList();
    const matchedItem = findMenuById(list, id);
    if (!matchedItem) {
      throw error;
    }
    return matchedItem;
  }
}

/**
 * 创建菜单
 */
async function createMenu(
  data: MenuPayload,
) {
  return requestClient.post('/v1/rbac/menus', normalizeMenuPayload(data));
}

/**
 * 更新菜单
 */
async function updateMenu(
  id: string,
  data: MenuUpdatePayload,
) {
  return requestClient.put(`/v1/rbac/menus/${id}`, normalizeMenuPayload(data));
}

/**
 * 删除菜单
 */
async function deleteMenu(id: string) {
  return requestClient.delete(`/v1/rbac/menus/${id}`);
}

export { createMenu, deleteMenu, getMenuDetail, getMenuList, getMenuTree, updateMenu };
