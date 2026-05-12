<script setup lang="ts">
import type { UploadFile } from 'ant-design-vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminRefundApi } from '#/api/admin';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Tag,
  Upload,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  applyRefundApi,
  getAdminRefundListApi,
  getAdminUsersApi,
  getReceivingAccountListApi,
  uploadFileApi,
} from '#/api/admin';

type RefundRow = AdminRefundApi.RefundOrderItem;

const statusMap: Record<number, { color: string; label: string }> = {
  0: { label: '待审核', color: 'warning' },
  1: { label: '审核通过', color: 'success' },
  2: { label: '已退款', color: 'blue' },
  [-1]: { label: '审核拒绝', color: 'error' },
};

const statusOptions = [
  { label: '待审核', value: 0 },
  { label: '审核通过', value: 1 },
  { label: '已退款', value: 2 },
  { label: '审核拒绝', value: -1 },
];

const paymentTypeMap: Record<number, string> = {
  0: 'Bank',
  1: 'USDT',
};

// Receiving account options
const receivingAccountOptions = ref<{ label: string; value: string }[]>([]);
const userOptions = ref<{ label: string; value: string }[]>([]);

async function fetchReceivingAccounts() {
  try {
    const list = await getReceivingAccountListApi();
    receivingAccountOptions.value = (Array.isArray(list) ? list : []).map(
      (item: any) => ({
        label: item.name || item.accountName || item.id,
        value: item.id,
      }),
    );
  } catch {
    message.error('获取收款账户列表失败');
  }
}

async function fetchUserOptions() {
  try {
    const result = await getAdminUsersApi();
    userOptions.value = (result.list ?? []).map((user: any) => ({
      label: `${user.name} (${user.email})`,
      value: user.id,
    }));
  } catch {
    message.error('获取用户列表失败');
  }
}

onMounted(() => {
  fetchReceivingAccounts();
  fetchUserOptions();
});

// Apply refund modal state
const applyModalVisible = ref(false);
const applyLoading = ref(false);
const applyForm = ref({
  uid: '',
  refundAmount: undefined as number | undefined,
  currency: 'USD',
  payerAccountId: '',
  receivingAccount: '',
  vouchers: [] as string[],
  remark: '',
});
const uploadLoading = ref(false);
const fileList = ref<UploadFile[]>([]);

// Detail modal state
const detailModalVisible = ref(false);
const detailRow = ref<null | RefundRow>(null);
const detailVoucherUrls = ref<string[]>([]);

async function loadVoucherImages(urls: string[]) {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        return URL.createObjectURL(blob);
      } catch {
        return url;
      }
    }),
  );
  return results;
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

function formatDateTime(dateStr: null | string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('zh-CN', { hour12: false });
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'orderId',
      label: '订单ID',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Input',
      fieldName: 'uid',
      label: '用户ID',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '退款状态',
      componentProps: {
        options: statusOptions,
        placeholder: '请选择',
        allowClear: true,
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'dateRange',
      label: '操作日期',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: false,
  resetButtonOptions: { text: '重置' },
  submitButtonOptions: { text: '搜索', type: 'primary' },
};

const gridOptions: VxeTableGridOptions<RefundRow> = {
  align: 'left',
  columns: [
    { field: 'orderId', minWidth: 160, title: '退款订单号' },
    { field: 'userDto.name', minWidth: 120, title: '收款人' },
    { field: 'refundAmount', minWidth: 120, title: '退款金额' },
    {
      field: 'currency',
      minWidth: 80,
      title: '退款币种',
    },
    {
      field: 'paymentType',
      minWidth: 100,
      title: '退款类型',
      slots: { default: 'paymentType' },
    },
    { field: 'remark', minWidth: 140, title: '备注' },
    {
      field: 'status',
      minWidth: 100,
      title: '退款状态',
      slots: { default: 'status' },
    },
    { field: 'operator.name', minWidth: 120, title: '操作人' },
    {
      field: 'updatedAt',
      minWidth: 180,
      title: '退款日期',
      slots: { default: 'updatedAt' },
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 100,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  keepSource: true,
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
          const { dateRange, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(dateRange)
            ? dateRange
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            startDate: formatRangeDate(startDate),
            endDate: formatRangeDate(endDate, true),
          });
          return await getAdminRefundListApi(
            normalized as AdminRefundApi.RefundListParams,
          );
        } catch {
          message.error('获取退款列表失败');
          return { list: [], total: 0 };
        }
      },
    },
    response: { result: 'list', total: 'total' },
  },
  rowConfig: { keyField: 'id' },
  scrollX: { enabled: true },
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

