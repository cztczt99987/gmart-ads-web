import { requestClient } from '#/api/request';

export namespace AdminRechargeApi {
  export interface RechargeRecordItem {
    [key: string]: any;
    amount: string;
    auditRemark?: string;
    auditTime?: string;
    createTime: string;
    id: number;
    status: AuditStatus;
    userId: string;
  }

  export type AuditStatus = -1 | 0 | 1;

  export interface RechargeListParams {
    [key: string]: any;
    page: number;
    size: number;
  }

  export interface RechargeListResult {
    list: RechargeRecordItem[];
    total: number;
  }

  export interface AuditParams {
    approvedAmount: number;
    rejectRemark?: string;
    status: number;
  }
}

export async function getAdminRechargeListApi(
  params: AdminRechargeApi.RechargeListParams,
) {
  const response = await requestClient.get<any>('/v1/admin/wallet/recharge', {
    params: {
      ...params,
    },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminRechargeApi.RechargeListResult;
    }
    throw payload;
  }
  return payload as AdminRechargeApi.RechargeListResult;
}

export async function auditRechargeApi(
  id: number,
  data: AdminRechargeApi.AuditParams,
) {
  const response = await requestClient.put<any>(
    `/v1/admin/wallet/recharge/${id}`,
    data,
    {
      responseReturn: 'body',
    },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}
