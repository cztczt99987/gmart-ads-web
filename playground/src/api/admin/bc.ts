import { requestClient } from '#/api/request';

export namespace AdBcApi {
  export interface BcListParams {
    status?: number;
  }

  export interface BcInfo {
    bcId: string;
    createdAt: string;
    description: string;
    id: string;
    name: string;
    status: number;
    updatedAt: string;
  }

  export interface CreateBcParams {
    bcId: string;
    description?: string;
    name: string;
  }

  export interface UpdateBcParams {
    description?: string;
    name: string;
    status: number;
  }
}

export async function getAdBcListAllApi(params?: AdBcApi.BcListParams) {
  const response = await requestClient.get<AdBcApi.BcInfo[]>('/v1/ad-bc', {
    params: { ...params },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdBcApi.BcInfo[];
    }
    throw payload;
  }
  return payload as AdBcApi.BcInfo[];
}

export async function createAdBcApi(data: AdBcApi.CreateBcParams) {
  const response = await requestClient.post<any>('/v1/ad-bc', data, {
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}

export async function updateAdBcApi(id: string, data: AdBcApi.UpdateBcParams) {
  const response = await requestClient.put<any>(`/v1/ad-bc/${id}`, data, {
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}

export async function syncAdBcApi(bcId: string, lang: string = 'zh') {
  const response = await requestClient.get<any>(`/v1/ad-bc/sync/${bcId}`, {
    headers: { 'x-lang': lang },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdBcApi.BcInfo;
    }
    throw payload;
  }
  return payload as AdBcApi.BcInfo;
}

export async function deleteAdBcApi(id: string) {
  const response = await requestClient.delete<any>(`/v1/ad-bc/${id}`, {
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}
