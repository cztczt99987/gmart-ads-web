<script lang="ts" setup>
import type { UploadProps } from 'ant-design-vue';

import type { TiktokAccountItem, TiktokCreatorInfo } from '#/api/tiktok-video';

import { computed, h, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { $t } from '@vben/locales';

import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Spin,
  Switch,
  Tooltip,
  Upload,
} from 'ant-design-vue';

import {
  ALLOWED_VIDEO_FORMATS,
  getTiktokAccountListApi,
  getTiktokCreatorInfoApi,
  MAX_VIDEO_SIZE,
  PRIVACY_LEVEL_OPTIONS,
  publishTiktokVideoApi,
  uploadShortVideoFileApi,
} from '#/api/tiktok-video';

const route = useRoute();
const router = useRouter();

const accountList = ref<TiktokAccountItem[]>([]);
const selectedAccountId = ref('');

// Form state
const formState = reactive({
  brandContentToggle: false,
  brandOrganic: false,
  brandedContent: false,
  description: '',
  disableComment: false,
  disableDuet: false,
  disableStitch: false,
  isAigc: false,
  privacyLevel: undefined as string | undefined,
  title: '',
});

// Creator info
const creatorInfo = ref<null | TiktokCreatorInfo>(null);
const loadingCreator = ref(true);

// Video file
const videoFile = ref<File | null>(null);
const videoPreview = ref<string>('');
const videoDuration = ref(0);

// Upload state
const uploading = ref(false);
const uploadProgress = ref(0);
const ALLOWED_VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm'];

// Computed
const privacyOptions = computed(() => {
  const isBrandedContentSelected = formState.brandedContent;
  const sourceOptions = creatorInfo.value?.privacyLevelOptions?.length
    ? creatorInfo.value.privacyLevelOptions.map((opt) => ({
        label: opt,
        value: opt,
      }))
    : PRIVACY_LEVEL_OPTIONS;

  return sourceOptions.map((opt) => ({
    ...opt,
    disabled: isBrandedContentSelected && opt.value === 'SELF_ONLY',
  }));
});

const selfOnlyDisabledTooltip = computed(() => {
  return $t('page.tiktokVideo.upload.brandedPrivacyWarning');
});

const canMakePost = computed(() => {
  if (!creatorInfo.value) return false;
  // If creator_info API returns that creator cannot post, block submission
  return true; // TODO: check actual field from creatorInfo when API supports it
});

const maxDuration = computed(() => {
  return creatorInfo.value?.maxVideoPostDurationSec ?? 600; // Default 10 minutes
});

const isValidDuration = computed(() => {
  return videoDuration.value <= maxDuration.value;
});

const canSubmit = computed(() => {
  return (
    selectedAccountId.value !== '' &&
    formState.title.trim() !== '' &&
    formState.privacyLevel !== undefined &&
    videoFile.value !== null &&
    isValidDuration.value &&
    canMakePost.value &&
    (!formState.brandContentToggle ||
      formState.brandOrganic ||
      formState.brandedContent)
  );
});

const showBrandContentError = computed(() => {
  return (
    formState.brandContentToggle &&
    !formState.brandOrganic &&
    !formState.brandedContent
  );
});

const showBrandedPrivacyWarning = computed(() => {
  return formState.brandedContent && formState.privacyLevel === 'SELF_ONLY';
});

const MUSIC_URL =
  'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en';
const BRANDED_POLICY_URL =
  'https://www.tiktok.com/legal/page/global/bc-policy/en';

// Whether to show the Branded Content Policy link
const showBrandedPolicy = computed(() => {
  return formState.brandContentToggle && formState.brandedContent;
});

// Brand label text
const brandLabelText = computed(() => {
  if (formState.brandOrganic && formState.brandedContent) {
    return $t('page.tiktokVideo.upload.brandLabelPaidPartnership');
  }
  if (formState.brandOrganic) {
    return $t('page.tiktokVideo.upload.brandLabelPromotional');
  }
  if (formState.brandedContent) {
    return $t('page.tiktokVideo.upload.brandLabelPaidPartnership');
  }
  return '';
});

// Fetch creator info on mount
onMounted(async () => {
  await fetchAuthorizedAccounts();
  await fetchCreatorInfo();
});

