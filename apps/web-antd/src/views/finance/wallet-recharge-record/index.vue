<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WalletRechargeRecordItem } from '#/api/wallet';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { formatDateTime } from '@vben/utils';

import { Card, message, Tag, Tooltip } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getWalletBalanceApi,
  getWalletRechargeRecordListApi,
} from '#/api/wallet';
import { $t } from '#/locales';

type RechargeRecordRow = WalletRechargeRecordItem;

const statusOptions = ref([
  { label: $t('page.finance.walletRechargeRecord.inReview'), value: 0 },
  { label: $t('page.finance.walletRechargeRecord.approved'), value: 1 },
  { label: $t('page.finance.walletRechargeRecord.rejected'), value: -1 },
]);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'orderId',
      label: $t('page.finance.walletRechargeRecord.orderId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'submittedAt',
      label: $t('page.finance.walletRechargeRecord.submittedAt'),
      componentProps: {
        placeholder: [$t('page.common.startDate'), $t('page.common.endDate')],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.finance.walletRechargeRecord.auditStatus'),
      componentProps: {
        options: statusOptions,
        placeholder: $t('page.common.pleaseSelect'),
        allowClear: true,
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: false,
  resetButtonOptions: {
    text: $t('page.common.reset'),
  },
  submitButtonOptions: {
    text: $t('page.common.search'),
    type: 'primary',
  },
};

const statusLabelMap: Record<number, string> = {
  [-1]: $t('page.finance.walletRechargeRecord.rejected'),
  0: $t('page.finance.walletRechargeRecord.inReview'),
  1: $t('page.finance.walletRechargeRecord.approved'),
};

// const enabledLabelMap: Record<number, string> = {
//   0: '启用',
//   1: '未启用',
// };

function getStatusColor(status?: number) {
  if (status === 1) return 'success';
  if (status === 0) return 'warning';
  if (status === -1) return 'error';
  return 'default';
}

// function getEnabledColor(value?: number) {
//   if (value === 0) return 'success';
//   if (value === 1) return 'default';
//   return 'default';
// }

function formatRangeDate(value: unknown, isEnd?: boolean) {
  if (!value) return undefined;
  let date: Date | undefined;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  } else if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  } else if (value instanceof Date) {
    date = value;
  } else if (
    typeof (value as { toISOString?: () => string })?.toISOString === 'function'
  ) {
    const parsed = new Date(
      (value as { toISOString: () => string }).toISOString(),
    );
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  }
  if (!date) return undefined;
  if (isEnd) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date.toISOString();
}

function normalizeQueryParams(values: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  Object.entries(values).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') return;
      result[key] = trimmed;
      return;
    }
    result[key] = value;
  });
  return result;
}

const walletBalance = ref(0);
const adBalance = ref(0);

const walletBalanceText = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(walletBalance.value),
);

const adBalanceText = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(adBalance.value),
);

