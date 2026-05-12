<script setup lang="ts">
import type { UploadFile } from 'ant-design-vue';
import type { Dayjs } from 'dayjs';

import type { ReceivingAccountItem, WalletInfo } from '#/api/wallet';

import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore } from '@vben/stores';

import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Tabs,
  Upload,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getReceivingAccountListApi,
  getWalletInfoApi,
  uploadFileApi,
  walletRechargeApi,
} from '#/api/wallet';
import { $t } from '#/locales';

interface RechargeFormState {
  applyAmount?: number;
  payerInput?: string;
  paidAt?: Dayjs | string;
  clientRemark?: string;
}

const activeSort = ref('1');
const uploadList = ref<UploadFile[]>([]);
const submitting = ref(false);
const walletInfo = ref<null | WalletInfo>(null);
const receivingAccounts = ref<ReceivingAccountItem[]>([]);
const selectedReceivingId = ref('');
const router = useRouter();

const formState = reactive<RechargeFormState>({
  applyAmount: undefined,
  payerInput: undefined,
  paidAt: undefined,
  clientRemark: '',
});

const isUSDT = computed(() => activeSort.value === '2');

const currencyLabel = computed(() => {
  const map: Record<string, string> = {
    '1': 'USD',
    '2': 'USDT',
    '3': '',
    '4': 'CNY',
  };
  return map[activeSort.value] || '';
});

const walletAvailableAmount = computed(() => {
  return Number(walletInfo.value?.balance ?? 0);
});

const walletCurrency = computed(
  () => walletInfo.value?.walletCurrency ?? walletInfo.value?.currency ?? 'CNY',
);

const activeReceivingAccounts = computed(() => {
  return receivingAccounts.value.filter(
    (item) => String(item.sort) === activeSort.value,
  );
});

// 切换Tab时自动选中第一个收款账户
watch(activeSort, () => {
  const accounts = activeReceivingAccounts.value;
  selectedReceivingId.value = accounts.length > 0 ? accounts[0]!.id : '';
});

/** paymentCode 图片的 blob URL 缓存（accountId -> blobUrl） */
const paymentCodeBlobs = ref<Record<string, string>>({});

async function loadPaymentCodeImages() {
  const accessStore = useAccessStore();
  const headers: Record<string, string> = {};
  if (accessStore.accessToken) {
    headers.Authorization = `Bearer ${accessStore.accessToken}`;
  }

  for (const account of receivingAccounts.value) {
    if (account.paymentCode && !paymentCodeBlobs.value[account.id]) {
      try {
        const response = await fetch(account.paymentCode, { headers });
        const blob = await response.blob();
        paymentCodeBlobs.value[account.id] = URL.createObjectURL(blob);
      } catch {
        // 请求失败时使用原始地址兜底
        paymentCodeBlobs.value[account.id] = account.paymentCode;
      }
    }
  }
}

onBeforeUnmount(() => {
  for (const url of Object.values(paymentCodeBlobs.value)) {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
});

function getReceivingDisplay(item: ReceivingAccountItem) {
  const bankName = item.bankName || '';
  const bankBranch = item.bankBranch || '';
  const bankNameText =
    bankName && bankBranch ? `${bankName} (${bankBranch})` : bankName;
  return {
    accountName: item.accountName || '-',
    accountNumber: item.accountNumber || '-',
    bankName: bankNameText || '-',
    accountOpeningArea: item.accountOpeningArea || '-',
    bankAddress: item.bankAddress || '-',
    swiftCode: item.swiftCode || '-',
    bankCode: item.bankCode || '-',
    branchCode: item.branchCode || '-',
  };
}

async function handleUpload(file: File): Promise<null | string> {
  try {
    const resp = await uploadFileApi(file, 0);
    return resp.id;
  } catch {
    message.error($t('page.finance.walletRecharge.uploadFailed'));
    return null;
  }
}

async function handleBeforeUpload(file: File) {
  const isValidType = ['image/jpeg', 'image/jpg', 'image/png'].includes(
    file.type,
  );
  if (!isValidType) {
    message.error($t('page.finance.walletRecharge.onlyJpgPng'));
    return Upload.LIST_IGNORE;
  }
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    message.error($t('page.finance.walletRecharge.fileSizeLimit'));
    return Upload.LIST_IGNORE;
  }
  return false;
}

