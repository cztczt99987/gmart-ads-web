<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminRechargeApi } from '#/api/admin';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { auditRechargeApi, getAdminRechargeListApi } from '#/api/admin';

type RechargeRecordRow = AdminRechargeApi.RechargeRecordItem;
type AuditStatus = AdminRechargeApi.AuditStatus;

const auditModalVisible = ref(false);
const auditStatus = ref<'APPROVED' | 'REJECTED'>('APPROVED');
const auditRemark = ref('');
const auditAmount = ref<number>();
const auditRow = ref<null | RechargeRecordRow>(null);
const auditLoading = ref(false);
const detailModalVisible = ref(false);
const detailRow = ref<null | RechargeRecordRow>(null);

const statusOptions = ref([
  { label: '审核中', value: 0 },
  { label: '已通过', value: 1 },
  { label: '已拒绝', value: -1 },
]);

const statusLabelMap: Record<AuditStatus, string> = {
  0: '审核中',
  1: '已通过',
  [-1]: '已拒绝',
};

function getStatusColor(status?: AuditStatus) {
  switch (status) {
    case -1: {
      return 'error';
    }
    case 0: {
      return 'warning';
    }
    case 1: {
      return 'success';
    }
    default: {
      return 'default';
    }
  }
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

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'orderId',
      label: '订单ID',
      componentProps: {
        placeholder: '请输入',
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'submittedAt',
      label: '提交转账时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '审核状态',
      componentProps: {
        options: statusOptions,
        placeholder: '请选择',
        allowClear: true,
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: false,
  resetButtonOptions: {
    text: '重置',
  },
  submitButtonOptions: {
    text: '搜索',
    type: 'primary',
  },
};

const gridOptions: VxeTableGridOptions<RechargeRecordRow> = {
  align: 'left',
  columns: [
    { field: 'orderId', minWidth: 180, title: '订单ID' },
    { field: 'applyAmount', minWidth: 120, title: '申请金额' },
    { field: 'approvedAmount', minWidth: 120, title: '审核金额' },
    { field: 'currency', title: '币种', width: 90 },
    { field: 'paidAt', minWidth: 180, title: '转账时间' },
    { field: 'clientRemark', minWidth: 140, title: '客户备注' },
    { field: 'rejectRemark', minWidth: 140, title: '拒绝原因' },
    {
      field: 'status',
      minWidth: 110,
      slots: { default: 'status' },
      title: '审核状态',
    },
    { field: 'operator.name', minWidth: 180, title: '审核人' },
    { field: 'createdAt', minWidth: 180, title: '创建时间' },
    { field: 'updatedAt', minWidth: 180, title: '审核时间' },
    { field: 'auditRemark', minWidth: 140, title: '审核备注' },
    { field: 'company.id', minWidth: 120, title: '公司ID' },
    { field: 'company.uid', minWidth: 120, title: '用户ID' },
    { field: 'company.name', minWidth: 160, title: '公司名称' },
    { field: 'company.area', minWidth: 120, title: '注册地' },
    { field: 'company.areaCode', title: '注册地代码', width: 120 },
    { field: 'company.address', minWidth: 200, title: '详细地址' },
    // { field: 'company.licenseNo', minWidth: 160, title: '营业执照编号' },
    // { field: 'company.licenseUrl', minWidth: 200, title: '营业执照' },
    { field: 'company.imageId', minWidth: 160, title: '资质图片ID' },
    { field: 'company.taxNumber', minWidth: 140, title: '税号' },
    // { field: 'company.type', title: '公司类型', width: 100 },
    // { field: 'company.status', title: '公司状态', width: 100 },
    { field: 'company.contactName', minWidth: 120, title: '联系人' },
    { field: 'company.contactEmail', minWidth: 200, title: '联系邮箱' },
    { field: 'company.contactNumber', minWidth: 140, title: '联系电话' },
    { field: 'company.createdAt', minWidth: 180, title: '公司创建时间' },
    { field: 'company.updatedAt', minWidth: 180, title: '公司更新时间' },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 180,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  data: [],
  exportConfig: {},
  keepSource: true,
  cellConfig: {
    height: 56,
  },
  pagerConfig: {
    pageSizes: [
      { label: '10 条/页', value: 10 },
      { label: '20 条/页', value: 20 },
      { label: '50 条/页', value: 50 },
    ],
  },
  proxyConfig: {
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
            size: page.pageSize,
            startDate: formatRangeDate(startDate),
            endDate: formatRangeDate(endDate, true),
          });
          return await getAdminRechargeListApi(normalized as any);
        } catch {
          message.error('获取充值记录失败');
          return {
            list: [],
            total: 0,
          };
        }
      },
    },
    response: {
      result: 'list',
      total: 'total',
    },
  },
  rowConfig: {
    keyField: 'id',
  },
  scrollX: {
    enabled: true,
  },
  size: 'medium',
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: false,
    refresh: true,
    resizable: false,
    search: false,
    zoom: false,
  },
};

const detailColumns = computed(() =>
  (gridOptions.columns || [])
    .filter((column) => {
      if (typeof column.field !== 'string') return false;
      if (column.field === 'actions') return false;
      const normalized = column.field.toLowerCase();
      if (normalized.includes('id')) return false;
      return true;
    })
    .map((column) => ({
      field: column.field as string,
      title: column.title as string,
    })),
);

const imageKeyPattern =
  /image|license|voucher|proof|receipt|transfer|remit|bank|qr/i;

