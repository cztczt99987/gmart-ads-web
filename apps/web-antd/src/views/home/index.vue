<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page, Tippy } from '@vben/common-ui';
import { openWindow } from '@vben/utils';

import { Button, Card, message } from 'ant-design-vue';

import { getWalletBalanceApi } from '#/api/wallet';
import yunyingAvatar from '#/assets/yunying.jpeg';

const router = useRouter();

const guideSteps = [
  {
    title: 'Tiktok 申请开户',
    description: '根据流程完成开户资料填写',
    actionText: '去开户',
    actionPath: '/advertisers/apply/index',
  },
  {
    title: '钱包充值',
    description: '完成企业钱包充值，广告账户可进行充值',
    actionText: '去充值',
    actionPath: '/finance/wallet-recharge/index',
  },
  {
    title: '广告账户充值',
    description: '账户充值并确认到账，可进行投放',
    actionText: '去充值',
    actionPath: '/ad-accounts/list/index',
  },
];

const guideLinks = [
  {
    title: '如何注册 TikTok Business Center 账户',
    url: 'https://my.feishu.cn/docx/Rp56dDYZbo6dJ4xzdfHcxVt9nnf',
  },
];

const walletBalance = ref(0);
const adBalance = ref(0);

const walletBalanceText = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(walletBalance.value),
);

const adBalanceText = computed(() =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(adBalance.value),
);

const overviewItems = computed(() => [
  { label: '钱包可用余额', value: walletBalanceText.value },
  { label: '所有广告账户余额', value: adBalanceText.value },
]);

function handleGuideAction(path: string) {
  router.push(path);
}

function handleOpenWalletDetail() {
  router.push('/finance/wallet-recharge/index');
}

function handleOpenGuide(url: string) {
  openWindow(url, { target: '_blank' });
}

async function loadWalletBalance() {
  try {
    const resp = await getWalletBalanceApi();
    walletBalance.value = Number(resp?.walletBalance ?? 0);
    adBalance.value = Number(resp?.adBalance ?? 0);
  } catch {
    message.error('获取钱包余额失败');
  }
}

onMounted(() => {
  loadWalletBalance();
});
</script>

<template>
  <Page>
    <div class="flex flex-col gap-6">
      <Card>
        <div
          class="rounded-lg bg-gradient-to-r from-[#e9f0ff] via-[#eef3ff] to-[#f2f5ff] p-6"
        >
          <div class="flex items-center justify-between gap-4">
            <div class="text-lg font-semibold text-gray-900">
              Hi，欢迎使用Gmart，助你高效开展广告业务！
            </div>
            <Tippy
              :content="
                () => `
                <div class='flex flex-col items-center group relative w-[380px]'>
                  <div class='bg-white w-[380px] py-[14px] pl-[14px] pr-[14px] rounded-[8px]'>
                    <div>
                      <div class='pl-[8px] pr-[8px] flex items-center bg-[#f8f8f8] rounded-[8px] ph-[8px] py-[6px] mb-[10px]'>
                        <div class='relative'>
                          <img src='${yunyingAvatar}' alt='gmart运营顾问' class='w-[56px] h-[56px] rounded-[8px] mr-[10px] overflow-hidden opacity-100 transition-opacity' />
                        </div>
                        <div>
                          <div class='font-bold text-[14px] text-[#303030]'>gmart运营顾问</div>
                          <div class='text-[12px] text-[#8a8a8a] mt-[3px]'>为您提供广告账户专属运营指导</div>
                        </div>
                      </div>
                      <div class='flex justify-around'>
                        <div class='flex flex-col items-center' style='width: 110px;'>
                          <div class='rounded-[8px] overflow-hidden relative' style='width: 110px; height: 110px;'>
                            <div class='relative' style='width: 110px; height: 110px; object-fit: contain;'>
                              <img src='/img_v3_02vh_5b8558b0-503c-4708-b76e-a299b11ee1fg.jpg' alt='gmart运营顾问二维码' class='rounded-[8px] opacity-100 transition-opacity' style='width: 110px; height: 110px; object-fit: contain;' />
                            </div>
                          </div>
                        </div>
                        <div class='flex flex-col items-center' style='width: 110px;'>
                          <div class='rounded-[8px] overflow-hidden relative' style='width: 110px; height: 110px;'>
                            <div class='relative' style='width: 110px; height: 110px; object-fit: contain;'>
                              <img src='/img_v3_02vh_e14e443b-6a37-4cdf-b6c7-757fcd5b7bdg.jpg' alt='gmart运营顾问二维码' class='rounded-[8px] opacity-100 transition-opacity' style='width: 110px; height: 110px; object-fit: contain;' />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `
              "
              placement="bottom"
              trigger="mouseenter focusin"
              theme="light"
              :allow-html="true"
              :interactive="true"
              :arrow="true"
              animation="shift-away"
              :duration="200"
              :delay="[200, 200]"
              max-width="none"
            >
              <Button
                type="default"
                style="
                  display: flex;
                  gap: 8px;
                  align-items: center;
                  padding: 6px 12px;
                  border-radius: 8px;
                "
              >
                添加专属运营
              </Button>
            </Tippy>
          </div>
          <div class="mt-5 grid gap-4 lg:grid-cols-3">
            <div
              v-for="(step, index) in guideSteps"
              :key="step.title"
              class="rounded-lg bg-white/90 p-4 shadow-sm"
            >
              <div class="flex items-start gap-3">
                <div
                  class="flex size-6 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white"
                >
                  {{ index + 1 }}
                </div>
                <div class="flex-1">
                  <div class="font-medium text-gray-900">
                    {{ step.title }}
                  </div>
                  <div class="mt-1 text-sm text-gray-500">
                    {{ step.description }}
                  </div>
                  <Button
                    class="mt-3"
                    size="small"
                    type="primary"
                    @click="handleGuideAction(step.actionPath)"
                  >
                    {{ step.actionText }}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card title="资产概览">
          <div class="flex items-center justify-end">
            <Button type="link" @click="handleOpenWalletDetail">
              查看钱包明细
            </Button>
          </div>
          <div class="mt-2 grid gap-4 md:grid-cols-2">
            <div
              v-for="item in overviewItems"
              :key="item.label"
              class="rounded-lg border border-gray-100 p-4"
            >
              <div class="text-sm text-gray-500">{{ item.label }}</div>
              <div class="mt-2 text-lg font-semibold text-gray-900">
                {{ item.value }}
              </div>
            </div>
          </div>
        </Card>

        <Card title="新手必读">
          <div class="flex flex-col gap-3">
            <div
              v-for="item in guideLinks"
              :key="item.title"
              class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm text-blue-600"
              @click="handleOpenGuide(item.url)"
            >
              <span>{{ item.title }}</span>
              <span>查看文档 ></span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </Page>
</template>
