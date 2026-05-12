<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdvertiserBindItem, AdvertiserListItem } from '#/api/advertiser';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { formatDateTime } from '@vben/utils';

import {
  Button,
  Checkbox,
  Input,
  InputNumber,
  message,
  Modal,
  Radio,
  Spin,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  bindAdvertiserApi,
  getAdvertiserBindListApi,
  getAdvertiserListApi,
  rechargeAdvertiserApi,
  refundAdvertiserApi,
  syncAdvertiserBalanceApi,
  unbindAdvertiserApi,
} from '#/api/advertiser';
import { getWalletBalanceApi } from '#/api/wallet';

interface AdAccountRow extends AdvertiserListItem {}

const statusOptions = ref([
  {
    label: $t('page.adAccount.list.notApproved'),
    value: 'SHOW_ACCOUNT_STATUS_NOT_APPROVED',
  },
  {
    label: $t('page.adAccount.list.approved'),
    value: 'SHOW_ACCOUNT_STATUS_APPROVED',
  },
  {
    label: $t('page.adAccount.list.inReview'),
    value: 'SHOW_ACCOUNT_STATUS_IN_REVIEW',
  },
  {
    label: $t('page.adAccount.list.punished'),
    value: 'SHOW_ACCOUNT_STATUS_PUNISHED',
  },
]);

const router = useRouter();
const rechargeVisible = ref(false);
const deductVisible = ref(false);
const bindVisible = ref(false);
const bcVisible = ref(false);
const activeRow = ref<AdAccountRow | null>(null);
const rechargeAmount = ref<number>();
const deductAmount = ref<number>();
const walletAvailable = ref(0);
const gridRef = ref<any>(null);
const bindMode = ref<'bind' | 'unbind'>('bind');
const bindInput = ref('');
const bindList = ref<AdvertiserBindItem[]>([]);
const bindSelected = ref<string[]>([]);
const bindLoading = ref(false);
const rechargeLoading = ref(false);
const deductLoading = ref(false);
const bcInfoList = ref<AdvertiserBindItem[]>([]);
const bcInfoLoading = ref(false);