async function handleSubmit() {
  if (submitting.value) return;

  if (!formState.applyAmount || formState.applyAmount < 10) {
    message.error($t('page.finance.walletRecharge.transferAmountMinError'));
    return;
  }
  if (!formState.payerInput?.trim()) {
    const label = isUSDT.value
      ? $t('page.finance.walletRecharge.payerWalletAddress')
      : $t('page.finance.walletRecharge.payerCompanyName');
    message.error(`${$t('page.common.pleaseInput')}${label}`);
    return;
  }
  if (!formState.paidAt) {
    message.error($t('page.finance.walletRecharge.selectTransferTime'));
    return;
  }
  if (uploadList.value.length === 0) {
    message.error($t('page.finance.walletRecharge.uploadVoucherRequired'));
    return;
  }
  if (!selectedReceivingId.value) {
    message.error(
      $t('page.finance.walletRecharge.selectReceivingAccountError'),
    );
    return;
  }

  submitting.value = true;
  try {
    const uploadedIds: string[] = [];
    for (const file of uploadList.value) {
      if (file.originFileObj) {
        const id = await handleUpload(file.originFileObj);
        if (id) {
          uploadedIds.push(id);
        } else {
          submitting.value = false;
          return;
        }
      }
    }

    const paidAt = dayjs(formState.paidAt).toISOString();

    await walletRechargeApi({
      applyAmount: formState.applyAmount,
      payerAccount: isUSDT.value
        ? { walletAddress: formState.payerInput.trim() }
        : { companyName: formState.payerInput.trim() },
      receivingAccountId: selectedReceivingId.value,
      paidAt,
      vouchers: uploadedIds,
      clientRemark: formState.clientRemark?.trim() || '',
    });

    message.success($t('page.finance.walletRecharge.submitSuccess'));
    router.push('/finance/wallet-recharge-record/index');
    formState.applyAmount = undefined;
    formState.payerInput = undefined;
    formState.paidAt = undefined;
    formState.clientRemark = '';
    uploadList.value = [];
  } catch {
    message.error($t('page.finance.walletRecharge.submitFailed'));
  } finally {
    submitting.value = false;
  }
}

function handleCopy(value?: string) {
  if (!value) {
    message.error($t('page.finance.walletRecharge.noContentToCopy'));
    return;
  }
  navigator.clipboard?.writeText(value);
  message.success($t('page.finance.walletRecharge.copied'));
}

function handleCopyAccountAll(account: ReceivingAccountItem) {
  const display = getReceivingDisplay(account);
  const content = [
    `${$t('page.finance.walletRecharge.accountName')}${display.accountName}`,
    `${$t('page.finance.walletRecharge.bankAccountNumber')}${display.accountNumber}`,
    `${$t('page.finance.walletRecharge.bankName')}${display.bankName}`,
    `${$t('page.finance.walletRecharge.bankLocation')}${display.accountOpeningArea}`,
    `${$t('page.finance.walletRecharge.bankAddress')}${display.bankAddress}`,
    `${$t('page.finance.walletRecharge.swiftCode')}${display.swiftCode}`,
    `${$t('page.finance.walletRecharge.bankCode')}${display.bankCode}`,
    `${$t('page.finance.walletRecharge.branchCode')}${display.branchCode}`,
  ].join('\n');
  navigator.clipboard?.writeText(content);
  message.success($t('page.finance.walletRecharge.copiedAll'));
}

function formatCurrency(value: number | string, currency: string) {
  if (!currency) return value ? String(value) : '-';
  const amount = Number(value);
  if (Number.isNaN(amount)) return String(value);
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
  return formatted.replace(/^CN/, '');
}

async function loadWalletInfo() {
  try {
    const resp = await getWalletInfoApi();
    walletInfo.value = resp;
  } catch {
    message.error($t('page.finance.walletRecharge.fetchWalletInfoFailed'));
  }
}

async function loadReceivingAccounts() {
  try {
    const resp = await getReceivingAccountListApi();
    receivingAccounts.value = resp;
    // 默认选中第一个收款账户
    const firstAccount = resp.find(
      (item) => String(item.sort) === activeSort.value,
    );
    if (firstAccount) {
      selectedReceivingId.value = firstAccount.id;
    }
    // 预加载 paymentCode 图片为 blob URL
    loadPaymentCodeImages();
  } catch {
    message.error(
      $t('page.finance.walletRecharge.fetchReceivingAccountFailed'),
    );
  }
}

onMounted(() => {
  loadWalletInfo();
  loadReceivingAccounts();
});
</script>