function collectImageUrls(target: Record<string, any>) {
  const result: string[] = [];
  const stack: Array<{ key: string; value: any }> = Object.entries(target).map(
    ([key, value]) => ({ key, value }),
  );
  while (stack.length > 0) {
    const item = stack.pop();
    if (!item) continue;
    const { key, value } = item;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      if (!imageKeyPattern.test(key)) continue;
      if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) {
        result.push(trimmed);
      }
      continue;
    }
    if (!value || typeof value !== 'object') continue;
    for (const [childKey, childValue] of Object.entries(value)) {
      stack.push({ key: `${key}.${childKey}`, value: childValue });
    }
  }
  return result;
}

const detailImages = computed(() => {
  if (!detailRow.value) return [];
  return collectImageUrls(detailRow.value);
});

const [Grid, gridRef] = useVbenVxeGrid<RechargeRecordRow>({
  formOptions,
  gridOptions,
} as any);

function openAuditModal(
  row: RechargeRecordRow,
  status: 'APPROVED' | 'REJECTED',
) {
  if (row.status !== 0) {
    message.warning('只能审核待审核状态的记录');
    return;
  }
  auditRow.value = row;
  auditStatus.value = status;
  auditRemark.value = '';
  auditAmount.value = Number(row.approvedAmount ?? row.applyAmount ?? 0);
  auditModalVisible.value = true;
}

async function handleAudit() {
  if (!auditRow.value?.id) return;
  if (
    auditStatus.value === 'APPROVED' &&
    (!auditAmount.value || auditAmount.value <= 0)
  ) {
    message.warning('请输入审核金额');
    return;
  }
  auditLoading.value = true;
  try {
    await auditRechargeApi(auditRow.value.id, {
      approvedAmount:
        auditStatus.value === 'APPROVED' ? (auditAmount.value ?? 0) : 0,
      rejectRemark: auditRemark.value || undefined,
      status: auditStatus.value === 'APPROVED' ? 1 : -1,
    });
    message.success(
      auditStatus.value === 'APPROVED' ? '审核通过成功' : '审核拒绝成功',
    );
    auditModalVisible.value = false;
    gridRef.reload?.();
    auditRow.value = null;
  } catch (error: any) {
    message.error(error?.message || '审核失败');
  } finally {
    auditLoading.value = false;
  }
}

function handleRowApprove(row: RechargeRecordRow) {
  openAuditModal(row, 'APPROVED');
}

function handleRowReject(row: RechargeRecordRow) {
  openAuditModal(row, 'REJECTED');
}

function handleViewDetail(row: RechargeRecordRow) {
  detailRow.value = row;
  detailModalVisible.value = true;
}

function getValueByPath(row: RechargeRecordRow, field: string) {
  const parts = field.split('.');
  let current: any = row;
  for (const key of parts) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }
  return current;
}

function formatDetailValue(row: RechargeRecordRow, field: string) {
  if (field === 'status') {
    return statusLabelMap[row.status as AuditStatus] ?? '-';
  }
  const value = getValueByPath(row, field);
  if (value === undefined || value === null || value === '') return '-';
  return String(value);
}
</script>

<template>
  <Page auto-content-height title="充值审核">
    <div class="flex flex-col gap-4">
      <Grid>
        <template #status="{ row }">
          <Tag :color="getStatusColor(row.status)">
            {{ statusLabelMap[row.status] ?? row.status ?? '-' }}
          </Tag>
        </template>
        <template #actions="{ row }">
          <Space>
            <Button size="small" type="link" @click="handleViewDetail(row)">
              查看详情
            </Button>
            <Button
              v-if="row.status === 0"
              size="small"
              type="link"
              @click="handleRowApprove(row)"
            >
              通过
            </Button>
            <Button
              v-if="row.status === 0"
              danger
              size="small"
              type="link"
              @click="handleRowReject(row)"
            >
              拒绝
            </Button>
            <span v-if="row.status !== 0" class="text-gray-400">已审核</span>
          </Space>
        </template>
      </Grid>

      <Modal
        v-model:open="auditModalVisible"
        :title="auditStatus === 'APPROVED' ? '审核通过确认' : '审核拒绝确认'"
        :confirm-loading="auditLoading"
        @ok="handleAudit"
      >
        <div class="py-4">
          <p class="mb-4">
            确定要{{ auditStatus === 'APPROVED' ? '通过' : '拒绝' }}这条记录吗？
          </p>
          <div v-if="auditStatus === 'APPROVED'" class="mb-4">
            <div class="mb-2 text-sm font-medium">审核金额：</div>
            <InputNumber
              v-model:value="auditAmount"
              class="w-full"
              :min="0.01"
              :precision="2"
              placeholder="请输入审核金额"
            />
          </div>
          <div>
            <div class="mb-2 text-sm font-medium">审核备注：</div>
            <Input.TextArea
              v-model:value="auditRemark"
              :rows="4"
              :placeholder="
                auditStatus === 'APPROVED'
                  ? '请输入审核备注（选填）'
                  : '请输入拒绝原因'
              "
            />
          </div>
        </div>
      </Modal>

      <Modal
        v-model:open="detailModalVisible"
        title="充值详情"
        width="720px"
        footer=""
      >
        <div v-if="detailImages.length > 0" class="mb-4">
          <div
            class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            审核图片
          </div>
          <div class="flex flex-wrap gap-3">
            <img
              v-for="url in detailImages"
              :key="url"
              :src="url"
              alt="审核图片"
              class="h-32 w-32 rounded border border-gray-200 object-contain"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <template v-for="item in detailColumns" :key="item.field">
            <div class="text-gray-500 dark:text-gray-300">
              {{ item.title || item.field }}
            </div>
            <div class="text-gray-900 dark:text-gray-100">
              {{ detailRow ? formatDetailValue(detailRow, item.field) : '-' }}
            </div>
          </template>
        </div>
      </Modal>
    </div>
  </Page>
</template>
