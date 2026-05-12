<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Card, Tag } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

import {
  getReviewStatusColor,
  getReviewStatusText,
  getStatusText,
} from './utils';

defineOptions({
  name: 'ApplyAdvertiserDetail',
});

// 状态
const status = ref('');
const remark = ref('');
const reviewStatus = ref<null | number>(null);
const reviewRemark = ref('');
const reviewerId = ref('');
const reviewedAt = ref('');

const commonConfig: VbenFormProps['commonConfig'] = {
  componentProps: {
    readonly: true,
    style: {
      // width: '100%',
      // height: '50px',
    },
    labelAlign: 'left',
  },
  hideRequiredMark: false,
};

// 申请账户信息
const [Form1, formApi1] = useVbenForm({
  commonConfig,
  schema: [
    {
      component: 'Input',
      fieldName: 'applyId',
      label: '申请ID',
    },
    {
      component: 'Input',
      fieldName: 'createdAt',
      label: '申请时间',
    },
    {
      component: 'Input',
      fieldName: 'area',
      label: '投放地区',
    },
    {
      component: 'Input',
      fieldName: 'timezoneCode',
      label: '账户时区',
    },
    {
      component: 'Input',
      fieldName: 'promotionLink',
      label: '推广链接',
    },
    {
      component: 'Input',
      fieldName: 'currency',
      label: '结算货币',
    },
  ],
  showDefaultActions: false,
});

// 申请公司信息
const [Form2, formApi2] = useVbenForm({
  commonConfig,
  schema: [
    {
      component: 'Input',
      fieldName: 'company.name',
      label: '公司名称',
    },
    {
      component: 'Input',
      fieldName: 'company.licenseNo',
      label: '统一社会信用代码',
    },
  ],
  showDefaultActions: false,
});

// 申请公司信息
const [Form3, formApi3] = useVbenForm({
  commonConfig,
  schema: [
    {
      component: 'Input',
      fieldName: 'advertiserId',
      label: '账户ID',
    },
    {
      component: 'Input',
      fieldName: 'advertiserName',
      label: '账户名称',
    },
    {
      component: 'Input',
      fieldName: 'ttCreatedAt',
      label: '账号创建时间',
    },
  ],
  showDefaultActions: false,
});

// 后台审核信息
const [Form4, formApi4] = useVbenForm({
  commonConfig,
  schema: [
    {
      component: 'Input',
      fieldName: 'reviewerId',
      label: '审核人',
    },
    {
      component: 'Input',
      fieldName: 'reviewedAt',
      label: '审核时间',
    },
  ],
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  onConfirm: async () => {
    // await formApi.submitForm();
    await drawerApi.close();
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      const { values } = drawerApi.getData<Record<string, any>>();
      if (values) {
        // 格式化时间字段
        const formattedValues = {
          ...values,
          createdAt: values.createdAt ? formatDateTime(values.createdAt) : '',
          ttCreatedAt: values.ttCreatedAt
            ? formatDateTime(values.ttCreatedAt)
            : '',
        };
        formApi1.setValues(formattedValues);
        formApi2.setValues(formattedValues);
        formApi3.setValues(formattedValues);
        // 审核信息
        reviewStatus.value = values.reviewStatus ?? null;
        reviewRemark.value = values.reviewRemark || '';
        reviewerId.value = values.reviewerId || '';
        reviewedAt.value = values.reviewedAt
          ? formatDateTime(values.reviewedAt)
          : '';
        formApi4.setValues({
          reviewerId: values.reviewerId || '',
          reviewedAt: values.reviewedAt
            ? formatDateTime(values.reviewedAt)
            : '',
        });
        remark.value = values.reason;
        status.value = values.status;
      }
    }
  },
  title: '开户申请',
});
</script>
<template>
  <Drawer class="w-[850px]">
    <Card :bordered="false">
      <template #title>
        申请账户信息
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
            }[status]
          "
        >
          {{ getStatusText(status) }}
        </Tag>
      </template>
      <Form1 />
    </Card>
    <Card :bordered="false" title="公司信息">
      <Form2 />
    </Card>
    <Card :bordered="false" title="Tiktok账户">
      <Form3 />
    </Card>
    <Card :bordered="false" title="后台审核" class="mt-4">
      <div
        style="
          display: flex;
          gap: 8px;
          align-items: center;
          margin-bottom: 12px;
        "
      >
        <span>审核状态：</span>
        <Tag
          v-if="reviewStatus !== null"
          :color="getReviewStatusColor(reviewStatus)"
        >
          {{ getReviewStatusText(reviewStatus) }}
        </Tag>
        <span v-else style="color: #999">--</span>
      </div>
      <div style="margin-bottom: 12px">
        <span>审核原因：</span>
        <span>{{ reviewRemark || '--' }}</span>
      </div>
      <Form4 />
    </Card>
    <Card :bordered="false" title="备注" class="mt-4">
      <div class="remark-content">
        {{ remark || '无' }}
      </div>
    </Card>
  </Drawer>
</template>

<style scoped>
.mt-4 {
  margin-top: 16px;
}

.remark-content {
  min-height: 80px;
  padding: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  background-color: #f5f5f5;
  border-radius: 4px;
}

/* 隐藏取消按钮 */
:deep(.ant-drawer-footer .ant-btn-default) {
  display: none !important;
}
</style>