<template>
  <Page auto-content-height :title="$t('page.finance.walletRecharge.title')">
    <div class="flex flex-col gap-4">
      <Card>
        <div class="flex flex-col gap-2">
          <div class="text-sm text-gray-500">
            {{ $t('page.finance.walletRecharge.walletAvailableBalance') }}
          </div>
          <div class="text-2xl font-semibold text-gray-900">
            {{ formatCurrency(walletAvailableAmount, walletCurrency) }}
          </div>
          <div class="pt-2 text-sm text-gray-500">
            {{ $t('page.finance.walletRecharge.adAccountCurrency') }}
          </div>
          <div class="text-2xl font-semibold text-gray-900">USD</div>
        </div>
      </Card>

      <Card>
        <Tabs v-model:active-key="activeSort">
          <Tabs.TabPane
            key="1"
            :tab="$t('page.finance.walletRecharge.usdRecharge')"
          />
          <Tabs.TabPane
            key="2"
            :tab="$t('page.finance.walletRecharge.usdtRecharge')"
          />
          <Tabs.TabPane
            key="4"
            :tab="$t('page.finance.walletRecharge.cnyRecharge')"
          />
          <Tabs.TabPane
            key="3"
            :tab="$t('page.finance.walletRecharge.otherRecharge')"
          />
        </Tabs>

        <Form layout="vertical" :model="formState" class="mt-4">
          <Form.Item>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>{{ $t('page.finance.walletRecharge.paymentMethod') }}</span>
              <span class="font-medium text-gray-900">{{
                $t('page.finance.walletRecharge.offlineTransfer')
              }}</span>
            </div>
          </Form.Item>

          <!-- 转账金额 -->
          <Form.Item
            :label="$t('page.finance.walletRecharge.transferAmount')"
            name="applyAmount"
            required
          >
            <InputNumber
              v-model:value="formState.applyAmount"
              class="w-64"
              :min="10"
              :precision="2"
              :addon-after="currencyLabel"
              :placeholder="$t('page.common.pleaseInput')"
            />
          </Form.Item>

          <!-- 付款信息：USDT显示钱包地址，其他显示公司名称 -->
          <Form.Item
            :label="
              isUSDT
                ? $t('page.finance.walletRecharge.payerWalletAddress')
                : $t('page.finance.walletRecharge.payerCompanyName')
            "
            name="payerInput"
            required
          >
            <Input
              v-model:value="formState.payerInput"
              class="w-96"
              :placeholder="
                isUSDT
                  ? $t(
                      'page.finance.walletRecharge.payerWalletAddressPlaceholder',
                    )
                  : $t(
                      'page.finance.walletRecharge.payerCompanyNamePlaceholder',
                    )
              "
            />
          </Form.Item>

          <!-- 平台收款信息 -->
          <Form.Item :label="$t('page.finance.walletRecharge.receivingInfo')">
            <!-- 多个收款账户时显示单选 -->
            <Radio.Group
              v-if="activeReceivingAccounts.length > 1"
              v-model:value="selectedReceivingId"
              class="mb-3"
            >
              <Radio
                v-for="(acc, idx) in activeReceivingAccounts"
                :key="acc.id"
                :value="acc.id"
              >
                {{ $t('page.finance.walletRecharge.receivingAccountLabel') }}
                {{ idx + 1 }}
              </Radio>
            </Radio.Group>

            <!-- 展示所有收款账户信息 -->
            <div
              v-for="(account, idx) in activeReceivingAccounts"
              :key="account.id"
              :style="
                activeReceivingAccounts.length > 1 ? 'margin-bottom: 16px;' : ''
              "
            >
              <div
                v-if="activeReceivingAccounts.length > 1"
                class="receiving-card-header"
              >
                {{ $t('page.finance.walletRecharge.receivingAccountLabel') }}
                {{ idx + 1 }}
              </div>

              <!-- USDT 收款信息 -->
              <template v-if="isUSDT">
                <div
                  class="receiving-card"
                  :class="{
                    'receiving-card-selected':
                      activeReceivingAccounts.length > 1 &&
                      account.id === selectedReceivingId,
                  }"
                >
                  <div class="flex flex-col gap-4">
                    <img
                      v-if="account.paymentCode"
                      :src="paymentCodeBlobs[account.id] || account.paymentCode"
                      alt="收款二维码"
                      class="h-40 w-40 object-contain"
                    />
                    <div class="flex items-center gap-2 text-sm text-gray-500">
                      <span>{{
                        $t('page.finance.walletRecharge.walletAddress')
                      }}</span>
                      <span>{{ account.accountNumber || '-' }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.accountNumber)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              </template>

              <!-- 非USDT 收款信息（银行详情） -->
              <template v-else>
                <div
                  class="receiving-card"
                  :class="{
                    'receiving-card-selected':
                      activeReceivingAccounts.length > 1 &&
                      account.id === selectedReceivingId,
                  }"
                >
                  <Button
                    type="text"
                    size="small"
                    class="absolute right-3 top-3"
                    @click="handleCopyAccountAll(account)"
                  >
                    <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                  </Button>
                  <div class="flex flex-col gap-3 text-sm text-gray-700">
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.accountName')
                      }}</span>
                      <span class="flex-1">{{
                        account.accountName || '-'
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.accountName)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.bankAccountNumber')
                      }}</span>
                      <span class="flex-1">{{
                        account.accountNumber || '-'
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.accountNumber)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.bankName')
                      }}</span>
                      <span class="flex-1">{{
                        getReceivingDisplay(account).bankName
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.bankName)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.bankLocation')
                      }}</span>
                      <span class="flex-1">{{
                        account.accountOpeningArea || '-'
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.accountOpeningArea)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.bankAddress')
                      }}</span>
                      <span class="flex-1">{{
                        account.bankAddress || '-'
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.bankAddress)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.swiftCode')
                      }}</span>
                      <span class="flex-1">{{ account.swiftCode || '-' }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.swiftCode)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.bankCode')
                      }}</span>
                      <span class="flex-1">{{ account.bankCode || '-' }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.bankCode)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="w-28 text-gray-500">{{
                        $t('page.finance.walletRecharge.branchCode')
                      }}</span>
                      <span class="flex-1">{{
                        account.branchCode || '-'
                      }}</span>
                      <Button
                        type="link"
                        size="small"
                        @click="handleCopy(account.branchCode)"
                      >
                        <IconifyIcon icon="lucide:copy" class="text-gray-400" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div
                  v-if="idx === activeReceivingAccounts.length - 1"
                  class="mt-2 text-sm text-blue-600"
                >
                  {{ $t('page.finance.walletRecharge.receivingHint') }}
                </div>
              </template>
            </div>

            <!-- 无收款账户 -->
            <div
              v-if="activeReceivingAccounts.length === 0"
              class="text-sm text-gray-400"
            >
              {{ $t('page.finance.walletRecharge.noReceivingInfo') }}
            </div>
          </Form.Item>

          <!-- 上传转账凭证 -->
          <Form.Item
            :label="$t('page.finance.walletRecharge.uploadVoucher')"
            required
          >
            <Upload
              v-model:file-list="uploadList"
              list-type="picture-card"
              :before-upload="handleBeforeUpload"
              :max-count="6"
              accept=".jpg,.jpeg,.png"
              :disabled="submitting"
            >
              <div class="flex h-20 w-20 flex-col items-center justify-center">
                <div class="text-lg text-gray-500">+</div>
                <div class="text-xs text-gray-500">
                  {{ $t('page.finance.walletRecharge.uploadBtn') }}
                </div>
              </div>
            </Upload>
            <div class="mt-2 text-xs text-gray-500">
              {{ $t('page.finance.walletRecharge.uploadHint') }}
            </div>
          </Form.Item>

          <!-- 转账时间 -->
          <Form.Item
            :label="$t('page.finance.walletRecharge.transferTime')"
            name="paidAt"
            required
          >
            <DatePicker
              v-model:value="formState.paidAt"
              class="w-64"
              :show-time="{ format: 'HH:mm:ss' }"
              format="YYYY-MM-DD HH:mm:ss"
              :placeholder="$t('page.common.pleaseSelect')"
            />
            <div class="mt-2 text-xs text-gray-500">
              {{ $t('page.finance.walletRecharge.transferTimeHint') }}
            </div>
          </Form.Item>

          <!-- 转账备注 -->
          <Form.Item
            :label="$t('page.finance.walletRecharge.transferRemark')"
            name="clientRemark"
          >
            <Input.TextArea
              v-model:value="formState.clientRemark"
              :rows="4"
              :placeholder="$t('page.common.pleaseInput')"
            />
          </Form.Item>

          <div class="mb-4 text-sm text-blue-600">
            {{ $t('page.finance.walletRecharge.submitHint') }}
          </div>

          <Form.Item>
            <Button type="primary" :loading="submitting" @click="handleSubmit">
              {{ $t('page.common.submit') }}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.receiving-card {
  position: relative;
  padding: 16px;
  background-color: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 8px;
}

.receiving-card-selected {
  border-color: #60a5fa;
  box-shadow: 0 0 0 1px #60a5fa;
}

.receiving-card-header {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
}
</style>
