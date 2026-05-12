<script lang="ts" setup>
import { computed, watchEffect } from 'vue';

import { VbenSelect } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { getCountryList } from '#/api';

const props = withDefaults(defineProps<Props>(), {
  placeholder: () => ({
    phone: $t('authentication.mobileTip'),
  }),
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: { countryCode: string; phone: string }): void;
  (e: 'change', value: { countryCode: string; phone: string }): void;
}>();

// 定义组件接收的 props
interface Props {
  modelValue: {
    countryCode: string;
    phone: string;
  };
  placeholder?: {
    countryCode?: string;
    phone?: string;
  };
}

// 在组件内部获取国家码列表
const countryList = getCountryList();

// 计算属性：当前选中的国家码
const currentCountryCode = computed({
  get: () => props.modelValue.countryCode || countryList[0]?.value || '',
  set: (val: string) => {
    const newValue = {
      countryCode: val,
      phone: props.modelValue.phone,
    };
    emit('update:modelValue', newValue);
    emit('change', newValue);
  },
});

// 监听国家码变化，确保默认值被设置
watchEffect(() => {
  if (!props.modelValue.countryCode && countryList[0]?.value) {
    emit('update:modelValue', {
      countryCode: countryList[0].value,
      phone: props.modelValue.phone || '',
    });
  }
});

// 计算属性：当前输入的手机号
const currentPhone = computed({
  get: () => props.modelValue.phone,
  set: (val: string) => {
    const newValue = {
      countryCode: currentCountryCode.value,
      phone: val,
    };
    emit('update:modelValue', newValue);
    emit('change', newValue);
  },
});
</script>

<template>
  <div class="country-phone-group">
    <div class="country-code-wrapper">
      <VbenSelect
        :options="countryList"
        :placeholder="placeholder.countryCode"
        v-model="currentCountryCode"
      />
    </div>
    <div class="phone-input-wrapper">
      <input
        type="text"
        :placeholder="placeholder.phone"
        v-model="currentPhone"
      />
    </div>
  </div>
</template>

<style scoped>
/* 响应式设计 */
@media (max-width: 768px) {
  .country-code-wrapper {
    width: 100px;
    min-width: 100px;
  }
}

@media (max-width: 480px) {
  .country-phone-group {
    flex-direction: column;
    gap: 12px;
  }

  .country-code-wrapper,
  .phone-input-wrapper {
    width: 100%;
    min-width: auto;
  }
}

.country-phone-group {
  display: flex;
  gap: 8px;
  align-items: stretch;
  width: 100%;
}

.country-code-wrapper {
  width: 120px;
  min-width: 120px;
}

.phone-input-wrapper {
  flex: 1;
  min-width: 0;
}

.phone-input-wrapper input {
  width: 100%;
  height: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  transition: border-color 0.2s;
}

.phone-input-wrapper input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgb(59 130 246 / 20%);
}
</style>
