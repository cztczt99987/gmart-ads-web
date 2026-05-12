<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdminAdvertiserApi } from '#/api/admin';

import { computed, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Image,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  auditAdvertiserApplyApi,
  getAdBcListApi,
  getAdminAdvertiserApplyListApi,
} from '#/api/admin';

type ApplyRow = AdminAdvertiserApi.AdvertiserApplyInfo;

const reviewStatusMap: Record<number, { color: string; label: string }> = {
  0: { label: '待审核', color: 'warning' },
  1: { label: '审核通过', color: 'success' },
  [-1]: { label: '审核拒绝', color: 'error' },
};

const reviewStatusOptions = [
  { label: '待审核', value: 0 },
  { label: '审核通过', value: 1 },
  { label: '审核拒绝', value: -1 },
];

const bcOptions = ref<{ label: string; value: string }[]>([]);

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
  fetchBcOptions();
});

// Approve modal state
const approveModalVisible = ref(false);
const approveLoading = ref(false);
const approveRow = ref<ApplyRow | null>(null);
const approveBcId = ref<string | undefined>(undefined);
const approveRemark = ref('');

// Reject modal state
const rejectModalVisible = ref(false);
const rejectLoading = ref(false);
const rejectRow = ref<ApplyRow | null>(null);
const rejectRemark = ref('');

// Detail modal state
const detailModalVisible = ref(false);
const detailRow = ref<ApplyRow | null>(null);
const licenseBlobUrl = ref('');

const detailItems = computed(() => {
  if (!detailRow.value) return [];
  const row = detailRow.value;
  return [
    { label: '申请ID', value: row.applyId },
    { label: '广告账户名称', value: row.advertiserName },
    { label: '广告账户ID', value: row.advertiserId ?? '-' },
    { label: '广告账户状态', value: row.status || '-' },
    { label: '货币', value: row.currency },
    { label: '目标区域', value: row.area },
    { label: '广告账户类型', value: row.type },
    { label: '行业', value: row.industry },
    { label: '时区', value: row.timezone },
    { label: '推广链接', value: row.promotionLink },
    { label: '申请原因', value: row.reason || '-' },
    {
      label: '审核状态',
      value: reviewStatusMap[row.reviewStatus]?.label ?? '-',
    },
    { label: '审核备注', value: row.reviewRemark || '-' },
    { label: '申请时间', value: formatDateTime(row.createdAt) },
    { label: '审核时间', value: formatDateTime(row.reviewedAt) },
    { label: 'TikTok创建时间', value: formatDateTime(row.ttCreatedAt) },
    { label: '公司名称', value: row.company?.name },
    { label: '公司ID', value: row.company?.id },
    { label: '注册地', value: row.company?.area },
    { label: '营业执照编号', value: row.company?.licenseNo },
    { label: '国家代码', value: row.company?.countryCode },
    { label: '联系人', value: row.company?.contactName },
    { label: '联系电话', value: row.company?.contactNumber },
    { label: '联系邮箱', value: row.company?.contactEmail },
  ];
});

async function loadLicenseImage(url: string) {
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    if (licenseBlobUrl.value) {
      URL.revokeObjectURL(licenseBlobUrl.value);
    }
    licenseBlobUrl.value = URL.createObjectURL(blob);
  } catch {
    licenseBlobUrl.value = url;
  }
}

