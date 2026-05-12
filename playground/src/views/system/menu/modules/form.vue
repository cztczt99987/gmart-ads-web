<script lang="ts" setup>
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '#/adapter/form';

import { computed, h, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { $te } from '@vben/locales';
import { getPopupContainer } from '@vben/utils';

import { breakpointsTailwind, useBreakpoints } from '@vueuse/core';

import { useVbenForm, z } from '#/adapter/form';
import {
  createMenu,
  getMenuTree,
  updateMenu,
} from '#/api/system/menu';
import type { SystemMenu } from '#/api/system/menu';
import { $t } from '#/locales';
import { componentKeys } from '#/router/routes';

import { getMenuTypeOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

type MenuFormValues = Omit<
  Partial<SystemMenu>,
  'isAffix' | 'isHidden' | 'keepAlive' | 'noBasicLayout'
> & {
  isAffix?: boolean;
  isHidden?: boolean;
  keepAlive?: boolean;
  noBasicLayout?: boolean;
};

const formData = ref<MenuFormValues>();

function normalizeFlagToBoolean(value: unknown) {
  return value === true || Number(value) === 1;
}

function normalizeParentId(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    value === '' ||
    value === 0 ||
    value === '0'
  ) {
    return undefined;
  }
  return String(value);
}

function normalizeMenuFormData(data: Partial<SystemMenu>): MenuFormValues {
  return {
    ...data,
    isAffix: normalizeFlagToBoolean(data.isAffix),
    isHidden: normalizeFlagToBoolean(data.isHidden),
    keepAlive: normalizeFlagToBoolean(data.keepAlive),
    noBasicLayout: normalizeFlagToBoolean(data.noBasicLayout),
    parentId: normalizeParentId(data.parentId),
  };
}

const schema: VbenFormSchema[] = [
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: getMenuTypeOptions(),
      optionType: 'button',
    },
    defaultValue: 2,
    fieldName: 'type',
    formItemClass: 'col-span-2 md:col-span-2',
    label: $t('system.menu.type'),
  },
  {
    component: 'Input',
    fieldName: 'name',
    label: $t('system.menu.menuName'),
    rules: z
      .string()
      .min(1, $t('ui.formRules.minLength', [$t('system.menu.menuName'), 1]))
      .max(30, $t('ui.formRules.maxLength', [$t('system.menu.menuName'), 30])),
  },
  {
    component: 'ApiTreeSelect',
    componentProps: {
      api: getMenuTree,
      childrenField: 'children',
      class: 'w-full',
      filterTreeNode(input: string, node: Recordable<any>) {
        if (!input || input.length === 0) {
          return true;
        }
        const title: string = node.title ?? '';
        const name: string = node.name ?? '';
        return (
          title.includes(input) ||
          name.includes(input) ||
          (title && $te(title) && $t(title).includes(input))
        );
      },
      getPopupContainer,
      labelField: 'title',
      resultField: 'list',
      showSearch: true,
      treeDefaultExpandAll: true,
      valueField: 'id',
    },
    fieldName: 'parentId',
    label: $t('system.menu.parent'),
    renderComponentContent() {
      return {
        title({ label, name }: { label: string; name: string }) {
          const coms = [];
          const displayText = label && $te(label) ? $t(label) : label || name;
          coms.push(h('span', { class: '' }, displayText));
          return h('div', { class: 'flex items-center gap-1' }, coms);
        },
      };
    },
  },
  {
    component: 'Input',
    fieldName: 'title',
    label: $t('system.menu.menuTitle'),
    rules: 'required',
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return [1, 2, 4].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'path',
    label: $t('system.menu.path'),
    rules: z
      .string()
      .min(1, $t('ui.formRules.minLength', [$t('system.menu.path'), 1]))
      .max(100, $t('ui.formRules.maxLength', [$t('system.menu.path'), 100]))
      .refine(
        (value: string) => {
          return value.startsWith('/');
        },
        $t('ui.formRules.startWith', [$t('system.menu.path'), '/']),
      )
      .optional()
      .or(z.literal('')),
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return [1, 2].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'redirect',
    label: $t('system.menu.redirect'),
  },
  {
    component: 'AutoComplete',
    componentProps: {
      allowClear: true,
      class: 'w-full',
      filterOption(input: string, option: { value: string }) {
        return option.value.toLowerCase().includes(input.toLowerCase());
      },
      options: componentKeys.map((item) => ({ value: item })),
    },
    dependencies: {
      rules: (values) => {
        return values.type === 2 ? 'required' : null;
      },
      show: (values) => {
        return values.type === 2;
      },
      triggerFields: ['type'],
    },
    fieldName: 'component',
    label: $t('system.menu.component'),
  },
  {
    component: 'Input',
    fieldName: 'icon',
    label: $t('system.menu.icon'),
    dependencies: {
      show: (values) => {
        return [1, 2, 4, 5].includes(values.type);
      },
      triggerFields: ['type'],
    },
  },
  {
    component: 'InputNumber',
    componentProps: {
      min: 0,
      style: 'width: 100%',
    },
    fieldName: 'menuOrder',
    label: $t('system.menu.menuOrder'),
    defaultValue: 0,
  },
  {
    component: 'Input',
    dependencies: {
      show: (values) => {
        return [3].includes(values.type);
      },
      rules: (values) => {
        return values.type === 3 ? 'required' : null;
      },
      triggerFields: ['type'],
    },
    fieldName: 'permissionId',
    label: $t('system.menu.permissionId'),
  },
  {
    component: 'Textarea',
    fieldName: 'description',
    label: $t('system.menu.description'),
  },
  {
    component: 'RadioGroup',
    componentProps: {
      buttonStyle: 'solid',
      options: [
        { label: $t('common.enabled'), value: 1 },
        { label: $t('common.disabled'), value: 0 },
      ],
      optionType: 'button',
    },
    defaultValue: 1,
    fieldName: 'status',
    label: $t('system.menu.status'),
  },
  {
    component: 'Divider',
    dependencies: {
      show: (values) => {
        return [1, 2, 4].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'divider1',
    formItemClass: 'col-span-2 md:col-span-2 pb-0',
    hideLabel: true,
    renderComponentContent() {
      return {
        default: () => $t('system.menu.advancedSettings'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return [2].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'keepAlive',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.keepAlive'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return [1, 2, 4, 5].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'isHidden',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.isHidden'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return [1, 2, 4].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'isAffix',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.isAffix'),
      };
    },
  },
  {
    component: 'Checkbox',
    dependencies: {
      show: (values) => {
        return [1, 2, 4].includes(values.type);
      },
      triggerFields: ['type'],
    },
    fieldName: 'noBasicLayout',
    renderComponentContent() {
      return {
        default: () => $t('system.menu.noBasicLayout'),
      };
    },
  },
];

const breakpoints = useBreakpoints(breakpointsTailwind);
const isHorizontal = computed(() => breakpoints.greaterOrEqual('md').value);

const [Form, formApi] = useVbenForm({
  commonConfig: {
    colon: true,
    formItemClass: 'col-span-2 md:col-span-1',
  },
  schema,
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
});
const [Drawer, drawerApi] = useVbenDrawer({
  onConfirm: onSubmit,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData<Partial<SystemMenu>>();
      formApi.resetForm();
      if (data) {
        const normalizedData = normalizeMenuFormData(data);
        formData.value = normalizedData;
        formApi.setValues(normalizedData);
      } else {
        formData.value = undefined;
      }
    }
  },
});

async function onSubmit() {
  const { valid } = await formApi.validate();
  if (valid) {
    drawerApi.lock();
    const data = await formApi.getValues();
    try {
      await (formData.value?.id
        ? updateMenu(formData.value.id, data)
        : createMenu(data));
      drawerApi.close();
      emit('success');
    } finally {
      drawerApi.unlock();
    }
  }
}
const getDrawerTitle = computed(() =>
  formData.value?.id
    ? $t('ui.actionTitle.edit', [$t('system.menu.name')])
    : $t('ui.actionTitle.create', [$t('system.menu.name')]),
);
</script>
<template>
  <Drawer class="w-full max-w-[800px]" :title="getDrawerTitle">
    <Form class="mx-4" :layout="isHorizontal ? 'horizontal' : 'vertical'" />
  </Drawer>
</template>
