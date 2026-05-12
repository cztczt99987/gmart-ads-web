<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationForgetPassword, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { resetPasswordApi, sendForgotCodeApi } from '#/api';

defineOptions({ name: 'ForgetPassword' });

const router = useRouter();
const loading = ref(false);
const CODE_LENGTH = 6;

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: '',
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z
        .string()
        .min(1, { message: $t('authentication.emailTip') })
        .email($t('authentication.emailValidErrorTip')),
    },
    {
      component: 'VbenPinInput',
      componentProps: (values) => ({
        codeLength: CODE_LENGTH,
        createText: (countdown: number) => {
          return countdown > 0
            ? $t('authentication.sendText', [countdown])
            : $t('authentication.sendCode');
        },
        handleSendCode: async () => {
          return handleSendCode(values.email);
        },
        placeholder: $t('authentication.code'),
        disabled:
          !values.email || !z.string().email().safeParse(values.email).success,
      }),
      fieldName: 'code',
      label: $t('authentication.code'),
      rules: z.string().length(CODE_LENGTH, {
        message: $t('authentication.codeTip', [CODE_LENGTH]),
      }),
    },
    // 密码
    {
      component: 'VbenInputPassword',
      componentProps: {
        passwordStrength: true,
        placeholder: $t('authentication.password'),
      },
      fieldName: 'password',
      label: $t('authentication.password'),
      renderComponentContent() {
        return {
          strengthText: () => $t('authentication.passwordStrength'),
        };
      },
      rules: z.string().min(1, { message: $t('authentication.passwordTip') }),
    },
    // 确认密码
    {
      component: 'VbenInputPassword',
      componentProps: {
        placeholder: $t('authentication.confirmPassword'),
      },
      dependencies: {
        rules(values) {
          const { password } = values;
          return z
            .string({ required_error: $t('authentication.passwordTip') })
            .min(1, { message: $t('authentication.passwordTip') })
            .refine((value) => value === password, {
              message: $t('authentication.confirmPasswordTip'),
            });
        },
        triggerFields: ['password'],
      },
      fieldName: 'confirmPassword',
      label: $t('authentication.confirmPassword'),
    },
  ];
});

const sendCodeLoading = ref(false);

/**
 * 发送验证码
 */
async function handleSendCode(email: string) {
  try {
    if (!sendCodeLoading.value) {
      sendCodeLoading.value = true;
      await sendForgotCodeApi(email);
    }
  } finally {
    sendCodeLoading.value = false;
  }
}

async function handleSubmit(value: Recordable<any>) {
  try {
    loading.value = true;
    await resetPasswordApi({
      email: value.email,
      code: value.code,
      password: value.password,
    });
    notification.success({ message: '修改成功' });
    await router.push({
      path: '/auth/login',
      query: { account: window.btoa(value.email) },
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <AuthenticationForgetPassword
    :form-schema="formSchema"
    :loading="loading"
    :submit-button-text="$t('common.reset')"
    @submit="handleSubmit"
  />
</template>
