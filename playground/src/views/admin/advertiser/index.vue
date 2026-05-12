<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminAdvertiserApi } from '#/api/admin';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchAddAdvertiserApi,
  getAdBcListApi,
  getAdminAdvertiserListApi,
  getAdminUsersApi,
  updateAdvertiserValidApi,
} from '#/api/admin';

type AdvertiserRow = AdminAdvertiserApi.AdvertiserInfo;

const advertiserStatusMap: Record<string, { color: string; label: string }> = {
  SHOW_ACCOUNT_STATUS_NOT_APPROVED: { label: '未通过', color: 'error' },
  SHOW_ACCOUNT_STATUS_APPROVED: { label: '已通过', color: 'success' },
  SHOW_ACCOUNT_STATUS_IN_REVIEW: { label: '审核中', color: 'warning' },
  SHOW_ACCOUNT_STATUS_PUNISHED: { label: '惩罚中', color: 'error' },
};

const isValidMap: Record<number, { color: string; label: string }> = {
  0: { label: '未启用', color: 'default' },
  1: { label: '已启用', color: 'success' },
};

const statusOptions = [
  { label: '未通过', value: 'SHOW_ACCOUNT_STATUS_NOT_APPROVED' },
  { label: '已通过', value: 'SHOW_ACCOUNT_STATUS_APPROVED' },
  { label: '审核中', value: 'SHOW_ACCOUNT_STATUS_IN_REVIEW' },
  { label: '惩罚中', value: 'SHOW_ACCOUNT_STATUS_PUNISHED' },
];

const validOptions = [
  { label: '未启用', value: 0 },
  { label: '已启用', value: 1 },
];

const batchModalVisible = ref(false);
const batchLoading = ref(false);
const batchForm = ref<{ items: AdminAdvertiserApi.BatchAddItem[] }>({
  items: [{ uid: '', bcId: '', advertiserId: '', partnerId: '' }],
});

const userOptions = ref<{ label: string; value: string }[]>([]);
const bcOptions = ref<{ label: string; value: string }[]>([]);

async function fetchUserOptions() {
  try {
    const result = await getAdminUsersApi();
    userOptions.value = (result.list ?? []).map((user) => ({
      label: `${user.name} (${user.email})`,
      value: user.id,
    }));
  } catch {
    message.error('获取用户列表失败');
  }
}

async function fetchBcOptions() {
  try {
    const list = await getAdBcListApi();
    bcOptions.value = (Array.isArray(list) ? list : []).map((bc) => ({
      label: `${bc.name} (${bc.bcId})`,
      value: bc.bcId,
    }));
  } catch {
    message.error('获取BC列表失败');
  }
}

onMounted(() => {
  fetchUserOptions();
  fetchBcOptions();
});

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

function formatStatus(status: string) {
  return advertiserStatusMap[status] ?? { label: status, color: 'default' };
}

function formatValid(valid: number) {
  return isValidMap[valid] ?? { label: String(valid), color: 'default' };
}

