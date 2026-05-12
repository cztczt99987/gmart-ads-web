import { $t } from '@vben/locales';

// Get localized status options for dropdowns
export function getStatusOptions() {
  const map: Record<string, string> = {
    STATUS_DISABLE: $t('page.advertiser.record.statusClosed'),
    STATUS_PENDING_CONFIRM: $t('page.advertiser.record.statusPendingConfirm'),
    STATUS_PENDING_VERIFIED: $t('page.advertiser.record.statusPendingVerified'),
    STATUS_CONFIRM_FAIL: $t('page.advertiser.record.statusConfirmFail'),
    STATUS_ENABLE: $t('page.advertiser.record.statusEnable'),
    STATUS_CONFIRM_FAIL_END: $t('page.advertiser.record.statusConfirmFailEnd'),
    STATUS_PENDING_CONFIRM_MODIFY: $t(
      'page.advertiser.record.statusPendingConfirmModify',
    ),
    STATUS_CONFIRM_MODIFY_FAIL: $t(
      'page.advertiser.record.statusConfirmModifyFail',
    ),
    STATUS_LIMIT: $t('page.advertiser.record.statusLimit'),
    STATUS_WAIT_FOR_BPM_AUDIT: $t(
      'page.advertiser.record.statusWaitForBpmAudit',
    ),
    STATUS_WAIT_FOR_PUBLIC_AUTH: $t(
      'page.advertiser.record.statusWaitForPublicAuth',
    ),
    STATUS_SELF_SERVICE_UNAUDITED: $t(
      'page.advertiser.record.statusSelfServiceUnaudited',
    ),
    STATUS_CONTRACT_PENDING: $t('page.advertiser.record.statusContractPending'),
  };
  return Object.entries(map).map(([value, label]) => ({ label, value }));
}

// Get status display text
export function getStatusText(status: string) {
  const map: Record<string, string> = {
    STATUS_DISABLE: $t('page.advertiser.record.statusClosed'),
    STATUS_PENDING_CONFIRM: $t('page.advertiser.record.statusPendingConfirm'),
    STATUS_PENDING_VERIFIED: $t('page.advertiser.record.statusPendingVerified'),
    STATUS_CONFIRM_FAIL: $t('page.advertiser.record.statusConfirmFail'),
    STATUS_ENABLE: $t('page.advertiser.record.statusEnable'),
    STATUS_CONFIRM_FAIL_END: $t('page.advertiser.record.statusConfirmFailEnd'),
    STATUS_PENDING_CONFIRM_MODIFY: $t(
      'page.advertiser.record.statusPendingConfirmModify',
    ),
    STATUS_CONFIRM_MODIFY_FAIL: $t(
      'page.advertiser.record.statusConfirmModifyFail',
    ),
    STATUS_LIMIT: $t('page.advertiser.record.statusLimit'),
    STATUS_WAIT_FOR_BPM_AUDIT: $t(
      'page.advertiser.record.statusWaitForBpmAudit',
    ),
    STATUS_WAIT_FOR_PUBLIC_AUTH: $t(
      'page.advertiser.record.statusWaitForPublicAuth',
    ),
    STATUS_SELF_SERVICE_UNAUDITED: $t(
      'page.advertiser.record.statusSelfServiceUnaudited',
    ),
    STATUS_CONTRACT_PENDING: $t('page.advertiser.record.statusContractPending'),
  };
  return map[status] || status;
}

// Get account type display text
export function getTypeText(type: string) {
  const map: Record<string, string> = {
    AUCTION: $t('page.advertiser.record.auction'),
    RESERVATION: $t('page.advertiser.record.reservation'),
  };
  return map[type] || type;
}

// Keep for backward compatibility - statusMap with Chinese labels
export const statusMap: Record<string, string> = {
  STATUS_DISABLE: '该广告账户已关户',
  STATUS_PENDING_CONFIRM: '申请待审核',
  STATUS_PENDING_VERIFIED: '待验证',
  STATUS_CONFIRM_FAIL: '审核不通过',
  STATUS_ENABLE: '审核通过',
  STATUS_CONFIRM_FAIL_END: 'CRM审核不通过',
  STATUS_PENDING_CONFIRM_MODIFY: '修改待审核',
  STATUS_CONFIRM_MODIFY_FAIL: '修改审核不通过',
  STATUS_LIMIT: '用户被惩罚',
  STATUS_WAIT_FOR_BPM_AUDIT: '等待CRM审核',
  STATUS_WAIT_FOR_PUBLIC_AUTH: '待对公验证',
  STATUS_SELF_SERVICE_UNAUDITED: '自助开户待验证资质',
  STATUS_CONTRACT_PENDING: '合同未生效',
};

// Get review status display text
export function getReviewStatusText(reviewStatus: number) {
  const map: Record<number, string> = {
    0: $t('page.advertiser.record.reviewPending'),
    1: $t('page.advertiser.record.reviewApproved'),
    [-1]: $t('page.advertiser.record.reviewRejected'),
  };
  return map[reviewStatus] ?? '';
}

// Get review status tag color
export function getReviewStatusColor(reviewStatus: number) {
  const map: Record<number, string> = {
    0: 'warning',
    1: 'success',
    [-1]: 'error',
  };
  return map[reviewStatus] ?? 'default';
}
