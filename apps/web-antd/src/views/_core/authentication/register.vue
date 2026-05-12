<script lang="ts" setup>
import type { VbenFormSchema } from '@vben/common-ui';
import type { Recordable } from '@vben/types';

import { computed, h, ref } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationRegister, z } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { notification } from 'ant-design-vue';

import { registerUserApi, sendRegisterCodeApi } from '#/api';

import CountryPhoneInput from './compents/country-phone-input.vue';

defineOptions({ name: 'Register' });

const router = useRouter();

const loading = ref(false);
const CODE_LENGTH = 6;

const formSchema = computed((): VbenFormSchema[] => {
  return [
    // 公司名称
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.company'),
      },
      fieldName: 'name',
      label: $t('authentication.company'),
      rules: z.string().min(1, { message: $t('authentication.companyTip') }),
    },
    // 手机号
    {
      component: CountryPhoneInput,
      fieldName: 'phoneInfo',
      label: $t('authentication.mobile'),
      rules: z.object({
        // countryCode: z.string().min(1, $t('authentication.countryCodeTip')),
        phone: z.string().min(1, $t('authentication.mobileTip')),
      }),
    },
    // 邮箱
    {
      component: 'VbenInput',
      componentProps: {
        placeholder: $t('authentication.email'),
      },
      fieldName: 'email',
      label: $t('authentication.email'),
      rules: z.string().email($t('authentication.emailTip')),
    },
    // 邮箱验证码
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
    // 同意条款
    {
      component: 'VbenCheckbox',
      fieldName: 'agreePolicy',
      renderComponentContent: () => ({
        default: () =>
          h('span', [
            $t('authentication.agree'),
            h(
              'a',
              {
                class: 'vben-link ml-1',
                href: '',
              },
              `${$t('authentication.privacyPolicy')} & ${$t('authentication.terms')}`,
            ),
          ]),
      }),
      rules: z.boolean().refine((value) => !!value, {
        message: $t('authentication.agreeTip'),
      }),
    },
  ];
});

const sendCodeLoading = ref(false);

/**
 * 发送验证码
 */
async function handleSendCode(email: string) {
  if (sendCodeLoading.value) return;
  try {
    sendCodeLoading.value = true;
    await sendRegisterCodeApi(email);
  } finally {
    sendCodeLoading.value = false;
  }
}

/**
 * 注册
 */
async function handleSubmit(value: Recordable<any>) {
  try {
    loading.value = true;
    await registerUserApi({
      name: value.name,
      email: value.email,
      code: value.code,
      password: value.password,
      countryCode: value.phoneInfo.countryCode,
      phone: String(value.phoneInfo.phone),
    });
    notification.success({ message: '注册成功' });
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
  <AuthenticationRegister
    :form-schema="formSchema"
    :loading="loading"
    @submit="handleSubmit"
  />
</template>