function formatDateTime(dateStr: string) {
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
      fieldName: 'company',
      label: '公司名称',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Input',
      fieldName: 'advertiserName',
      label: '广告账户名称',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Input',
      fieldName: 'advertiserId',
      label: '广告账户ID',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Select',
      fieldName: 'advertiserStatus',
      label: '广告账户状态',
      componentProps: {
        options: statusOptions,
        placeholder: '请选择',
        allowClear: true,
      },
    },
    {
      component: 'Select',
      fieldName: 'isValid',
      label: '是否有效',
      componentProps: {
        options: validOptions,
        placeholder: '请选择',
        allowClear: true,
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createdAt',
      label: '创建日期',
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

const gridOptions: VxeTableGridOptions<AdvertiserRow> = {
  align: 'left',
  columns: [
    { field: 'advertiserId', minWidth: 160, title: '广告账户ID' },
    { field: 'advertiserName', minWidth: 160, title: '广告账户名称' },
    {
      field: 'advertiserStatus',
      minWidth: 110,
      title: '广告账户状态',
      slots: { default: 'advertiserStatus' },
    },
    { field: 'company', minWidth: 180, title: '公司名称' },
    { field: 'advertiserType', minWidth: 120, title: '广告账户类型' },
    { field: 'currency', title: '货币', width: 80 },
    { field: 'budgetCost', minWidth: 120, title: '消耗' },
    { field: 'budgetRemaining', minWidth: 120, title: '剩余预算' },
    { field: 'remark', minWidth: 140, title: '备注' },
    {
      field: 'isValid',
      minWidth: 90,
      title: '是否有效',
      slots: { default: 'isValid' },
    },
    {
      field: 'createdAt',
      minWidth: 180,
      title: '开户时间',
      slots: { default: 'createdAt' },
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
          const { createdAt, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(createdAt)
            ? createdAt
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            startDate: formatRangeDate(startDate),
            endDate: formatRangeDate(endDate, true),
          });
          return await getAdminAdvertiserListApi(
            normalized as AdminAdvertiserApi.AdvertiserListParams,
          );
        } catch {
          message.error('获取广告账户列表失败');
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

const [Grid, gridRef] = useVbenVxeGrid<AdvertiserRow>({
  formOptions,
  gridOptions,
} as any);

async function handleToggleValid(row: AdvertiserRow) {
  const newValid = row.isValid === 1 ? 0 : 1;
  const actionText = newValid === 1 ? '启用' : '停用';
  try {
    await updateAdvertiserValidApi(row.id, {
      remark: `${actionText}广告账户`,
      valid: newValid,
    });
    message.success(`${actionText}成功`);
    gridRef.reload?.();
  } catch (error: any) {
    message.error(error?.message || `${actionText}失败`);
  }
}

function openBatchModal() {
  batchForm.value = {
    items: [{ uid: '', bcId: '', advertiserId: '', partnerId: '' }],
  };
  batchModalVisible.value = true;
}

function addBatchItem() {
  batchForm.value.items.push({
    uid: '',
    bcId: '',
    advertiserId: '',
    partnerId: '',
  });
}

function removeBatchItem(index: number) {
  batchForm.value.items.splice(index, 1);
}

async function handleBatchAdd() {
  const items = batchForm.value.items.filter(
    (item) => item.advertiserId.trim() !== '',
  );
  if (items.length === 0) {
    message.warning('请至少填写一条广告账户信息');
    return;
  }
  batchLoading.value = true;
  try {
    const result = await batchAddAdvertiserApi(items);
    const { successCount = 0, failCount = 0, results = [] } = result ?? {};
    if (failCount === 0) {
      message.success(`添加成功，共 ${successCount} 条`);
    } else if (successCount === 0) {
      message.error(`添加失败，共 ${failCount} 条`);
      const errors = results
        .filter((r) => !r.success)
        .map((r) => `${r.advertiserId}: ${r.error}`)
        .join('\n');
      if (errors) {
        Modal.error({
          title: '添加失败详情',
          content: errors,
        });
      }
    } else {
      message.warning(
        `部分成功：成功 ${successCount} 条，失败 ${failCount} 条`,
      );
      const errors = results
        .filter((r) => !r.success)
        .map((r) => `${r.advertiserId}: ${r.error}`)
        .join('\n');
      if (errors) {
        Modal.warning({
          title: '部分失败详情',
          content: errors,
        });
      }
    }
    if (successCount > 0) {
      batchModalVisible.value = false;
      gridRef.reload?.();
    }
  } catch (error: any) {
    message.error(error?.message || '批量添加失败');
  } finally {
    batchLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height title="广告账户">
    <div class="flex flex-col gap-4">
      <Grid>
        <template #toolbar-tools>
          <Button type="primary" @click="openBatchModal">
            增加既存广告账户
          </Button>
        </template>
        <template #advertiserStatus="{ row }">
          <Tag :color="formatStatus(row.advertiserStatus).color">
            {{ formatStatus(row.advertiserStatus).label }}
          </Tag>
        </template>
        <template #isValid="{ row }">
          <Tag :color="formatValid(row.isValid).color">
            {{ formatValid(row.isValid).label }}
          </Tag>
        </template>
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
        <template #actions="{ row }">
          <Space>
            <Button
              v-if="row.isValid === 0"
              size="small"
              type="link"
              @click="handleToggleValid(row)"
            >
              启用
            </Button>
            <Button
              v-if="row.isValid === 1"
              danger
              size="small"
              type="link"
              @click="handleToggleValid(row)"
            >
              停用
            </Button>
          </Space>
        </template>
      </Grid>

      <Modal
        v-model:open="batchModalVisible"
        title="增加既存广告账户"
        width="680px"
        :confirm-loading="batchLoading"
        @ok="handleBatchAdd"
      >
        <div class="py-4">
          <div
            v-for="(_, index) in batchForm.items"
            :key="index"
            class="mb-4 flex items-start gap-2"
          >
            <div class="grid flex-1 grid-cols-2 gap-3">
              <Form.Item label="UID" class="mb-0">
                <Select
                  v-model:value="batchForm.items[index]!.uid"
                  placeholder="请选择用户"
                  show-search
                  :options="userOptions"
                  :filter-option="
                    (input: string, option: any) =>
                      option.label?.toLowerCase().includes(input.toLowerCase())
                  "
                />
              </Form.Item>
              <Form.Item label="BC ID" class="mb-0">
                <Select
                  v-model:value="batchForm.items[index]!.bcId"
                  placeholder="请选择BC"
                  show-search
                  :options="bcOptions"
                  :filter-option="
                    (input: string, option: any) =>
                      option.label?.toLowerCase().includes(input.toLowerCase())
                  "
                />
              </Form.Item>
              <Form.Item label="广告账户ID" class="mb-0">
                <Input
                  v-model:value="batchForm.items[index]!.advertiserId"
                  placeholder="请输入广告账户ID"
                />
              </Form.Item>
              <Form.Item label="Partner ID" class="mb-0">
                <Input
                  v-model:value="batchForm.items[index]!.partnerId"
                  placeholder="请输入Partner ID"
                />
              </Form.Item>
            </div>
            <Button
              v-if="batchForm.items.length > 1"
              danger
              type="text"
              class="mt-6"
              @click="removeBatchItem(index)"
            >
              删除
            </Button>
          </div>
          <Button type="dashed" block @click="addBatchItem">
            + 添加一条
          </Button>
        </div>
      </Modal>
    </div>
  </Page>
</template>