const [Grid, gridRef] = useVbenVxeGrid<RefundRow>({
  formOptions,
  gridOptions,
} as any);

// Detail modal
const detailItems = computed(() => {
  if (!detailRow.value) return [];
  const row = detailRow.value;
  return [
    { label: '退款订单号', value: row.orderId },
    { label: '退款金额', value: row.refundAmount },
    { label: '退款币种', value: row.currency },
    {
      label: '退款类型',
      value: paymentTypeMap[row.paymentType] ?? row.paymentType,
    },
    { label: '收款人', value: row.userDto?.name },
    { label: '收款人ID', value: row.userDto?.uid },
    { label: '操作人', value: row.operator?.name },
    { label: '操作人ID', value: row.operator?.uid },
    { label: '备注', value: row.remark || '-' },
    { label: '退款状态', value: statusMap[row.status]?.label ?? '-' },
    { label: '退款日期', value: formatDateTime(row.updatedAt) },
  ];
});

async function openDetailModal(row: RefundRow) {
  detailRow.value = row;
  detailVoucherUrls.value = [];
  detailModalVisible.value = true;
  if (row.vouchers?.length) {
    detailVoucherUrls.value = await loadVoucherImages(row.vouchers);
  }
}

// Apply refund modal
function openApplyModal() {
  applyForm.value = {
    uid: '',
    refundAmount: undefined,
    currency: 'USD',
    payerAccountId: '',
    receivingAccount: '',
    vouchers: [],
    remark: '',
  };
  fileList.value = [];
  applyModalVisible.value = true;
}

async function handleUpload(info: any) {
  uploadLoading.value = true;
  try {
    const result: any = await uploadFileApi(info.file, 4);
    const fileId = typeof result === 'object' ? result.id : result;
    applyForm.value.vouchers = [...applyForm.value.vouchers, fileId];
    fileList.value = [
      ...fileList.value,
      {
        uid: fileId,
        name: info.file.name,
        status: 'done',
      },
    ];
  } catch {
    message.error('上传失败');
  } finally {
    uploadLoading.value = false;
  }
}

function handleRemoveUpload(file: UploadFile) {
  const index = fileList.value.findIndex((f) => f.uid === file.uid);
  if (index !== -1) {
    fileList.value = fileList.value.filter((_, i) => i !== index);
    applyForm.value.vouchers = applyForm.value.vouchers.filter(
      (_, i) => i !== index,
    );
  }
}

