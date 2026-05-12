<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { adminChangePasswordApi } from '#/api';
import { useAuthStore } from '#/store';

defineOptions({ name: 'ChangePassword' });

const authStore = useAuthStore();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // 旧密码
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.oldPassword'),
      },
      fieldName: 'password',
      label: $t('authentication.oldPassword'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.oldPasswordTip') }),
    },
    // 新密码
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.newPassword'),
      },
      fieldName: 'newPassword',
      label: $t('authentication.newPassword'),
      renderComponentContent() {
        return {
          strengthText: () => $t('authentication.passwordStrength'),
        };
      },
      rules: z.string().min(8, { message: $t('authentication.passwordTip') }),
    },
    // 确认密码
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          const { newPassword } = values;
          return z
            .string({ required_error: $t('authentication.passwordTip') })
            .min(1, { message: $t('authentication.passwordTip') })
            .refine((value) => value === newPassword, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['newPassword'],
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
    },
  ];
});

async function handleSubmit(value: Recordable<any>) {
  try {
    loading.value = true;
    await adminChangePasswordApi({
      password: value.password,
      newPassword: value.newPassword,
    });
    notification.success({
      message: $t('authentication.changePasswordSuccess'),
    });
    // 修改密码成功后退出登录，跳转到登录页重新登录
    await authStore.logout(false);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    :title="$t('authentication.changePassword')"
    :sub-title="$t('authentication.changePasswordSubtitle')"
    :submit-button-text="$t('common.confirm')"
    @submit="handleSubmit"
  />
</template>
