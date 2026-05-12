<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdvertiserActionRecordItem } from '#/api/advertiser';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Button, message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdvertiserActionRecordApi } from '#/api/advertiser';
import { $t } from '#/locales';

interface OperationRecordRow extends AdvertiserActionRecordItem {}

const operationTypeOptions = ref([
  { label: $t('page.adAccount.operationRecord.bindBC'), value: 'BIND_BC' },
  { label: $t('page.adAccount.operationRecord.unbindBC'), value: 'UNBIND_BC' },
  {
    label: $t('page.adAccount.operationRecord.adAccountRecharge'),
    value: 'RECHARGE',
  },
  {
    label: $t('page.adAccount.operationRecord.adAccountDeduct'),
    value: 'DEDUCT',
  },
]);

const statusOptions = ref([
  { label: $t('page.common.success'), value: 1 },
  { label: $t('page.common.failed'), value: 0 },
]);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Select',
      fieldName: 'action',
      label: $t('page.adAccount.operationRecord.operationType'),
      componentProps: {
        options: operationTypeOptions,
        placeholder: $t('page.adAccount.operationRecord.selectOperationType'),
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'actionStatus',
      label: $t('page.common.status'),
      componentProps: {
        options: statusOptions,
        placeholder: $t('page.common.pleaseSelect'),
        allowClear: true,
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'operationTime',
      label: $t('page.adAccount.operationRecord.operationTime'),
      componentProps: {
        placeholder: [$t('page.common.startDate'), $t('page.common.endDate')],
      },
    },
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('page.adAccount.operationRecord.orderId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'Input',
      fieldName: 'advertiserId',
      label: $t('page.adAccount.operationRecord.adAccountId'),
      componentProps: {
        placeholder: $t('page.common.pleaseInput'),
      },
    },
    {
      component: 'Input',
      fieldName: 'advertiserName',
      label: $t('page.adAccount.operationRecord.adAccountName'),
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

function getStatusColor(status: number) {
  if (status === 1) return 'success';
  if (status === 0) return 'error';
  return 'default';
}

const actionLabelMap: Record<string, string> = {
  BIND_BC: $t('page.adAccount.operationRecord.bindBC'),
  UNBIND_BC: $t('page.adAccount.operationRecord.unbindBC'),
  RECHARGE: $t('page.adAccount.operationRecord.adAccountRecharge'),
  DEDUCT: $t('page.adAccount.operationRecord.adAccountDeduct'),
};

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

const gridOptions: VxeTableGridOptions<OperationRecordRow> = {
  align: 'left',
  headerAlign: 'left',
  columns: [
    {
      field: 'id',
      title: $t('page.adAccount.operationRecord.orderId'),
      width: 90,
    },
    {
      field: 'advertiserName',
      title: $t('page.adAccount.operationRecord.accountNameAndId'),
      minWidth: 180,
      slots: { default: 'accountInfo' },
    },
    {
      field: 'action',
      title: $t('page.adAccount.operationRecord.operationType'),
      minWidth: 120,
      formatter: ({ cellValue }) => actionLabelMap[cellValue] ?? cellValue,
    },
    {
      field: 'actionStatus',
      title: $t('page.common.status'),
      width: 90,
      slots: { default: 'status' },
    },
    {
      field: 'createdAt',
      title: $t('page.adAccount.operationRecord.operationTime'),
      minWidth: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'actionDescription',
      title: $t('page.adAccount.operationRecord.operationDetail'),
      minWidth: 140,
    },
    {
      field: 'remark',
      title: $t('page.adAccount.operationRecord.remark'),
      minWidth: 160,
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
          const { operationTime, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(operationTime)
            ? operationTime
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            startDate: formatIso(startDate),
            endDate: formatIso(endDate),
            actionStatus:
              rest.actionStatus === undefined || rest.actionStatus === null
                ? undefined
                : Number(rest.actionStatus),
          });
          return await getAdvertiserActionRecordApi(normalized);
        } catch {
          message.error($t('page.adAccount.operationRecord.fetchRecordFailed'));
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

function handleExport() {
  message.info($t('page.adAccount.operationRecord.exportPending'));
}

function handleHistory() {
  message.info($t('page.adAccount.operationRecord.historyPending'));
}
</script>

<template>
  <Page auto-content-height :title="$t('page.adAccount.operationRecord.title')">
    <Grid>
      <template #toolbar-tools>
        <div class="flex w-full items-center justify-end gap-2">
          <Button type="link" size="small" @click="handleExport">
            {{ $t('page.common.export') }}
          </Button>
          <Button type="link" size="small" @click="handleHistory">
            {{ $t('page.common.historyRecord') }}
          </Button>
        </div>
      </template>

      <template #accountInfo="{ row }">
        <div class="flex flex-col items-start">
          <div class="font-medium">{{ row.advertiserName || '-' }}</div>
          <div class="text-xs text-gray-500">{{ row.advertiserId }}</div>
        </div>
      </template>

      <template #status="{ row }">
        <Tag :color="getStatusColor(row.actionStatus)">
          {{
            row.actionStatus === 1
              ? $t('page.common.success')
              : $t('page.common.failed')
          }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
