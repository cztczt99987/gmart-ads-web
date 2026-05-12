<script lang="ts" setup>
import type {
  TiktokAccountItem,
  TiktokVideoAuthUrlPayload,
} from '#/api/tiktok-video';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Avatar,
  Button,
  Card,
  Empty,
  message,
  Modal,
  Spin,
  Tag,
} from 'ant-design-vue';

import {
  disconnectTiktokVideoAccountApi,
  getTiktokAccountListApi,
  getTiktokVideoAuthUrlApi,
} from '#/api/tiktok-video';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const connecting = ref(false);
const disconnectingId = ref('');
const accountList = ref<TiktokAccountItem[]>([]);
const selectedAccountId = ref('');

const hasAccounts = computed(() => accountList.value.length > 0);

function resolveTid(item: TiktokAccountItem) {
  return item.tid || item.ttAccountId;
}

function resolveAvatar(item: TiktokAccountItem) {
  return item.avatarUrl || item.avatar || '';
}

function resolveDisplayName(item: TiktokAccountItem) {
  return (
    item.displayName ||
    item.nickname ||
    item.username ||
    $t('page.tiktokVideo.authorize.unnamedAccount')
  );
}

function resolveStatusText(item: TiktokAccountItem) {
  if (item.canMakePost === false || item.status === 0 || item.revokedAt) {
    return $t('page.tiktokVideo.authorize.unavailableStatus');
  }
  return $t('page.tiktokVideo.authorize.authorizedStatus');
}

function resolveStatusColor(item: TiktokAccountItem) {
  if (item.canMakePost === false || item.status === 0 || item.revokedAt) {
    return 'warning';
  }
  return 'success';
}

onMounted(async () => {
  await handleAuthCallbackResult();
  await fetchAccounts();
});

function toSingleQueryValue(value: unknown): string {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : '';
  }
  return typeof value === 'string' ? value : '';
}

async function handleAuthCallbackResult() {
  if (!Object.hasOwn(route.query, 'error_description')) {
    return;
  }

  const errorDescription = toSingleQueryValue(route.query.error_description);

  if (errorDescription) {
    Modal.error({
      title: $t('page.tiktokVideo.authorize.authFailedTitle'),
      content: errorDescription,
      okText: $t('page.tiktokVideo.authorize.iKnow'),
    });
  } else {
    Modal.success({
      title: $t('page.tiktokVideo.authorize.authSuccessTitle'),
      content: $t('page.tiktokVideo.authorize.authSuccessContent'),
      okText: $t('page.common.confirm'),
    });
  }

  const { error_description: _errorDescription, ...restQuery } = route.query;
  await router.replace({
    path: '/tiktok-video/authorize/index',
    query: restQuery,
  });
}

async function fetchAccounts() {
  loading.value = true;
  try {
    const res = await getTiktokAccountListApi();
    accountList.value = Array.isArray(res.list) ? res.list : [];
    const firstAccount = accountList.value[0];
    if (!selectedAccountId.value && firstAccount) {
      selectedAccountId.value = resolveTid(firstAccount);
    }
  } catch {
    message.error($t('page.tiktokVideo.authorize.fetchAccountsFailed'));
  } finally {
    loading.value = false;
  }
}

function resolveAuthUrl(payload: string | TiktokVideoAuthUrlPayload) {
  if (typeof payload === 'string') {
    return payload;
  }
  return (
    payload.authorizationUrl ||
    payload.redirectUrl ||
    payload.url ||
    payload.authUrl ||
    ''
  );
}

async function handleAuthorize() {
  connecting.value = true;
  try {
    const payload = await getTiktokVideoAuthUrlApi();
    const authUrl = resolveAuthUrl(payload);
    if (!authUrl) {
      message.error($t('page.tiktokVideo.authorize.fetchAuthUrlFailed'));
      return;
    }
    window.location.href = authUrl;
  } catch {
    message.error($t('page.tiktokVideo.authorize.fetchAuthUrlFailed'));
  } finally {
    connecting.value = false;
  }
}

async function handleUnbind(tid: string) {
  Modal.confirm({
    title: $t('page.tiktokVideo.authorize.unbindTitle'),
    content: $t('page.tiktokVideo.authorize.unbindConfirm'),
    okText: $t('page.common.confirm'),
    cancelText: $t('page.common.cancel'),
    onOk: async () => {
      disconnectingId.value = tid;
      try {
        await disconnectTiktokVideoAccountApi(tid);
        message.success($t('page.tiktokVideo.authorize.unbindSuccess'));
        await fetchAccounts();
      } catch {
        message.error($t('page.tiktokVideo.authorize.unbindFailed'));
      } finally {
        disconnectingId.value = '';
      }
    },
  });
}

