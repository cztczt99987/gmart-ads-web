import type { BasicUserInfo } from '@vben/types';

/**
 * 当前登录用户
 */
export interface CurrentUserInfo extends BasicUserInfo {
  email?: string;
  hasTkAuth?: boolean;
}
