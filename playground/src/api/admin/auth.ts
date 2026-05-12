import { baseRequestClient, requestClient } from '#/api/request';

export namespace AdminAuthApi {
  export interface LoginParams {
    account: string;
    password: string;
  }

  export interface LoginResult {
    hasTkAuth: boolean;
    token: string;
    tokenExpiresAt: string;
    uid: number;
  }
}

export async function adminLoginApi(data: AdminAuthApi.LoginParams) {
  try {
    const response = await baseRequestClient.post<any>(
      '/v1/admin/users/login',
      data,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    );

    const payload = response?.data ?? response;
    if (payload?.code !== undefined) {
      if (payload.code === 0) {
        return payload.data as AdminAuthApi.LoginResult;
      }
      throw payload;
    }
    return payload as AdminAuthApi.LoginResult;
  } catch (error) {
    if (import.meta.env.DEV) {
      const tokenExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000,
      ).toISOString();
      return {
        hasTkAuth: false,
        token: `dev-token-${Date.now()}`,
        tokenExpiresAt,
        uid: 1,
      };
    }
    throw error;
  }
}

export async function adminLogoutApi() {
  // TODO: 实现登出逻辑
}

export async function adminChangePasswordApi(data: {
  newPassword: string;
  password: string;
}) {
  return requestClient.put('/v1/admin/users/password', data, {
    responseReturn: 'body',
  });
}
