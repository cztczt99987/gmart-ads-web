<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { WalletTransferRecordItem } from '#/api/wallet';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Card, message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getWalletBalanceApi,
  getWalletTransferRecordListApi,
} from '#/api/wallet';
import { $t } from '#/locales';

type TransferRecordRow = WalletTransferRecordItem;

const typeOptions = ref([
  { label: $t('page.finance.walletTransferRecord.userRecharge'), value: 1 },
  {
    label: $t('page.finance.walletTransferRecord.adAccountRecharge'),
    value: 2,
  },
  { label: $t('page.finance.walletTransferRecord.adAccountRefund'), value: 3 },
]);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'orderId',
      label: $t('page.finance.walletTransferRecord.orderId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: $t('page.finance.walletTransferRecord.type'),
      componentProps: {
        options: typeOptions,
        placeholder: $t('page.common.pleaseSelect'),
        allowClear: true,
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'submittedAt',
      label: $t('page.finance.walletTransferRecord.time'),
      componentProps: {
        placeholder: [$t('page.common.startDate'), $t('page.common.endDate')],
      },
    },
    {
      component: 'Input',
      fieldName: 'advertiserId',
      label: $t('page.finance.walletTransferRecord.adAccountId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
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

const typeLabelMap: Record<number, string> = {
  1: $t('page.finance.walletTransferRecord.userRecharge'),
  2: $t('page.finance.walletTransferRecord.adAccountRecharge'),
  3: $t('page.finance.walletTransferRecord.adAccountRefund'),
};

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

function getTypeColor(value?: number) {
  if (value === 1) return 'success';
  if (value === 2) return 'processing';
  if (value === 3) return 'warning';
  return 'default';
}

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

const gridOptions: VxeTableGridOptions<TransferRecordRow> = {
  align: 'left',
  headerAlign: 'left',
  columns: [
    {
      field: 'orderId',
      title: $t('page.finance.walletTransferRecord.orderId'),
      minWidth: 180,
    },
    {
      field: 'type',
      title: $t('page.finance.walletTransferRecord.type'),
      width: 140,
      slots: { default: 'type' },
    },
    {
      field: 'createdAt',
      title: $t('page.finance.walletTransferRecord.time'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'advertiserId',
      title: $t('page.finance.walletTransferRecord.adAccountId'),
      minWidth: 140,
    },
    {
      field: 'advertiserName',
      title: $t('page.finance.walletTransferRecord.adAccountName'),
      minWidth: 160,
    },
    {
      field: 'amount',
      title: $t('page.finance.walletTransferRecord.amount'),
      minWidth: 140,
    },
    {
      field: 'balance',
      title: $t('page.finance.walletTransferRecord.balance'),
      minWidth: 140,
    },
    {
      field: 'remark',
      title: $t('page.finance.walletTransferRecord.remark'),
      minWidth: 160,
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
            type:
              rest.type === undefined || rest.type === null
                ? undefined
                : Number(rest.type),
          });
          return await getWalletTransferRecordListApi(normalized);
        } catch {
          message.error(
            $t('page.finance.walletTransferRecord.fetchRecordFailed'),
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

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

async function loadWalletBalance() {
  try {
    const resp = await getWalletBalanceApi();
    walletBalance.value = Number(resp?.walletBalance ?? 0);
    adBalance.value = Number(resp?.adBalance ?? 0);
  } catch {
    message.error(
      $t('page.finance.walletTransferRecord.fetchWalletBalanceFailed'),
    );
  }
}

// function handleExport() {
//   message.info('导出功能待接入');
// }

// function handleHistory() {
//   message.info('历史记录功能待接入');
// }

onMounted(() => {
  loadWalletBalance();
});
</script>

<template>
  <Page
    auto-content-height
    :title="$t('page.finance.walletTransferRecord.title')"
  >
    <div class="flex flex-col gap-4">
      <Card>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="flex flex-col gap-2">
            <div class="text-sm text-gray-500">
              {{
                $t('page.finance.walletTransferRecord.walletAvailableBalance')
              }}
            </div>
            <div class="text-2xl font-semibold text-gray-900">
              {{ walletBalanceText }}
            </div>
          </div>
          <div class="flex flex-col gap-2 md:items-end">
            <div class="text-sm text-gray-500">
              {{
                $t('page.finance.walletTransferRecord.adAccountTotalBalance')
              }}
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

        <template #type="{ row }">
          <Tag :color="getTypeColor(row.type)">
            {{ typeLabelMap[row.type] ?? row.type ?? '-' }}
          </Tag>
        </template>
      </Grid>
    </div>
  </Page>
</template>
