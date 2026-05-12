import type { UserInfo } from '@vben/types';

import { requestClient } from '#/api/request';

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  if (import.meta.env.DEV) {
    return {
      userId: 'admin',
      username: 'admin',
      realName: '管理员',
      roles: ['admin'],
      homePath: '/finance/recharge-audit',
    } as UserInfo;
  }
  try {
    return await requestClient.get<UserInfo>('/user/info');
  } catch (error) {
    console.warn('Failed to get user info, using mock data', error);
    return {
      userId: 'admin',
      username: 'admin',
      realName: '管理员',
      roles: ['admin'],
      homePath: '/finance/recharge-audit',
    } as UserInfo;
  }
}