const gridOptions: VxeTableGridOptions<RechargeRecordRow> = {
  align: 'left',
  headerAlign: 'left',
  columns: [
    {
      field: 'orderId',
      title: $t('page.finance.walletRechargeRecord.orderId'),
      minWidth: 180,
    },
    {
      field: 'applyAmount',
      title: $t('page.finance.walletRechargeRecord.applyAmount'),
      minWidth: 120,
    },
    {
      field: 'approvedAmount',
      title: $t('page.finance.walletRechargeRecord.approvedAmount'),
      minWidth: 120,
    },
    {
      field: 'currency',
      title: $t('page.finance.walletRechargeRecord.currency'),
      width: 90,
    },
    {
      field: 'paidAt',
      title: $t('page.finance.walletRechargeRecord.paidAt'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'clientRemark',
      title: $t('page.finance.walletRechargeRecord.clientRemark'),
      minWidth: 140,
    },
    {
      field: 'rejectRemark',
      title: $t('page.finance.walletRechargeRecord.rejectRemark'),
      minWidth: 140,
    },
    {
      field: 'status',
      title: $t('page.finance.walletRechargeRecord.auditStatus'),
      minWidth: 110,
      slots: { default: 'status' },
    },
    {
      field: 'createdAt',
      title: $t('page.finance.walletRechargeRecord.createdAt'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'updatedAt',
      title: $t('page.finance.walletRechargeRecord.updatedAt'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'company.id',
      title: $t('page.finance.walletRechargeRecord.companyId'),
      minWidth: 120,
    },
    {
      field: 'company.uid',
      title: $t('page.finance.walletRechargeRecord.companyUid'),
      minWidth: 120,
    },
    {
      field: 'company.name',
      title: $t('page.finance.walletRechargeRecord.companyName'),
      minWidth: 160,
    },
    {
      field: 'company.area',
      title: $t('page.finance.walletRechargeRecord.registrationLocation'),
      minWidth: 120,
    },
    {
      field: 'company.areaCode',
      title: $t('page.finance.walletRechargeRecord.registrationLocationCode'),
      width: 120,
    },
    {
      field: 'company.address',
      title: $t('page.finance.walletRechargeRecord.address'),
      minWidth: 200,
    },
    {
      field: 'company.licenseNo',
      title: $t('page.finance.walletRechargeRecord.licenseNo'),
      minWidth: 160,
    },
    // { field: 'company.licenseUrl', title: '营业执照', minWidth: 200 },
    // { field: 'company.imageId', title: '资质图片ID', minWidth: 160 },
    {
      field: 'company.taxNumber',
      title: $t('page.finance.walletRechargeRecord.taxNumber'),
      minWidth: 140,
    },
    {
      field: 'company.type',
      title: $t('page.finance.walletRechargeRecord.companyType'),
      width: 100,
    },
    {
      field: 'company.status',
      title: $t('page.finance.walletRechargeRecord.companyStatus'),
      width: 100,
    },
    // {
    //   field: 'company.isEnabled',
    //   title: '公司启用状态',
    //   minWidth: 130,
    //   slots: { default: 'enabled' },
    // },
    {
      field: 'company.contactName',
      title: $t('page.finance.walletRechargeRecord.contactName'),
      minWidth: 120,
    },
    {
      field: 'company.contactEmail',
      title: $t('page.finance.walletRechargeRecord.contactEmail'),
      minWidth: 200,
    },
    {
      field: 'company.contactNumber',
      title: $t('page.finance.walletRechargeRecord.contactNumber'),
      minWidth: 140,
    },
    {
      field: 'company.createdAt',
      title: $t('page.finance.walletRechargeRecord.companyCreatedAt'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'company.updatedAt',
      title: $t('page.finance.walletRechargeRecord.companyUpdatedAt'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
  ],
  data: [],
  exportConfig: {},
  height: 520,
  scrollX: {
    enabled: true,
  },
  keepSource: true,
  stripe: true,
  size: 'medium',
  rowConfig: {
    height: 56,
  },
  pagerConfig: {
    pageSizes: [
      { label: $t('page.company.create.page10'), value: 10 },
      { label: $t('page.company.create.page20'), value: 20 },
      { label: $t('page.company.create.page50'), value: 50 },
    ],
  },
  toolbarConfig: {
    custom: true,
    export: false,
    refresh: false,
    resizable: false,
    search: false,
    zoom: false,
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const { submittedAt, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(submittedAt)
            ? submittedAt
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            startDate: formatRangeDate(startDate),
            endDate: formatRangeDate(endDate, true),
            status:
              rest.status === undefined || rest.status === null
                ? undefined
                : Number(rest.status),
          });
          return await getWalletRechargeRecordListApi(normalized);
        } catch {
          message.error(
            $t('page.finance.walletRechargeRecord.fetchRecordFailed'),
          );
          return {
            list: [],
            total: 0,
          };
        }
      },
    },
  },
};

// @ts-ignore
const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// function handleExport() {
//   message.info('导出功能待接入');
// }

// function handleHistory() {
//   message.info('历史记录功能待接入');
// }

async function loadWalletBalance() {
  try {
    const resp = await getWalletBalanceApi();
    walletBalance.value = Number(resp?.walletBalance ?? 0);
    adBalance.value = Number(resp?.adBalance ?? 0);
  } catch {
    message.error(
      $t('page.finance.walletRechargeRecord.fetchWalletBalanceFailed'),
    );
  }
}

onMounted(() => {
  loadWalletBalance();
});
</script>

<template>
  <Page
    auto-content-height
    :title="$t('page.finance.walletRechargeRecord.title')"
  >
    <div class="flex flex-col gap-4">
      <Card>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-1 text-sm text-gray-500">
              <span>{{
                $t('page.finance.walletRechargeRecord.walletAvailableBalance')
              }}</span>
              <Tooltip
                :title="
                  $t(
                    'page.finance.walletRechargeRecord.walletAvailableBalanceTooltip',
                  )
                "
              >
                <IconifyIcon class="text-red-500" icon="lucide:help-circle" />
              </Tooltip>
            </div>
            <div class="text-2xl font-semibold text-gray-900">
              {{ walletBalanceText }}
            </div>
          </div>
          <div class="flex flex-col gap-2 md:items-end">
            <div class="flex items-center gap-1 text-sm text-gray-500">
              <span>{{
                $t('page.finance.walletRechargeRecord.adAccountBalance')
              }}</span>
              <Tooltip
                :title="
                  $t(
                    'page.finance.walletRechargeRecord.adAccountBalanceTooltip',
                  )
                "
              >
                <IconifyIcon class="text-red-500" icon="lucide:help-circle" />
              </Tooltip>
            </div>
            <div class="text-2xl font-semibold text-gray-900">
              {{ adBalanceText }}
            </div>
          </div>
        </div>
      </Card>

      <Grid>
        <!-- <template #toolbar-tools>
          <div class="flex w-full items-center justify-end gap-2">
            <Button type="link" size="small" @click="handleExport">导出</Button>
            <Button type="link" size="small" @click="handleHistory">
              历史记录
            </Button>
          </div>
        </template> -->

        <template #status="{ row }">
          <Tag :color="getStatusColor(row.status)">
            {{ statusLabelMap[row.status] ?? row.status ?? '-' }}
          </Tag>
        </template>

        <!-- <template #enabled="{ row }">
          <Tag :color="getEnabledColor(row.isEnabled)">
            {{ enabledLabelMap[row.isEnabled] ?? row.isEnabled ?? '-' }}
          </Tag>
        </template> -->
      </Grid>
    </div>
  </Page>
</template>
