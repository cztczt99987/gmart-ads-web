import { requestClient } from '#/api/request';

/**
 * 区域代码
 */
export interface AreaCode {
  /** 注册地 */
  area: string;
  /** 注册地代码 */
  code: string;
}

/**
 * 获取区域代码列表
 */
export async function getAreaListApi() {
  return requestClient.get<AreaCode[]>('/v1/area');
}