async function fetchAuthorizedAccounts() {
  try {
    const response = await getTiktokAccountListApi();
    accountList.value = Array.isArray(response.list) ? response.list : [];

    const routeAccountId =
      typeof route.query.tid === 'string' ? route.query.tid : '';

    if (
      routeAccountId &&
      accountList.value.some(
        (item) => (item.tid || item.ttAccountId) === routeAccountId,
      )
    ) {
      selectedAccountId.value = routeAccountId;
      return;
    }

    const firstAccount = accountList.value[0];
    if (firstAccount) {
      selectedAccountId.value = firstAccount.tid || firstAccount.ttAccountId;
    }
  } catch {
    message.error($t('page.tiktokVideo.upload.fetchAccountError'));
  }
}

async function fetchCreatorInfo() {
  if (!selectedAccountId.value) {
    creatorInfo.value = null;
    loadingCreator.value = false;
    return;
  }
  loadingCreator.value = true;
  try {
    const response = await getTiktokCreatorInfoApi(selectedAccountId.value);
    creatorInfo.value = response;
    formState.disableComment = response.commentDisabled;
    formState.disableDuet = response.duetDisabled;
    formState.disableStitch = response.stitchDisabled;
    if (
      formState.privacyLevel &&
      !response.privacyLevelOptions.includes(formState.privacyLevel)
    ) {
      formState.privacyLevel = undefined;
    }
  } catch {
    message.error($t('page.tiktokVideo.upload.fetchCreatorError'));
  } finally {
    loadingCreator.value = false;
  }
}

async function handleAccountChange(value: unknown) {
  selectedAccountId.value = typeof value === 'string' ? value : '';
  await fetchCreatorInfo();
}

function isAllowedVideoFile(file: File) {
  if (ALLOWED_VIDEO_FORMATS.includes(file.type)) {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return ALLOWED_VIDEO_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension),
  );
}

function setVideoDuration(file: File) {
  const metadataUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  const releaseMetadataUrl = () => {
    URL.revokeObjectURL(metadataUrl);
  };

  video.preload = 'metadata';
  video.addEventListener('loadedmetadata', () => {
    videoDuration.value = Math.floor(video.duration || 0);
    releaseMetadataUrl();
  });
  video.addEventListener('error', () => {
    videoDuration.value = 0;
    releaseMetadataUrl();
  });
  video.src = metadataUrl;
}

function setSelectedVideo(file: File) {
  if (videoPreview.value) {
    URL.revokeObjectURL(videoPreview.value);
  }

  videoFile.value = file;
  videoPreview.value = URL.createObjectURL(file);
  setVideoDuration(file);
}

const handleBeforeVideoUpload: UploadProps['beforeUpload'] = (file) => {
  if (!isAllowedVideoFile(file)) {
    message.error($t('page.tiktokVideo.upload.invalidFormat'));
    return false;
  }

  if (file.size > MAX_VIDEO_SIZE) {
    message.error($t('page.tiktokVideo.upload.fileTooLarge'));
    return false;
  }

  setSelectedVideo(file);
  return false;
};

// Remove video
function handleRemoveVideo() {
  videoFile.value = null;
  if (videoPreview.value) {
    URL.revokeObjectURL(videoPreview.value);
  }
  videoPreview.value = '';
  videoDuration.value = 0;
}

// Format duration
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Handle brand content toggle
function handleBrandContentToggle(checked: boolean | number | string) {
  formState.brandContentToggle = Boolean(checked);
  if (!checked) {
    formState.brandOrganic = false;
    formState.brandedContent = false;
  }
}

function handleBrandOrganicChange(checked: boolean) {
  formState.brandOrganic = checked;
}

function handleBrandedContentChange(checked: boolean) {
  formState.brandedContent = checked;
  // Auto-switch privacy from SELF_ONLY to PUBLIC when branded content is selected
  if (checked && formState.privacyLevel === 'SELF_ONLY') {
    formState.privacyLevel = 'PUBLIC_TO_EVERYONE';
    message.info($t('page.tiktokVideo.upload.brandedPrivacyWarning'));
  }
}

