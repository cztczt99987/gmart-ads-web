<script lang="ts" setup>
import { Button, Select, Space } from 'ant-design-vue';

interface Props {
  modelValue: string;
  options: any[];
  placeholder?: string;
  required?: boolean;
  onCreateCompany?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择',
  required: false,
  onCreateCompany: undefined,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'companySelected', companyId: string, companyArea: string): void;
  (e: 'createCompany'): void;
  (e: 'loadMore'): void;
}>();

const handlePopupScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
    // 滚动到底部，触发加载更多
    emit('loadMore');
  }
};

const handleCreateCompany = () => {
  if (props.onCreateCompany) {
    props.onCreateCompany();
  } else {
    console.warn('onCreateCompany 回调未定义');
  }
  emit('createCompany');
};

const handleValueChange = (value: any) => {
  // console.warn('值变化:', value);
  emit('update:modelValue', value as string);

  // 查找选中的公司选项
  const selectedOption = props.options.find(
    (option: any) => option.value === value,
  );
  // console.warn('选中的选项:', selectedOption);
  if (selectedOption && selectedOption.area) {
    // console.warn('触发 companySelected 事件:', value, selectedOption.area);
    emit('companySelected', value as string, selectedOption.area);
  }
};
</script>

<template>
  <Space style="display: flex; align-items: center">
    <Select
      :value="props.modelValue"
      @change="handleValueChange"
      :options="props.options"
      :placeholder="props.placeholder"
      style="width: 300px; border-radius: 8px"
      @popup-scroll="handlePopupScroll"
    />
    <Button
      type="primary"
      style="margin-left: 16px; border-radius: 8px"
      @click="handleCreateCompany"
    >
      + 新建开户公司
    </Button>
  </Space>
</template>

<style scoped>
/* 组件样式 */
</style>
