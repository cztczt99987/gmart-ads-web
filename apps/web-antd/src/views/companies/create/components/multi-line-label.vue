<script lang="ts" setup>
import { computed } from 'vue';

// 定义组件属性
interface Props {
  // 标签文本
  text: string;
  // 是否需要额外的CSS类名
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  className: '',
});

// 将文本按换行符分割
const lines = computed(() => {
  return props.text.split('\n');
});
</script>

<template>
  <div class="multi-line-label" :class="className">
    <div v-for="(line, index) in lines" :key="index">
      {{ line }}
      <br v-if="index < lines.length - 1" />
    </div>
  </div>
</template>

<style scoped>
.multi-line-label {
  line-height: 1.4;
  text-align: left;
  overflow-wrap: break-word;
  white-space: pre-wrap !important;
}
</style>