// Submit upload
async function handleSubmit() {
  if (!canSubmit.value || !videoFile.value) return;

  // Show confirmation dialog with hyperlinks
  const musicLink = h(
    'a',
    { href: MUSIC_URL, target: '_blank', rel: 'noopener noreferrer' },
    $t('page.tiktokVideo.upload.musicUsageConfirmation'),
  );
  const brandedLink = h(
    'a',
    { href: BRANDED_POLICY_URL, target: '_blank', rel: 'noopener noreferrer' },
    $t('page.tiktokVideo.upload.brandedContentPolicy'),
  );

  const content = showBrandedPolicy.value
    ? h('span', [
        $t('page.tiktokVideo.upload.agreementPrefix'),
        brandedLink,
        $t('page.tiktokVideo.upload.and'),
        musicLink,
        '.',
      ])
    : h('span', [
        $t('page.tiktokVideo.upload.agreementPrefix'),
        musicLink,
        '.',
      ]);

  Modal.confirm({
    content,
    okText: $t('page.tiktokVideo.upload.confirm'),
    cancelText: $t('page.tiktokVideo.upload.cancel'),
    title: $t('page.tiktokVideo.upload.confirmUpload'),
    onOk: async () => {
      await performUpload();
    },
  });
}

async function performUpload() {
  if (!videoFile.value || !selectedAccountId.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  let progressInterval: ReturnType<typeof setInterval> | undefined;

  try {
    // Simulate progress
    progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10;
      }
    }, 500);

    const fileResp = await uploadShortVideoFileApi(videoFile.value);
    const fileId = fileResp.fileId || fileResp.id;
    if (!fileId) {
      clearInterval(progressInterval);
      message.error($t('page.tiktokVideo.upload.fileIdMissing'));
      return;
    }

    await publishTiktokVideoApi({
      tid: selectedAccountId.value,
      fileId,
      type: 0,
      privacyLevel: formState.privacyLevel!,
      title: formState.title.trim(),
      disableComment: formState.disableComment,
      disableDuet: formState.disableDuet,
      disableStitch: formState.disableStitch,
      videoCoverTimestampMs: 0,
      brandContentToggle: formState.brandContentToggle,
      brandOrganicToggle: formState.brandOrganic,
      isAigc: formState.isAigc,
      remark: formState.description.trim(),
    });

    uploadProgress.value = 100;

    message.success($t('page.tiktokVideo.upload.uploadSuccess'));

    // Reset form after successful upload
    resetForm();
    await router.push('/tiktok-video/list/index');
  } catch {
    message.error($t('page.tiktokVideo.upload.uploadFailed'));
  } finally {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    uploading.value = false;
  }
}

