<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdvertiserRecordItem } from '#/api/advertiser';
import type { Company } from '#/api/company';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Tag } from 'ant-design-vue';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAdvertiserRecordListApi } from '#/api/advertiser';
import { getCompanyListApi } from '#/api/company';

import ApplyAdvertiserDetail from './detail.vue';
import {
  getReviewStatusColor,
  getReviewStatusText,
  getStatusOptions,
  getStatusText,
  getTypeText,
} from './utils';

// 公司列表
const companyList = ref<Array<{ label: string; value: string }>>([]);

// 路由实例
const router = useRouter();

// 获取公司列表
async function fetchCompanyList(page = 1, pageSize = 100) {
  try {
    const response = await getCompanyListApi({
      page,
      pageSize,
    });
    if (response?.list) {
      companyList.value = response.list.map((company: Company) => ({
        label: company.name,
        value: company.id,
      }));
    }
  } catch {
    message.error($t('page.advertiser.record.fetchCompanyListFailed'));
  }
}

// 初始化获取公司列表
fetchCompanyList();

// 扩展dayjs插件
dayjs.extend(utc);
dayjs.extend(timezone);

function handleViewDetail(row: AdvertiserRecordItem) {
  console.log(row);
  applyAdvertiserDetailApi
    .setData({
      // 表单值
      values: row,
    })
    .open();
}

function handleEdit(row: AdvertiserRecordItem) {
  console.log(row);
  // 导航到创建页面并传递编辑数据
  router.push({
    path: '/advertisers/apply/index',
    query: {
      mode: 'edit',
      data: JSON.stringify(row),
    },
  });
}

// 格式化时间，按timezoneCode转换（API返回UTC+0时间）
function formatTime(dateString: string, timezoneCode: string) {
  if (!dateString) return '';

  try {
    // 先解析为UTC时间，再转换到目标时区
    return timezoneCode
      ? dayjs.utc(dateString).tz(timezoneCode).format('YYYY-MM-DD HH:mm:ss')
      : dayjs.utc(dateString).format('YYYY-MM-DD HH:mm:ss');
  } catch {
    return dateString;
  }
}

// 使用从API导出的类型
interface RowType extends AdvertiserRecordItem {}

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'applyIds',
      label: $t('page.advertiser.record.applyId'),
    },
    {
      component: 'Select',
      fieldName: 'companyId',
      label: $t('page.advertiser.record.applyCompany'),
      componentProps: {
        options: companyList,
        allowClear: true,
        placeholder: $t('page.advertiser.record.selectCompanyPlaceholder'),
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: $t('page.advertiser.record.accountStatus'),
      componentProps: {
        options: getStatusOptions(),
        allowClear: true,
        placeholder: $t('page.advertiser.record.selectStatusPlaceholder'),
      },
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: false,
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<RowType> = {
  columns: [
    { field: 'applyId', title: $t('page.advertiser.record.applyId') },
    { field: 'company.name', title: $t('page.advertiser.record.applyCompany') },
    {
      field: 'status',
      title: $t('page.common.status'),
      width: '100px',
      slots: { default: 'status' },
    },
    { field: 'area', title: $t('page.advertiser.record.registrationLocation') },
    {
      field: 'currency',
      width: '70px',
      title: $t('page.advertiser.record.currency'),
    },
    {
      field: 'type',
      width: '70px',
      title: $t('page.advertiser.record.type'),
      formatter: ({ cellValue }) => getTypeText(cellValue),
    },
    { field: 'industry', title: $t('page.advertiser.record.industry') },
    { field: 'timezoneCode', title: $t('page.advertiser.record.timezone') },
    {
      field: 'promotionLink',
      minWidth: '30px',
      title: $t('page.advertiser.record.promotionLink'),
    },
    {
      field: 'createdAt',
      width: '140px',
      title: $t('page.advertiser.record.applyTime'),
      titleSuffix: { content: $t('page.advertiser.record.applyTimeTooltip') },
      formatter: ({ row }) => formatTime(row.createdAt, row.timezoneCode),
    },
    { field: 'reason', title: $t('page.advertiser.record.remark') },
    {
      field: 'reviewStatus',
      width: '100px',
      title: $t('page.advertiser.record.reviewStatus'),
      slots: { default: 'reviewStatus' },
    },
    {
      field: 'reviewRemark',
      width: '140px',
      title: $t('page.advertiser.record.reviewRemark'),
    },
    {
      field: 'id',
      slots: { default: 'action' },
      width: '165px',
      title: $t('page.common.operation'),
    },
  ],
  exportConfig: {},
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    // enabled: false, // 暂时不分页
    pageSizes: [
      { label: $t('page.company.create.page10'), value: 10 },
      { label: $t('page.company.create.page20'), value: 20 },
      { label: $t('page.company.create.page50'), value: 50 },
    ],
  },
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          return await getAdvertiserRecordListApi({
            ...formValues,
            page: page.currentPage,
            pageSize: page.pageSize,
          });
        } catch {
          message.error($t('page.advertiser.record.fetchRecordFailed'));
          return {
            list: [],
            total: 0,
          };
        }
      },
    },
  },
  toolbarConfig: {
    custom: true,
    export: false,
    refresh: true,
    resizable: false,
    search: false,
    zoom: false,
  },
};

// @ts-ignore
const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });

const [FormDrawer, applyAdvertiserDetailApi] = useVbenDrawer({
  showCancelButton: false,
  connectedComponent: ApplyAdvertiserDetail,
});
</script>

<template>
  <Page auto-content-height>
    <FormDrawer />
    <Grid>
      <template #status="{ row }">
        <Tag
          :color="
            {
              STATUS_DISABLE: 'default',
              STATUS_PENDING_CONFIRM: 'warning',
              STATUS_PENDING_VERIFIED: 'warning',
              STATUS_CONFIRM_FAIL: 'error',
              STATUS_ENABLE: 'success',
              STATUS_CONFIRM_FAIL_END: 'error',
              STATUS_PENDING_CONFIRM_MODIFY: 'warning',
              STATUS_CONFIRM_MODIFY_FAIL: 'error',
              STATUS_LIMIT: 'purple',
              STATUS_WAIT_FOR_BPM_AUDIT: 'warning',
              STATUS_WAIT_FOR_PUBLIC_AUTH: 'warning',
              STATUS_SELF_SERVICE_UNAUDITED: 'warning',
              STATUS_CONTRACT_PENDING: 'warning',
            }[row.status]
          "
        >
          {{ getStatusText(row.status) }}
        </Tag>
      </template>

      <template #reviewStatus="{ row }">
        <Tag
          v-if="row.reviewStatus !== undefined && row.reviewStatus !== null"
          :color="getReviewStatusColor(row.reviewStatus)"
        >
          {{ getReviewStatusText(row.reviewStatus) }}
        </Tag>
      </template>

      <template #action="{ row }">
        <Button type="link" @click="handleViewDetail(row)">
          {{ $t('page.company.create.viewDetail') }}
        </Button>
        <Button
          v-if="row.reviewStatus === -1"
          type="link"
          @click="handleEdit(row)"
        >
          {{ $t('page.company.create.edit') }}
        </Button>
      </template>
    </Grid>
  </Page>
</template>
