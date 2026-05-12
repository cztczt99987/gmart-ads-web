<script setup lang="ts">
import type { VbenFormSchema } from '@vben/common-ui';

import { computed } from 'vue';

import { AuthenticationLogin } from '@vben/common-ui';

import { notification } from 'ant-design-vue';

import { useAdminAuthStore } from '#/store/admin-auth';

defineOptions({ name: 'AdminLogin' });

const adminAuthStore = useAdminAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'Input',
      componentProps: {
        placeholder: '请输入账号',
        size: 'large',
      },
      fieldName: 'account',
      label: '账号',
      rules: 'required',
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入密码',
        size: 'large',
      },
      fieldName: 'password',
      label: '密码',
      rules: 'required',
    },
  ];
});

const loading = computed(() => adminAuthStore.loginLoading);

async function handleSubmit(params: Record<string, any>) {
  try {
    await adminAuthStore.adminAuthLogin(params);
  } catch (error: any) {
    notification.error({
      message: '登录失败',
      description: error?.message || '账号或密码错误',
      duration: 3,
    });
  }
}
</script>

<template>
  <AuthenticationLogin
    :form-schema="formSchema"
    :loading="loading"
    title="管理后台"
    subtitle="充值审核系统"
    :show-code-login="false"
    :show-qrcode-login="false"
    :show-third-party-login="false"
    :show-register="false"
    :show-forget-password="false"
    :show-change-password="false"
    @submit="handleSubmit"
  />
</template>