// Reset form
function resetForm() {
  formState.title = '';
  formState.description = '';
  formState.privacyLevel = undefined;
  formState.disableComment = false;
  formState.disableDuet = false;
  formState.disableStitch = false;
  formState.brandContentToggle = false;
  formState.brandOrganic = false;
  formState.brandedContent = false;
  formState.isAigc = false;
  handleRemoveVideo();
}
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loadingCreator">
      <Row :gutter="24">
        <!-- Left column: Form -->
        <Col :span="14">
          <Card :title="$t('page.tiktokVideo.upload.title')">
            <!-- Creator info -->
            <div v-if="creatorInfo" class="creator-info mb-4">
              <Alert
                :message="`${$t('page.tiktokVideo.upload.uploadingAs')}: ${
                  creatorInfo.creatorNickname
                }`"
                show-icon
              />
              <Alert
                v-if="!canMakePost"
                :message="$t('page.tiktokVideo.upload.cannotPost')"
                type="warning"
                class="mt-2"
                show-icon
              />
              <div class="creator-readonly mt-2">
                <div>tid: {{ creatorInfo.tid }}</div>
                <div>username: {{ creatorInfo.creatorUsername || '-' }}</div>
                <div>
                  {{ $t('page.tiktokVideo.upload.interactionLimits') }}
                  {{ $t('page.tiktokVideo.upload.comment') }}
                  {{
                    creatorInfo.commentDisabled
                      ? $t('page.tiktokVideo.upload.off')
                      : $t('page.tiktokVideo.upload.on')
                  }}
                  / {{ $t('page.tiktokVideo.upload.duet') }}
                  {{
                    creatorInfo.duetDisabled
                      ? $t('page.tiktokVideo.upload.off')
                      : $t('page.tiktokVideo.upload.on')
                  }}
                  / {{ $t('page.tiktokVideo.upload.stitch') }}
                  {{
                    creatorInfo.stitchDisabled
                      ? $t('page.tiktokVideo.upload.off')
                      : $t('page.tiktokVideo.upload.on')
                  }}
                </div>
                <div>
                  {{ $t('page.tiktokVideo.upload.maxDuration') }}
                  {{ creatorInfo.maxVideoPostDurationSec }}
                  {{ $t('page.tiktokVideo.upload.seconds') }}
                </div>
              </div>
            </div>

            <Form layout="vertical">
              <Form.Item
                :label="$t('page.tiktokVideo.upload.accountLabel')"
                :required="true"
              >
                <Select
                  :value="selectedAccountId"
                  :get-popup-container="
                    (trigger: HTMLElement) => trigger.parentElement!
                  "
                  :options="
                    accountList.map((item) => ({
                      label:
                        item.displayName ||
                        item.nickname ||
                        item.username ||
                        item.tid ||
                        item.ttAccountId,
                      value: item.tid || item.ttAccountId,
                    }))
                  "
                  :placeholder="
                    $t('page.tiktokVideo.upload.accountPlaceholder')
                  "
                  @change="handleAccountChange"
                />
              </Form.Item>

              <!-- Title -->
              <Form.Item
                :label="$t('page.tiktokVideo.upload.titleLabel')"
                :rules="[{ required: true }]"
              >
                <Input
                  v-model:value="formState.title"
                  :maxlength="150"
                  :placeholder="$t('page.tiktokVideo.upload.titlePlaceholder')"
                  show-count
                />
              </Form.Item>

              <!-- Description -->
              <Form.Item
                :label="$t('page.tiktokVideo.upload.descriptionLabel')"
              >
                <Input.TextArea
                  v-model:value="formState.description"
                  :maxlength="4000"
                  :placeholder="
                    $t('page.tiktokVideo.upload.descriptionPlaceholder')
                  "
                  :rows="4"
                  show-count
                />
              </Form.Item>

              <!-- Video Upload -->
              <Form.Item
                :label="$t('page.tiktokVideo.upload.videoLabel')"
                :required="true"
              >
                <div v-if="!videoFile" class="upload-area">
                  <Upload.Dragger
                    :accept="ALLOWED_VIDEO_FORMATS.join(',')"
                    :before-upload="handleBeforeVideoUpload"
                    :max-count="1"
                    :show-upload-list="false"
                  >
                    <p class="ant-upload-drag-icon">
                      <IconifyIcon
                        icon="ant-design:inbox-outlined"
                        class="upload-icon"
                      />
                    </p>
                    <p class="ant-upload-text">
                      {{ $t('page.tiktokVideo.upload.dragVideo') }}
                    </p>
                    <p class="ant-upload-hint">
                      {{ $t('page.tiktokVideo.upload.videoHint') }}
                    </p>
                  </Upload.Dragger>
                </div>

                <!-- Video Preview -->
                <div v-else class="video-preview">
                  <video
                    :src="videoPreview"
                    class="preview-video"
                    controls
                  ></video>
                  <div class="video-info">
                    <span>{{ videoFile.name }}</span>
                    <span>{{ formatDuration(videoDuration) }}</span>
                    <Button danger size="small" @click="handleRemoveVideo">
                      {{ $t('page.tiktokVideo.upload.remove') }}
                    </Button>
                  </div>
                  <Alert
                    v-if="!isValidDuration"
                    :message="`${$t(
                      'page.tiktokVideo.upload.durationExceeded',
                    )} (${formatDuration(maxDuration)})`"
                    type="error"
                    class="mt-2"
                  />
                </div>
              </Form.Item>

              <!-- Privacy Level -->
              <Form.Item
                :label="$t('page.tiktokVideo.upload.privacyLabel')"
                :required="true"
              >
                <Select
                  v-model:value="formState.privacyLevel"
                  :get-popup-container="
                    (trigger: HTMLElement) => trigger.parentElement!
                  "
                  :placeholder="
                    $t('page.tiktokVideo.upload.privacyPlaceholder')
                  "
                >
                  <Select.Option
                    v-for="opt in privacyOptions"
                    :key="opt.value"
                    :value="opt.value"
                    :disabled="opt.disabled"
                  >
                    <Tooltip
                      v-if="opt.disabled"
                      :title="selfOnlyDisabledTooltip"
                      placement="right"
                    >
                      <div class="disabled-option-full">{{ opt.label }}</div>
                    </Tooltip>
                    <span v-else>{{ opt.label }}</span>
                  </Select.Option>
                </Select>
                <Alert
                  v-if="showBrandedPrivacyWarning"
                  :message="$t('page.tiktokVideo.upload.brandedPrivacyWarning')"
                  type="warning"
                  class="mt-2"
                />
              </Form.Item>

              <!-- Interaction Settings -->
              <Form.Item
                :label="$t('page.tiktokVideo.upload.interactionLabel')"
              >
                <div class="interaction-options">
                  <Checkbox
                    v-model:checked="formState.disableComment"
                    :disabled="creatorInfo?.commentDisabled"
                  >
                    {{ $t('page.tiktokVideo.upload.disableComment') }}
                  </Checkbox>
                  <Checkbox
                    v-model:checked="formState.disableDuet"
                    :disabled="creatorInfo?.duetDisabled"
                  >
                    {{ $t('page.tiktokVideo.upload.disableDuet') }}
                  </Checkbox>
                  <Checkbox
                    v-model:checked="formState.disableStitch"
                    :disabled="creatorInfo?.stitchDisabled"
                  >
                    {{ $t('page.tiktokVideo.upload.disableStitch') }}
                  </Checkbox>
                </div>
              </Form.Item>

              <Form.Item :label="$t('page.tiktokVideo.upload.aigcLabel')">
                <Switch v-model:checked="formState.isAigc" />
              </Form.Item>

              <!-- Commercial Content Disclosure -->
              <Divider>
                {{ $t('page.tiktokVideo.upload.commercialContent') }}
              </Divider>

              <Form.Item>
                <div class="commercial-content">
                  <div class="toggle-row">
                    <span>{{
                      $t('page.tiktokVideo.upload.brandContentToggle')
                    }}</span>
                    <Switch
                      v-model:checked="formState.brandContentToggle"
                      @change="handleBrandContentToggle"
                    />
                  </div>

                  <div
                    v-if="formState.brandContentToggle"
                    class="brand-options"
                  >
                    <div class="brand-option-item">
                      <Checkbox
                        :checked="formState.brandOrganic"
                        @change="
                          handleBrandOrganicChange($event.target.checked)
                        "
                      >
                        {{ $t('page.tiktokVideo.upload.brandOrganic') }}
                      </Checkbox>
                      <div class="brand-option-hint">
                        {{ $t('page.tiktokVideo.upload.brandOrganicHint') }}
                      </div>
                    </div>
                    <div class="brand-option-item">
                      <Checkbox
                        :checked="formState.brandedContent"
                        @change="
                          handleBrandedContentChange($event.target.checked)
                        "
                      >
                        {{ $t('page.tiktokVideo.upload.brandedContent') }}
                      </Checkbox>
                      <div class="brand-option-hint">
                        {{ $t('page.tiktokVideo.upload.brandedContentHint') }}
                      </div>
                    </div>

                    <Alert
                      v-if="brandLabelText"
                      :message="brandLabelText"
                      type="info"
                      class="mt-2"
                    />

                    <Tooltip
                      v-if="showBrandContentError"
                      :title="
                        $t('page.tiktokVideo.upload.brandContentRequired')
                      "
                    >
                      <Alert
                        :message="
                          $t('page.tiktokVideo.upload.brandContentRequired')
                        "
                        type="warning"
                        class="mt-2"
                      />
                    </Tooltip>
                  </div>
                </div>
              </Form.Item>

              <!-- Agreement -->
              <div class="agreement-notice mb-4">
                <IconifyIcon
                  icon="ant-design:info-circle-outlined"
                  class="agreement-icon"
                />
                <span>
                  {{ $t('page.tiktokVideo.upload.agreementPrefix') }}
                  <a
                    v-if="showBrandedPolicy"
                    :href="BRANDED_POLICY_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ $t('page.tiktokVideo.upload.brandedContentPolicy') }}
                  </a>
                  <template v-if="showBrandedPolicy">
                    {{ $t('page.tiktokVideo.upload.and') }}
                  </template>
                  <a
                    :href="MUSIC_URL"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ $t('page.tiktokVideo.upload.musicUsageConfirmation') }}
                  </a>
                  .
                </span>
              </div>

              <!-- Processing Notice -->
              <Alert
                :message="$t('page.tiktokVideo.upload.processingNotice')"
                type="info"
                show-icon
                class="mb-4"
              />

              <!-- Submit Button -->
              <Form.Item>
                <Tooltip
                  v-if="!canSubmit && showBrandContentError"
                  :title="$t('page.tiktokVideo.upload.brandContentRequired')"
                >
                  <Button
                    :disabled="!canSubmit"
                    :loading="uploading"
                    type="primary"
                    @click="handleSubmit"
                  >
                    {{ $t('page.tiktokVideo.upload.submit') }}
                  </Button>
                </Tooltip>
                <Button
                  v-else
                  :disabled="!canSubmit"
                  :loading="uploading"
                  type="primary"
                  @click="handleSubmit"
                >
                  {{ $t('page.tiktokVideo.upload.submit') }}
                </Button>

                <Progress
                  v-if="uploading"
                  :percent="uploadProgress"
                  :status="uploadProgress === 100 ? 'success' : 'active'"
                  class="mt-2"
                />
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <!-- Right column: Preview -->
        <Col :span="10">
          <Card :title="$t('page.tiktokVideo.upload.previewTitle')">
            <div class="preview-container">
              <div v-if="!videoFile" class="preview-empty">
                {{ $t('page.tiktokVideo.upload.previewEmpty') }}
              </div>
              <div v-else class="preview-content">
                <video
                  :src="videoPreview"
                  class="preview-video-mobile"
                  controls
                ></video>
                <div class="preview-info">
                  <h4>
                    {{
                      formState.title || $t('page.tiktokVideo.upload.untitled')
                    }}
                  </h4>
                  <p v-if="formState.description">
                    {{ formState.description }}
                  </p>
                  <div class="preview-meta">
                    <span>
                      {{ $t('page.tiktokVideo.upload.privacy') }}:
                      {{ formState.privacyLevel || '-' }}
                    </span>
                    <span>
                      {{ $t('page.tiktokVideo.upload.duration') }}:
                      {{ formatDuration(videoDuration) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Spin>
  </Page>
</template>

<style scoped>
.creator-info {
  margin-bottom: 16px;
}

.creator-readonly {
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.7;
  color: #666;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.upload-area {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #1890ff;
}

.video-preview {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-video {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.video-info {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 4px;
}

.interaction-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.commercial-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 16px;
  border-left: 2px solid #e8e8e8;
}

.brand-option-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.brand-option-hint {
  padding-left: 24px;
  font-size: 12px;
  color: #999;
}

.preview-container {
  min-height: 400px;
}

.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
  color: #999;
  background: #f5f5f5;
  border-radius: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-video-mobile {
  width: 100%;
  max-height: 350px;
  aspect-ratio: 9/16;
  object-fit: cover;
  background: #000;
  border-radius: 12px;
}

.preview-info h4 {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 600;
}

.preview-info p {
  margin: 0 0 12px;
  font-size: 12px;
  color: #666;
}

.preview-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.mb-2 {
  margin-bottom: 8px;
}

.mb-4 {
  margin-bottom: 16px;
}

.mt-2 {
  margin-top: 8px;
}

.disabled-option-full {
  width: 100%;
  color: rgb(0 0 0 / 25%);
  cursor: not-allowed;
}

.agreement-notice {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 12px;
  font-size: 14px;
  color: rgb(0 0 0 / 65%);
  background-color: #e6f7ff;
  border: 1px solid #91d5ff;
  border-radius: 4px;
}

.agreement-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 16px;
  color: #1890ff;
}

.agreement-notice a {
  color: #1890ff;
  text-decoration: none;
}

.agreement-notice a:hover {
  text-decoration: underline;
}
</style>
