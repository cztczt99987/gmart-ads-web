<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { formatDateTime } from '@vben/utils';

import { message, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getTiktokVideoListApi } from '#/api/tiktok-video';

const videoStatusMap: Record<number, { color: string; text: string }> = {
  [-1]: { color: 'error', text: $t('page.tiktokVideo.list.publishFailed') },
  0: { color: 'default', text: $t('page.tiktokVideo.list.pendingPublish') },
  1: { color: 'success', text: $t('page.tiktokVideo.list.publishSuccess') },
};

const statusOptions = Object.entries(videoStatusMap).map(
  ([value, { text }]) => ({
    label: text,
    value: Number(value),
  }),
);

const PRIVACY_LEVEL_TEXT_MAP: Record<string, string> = {
  FOLLOWER_OF_CREATOR: $t('page.tiktokVideo.list.followerVisible'),
  MUTUAL_FOLLOW_FRIENDS: $t('page.tiktokVideo.list.mutualFriendVisible'),
  PUBLIC_TO_EVERYONE: $t('page.tiktokVideo.list.publicVisible'),
  SELF_ONLY: $t('page.tiktokVideo.list.selfOnlyVisible'),
};

// Form options for search
const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'username',
      label: $t('page.tiktokVideo.list.ttAccount'),
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: $t('page.tiktokVideo.list.titleLabel'),
    },
    {
      component: 'Select',
      fieldName: 'publishStatus',
      label: $t('page.tiktokVideo.list.publishStatus'),
      componentProps: {
        options: statusOptions,
        allowClear: true,
        placeholder: $t('page.tiktokVideo.list.statusPlaceholder'),
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'createdAtRange',
      label: $t('page.tiktokVideo.list.createdAt'),
      componentProps: {
        placeholder: [$t('page.common.startDate'), $t('page.common.endDate')],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: false,
};

// Grid options
const gridOptions: VxeTableGridOptions<any> = {
  columns: [
    {
      field: 'username',
      title: $t('page.tiktokVideo.list.ttAccount'),
      minWidth: 140,
    },
    {
      field: 'title',
      title: $t('page.tiktokVideo.list.titleLabel'),
      minWidth: 200,
    },
    {
      field: 'privacyLevel',
      title: $t('page.tiktokVideo.list.privacySettings'),
      width: 170,
      formatter: ({ cellValue }) => formatPrivacyLevel(cellValue),
    },
    {
      field: 'publishStatus',
      title: $t('page.tiktokVideo.list.publishStatus'),
      width: 120,
      slots: { default: 'status' },
    },
    {
      field: 'publishAt',
      title: $t('page.tiktokVideo.list.publishAt'),
      width: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'createdAt',
      title: $t('page.tiktokVideo.list.createdAt'),
      width: 180,
      formatter: ({ cellValue }) => formatDateTime(cellValue),
    },
    {
      field: 'remark',
      title: $t('page.tiktokVideo.list.remark'),
      minWidth: 180,
    },
    {
      field: 'error',
      title: $t('page.tiktokVideo.list.errorReason'),
      minWidth: 180,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {
    pageSizes: [
      { label: '10', value: 10 },
      { label: '20', value: 20 },
      { label: '50', value: 50 },
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
          const { createdAtRange, ...rest } = formValues ?? {};
          const [startDate, endDate] = Array.isArray(createdAtRange)
            ? createdAtRange
            : [];

          return await getTiktokVideoListApi({
            ...normalizeQueryParams(rest),
            page: page.currentPage,
            pageSize: page.pageSize,
            publishStatus: toPublishStatus(rest.publishStatus),
            startDate: formatRangeDate(startDate),
            endDate: formatRangeDate(endDate, true),
          });
        } catch {
          message.error($t('page.tiktokVideo.list.fetchError'));
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

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions } as any);

function toPublishStatus(value: unknown): -1 | 0 | 1 | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const normalized = Number(value);
  return normalized === -1 || normalized === 0 || normalized === 1
    ? normalized
    : undefined;
}

function normalizeQueryParams(
  params: Record<string, any>,
): Record<string, any> {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== undefined && value !== null,
    ),
  );
}

function formatRangeDate(value: unknown, isEnd?: boolean) {
  if (!value) return undefined;

  let date: Date | undefined;
  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  } else if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    date = (value as { toDate: () => Date }).toDate();
  }

  if (!date) return undefined;

  const normalized = new Date(date);
  if (isEnd) {
    normalized.setHours(23, 59, 59, 999);
  } else {
    normalized.setHours(0, 0, 0, 0);
  }
  return normalized.toISOString();
}

function formatPrivacyLevel(value?: string): string {
  if (!value) return '-';
  return PRIVACY_LEVEL_TEXT_MAP[value] || value;
}

// Get status color
function getStatusColor(status: number): string {
  return videoStatusMap[status]?.color || 'default';
}

// Get status text
function getStatusText(status: number): string {
  return videoStatusMap[status]?.text || String(status);
}
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <!-- Status column -->
      <template #status="{ row }">
        <Tag :color="getStatusColor(row.publishStatus)">
          {{ getStatusText(row.publishStatus) }}
        </Tag>
      </template>
    </Grid>
  </Page>
</template>
