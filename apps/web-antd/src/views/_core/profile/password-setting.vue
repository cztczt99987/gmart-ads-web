<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';

import { ProfilePasswordSetting, z } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import { changePasswordApi } from '#/api/core/user';
import { useAuthStore } from '#/store';

const profilePasswordSettingRef = ref();
const loading = ref(false);
const authStore = useAuthStore();

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'password',
      label: '旧密码',
      component: 'VbenInputPassword',
      rules: 'required',
      componentProps: {
        placeholder: '请输入旧密码',
      },
    },
    {
      fieldName: 'newPassword',
      label: '新密码',
      component: 'VbenInputPassword',
      rules: 'required',
      componentProps: {
        passwordStrength: true,
        placeholder: '请输入新密码',
      },
    },
    {
      fieldName: 'confirmPassword',
      label: '确认密码',
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: '请再次输入新密码',
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: '请再次输入新密码' })
            .min(1, { message: '请再次输入新密码' })
            .refine((value) => value === newPassword, {
              message: '两次输入的密码不一致',
            });
        },
        triggerFields: ['newPassword'],
      },
    },
  ];
});

async function handleSubmit(values: Record<string, any>) {
  try {
    loading.value = true;
    await changePasswordApi({
      password: values.password,
      newPassword: values.newPassword,
    });
    message.success('密码修改成功，请重新登录');
    // 重置表单
    profilePasswordSettingRef.value?.getFormApi()?.resetForm();
    // 弹窗提示后退出登录
    Modal.success({
      title: '密码修改成功',
      content: '您的密码已修改，请使用新密码重新登录。',
      okText: '重新登录',
      onOk: async () => {
        await authStore.logout();
      },
    });
  } catch {
    message.error('密码修改失败');
  } finally {
    loading.value = false;
  }
}
</script>
<template>
  <ProfilePasswordSetting
    ref="profilePasswordSettingRef"
    class="w-1/3"
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
