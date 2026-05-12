import { requestClient } from '#/api/request';

export namespace AdminAdvertiserApi {
  export interface AdvertiserListParams {
    advertiserId?: string;
    advertiserName?: string;
    advertiserStatus?: string;
    company?: string;
    endDate?: string;
    isValid?: number;
    page: number;
    pageSize: number;
    startDate?: string;
  }

  export interface AdvertiserInfo {
    advertiserId: string;
    advertiserName: string;
    advertiserStatus: string;
    advertiserType: string;
    bcId: string;
    budgetCost: number;
    budgetRemaining: number;
    company: string;
    createdAt: string;
    currency: string;
    id: string;
    isValid: number;
    remark: string;
  }

  export interface AdvertiserListResult {
    list: AdvertiserInfo[];
    total: number;
  }

  export interface UpdateValidParams {
    remark?: string;
    valid: number;
  }

  export interface BatchAddItem {
    advertiserId: string;
    bcId: string;
    partnerId: string;
    uid: string;
  }

  export interface UserInfo {
    email: string;
    id: string;
    name: string;
    status: number;
    type: number;
  }

  export interface UserListResult {
    list: UserInfo[];
  }

  export interface BcInfo {
    bcId: string;
    createdAt: string;
    description: string;
    name: string;
    status: number;
    updatedAt: string;
  }

  export interface BatchCreateResult {
    advertiserId: string;
    error: string;
    success: boolean;
  }

  export interface BatchCreateResponse {
    failCount: number;
    results: BatchCreateResult[];
    successCount: number;
  }

  export interface AdvertiserApplyListParams {
    applyEnd?: string;
    applyId?: string;
    applyStart?: string;
    companyId?: string;
    page: number;
    pageSize: number;
    reviewEnd?: string;
    reviewStart?: string;
    reviewStatus?: number;
    status?: string;
  }

  export interface ApplyCompanyInfo {
    area: string;
    contactEmail: string;
    contactName: string;
    contactNumber: string;
    countryCode: string;
    id: string;
    licenseFileId: string;
    licenseNo: string;
    licenseUrl: string;
    name: string;
  }

  export interface AdvertiserApplyInfo {
    advertiserId: null | string;
    advertiserName: string;
    applyId: string;
    area: string;
    company: ApplyCompanyInfo;
    createdAt: string;
    currency: string;
    id: string;
    industry: string;
    industryId: string;
    promotionLink: string;
    reason: string;
    reviewedAt: null | string;
    reviewerId: string;
    reviewRemark: string;
    reviewStatus: number;
    status: string;
    timezone: string;
    timezoneCode: string;
    ttCreatedAt: null | string;
    type: string;
  }

  export interface AdvertiserApplyListResult {
    list: AdvertiserApplyInfo[];
    total: number;
  }

  export interface AuditApplyParams {
    adBcId?: string;
    reviewRemark?: string;
    reviewStatus: number;
  }
}

export async function getAdminAdvertiserListApi(
  params: AdminAdvertiserApi.AdvertiserListParams,
) {
  const response = await requestClient.get<any>('/v1/admin/bc/advertisers', {
    params: { ...params },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminAdvertiserApi.AdvertiserListResult;
    }
    throw payload;
  }
  return payload as AdminAdvertiserApi.AdvertiserListResult;
}

export async function updateAdvertiserValidApi(
  id: string,
  data: AdminAdvertiserApi.UpdateValidParams,
) {
  const response = await requestClient.put<any>(
    `/v1/admin/bc/advertisers/valid/${id}`,
    data,
    { responseReturn: 'body' },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}

export async function batchAddAdvertiserApi(
  data: AdminAdvertiserApi.BatchAddItem[],
) {
  const response = await requestClient.post<any>(
    '/v1/admin/bc/advertisers/batch',
    data,
    { responseReturn: 'body' },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return (payload.data ?? payload) as AdminAdvertiserApi.BatchCreateResponse;
}

export async function getAdminUsersApi() {
  const response = await requestClient.get<AdminAdvertiserApi.UserListResult>(
    '/v1/admin/users',
    {
      params: { type: 0, status: 1 },
      responseReturn: 'body',
    },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminAdvertiserApi.UserListResult;
    }
    throw payload;
  }
  return payload as AdminAdvertiserApi.UserListResult;
}

export async function getAdBcListApi() {
  const response = await requestClient.get<AdminAdvertiserApi.BcInfo[]>(
    '/v1/ad-bc',
    {
      params: { status: 1 },
      responseReturn: 'body',
    },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminAdvertiserApi.BcInfo[];
    }
    throw payload;
  }
  return payload as AdminAdvertiserApi.BcInfo[];
}

export async function getAdminAdvertiserApplyListApi(
  params: AdminAdvertiserApi.AdvertiserApplyListParams,
) {
  const response = await requestClient.get<any>(
    '/v1/admin/bc/advertisers/apply',
    {
      params: { ...params },
      responseReturn: 'body',
    },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminAdvertiserApi.AdvertiserApplyListResult;
    }
    throw payload;
  }
  return payload as AdminAdvertiserApi.AdvertiserApplyListResult;
}

export async function auditAdvertiserApplyApi(
  id: string,
  data: AdminAdvertiserApi.AuditApplyParams,
) {
  const response = await requestClient.put<any>(
    `/v1/admin/bc/advertisers/apply/${id}`,
    data,
    { responseReturn: 'body' },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}
