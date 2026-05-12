import { requestClient } from '#/api/request';

// 用户信息类型
export interface UserInfo {
  id: string;
  email: string;
  countryCode: string;
  phone: string;
  name: string;
}

// 修改用户信息参数
export interface UpdateUserParams {
  name?: string;
  countryCode?: string;
  phone?: string;
}

// 修改密码参数
export interface ChangePasswordParams {
  password: string;
  newPassword: string;
}

// 修改邮箱参数
export interface ChangeEmailParams {
  email: string;
  code: string;
}

/**
 * 获取用户信息
 */
export async function getUserInfoApi() {
  return requestClient.get<UserInfo>('/v1/users');
}

/**
 * 修改用户信息
 */
export async function updateUserInfoApi(data: UpdateUserParams) {
  return requestClient.put<UserInfo>('/v1/users', data);
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: ChangePasswordParams) {
  return requestClient.put('/v1/users/password', data);
}

/**
 * 发送旧邮箱验证码
 */
export async function sendOldEmailCodeApi() {
  return requestClient.post('/v1/users/old/email/code');
}

/**
 * 发送新邮箱验证码
 */
export async function sendNewEmailCodeApi(email: string, code: string) {
  return requestClient.post('/v1/users/new/email/code', { email, code });
}

/**
 * 修改邮箱
 */
export async function changeEmailApi(data: ChangeEmailParams) {
  return requestClient.put('/v1/users/email', data);
}