async function handleApplyRefund() {
  const form = applyForm.value;
  if (!form.uid) {
    message.warning('请选择用户');
    return;
  }
  if (!form.refundAmount || form.refundAmount <= 0) {
    message.warning('请输入退款金额');
    return;
  }
  if (!form.payerAccountId) {
    message.warning('请选择付款账户');
    return;
  }
  if (!form.receivingAccount.trim()) {
    message.warning('请输入收款账户信息');
    return;
  }
  if (form.vouchers.length === 0) {
    message.warning('请至少上传一张凭证');
    return;
  }
  applyLoading.value = true;
  try {
    await applyRefundApi({
      currency: form.currency,
      payerAccountId: form.payerAccountId,
      receivingAccount: form.receivingAccount,
      refundAmount: form.refundAmount,
      remark: form.remark || undefined,
      uid: form.uid,
      vouchers: form.vouchers,
    });
    message.success('发起退款成功');
    applyModalVisible.value = false;
    gridRef.reload?.();
  } catch (error: any) {
    message.error(error?.message || '发起退款失败');
  } finally {
    applyLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height title="退款列表">
    <div class="flex flex-col gap-4">
      <Grid>
        <template #toolbar-tools>
          <Button type="primary" @click="openApplyModal">发起退款</Button>
        </template>
        <template #paymentType="{ row }">
          {{ paymentTypeMap[row.paymentType] ?? row.paymentType }}
        </template>
        <template #status="{ row }">
          <Tag :color="statusMap[row.status]?.color ?? 'default'">
            {{ statusMap[row.status]?.label ?? '-' }}
          </Tag>
        </template>
        <template #updatedAt="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
        <template #actions="{ row }">
          <Space>
            <Button size="small" type="link" @click="openDetailModal(row)">
              查看详情
            </Button>
          </Space>
        </template>
      </Grid>

      <!-- Apply Refund Modal -->
      <Modal
        v-model:open="applyModalVisible"
        title="发起退款"
        width="640px"
        :confirm-loading="applyLoading"
        @ok="handleApplyRefund"
      >
        <div class="py-4">
          <Form layout="vertical">
            <Form.Item label="用户" required>
              <Select
                v-model:value="applyForm.uid"
                placeholder="请选择用户"
                show-search
                :options="userOptions"
                :filter-option="
                  (input: string, option: any) =>
                    option.label?.toLowerCase().includes(input.toLowerCase())
                "
              />
            </Form.Item>
            <Form.Item label="退款金额" required>
              <InputNumber
                v-model:value="applyForm.refundAmount"
                class="w-full"
                :min="0.01"
                :precision="2"
                placeholder="请输入退款金额"
              />
            </Form.Item>
            <Form.Item label="退款币种" required>
              <Select
                v-model:value="applyForm.currency"
                :options="[
                  { label: 'USD', value: 'USD' },
                  { label: 'CNY', value: 'CNY' },
                ]"
              />
            </Form.Item>
            <Form.Item label="付款账户" required>
              <Select
                v-model:value="applyForm.payerAccountId"
                placeholder="请选择付款账户"
                show-search
                :options="receivingAccountOptions"
                :filter-option="
                  (input: string, option: any) =>
                    option.label?.toLowerCase().includes(input.toLowerCase())
                "
              />
            </Form.Item>
            <Form.Item label="收款账户信息" required>
              <Input
                v-model:value="applyForm.receivingAccount"
                placeholder="请输入收款账户信息"
              />
            </Form.Item>
          </Form>
          <Form.Item label="退款凭证" class="mt-4" required>
            <Upload
              list-type="picture-card"
              :file-list="fileList"
              :custom-request="handleUpload"
              @remove="handleRemoveUpload"
              accept=".jpg,.jpeg,.png"
            >
              <div v-if="fileList.length < 6">
                <span style="font-size: 20px">+</span>
                <div class="mt-1 text-xs">上传</div>
              </div>
            </Upload>
            <div class="text-xs text-gray-400">
              仅支持 JPG/JPEG/PNG，最大 10MB，最多 6 张
            </div>
          </Form.Item>
          <Form.Item label="备注">
            <Input.TextArea
              v-model:value="applyForm.remark"
              :rows="3"
              :maxlength="500"
              show-count
              placeholder="请输入备注（选填）"
            />
          </Form.Item>
        </div>
      </Modal>

      <!-- Detail Modal -->
      <Modal
        v-model:open="detailModalVisible"
        title="退款详情"
        width="720px"
        footer=""
      >
        <div class="py-4">
          <div v-if="detailVoucherUrls.length > 0" class="mb-4">
            <div
              class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              退款凭证
            </div>
            <div class="flex flex-wrap gap-3">
              <Image
                v-for="url in detailVoucherUrls"
                :key="url"
                :src="url"
                alt="退款凭证"
                class="h-24 w-24 rounded border border-gray-200 object-cover"
              />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <template v-for="item in detailItems" :key="item.label">
              <div class="text-gray-500 dark:text-gray-300">
                {{ item.label }}
              </div>
              <div class="text-gray-900 dark:text-gray-100">
                {{ item.value }}
              </div>
            </template>
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>
