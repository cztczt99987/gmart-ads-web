import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    account?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    uid: string;
    token: string;
    tokenExpiresAt: string;
    hasTkAuth: boolean;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 注册 */
  export interface RegisterParams {
    name: string;
    email: string;
    countryCode: string;
    phone: string;
    password: string;
    code: string;
  }

  /** 注册接口返回值 */
  export interface RegisterResult {
    uid: string;
    token: string;
    tokenExpiresAt: string;
    hasTkAuth: boolean;
  }

  /** 注册接口返回值 */
  export interface RestPassword {
    email: string;
    code: string;
    password: string;
  }

  /** 管理员修改密码参数 */
  export interface AdminChangePasswordParams {
    password: string;
    newPassword: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/v1/users/login', data);
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  // return baseRequestClient.post('/auth/logout', {
  //   withCredentials: true,
  // });
  return {};
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  // return requestClient.get<string[]>('/auth/codes');
  return [];
}

/**
 * 注册邮箱验证码
 */
export async function sendRegisterCodeApi(email: string) {
  return requestClient.post('/v1/users/register/email/code', {
    email,
  });
}

/**
 * 注册
 */
export async function registerUserApi(data: AuthApi.RegisterParams) {
  return requestClient.post<AuthApi.RegisterResult>('/v1/users/register', data);
}

/**
 * 忘记密码邮箱验证码
 */
export async function sendForgotCodeApi(email: string) {
  return requestClient.post('/v1/users/forgot/pwd/email/code', {
    email,
  });
}

/**
 * 修改密码
 */
export async function resetPasswordApi(data: AuthApi.RestPassword) {
  return requestClient.put('/v1/users/forgot/pwd', data);
}

/**
 * 管理员修改密码
 */
export async function adminChangePasswordApi(
  data: AuthApi.AdminChangePasswordParams,
) {
  return requestClient.put('/v1/admin/users/password', data, {
    responseReturn: 'body',
  });
}

/**
 * 获取手机号国家码
 */
export function getCountryList() {
  return [
    { label: '中国+86', value: '+86' },
    { label: '美国+1', value: '+1' },
    { label: '英国+44', value: '+44' },
    { label: '日本', value: '+81' },
    { label: '韩国', value: '+82' },
    { label: '加拿大', value: '+2' },
    { label: '澳大利亚', value: '+61' },
    { label: '德国', value: '+49' },
    { label: '法国', value: '+33' },
    { label: '意大利', value: '+39' },
    { label: '西班牙', value: '+34' },
    { label: '俄罗斯', value: '+7' },
    { label: '印度', value: '+91' },
    { label: '新加坡', value: '+65' },
    { label: '马来西亚', value: '+60' },
  ];
}
