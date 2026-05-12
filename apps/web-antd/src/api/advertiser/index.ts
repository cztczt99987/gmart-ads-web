import { requestClient } from '#/api/request';

/**
 * 开户记录查询参数
 */
export interface AdvertiserRecordQueryParams {
  page?: number;
  pageSize?: number;
  status?: string;
  companyName?: string;
  applyId?: string;
}

/**
 * 公司信息
 */
export interface CompanyInfo {
  id: string;
  name: string;
  licenseNo: string;
}

/**
 * 开户记录项
 */
export interface AdvertiserRecordItem {
  id: string;
  applyId: string;
  advertiserId: string;
  advertiserName: string;
  status: string;
  company: CompanyInfo;
  currency: string;
  timezone: string;
  timezoneCode: string;
  area: string;
  type: string;
  industry: string;
  industryId: string;
  promotionLink: string;
  reason: string;
  /** 后台审核状态：0待审核, 1审核通过, -1审核拒绝 */
  reviewStatus: number;
  /** 后台审核原因 */
  reviewRemark: string;
  /** 后台审核人 */
  reviewerId: string;
  /** 后台审核时间 */
  reviewedAt: string;
  /** 开户日期 */
  ttCreatedAt: string;
  createdAt: string;
}

/**
 * 开户记录列表响应
 */
export interface AdvertiserRecordListResponse {
  list: AdvertiserRecordItem[];
  total: number;
}

export interface AdvertiserListQueryParams {
  company?: string;
  advertiserName?: string;
  advertiserId?: string;
  advertiserStatus?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface AdvertiserListItem {
  id: string;
  bcId: string;
  advertiserId: string;
  advertiserName: null | string;
  advertiserStatus: string;
  company: string;
  advertiserType: null | string;
  currency: string;
  budgetCost: number | string;
  budgetRemaining: number | string;
  remark: string;
  createdAt: string;
}

export interface AdvertiserListResponse {
  list: AdvertiserListItem[];
  total: number;
}

export interface AdvertiserBindItem {
  partnerTableId: string;
  partnerId: string;
  partnerName: string;
}

export interface BcInfoItem {
  bcId: string;
  name: string;
}

export interface AdvertiserActionRecordQueryParams {
  id?: string;
  action?: string;
  actionStatus?: number;
  advertiserName?: string;
  advertiserId?: string;
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

export interface AdvertiserActionRecordItem {
  id: string;
  advertiserId: string;
  advertiserName: null | string;
  action: string;
  actionStatus: number;
  actionDescription: string;
  remark: string;
  createdAt: string;
  lastSyncAt: null | string;
}

export interface AdvertiserActionRecordResponse {
  list: AdvertiserActionRecordItem[];
  total: number;
}

/**
 * 开户申请参数
 */
export interface ApplyAdvertiserRequestDto {
  /** 开户公司id */
  companyId: string;
  /** 币种 */
  currency: string;
  /** 账户类型 */
  type: string;
  /** 账户名称 */
  advertiserName: string;
  /** 账户时区代码 */
  timezoneCode: string;
  /** 账户时区 */
  timezone: string;
  /** 推广链接 */
  promotionLink: string;
  /** 行业ID */
  industryId: number;
  /** 行业名称 */
  industry: string;
}

export type UpdateAdvertiserRequestDto = ApplyAdvertiserRequestDto;

/**
 * 广告账户申请
 * @param params 开户申请参数
 */
export async function applyAdvertiserApi(params: ApplyAdvertiserRequestDto) {
  return requestClient.post('/v1/bc/advertisers/apply', params);
}

/**
 * 更新广告账户申请
 * @param id 申请ID
 * @param params 更新参数
 */
export async function updateAdvertiserApplyApi(
  id: string,
  params: UpdateAdvertiserRequestDto,
) {
  return requestClient.put(`/v1/bc/advertisers/apply/${id}`, params);
}

/**
 * 获取开户记录列表
 * @param params 查询参数
 */
export async function getAdvertiserRecordListApi(
  params?: AdvertiserRecordQueryParams,
) {
  return requestClient.get<AdvertiserRecordListResponse>(
    '/v1/bc/advertisers/apply',
    {
      params,
    },
  );
}

export async function getAdvertiserListApi(params?: AdvertiserListQueryParams) {
  return requestClient.get<AdvertiserListResponse>('/v1/bc/advertisers', {
    params,
  });
}

export async function getAdvertiserActionRecordApi(
  params?: AdvertiserActionRecordQueryParams,
) {
  return requestClient.get<AdvertiserActionRecordResponse>(
    '/v1/bc/advertisers/record',
    {
      params,
    },
  );
}

export async function syncAdvertiserBalanceApi(id: string) {
  return requestClient.get(`/v1/bc/advertisers/sync/${id}`);
}

export async function rechargeAdvertiserApi(id: string, amount: number) {
  return requestClient.put(`/v1/bc/advertisers/recharge/${id}`, {
    amount,
  });
}

export async function refundAdvertiserApi(id: string, amount: number) {
  return requestClient.put(`/v1/bc/advertisers/refund/${id}`, {
    amount,
  });
}

export async function bindAdvertiserApi(id: string, partnerId: string) {
  return requestClient.post(`/v1/bc/advertisers/bind/${id}`, {
    partnerId,
  });
}

export async function unbindAdvertiserApi(
  id: string,
  partnerTableId: number | string,
) {
  return requestClient.delete(`/v1/bc/advertisers/unbind/${id}`, {
    data: {
      partnerTableId: String(partnerTableId),
    },
  });
}

export async function getAdvertiserBindListApi(advertiserId: string) {
  return requestClient.get<AdvertiserBindItem[]>(
    `/v1/bc/advertisers/bind/${advertiserId}`,
  );
}

export async function getBcInfoApi(bcId: string) {
  return requestClient.get<BcInfoItem[]>(`/v1/bc/info/${bcId}`);
}
