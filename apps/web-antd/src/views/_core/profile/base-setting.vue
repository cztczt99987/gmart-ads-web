<script setup lang="ts">
import type { VbenFormSchema } from '#/adapter/form';
import type { UserInfo } from '#/api/core/user';

import { computed, onMounted, ref } from 'vue';

import { ProfileBaseSetting } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { getCountryListApi } from '#/api';
import { getUserInfoApi, updateUserInfoApi } from '#/api/core/user';

const profileBaseSettingRef = ref();
const userInfo = ref<UserInfo>();
const countryOptions = ref<{ label: string; value: string }[]>([]);

const formSchema = computed((): VbenFormSchema[] => {
  return [
    {
      fieldName: 'email',
      component: 'Input',
      label: '邮箱',
      componentProps: {
        disabled: true,
      },
    },
    {
      fieldName: 'name',
      component: 'Input',
      label: '姓名',
      rules: 'required',
      componentProps: {
        placeholder: '请输入姓名',
      },
    },
    {
      fieldName: 'countryCode',
      component: 'Select',
      label: '国家区号',
      componentProps: {
        options: countryOptions.value,
        placeholder: '请选择国家区号',
        showSearch: true,
        filterOption: (input: string, option: { label: string }) =>
          option.label.toLowerCase().includes(input.toLowerCase()),
      },
    },
    {
      fieldName: 'phone',
      component: 'Input',
      label: '手机号',
      componentProps: {
        placeholder: '请输入手机号',
      },
    },
  ];
});

onMounted(async () => {
  // 加载国家列表
  countryOptions.value = await getCountryListApi();

  // 加载用户信息
  try {
    const data = await getUserInfoApi();
    userInfo.value = data;
    profileBaseSettingRef.value.getFormApi().setValues({
      email: data.email,
      name: data.name,
      countryCode: data.countryCode,
      phone: data.phone,
    });
  } catch {
    message.error('获取用户信息失败');
  }
});

async function handleSubmit(values: Record<string, any>) {
  try {
    await updateUserInfoApi({
      name: values.name,
      countryCode: values.countryCode,
      phone: values.phone,
    });
    message.success('保存成功');
  } catch {
    message.error('保存失败');
  }
}
</script>
<template>
  <ProfileBaseSetting
    ref="profileBaseSettingRef"
    :form-schema="formSchema"
    @submit="handleSubmit"
  />
</template>
