import { requestClient } from '#/api/request';

export namespace AdminRefundApi {
  export interface RefundListParams {
    endDate?: string;
    orderId?: string;
    page: number;
    pageSize: number;
    startDate?: string;
    status?: number;
    uid?: string;
  }

  export interface SimpleUserDto {
    name: string;
    uid: string;
  }

  export interface RefundOrderItem {
    currency: Record<string, any>;
    id: string;
    operator: SimpleUserDto;
    orderId: string;
    payerAccount: Record<string, any>;
    paymentType: number;
    receivingAccount: string;
    refundAmount: number;
    relatedRechargeOrder: Record<string, any>;
    remark: string;
    status: number;
    updatedAt: string;
    userDto: SimpleUserDto;
    vouchers: string[];
  }

  export interface RefundListResult {
    list: RefundOrderItem[];
    total: number;
  }

  export interface ApplyRefundParams {
    currency: string;
    payerAccountId: string;
    receivingAccount: string;
    refundAmount: number;
    remark?: string;
    uid: string;
    vouchers: string[];
  }

  export interface ReceivingAccountItem {
    [key: string]: any;
    id: string;
  }
}

export async function getAdminRefundListApi(
  params: AdminRefundApi.RefundListParams,
) {
  const response = await requestClient.get<any>('/v1/admin/wallet/refund', {
    params: { ...params },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return payload.data as AdminRefundApi.RefundListResult;
    }
    throw payload;
  }
  return payload as AdminRefundApi.RefundListResult;
}

export async function applyRefundApi(data: AdminRefundApi.ApplyRefundParams) {
  const response = await requestClient.post<any>(
    '/v1/admin/wallet/refund',
    data,
    { responseReturn: 'body' },
  );
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return payload;
}

export async function getReceivingAccountListApi() {
  const response = await requestClient.get<any>('/v1/receiving-account', {
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined) {
    if (payload.code === 0) {
      return (payload.data ?? []) as AdminRefundApi.ReceivingAccountItem[];
    }
    throw payload;
  }
  return (payload ?? []) as AdminRefundApi.ReceivingAccountItem[];
}

export async function uploadFileApi(file: File, bizType: number = 4) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizType', String(bizType));
  const response = await requestClient.post<any>('/v1/file', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    responseReturn: 'body',
  });
  const payload = response ?? {};
  if (payload?.code !== undefined && payload.code !== 0) {
    throw payload;
  }
  return (payload.data ?? payload) as any;
}