function openDetailModal(row: ApplyRow) {
  detailRow.value = row;
  licenseBlobUrl.value = '';
  if (row.company?.licenseUrl) {
    loadLicenseImage(row.company.licenseUrl);
  }
  detailModalVisible.value = true;
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
      fieldName: 'companyId',
      label: '公司ID',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Input',
      fieldName: 'applyId',
      label: '申请ID',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'Select',
      fieldName: 'reviewStatus',
      label: '审核状态',
      componentProps: {
        options: reviewStatusOptions,
        placeholder: '请选择',
        allowClear: true,
      },
    },
    {
      component: 'Input',
      fieldName: 'status',
      label: '账户状态',
      componentProps: { placeholder: '请输入' },
    },
    {
      component: 'RangePicker',
      fieldName: 'applyDate',
      label: '申请时间',
      componentProps: {
        placeholder: ['开始日期', '结束日期'],
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'reviewDate',
      label: '审核时间',
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

const gridOptions: VxeTableGridOptions<ApplyRow> = {
  align: 'left',
  columns: [
    { field: 'applyId', minWidth: 120, title: '申请ID' },
    { field: 'advertiserName', minWidth: 160, title: '广告账户名称' },
    {
      field: 'company.name',
      minWidth: 180,
      title: '公司名称',
    },
    {
      field: 'company.area',
      minWidth: 100,
      title: '注册地',
    },
    {
      field: 'company.contactName',
      minWidth: 100,
      title: '联系人',
    },
    {
      field: 'company.contactEmail',
      minWidth: 180,
      title: '联系邮箱',
    },
    { field: 'currency', title: '货币', width: 80 },
    { field: 'area', minWidth: 100, title: '目标区域' },
    { field: 'type', minWidth: 120, title: '广告账户类型' },
    { field: 'industry', minWidth: 120, title: '行业' },
    { field: 'promotionLink', minWidth: 180, title: '推广链接' },
    { field: 'reason', minWidth: 140, title: '申请原因' },
    {
      field: 'reviewStatus',
      minWidth: 100,
      title: '审核状态',
      slots: { default: 'reviewStatus' },
    },
    { field: 'reviewRemark', minWidth: 140, title: '审核备注' },
    {
      field: 'createdAt',
      minWidth: 180,
      title: '申请时间',
      slots: { default: 'createdAt' },
    },
    {
      field: 'reviewedAt',
      minWidth: 180,
      title: '审核时间',
      slots: { default: 'reviewedAt' },
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 260,
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
          const { applyDate, reviewDate, ...rest } = formValues ?? {};
          const [applyStart, applyEnd] = Array.isArray(applyDate)
            ? applyDate
            : [];
          const [reviewStart, reviewEnd] = Array.isArray(reviewDate)
            ? reviewDate
            : [];
          const normalized = normalizeQueryParams({
            ...rest,
            page: page.currentPage,
            pageSize: page.pageSize,
            applyStart: formatRangeDate(applyStart),
            applyEnd: formatRangeDate(applyEnd, true),
            reviewStart: formatRangeDate(reviewStart),
            reviewEnd: formatRangeDate(reviewEnd, true),
          });
          return await getAdminAdvertiserApplyListApi(
            normalized as AdminAdvertiserApi.AdvertiserApplyListParams,
          );
        } catch {
          message.error('获取广告账户申请列表失败');
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

const [Grid, gridRef] = useVbenVxeGrid<ApplyRow>({
  formOptions,
  gridOptions,
} as any);

function openApproveModal(row: ApplyRow) {
  approveRow.value = row;
  approveBcId.value = undefined;
  approveRemark.value = '';
  approveModalVisible.value = true;
}

function openRejectModal(row: ApplyRow) {
  rejectRow.value = row;
  rejectRemark.value = '';
  rejectModalVisible.value = true;
}

async function handleApprove() {
  if (!approveRow.value?.id) return;
  if (!approveBcId.value) {
    message.warning('请选择要绑定的商务中心');
    return;
  }
  approveLoading.value = true;
  try {
    await auditAdvertiserApplyApi(approveRow.value.id, {
      adBcId: approveBcId.value,
      reviewRemark: approveRemark.value || undefined,
      reviewStatus: 1,
    });
    message.success('审核通过成功');
    approveModalVisible.value = false;
    gridRef.reload?.();
    approveRow.value = null;
  } catch (error: any) {
    message.error(error?.message || '审核通过失败');
  } finally {
    approveLoading.value = false;
  }
}

async function handleReject() {
  if (!rejectRow.value?.id) return;
  rejectLoading.value = true;
  try {
    await auditAdvertiserApplyApi(rejectRow.value.id, {
      reviewRemark: rejectRemark.value || undefined,
      reviewStatus: -1,
    });
    message.success('审核拒绝成功');
    rejectModalVisible.value = false;
    gridRef.reload?.();
    rejectRow.value = null;
  } catch (error: any) {
    message.error(error?.message || '审核拒绝失败');
  } finally {
    rejectLoading.value = false;
  }
}
</script>

<template>
  <Page auto-content-height title="广告账户审核">
    <div class="flex flex-col gap-4">
      <Grid>
        <template #reviewStatus="{ row }">
          <Tag :color="reviewStatusMap[row.reviewStatus]?.color ?? 'default'">
            {{ reviewStatusMap[row.reviewStatus]?.label ?? '-' }}
          </Tag>
        </template>
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
        <template #reviewedAt="{ row }">
          {{ formatDateTime(row.reviewedAt) }}
        </template>
        <template #actions="{ row }">
          <Space>
            <Button size="small" type="link" @click="openDetailModal(row)">
              查看详情
            </Button>
            <Button
              v-if="row.reviewStatus === 0"
              size="small"
              type="link"
              style="color: #52c41a"
              @click="openApproveModal(row)"
            >
              通过审核
            </Button>
            <Button
              v-if="row.reviewStatus === 0"
              size="small"
              type="link"
              danger
              @click="openRejectModal(row)"
            >
              拒绝审核
            </Button>
            <span v-if="row.reviewStatus !== 0" class="text-gray-400">
              已审核
            </span>
          </Space>
        </template>
      </Grid>

      <!-- Approve Modal -->
      <Modal
        v-model:open="approveModalVisible"
        title="通过审核"
        :confirm-loading="approveLoading"
        @ok="handleApprove"
      >
        <div class="py-4">
          <p class="mb-4">确定要通过该广告账户申请吗？</p>
          <div class="mb-4">
            <div class="mb-2 text-sm font-medium">
              绑定商务中心 <span class="text-red-500">*</span>
            </div>
            <Select
              v-model:value="approveBcId"
              placeholder="请选择商务中心"
              show-search
              :options="bcOptions"
              :filter-option="
                (input: string, option: any) =>
                  option.label?.toLowerCase().includes(input.toLowerCase())
              "
              class="w-full"
            />
          </div>
          <div>
            <div class="mb-2 text-sm font-medium">审核备注</div>
            <Input.TextArea
              v-model:value="approveRemark"
              :rows="4"
              placeholder="请输入审核备注（选填）"
            />
          </div>
        </div>
      </Modal>

      <!-- Reject Modal -->
      <Modal
        v-model:open="rejectModalVisible"
        title="拒绝审核"
        :confirm-loading="rejectLoading"
        @ok="handleReject"
      >
        <div class="py-4">
          <p class="mb-4">确定要拒绝该广告账户申请吗？</p>
          <div>
            <div class="mb-2 text-sm font-medium">拒绝原因</div>
            <Input.TextArea
              v-model:value="rejectRemark"
              :rows="4"
              placeholder="请输入拒绝原因"
            />
          </div>
        </div>
      </Modal>

      <!-- Detail Modal -->
      <Modal
        v-model:open="detailModalVisible"
        title="申请详情"
        width="720px"
        footer=""
      >
        <div class="py-4">
          <div v-if="detailRow?.company?.licenseUrl" class="mb-4">
            <div
              class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200"
            >
              营业执照
            </div>
            <Image
              v-if="licenseBlobUrl"
              :src="licenseBlobUrl"
              alt="营业执照"
              class="max-h-48 rounded border border-gray-200 object-contain"
            />
            <span v-else class="text-gray-400">加载中...</span>
          </div>
          <div class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <template v-for="item in detailItems" :key="item.label">
              <div class="text-gray-500 dark:text-gray-300">
                {{ item.label }}
              </div>
              <div class="break-all text-gray-900 dark:text-gray-100">
                {{ item.value }}
              </div>
            </template>
          </div>
        </div>
      </Modal>
    </div>
  </Page>
</template>
