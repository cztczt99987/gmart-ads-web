<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { adminChangePasswordApi } from '#/api/admin';

defineOptions({ name: 'ChangePassword' });

const router = useRouter();
const loading = ref(false);

const formSchema = computed((): VbenFormSchema[] => {
  return [
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
    await router.push('/auth/login');
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