function goUploadPage() {
  const selected = accountList.value.find(
    (item) => resolveTid(item) === selectedAccountId.value,
  );
  const tid = selected ? resolveTid(selected) : selectedAccountId.value;
  const query = tid ? { tid } : undefined;
  router.push({
    path: '/tiktok-video/upload/index',
    query,
  });
}

function goUploadByTid(tid: string) {
  selectedAccountId.value = tid;
  router.push({
    path: '/tiktok-video/upload/index',
    query: { tid },
  });
}
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <div class="auth-page">
        <Card>
          <template #title>
            <div class="card-title-row">
              <span class="card-title-text">{{
                $t('page.tiktokVideo.authorize.selectPublishAccount')
              }}</span>
              <div class="card-actions">
                <Button
                  :loading="connecting"
                  type="primary"
                  @click="handleAuthorize"
                >
                  {{ $t('page.tiktokVideo.authorize.authorizeTikTok') }}
                </Button>
                <Button type="default" @click="fetchAccounts">
                  {{ $t('page.tiktokVideo.authorize.refreshAccounts') }}
                </Button>
              </div>
            </div>
          </template>

          <Alert
            show-icon
            type="info"
            :message="$t('page.tiktokVideo.authorize.alertMessage')"
            class="mb-16"
          />

          <Empty
            v-if="!hasAccounts"
            :description="$t('page.tiktokVideo.authorize.noAuthAccount')"
          />

          <div v-else class="account-list">
            <div
              v-for="item in accountList"
              :key="item.ttAccountId"
              class="account-item"
              :class="{
                selected: selectedAccountId === (item.tid || item.ttAccountId),
              }"
              @click="selectedAccountId = item.tid || item.ttAccountId"
            >
              <div class="left">
                <Avatar :src="resolveAvatar(item)" :size="48">
                  <template #icon>
                    <IconifyIcon icon="ant-design:user-outlined" />
                  </template>
                </Avatar>
                <div class="info">
                  <div class="name-row">
                    <span class="name">{{ resolveDisplayName(item) }}</span>
                    <Tag :color="resolveStatusColor(item)">
                      {{ resolveStatusText(item) }}
                    </Tag>
                  </div>
                  <div class="id">tid: {{ item.tid || item.ttAccountId }}</div>
                  <div class="meta">
                    <span>
                      {{ $t('page.tiktokVideo.authorize.usernameLabel') }}
                      {{ item.username || '-' }}
                    </span>
                  </div>
                  <div class="meta">
                    <span>
                      {{ $t('page.tiktokVideo.authorize.followersLabel') }}
                      {{ item.followerCount ?? 0 }} /
                      {{ $t('page.tiktokVideo.authorize.videosLabel') }}
                      {{ item.videoCount ?? 0 }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="right">
                <Button
                  size="small"
                  type="primary"
                  @click.stop="goUploadByTid(item.tid || item.ttAccountId)"
                >
                  {{ $t('page.tiktokVideo.authorize.uploadVideo') }}
                </Button>
                <Button
                  size="small"
                  danger
                  :loading="disconnectingId === resolveTid(item)"
                  @click.stop="handleUnbind(resolveTid(item))"
                >
                  {{ $t('page.tiktokVideo.authorize.unbind') }}
                </Button>
              </div>
            </div>
          </div>

          <div class="footer-actions">
            <Button
              type="primary"
              :disabled="!selectedAccountId"
              @click="goUploadPage"
            >
              {{ $t('page.tiktokVideo.authorize.goUploadVideo') }}
            </Button>
          </div>
        </Card>
      </div>
    </Spin>
  </Page>
</template>

<style scoped>
.auth-page {
  max-width: 980px;
  margin: 0 auto;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title-text {
  font-size: 20px;
  font-weight: 600;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.mb-16 {
  margin-bottom: 16px;
}

.account-list {
  display: grid;
  gap: 12px;
}

.account-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  cursor: pointer;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  transition: all 0.2s;
}

.account-item:hover {
  border-color: #91caff;
}

.account-item.selected {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgb(22 119 255 / 12%);
}

.left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.name-row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.name {
  font-size: 16px;
  font-weight: 600;
}

.id,
.meta {
  font-size: 12px;
  color: #666;
}

.right {
  display: flex;
  gap: 8px;
}

.footer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
