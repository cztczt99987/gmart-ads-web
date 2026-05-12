import { requestClient } from '#/api/request';

export interface WalletInfo {
  uid?: string;
  balance?: string;
  availableBalance?: number;
  pendingRechargeAmount?: number;
  walletCurrency?: string;
  pendingCurrency?: string;
  pendingRechargeCurrency?: string;
  available?: number;
  balanceAvailable?: number;
  pendingAmount?: number;
  advertiserPendingAmount?: number;
  currency?: string;
}

export interface ReceivingAccountItem {
  id: string;
  accountType: number;
  /** 分类排序: 1=USD 2=USDT 3=其他 4=CNY */
  sort: number;
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  bankAddress?: string;
  accountOpeningArea?: string;
  swiftCode?: string;
  bankCode?: string;
  branchCode?: string;
  paymentCode?: string;
  taxId?: string;
}

export interface WalletRechargeRequest {
  applyAmount: number;
  payerAccount: {
    companyName?: string;
    walletAddress?: string;
  };
  receivingAccountId: string;
  paidAt: string;
  vouchers: string[];
  clientRemark?: string;
}

export interface UploadFileResponse {
  id: string;
}

export interface WalletRechargeRecordQueryParams {
  page?: number;
  pageSize?: number;
  orderId?: string;
  status?: number;
  startDate?: string;
  endDate?: string;
}

export interface WalletRechargeCompanyInfo {
  id: string;
  uid: string;
  area: string;
  name: string;
  type: number;
  status: number;
  address: string;
  imageId: string;
  areaCode: string;
  createdAt: string;
  isEnabled: number;
  licenseNo: string;
  taxNumber: string;
  updatedAt: string;
  licenseUrl: string;
  contactName: string;
  contactEmail: string;
  contactNumber: string;
}

export interface WalletRechargeRecordItem {
  id: string;
  orderId: string;
  applyAmount: string;
  approvedAmount: string;
  currency: string;
  paidAt: string;
  clientRemark: string;
  rejectRemark: string;
  status: number;
  createdAt: string;
  updatedAt: null | string;
  company: WalletRechargeCompanyInfo;
  vouchers: string[];
}

export interface WalletRechargeRecordResponse {
  list: WalletRechargeRecordItem[];
  total: number;
}

export interface WalletTransferRecordQueryParams {
  page?: number;
  pageSize?: number;
  orderId?: string;
  advertiserId?: string;
  type?: number;
  startDate?: string;
  endDate?: string;
}

export interface WalletTransferRecordItem {
  id: string;
  orderId: string;
  advertiserId: string;
  advertiserName: string;
  type: number;
  createdAt: string;
  balanceBefore: string;
  amount: string;
  balanceAfter: string;
  remark: string;
}

export interface WalletTransferRecordResponse {
  list: WalletTransferRecordItem[];
  total: number;
}

export interface WalletBalanceResponse {
  walletBalance: number;
  adBalance: number;
}

export async function getWalletInfoApi() {
  return requestClient.get<WalletInfo>('/v1/wallet');
}

export async function getReceivingAccountListApi() {
  return requestClient.get<ReceivingAccountItem[]>('/v1/receiving-account');
}

export async function uploadFileApi(file: File, bizType: number) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('bizType', String(bizType));
  return requestClient.post<UploadFileResponse>('/v1/file', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export async function walletRechargeApi(data: WalletRechargeRequest) {
  return requestClient.post('/v1/wallet/recharge', data);
}

export async function getWalletRechargeRecordListApi(
  params?: WalletRechargeRecordQueryParams,
) {
  return requestClient.get<WalletRechargeRecordResponse>(
    '/v1/wallet/recharge',
    {
      params,
    },
  );
}

export async function getWalletTransferRecordListApi(
  params?: WalletTransferRecordQueryParams,
) {
  return requestClient.get<WalletTransferRecordResponse>(
    '/v1/wallet/transfer',
    {
      params,
    },
  );
}

export async function getWalletBalanceApi() {
  return requestClient.get<WalletBalanceResponse>('/v1/wallet/balance');
}