const currentCurrency = computed(() => activeRow.value?.currency || 'USD');
const allBindSelected = computed(
  () =>
    bindList.value.length > 0 &&
    bindSelected.value.length === bindList.value.length,
);
const bindIndeterminate = computed(
  () =>
    bindSelected.value.length > 0 &&
    bindSelected.value.length < bindList.value.length,
);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'company',
      label: $t('page.adAccount.list.companyName'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'Select',
      fieldName: 'advertiserStatus',
      label: $t('page.adAccount.list.adAccountStatus'),
      componentProps: {
        options: statusOptions,
        placeholder: $t('page.common.pleaseSelect'),
        allowClear: true,
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createdAt',
      label: $t('page.adAccount.list.accountCreationTime'),
      componentProps: {
        placeholder: [$t('page.common.startDate'), $t('page.common.endDate')],
      },
    },
    {
      component: 'Input',
      fieldName: 'advertiserId',
      label: $t('page.adAccount.list.adAccountId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'Input',
      fieldName: 'advertiserName',
      label: $t('page.adAccount.list.adAccountName'),
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

function formatCurrency(value: number | string, currency: string) {
  if (!currency) return value ? String(value) : '-';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

const statusLabelMap: Record<string, string> = {
  SHOW_ACCOUNT_STATUS_NOT_APPROVED: $t('page.adAccount.list.notApproved'),
  SHOW_ACCOUNT_STATUS_APPROVED: $t('page.adAccount.list.approved'),
  SHOW_ACCOUNT_STATUS_IN_REVIEW: $t('page.adAccount.list.inReview'),
  SHOW_ACCOUNT_STATUS_PUNISHED: $t('page.adAccount.list.punished'),
};

function getStatusColor(status: string) {
  if (status === 'SHOW_ACCOUNT_STATUS_APPROVED') return 'success';
  if (status === 'SHOW_ACCOUNT_STATUS_IN_REVIEW') return 'warning';
  if (status === 'SHOW_ACCOUNT_STATUS_PUNISHED') return 'error';
  return 'default';
}

function getStatusText(status?: null | string) {
  if (!status) return '-';
  return statusLabelMap[status] ?? status;
}

function formatIso(value?: any) {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (typeof value?.toISOString === 'function') return value.toISOString();
  if (typeof value?.toDate === 'function') {
    const date = value.toDate();
    if (date?.toISOString) return date.toISOString();
  }
  return value;
}

function normalizeQueryParams(values: Record<string, any>) {
  const result: Record<string, any> = {};
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

const gridOptions: VxeTableGridOptions<AdAccountRow> = {
  align: 'left',
  headerAlign: 'left',
  columns: [
    {
      field: 'advertiserName',
      title: $t('page.adAccount.list.accountNameAndId'),
      minWidth: 180,
      slots: { default: 'accountInfo' },
    },
    {
      field: 'company',
      title: $t('page.adAccount.list.companyName'),
      minWidth: 180,
      align: 'left',
    },
    {
      field: 'advertiserStatus',
      title: $t('page.common.status'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'currency',
      title: $t('page.adAccount.list.settlementCurrency'),
      width: 90,
    },
    {
      field: 'budgetRemaining',
      title: $t('page.adAccount.list.adAccountBalance'),
      minWidth: 140,
      formatter: ({ row }) => formatCurrency(row.budgetRemaining, row.currency),
    },
    {
      field: 'budgetCost',
      title: $t('page.adAccount.list.adAccountSpend'),
      minWidth: 120,
      formatter: ({ row }) => formatCurrency(row.budgetCost, row.currency),
    },
    {
      field: 'advertiserType',
      title: $t('page.adAccount.list.adAccountType'),
      minWidth: 120,
    },
    {
      field: 'createdAt',
      title: $t('page.adAccount.list.accountCreationTime'),
      minWidth: 160,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'remark',
      title: $t('page.adAccount.operationRecord.remark'),
      minWidth: 120,
      align: 'left',
    },
    {
      title: $t('page.common.operation'),
      minWidth: 340,
      slots: { default: 'action' },
      showOverflow: false,
    },
  ],
  data: [],
  exportConfig: {},
  height: 'auto',
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
          const { createdAt, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(createdAt)
            ? createdAt
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            startDate: formatIso(startDate),
            endDate: formatIso(endDate),
          });
          return await getAdvertiserListApi(normalized);
        } catch {
          message.error($t('page.adAccount.list.fetchAccountListFailed'));
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
const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});
gridRef.value = gridApi;

// function handleExport() {
//   message.info('导出功能待接入');
// }

// function handleHistory() {
//   message.info('历史记录功能待接入');
// }

function handleOpenRecharge(row: AdAccountRow) {
  activeRow.value = row;
  rechargeAmount.value = undefined;
  rechargeVisible.value = true;
  loadWalletAvailable();
}

function handleOpenDeduct(row: AdAccountRow) {
  activeRow.value = row;
  deductAmount.value = undefined;
  deductVisible.value = true;
  loadWalletAvailable();
}

async function handleRechargeOk() {
  if (!activeRow.value?.id) {
    message.error($t('page.adAccount.list.accountInfoMissing'));
    return;
  }
  if (!rechargeAmount.value || rechargeAmount.value < 10) {
    message.error($t('page.adAccount.list.rechargeAmountMinError'));
    return;
  }
  // 校验钱包余额是否充足
  await loadWalletAvailable();
  if (walletAvailable.value <= 0) {
    message.error($t('page.adAccount.list.insufficientBalance'));
    return;
  }
  if (rechargeAmount.value > walletAvailable.value) {
    message.error($t('page.adAccount.list.insufficientBalance'));
    return;
  }
  try {
    rechargeLoading.value = true;
    await rechargeAdvertiserApi(activeRow.value.id, rechargeAmount.value);
    message.success($t('page.adAccount.list.rechargeSuccess'));
    rechargeVisible.value = false;
    gridRef.value?.reload?.();
  } catch {
    message.error($t('page.adAccount.list.rechargeFailed'));
  } finally {
    rechargeLoading.value = false;
  }
}

async function handleDeductOk() {
  if (!activeRow.value?.id) {
    message.error($t('page.adAccount.list.accountInfoMissing'));
    return;
  }
  if (!deductAmount.value || deductAmount.value <= 0) {
    message.error($t('page.adAccount.list.transferAmountError'));
    return;
  }
  try {
    deductLoading.value = true;
    await refundAdvertiserApi(activeRow.value.id, deductAmount.value);
    message.success($t('page.adAccount.list.deductSuccess'));
    deductVisible.value = false;
    gridRef.value?.reload?.();
  } catch {
    message.error($t('page.adAccount.list.deductFailed'));
  } finally {
    deductLoading.value = false;
  }
}

function handleGoWalletRecharge() {
  router.push('/finance/wallet-recharge/index');
}

async function loadWalletAvailable() {
  try {
    const resp = await getWalletBalanceApi();
    walletAvailable.value = Number(resp?.walletBalance ?? 0);
  } catch {
    message.error($t('page.adAccount.list.fetchWalletBalanceFailed'));
  }
}

function handleOpenBind(row: AdAccountRow) {
  activeRow.value = row;
  bindMode.value = 'bind';
  bindInput.value = '';
  bindList.value = [];
  bindSelected.value = [];
  bindVisible.value = true;
}

function splitPartnerIds(value: string) {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function loadBindList() {
  if (!activeRow.value?.advertiserId) {
    message.error($t('page.adAccount.list.accountInfoMissing'));
    return;
  }
  try {
    bindLoading.value = true;
    const resp = await getAdvertiserBindListApi(activeRow.value.advertiserId);
    bindList.value = resp;
    bindSelected.value = [];
  } catch {
    message.error($t('page.adAccount.list.fetchBindListFailed'));
  } finally {
    bindLoading.value = false;
  }
}

async function handleBindOk() {
  if (!activeRow.value?.id) {
    message.error($t('page.adAccount.list.accountInfoMissing'));
    return;
  }
  if (bindMode.value === 'bind') {
    const ids = splitPartnerIds(bindInput.value);
    if (ids.length === 0) {
      message.error($t('page.adAccount.list.inputBCId'));
      return;
    }
    try {
      bindLoading.value = true;
      await Promise.all(
        ids.map((partnerId) =>
          bindAdvertiserApi(activeRow.value!.id, partnerId),
        ),
      );
      message.success($t('page.adAccount.list.bindSuccess'));
      bindVisible.value = false;
      gridRef.value?.reload?.();
    } catch {
      message.error($t('page.adAccount.list.bindFailed'));
    } finally {
      bindLoading.value = false;
    }
    return;
  }
  if (bindSelected.value.length === 0) {
    message.error($t('page.adAccount.list.selectUnbindBC'));
    return;
  }
  try {
    bindLoading.value = true;
    await Promise.all(
      bindSelected.value.map((partnerTableId) =>
        unbindAdvertiserApi(activeRow.value!.id, partnerTableId),
      ),
    );
    message.success($t('page.adAccount.list.unbindSuccess'));
    bindVisible.value = false;
    gridRef.value?.reload?.();
  } catch {
    message.error($t('page.adAccount.list.unbindFailed'));
  } finally {
    bindLoading.value = false;
  }
}

function handleToggleAllBind(checked: boolean) {
  if (checked) {
    bindSelected.value = bindList.value.map((item) => item.partnerTableId);
    return;
  }
  bindSelected.value = [];
}

async function handleOpenBcInfo(row: AdAccountRow) {
  if (!row.advertiserId) {
    message.error($t('page.adAccount.list.accountInfoMissing'));
    return;
  }
  bcVisible.value = true;
  bcInfoList.value = [];
  try {
    bcInfoLoading.value = true;
    const resp = await getAdvertiserBindListApi(row.advertiserId);
    bcInfoList.value = resp;
  } catch {
    message.error($t('page.adAccount.list.fetchBCInfoFailed'));
  } finally {
    bcInfoLoading.value = false;
  }
}

async function handleSyncBalance(row: AdAccountRow) {
  try {
    gridRef.value?.setLoading?.(true);
    await syncAdvertiserBalanceApi(row.id);
    message.success($t('page.adAccount.list.syncBalanceSuccess'));
    gridRef.value?.reload?.();
  } catch {
    message.error($t('page.adAccount.list.syncBalanceFailed'));
  } finally {
    gridRef.value?.setLoading?.(false);
  }
}

watch(bindMode, (value) => {
  if (value === 'unbind') {
    loadBindList();
  }
});
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <div class="flex w-full items-center justify-start">
          <div class="text-left text-red-500">
            {{ $t('page.adAccount.list.unrechargedWarning') }}
          </div>
          <!-- <div class="ml-auto flex items-center gap-2">
            <Button type="link" size="small" @click="handleExport">
              导出
            </Button>
            <Button type="link" size="small" @click="handleHistory">
              历史记录
            </Button>
          </div> -->
        </div>
      </template>

      <template #accountInfo="{ row }">
        <div class="flex flex-col items-start">
          <div class="font-medium">{{ row.advertiserName || '-' }}</div>
          <div class="text-xs text-gray-500">{{ row.advertiserId }}</div>
        </div>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.advertiserStatus)">
          {{
            statusLabelMap[row.advertiserStatus] ?? row.advertiserStatus ?? '-'
          }}
        </Tag>
      </template>

      <template #action="{ row }">
        <div class="flex flex-wrap items-center gap-2">
          <Button type="link" size="small" @click="handleOpenRecharge(row)">
            {{ $t('page.adAccount.list.recharge') }}
          </Button>
          <Button type="link" size="small" @click="handleOpenDeduct(row)">
            {{ $t('page.adAccount.list.deduct') }}
          </Button>
          <Button type="link" size="small" @click="handleSyncBalance(row)">
            {{ $t('page.adAccount.list.syncBalance') }}
          </Button>
          <Button type="link" size="small" @click="handleOpenBind(row)">
            {{ $t('page.adAccount.list.bindUnbind') }}
          </Button>
          <Button type="link" size="small" @click="handleOpenBcInfo(row)">
            {{ $t('page.adAccount.list.viewBC') }}
          </Button>
        </div>
      </template>
    </Grid>

    <Modal
      v-model:open="rechargeVisible"
      :title="$t('page.adAccount.list.rechargeTitle')"
      width="720px"
      :ok-text="$t('page.adAccount.list.recharge')"
      :cancel-text="$t('page.common.cancel')"
      :confirm-loading="rechargeLoading"
      @ok="handleRechargeOk"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-8">
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-500">{{
              $t('page.adAccount.list.walletAvailableBalance')
            }}</span>
            <span class="text-sm text-red-500">
              {{ formatCurrency(walletAvailable, currentCurrency) }}
            </span>
            <Button type="link" class="px-0" @click="handleGoWalletRecharge">
              {{ $t('page.adAccount.list.goRecharge') }}
            </Button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">
            <span class="text-red-500">*</span>
            {{ $t('page.adAccount.list.rechargeAmount') }}
          </span>
          <InputNumber
            v-model:value="rechargeAmount"
            class="w-[360px]"
            :min="10"
            :precision="2"
            :addon-after="currentCurrency"
            :placeholder="$t('page.adAccount.list.rechargeMinAmount')"
          />
        </div>

        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-4">
            <span class="w-28 text-sm text-gray-500">{{
              $t('page.adAccount.list.adAccountBalanceLabel')
            }}</span>
            <span class="text-sm text-gray-900">
              {{
                activeRow
                  ? formatCurrency(activeRow.budgetRemaining, currentCurrency)
                  : '-'
              }}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-28 text-sm text-gray-500">{{
              $t('page.adAccount.list.adAccountNameLabel')
            }}</span>
            <span class="text-sm text-gray-900">
              {{ activeRow?.advertiserName || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-28 text-sm text-gray-500">{{
              $t('page.adAccount.list.adAccountIdLabel')
            }}</span>
            <span class="text-sm text-gray-900">
              {{ activeRow?.advertiserId || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-28 text-sm text-gray-500">{{
              $t('page.adAccount.list.adAccountStatusLabel')
            }}</span>
            <Tag :color="getStatusColor(activeRow?.advertiserStatus || '')">
              {{ getStatusText(activeRow?.advertiserStatus) }}
            </Tag>
          </div>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="deductVisible"
      :title="$t('page.adAccount.list.deductTitle')"
      width="720px"
      :ok-text="$t('page.common.confirm')"
      :cancel-text="$t('page.common.cancel')"
      :confirm-loading="deductLoading"
      @ok="handleDeductOk"
    >
      <div class="flex flex-col gap-4">
        <div class="rounded-lg border border-gray-200 p-4">
          <div class="flex flex-wrap items-start justify-between gap-6">
            <div>
              <div class="text-sm text-gray-500 dark:text-gray-300">
                {{ $t('page.adAccount.list.adAccountAvailableBalance') }}
              </div>
              <div
                class="mt-2 text-2xl font-semibold text-gray-900 dark:text-gray-100"
              >
                {{
                  activeRow
                    ? formatCurrency(activeRow.budgetRemaining, currentCurrency)
                    : '-'
                }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-sm text-gray-500">
                {{ $t('page.adAccount.list.transferAccountName') }}
              </div>
              <div class="text-sm text-gray-900">
                {{ activeRow?.advertiserName || '-' }}
              </div>
              <div class="mt-3 text-sm text-gray-500">
                {{ $t('page.adAccount.list.transferAccountId') }}
              </div>
              <div class="text-sm text-gray-900">
                {{ activeRow?.advertiserId || '-' }}
              </div>
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-500">
          {{ $t('page.adAccount.list.operationType') }}
          <span class="text-gray-900">{{
            $t('page.adAccount.list.deductLabel')
          }}</span>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">
            <span class="text-red-500">*</span>
            {{ $t('page.adAccount.list.transferAmount') }}
          </span>
          <InputNumber
            v-model:value="deductAmount"
            class="w-[240px]"
            :min="0.01"
            :precision="2"
            :placeholder="$t('page.adAccount.list.transferAmountPlaceholder')"
          />
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="bindVisible"
      :title="$t('page.adAccount.list.bindUnbindTitle')"
      width="720px"
      :ok-text="$t('page.common.confirm')"
      :cancel-text="$t('page.common.cancel')"
      :confirm-loading="bindLoading"
      @ok="handleBindOk"
    >
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-gray-900">
            {{ $t('page.adAccount.list.bindUnbindLabel') }}
          </div>
          <Button
            type="link"
            size="small"
            class="px-0"
            href="https://file-v2.uchoice.pro/ads/youpik-hk/protocol/faq/bc-zh.pdf"
            target="_blank"
          >
            {{ $t('page.adAccount.list.howToRegisterBC') }}
          </Button>
        </div>
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-500">{{
              $t('page.adAccount.list.accountNameLabel')
            }}</span>
            <span class="text-sm text-gray-900">
              {{ activeRow?.advertiserName || '-' }}
            </span>
          </div>
          <div class="flex items-center gap-4">
            <span class="w-20 text-sm text-gray-500">{{
              $t('page.adAccount.list.accountIdLabel')
            }}</span>
            <span class="text-sm text-gray-900">
              {{ activeRow?.advertiserId || '-' }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500">
            <span class="text-red-500">*</span>
            {{ $t('page.adAccount.list.operationType') }}
          </span>
          <Radio.Group v-model:value="bindMode">
            <Radio value="bind">{{ $t('page.adAccount.list.bindBC') }}</Radio>
            <Radio value="unbind">
              {{ $t('page.adAccount.list.unbindBC') }}
            </Radio>
          </Radio.Group>
        </div>
        <div v-if="bindMode === 'bind'" class="flex flex-col gap-3">
          <span class="text-sm text-gray-500">
            <span class="text-red-500">*</span>
            {{ $t('page.adAccount.list.bindBCLabel') }}
          </span>
          <Input.TextArea
            v-model:value="bindInput"
            :rows="4"
            :placeholder="$t('page.adAccount.list.bindBCPlaceholder')"
          />
        </div>
        <div v-else class="flex flex-col gap-3">
          <span class="text-sm text-gray-500">{{
            $t('page.adAccount.list.unbindBCIdLabel')
          }}</span>
          <Spin :spinning="bindLoading">
            <div class="flex flex-col gap-3">
              <Checkbox
                :indeterminate="bindIndeterminate"
                :checked="allBindSelected"
                @change="(event) => handleToggleAllBind(event.target.checked)"
              >
                {{ $t('page.adAccount.list.selectAll') }}
              </Checkbox>
              <Checkbox.Group v-model:value="bindSelected">
                <div class="flex flex-col gap-2">
                  <Checkbox
                    v-for="item in bindList"
                    :key="item.partnerTableId"
                    :value="item.partnerTableId"
                  >
                    {{ item.partnerId }}
                  </Checkbox>
                </div>
              </Checkbox.Group>
              <div v-if="bindList.length === 0" class="text-sm text-gray-400">
                {{ $t('page.adAccount.list.noBindBC') }}
              </div>
            </div>
          </Spin>
        </div>
      </div>
    </Modal>

    <Modal
      v-model:open="bcVisible"
      :title="$t('page.adAccount.list.viewBCTitle')"
      width="640px"
      :ok-text="$t('page.common.close')"
      :cancel-text="$t('page.common.close')"
      @ok="bcVisible = false"
    >
      <Spin :spinning="bcInfoLoading">
        <div class="rounded-lg border border-gray-200">
          <div
            class="grid grid-cols-2 gap-0 border-b border-gray-200 bg-gray-50"
          >
            <div class="px-4 py-2 text-sm text-gray-500">
              {{ $t('page.adAccount.list.accountNameLabel') }}
            </div>
            <div class="px-4 py-2 text-sm text-gray-500">
              {{ $t('page.adAccount.list.accountIdLabel') }}
            </div>
          </div>
          <div
            v-for="item in bcInfoList"
            :key="item.partnerTableId"
            class="grid grid-cols-2 gap-0 border-b border-gray-100"
          >
            <div class="px-4 py-2 text-sm text-gray-900">
              {{ item.partnerName || '-' }}
            </div>
            <div class="px-4 py-2 text-sm text-gray-900">
              {{ item.partnerId || '-' }}
            </div>
          </div>
          <div
            v-if="bcInfoList.length === 0"
            class="px-4 py-4 text-sm text-gray-400"
          >
            {{ $t('page.common.noData') }}
          </div>
        </div>
      </Spin>
    </Modal>
  </Page>
</template>
