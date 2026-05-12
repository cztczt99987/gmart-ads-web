<script lang="ts" setup>
import type { DataNode } from 'ant-design-vue/es/tree';

import type { Recordable } from '@vben/types';

import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { MenuTreeNode } from '#/api/system/menu';
import type { SystemRole } from '#/api/system/role';

import { ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal, Tree } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  assignRoleMenus,
  deleteRole,
  getRoleList,
  getRoleMenuTree,
  updateRole,
} from '#/api/system/role';
import { $t } from '#/locales';

import { useColumns, useGridFormSchema } from './data';
import Form from './modules/form.vue';

/** 角色菜单分配相关状态 */
const assignModalVisible = ref(false);
const assignRoleId = ref<string>('');
const assignRoleName = ref<string>('');
const menuTreeData = ref<DataNode[]>([]);
const checkedKeys = ref<string[]>([]);
const assignLoading = ref(false);

const [FormDrawer, formDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: {
    fieldMappingTime: [['createTime', ['startTime', 'endTime']]],
    schema: useGridFormSchema(),
    submitOnChange: true,
  },
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async ({ page }, formValues) => {
          return await getRoleList({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
    rowConfig: {
      keyField: 'id',
    },

    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      search: true,
      zoom: true,
    },
  } as VxeTableGridOptions<SystemRole>,
});

function onActionClick(e: OnActionClickParams<SystemRole>) {
  switch (e.code) {
    case 'delete': {
      onDelete(e.row);
      break;
    }
    case 'edit': {
      onEdit(e.row);
      break;
    }
    case 'assignMenus': {
      onAssignMenus(e.row);
      break;
    }
  }
}

/**
 * 将Antd的Modal.confirm封装为promise
 */
function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

/**
 * 状态切换
 */
async function onStatusChange(
  newStatus: number,
  row: SystemRole,
) {
  const status: Recordable<string> = {
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将${row.name}的状态切换为 【${status[newStatus.toString()]}】 吗？`,
      `切换状态`,
    );
    await updateRole(row.id, { status: newStatus });
    return true;
  } catch {
    return false;
  }
}

function onEdit(row: SystemRole) {
  formDrawerApi.setData(row).open();
}

function onDelete(row: SystemRole) {
  const hideLoading = message.loading({
    content: $t('ui.actionMessage.deleting', [row.name]),
    duration: 0,
    key: 'action_process_msg',
  });
  deleteRole(row.id)
    .then(() => {
      message.success({
        content: $t('ui.actionMessage.deleteSuccess', [row.name]),
        key: 'action_process_msg',
      });
      onRefresh();
    })
    .catch(() => {
      hideLoading();
    });
}

/** 打开分配菜单弹窗 */
async function onAssignMenus(row: SystemRole) {
  assignRoleId.value = row.id;
  assignRoleName.value = row.name;
  assignLoading.value = true;
  assignModalVisible.value = true;
  try {
    const treeData = (await getRoleMenuTree(row.id))?.list ?? [];
    menuTreeData.value = treeData as unknown as DataNode[];
    // 收集所有 checked 为 true 的节点 ID
    checkedKeys.value = collectCheckedKeys(treeData);
  } catch {
    menuTreeData.value = [];
    checkedKeys.value = [];
  } finally {
    assignLoading.value = false;
  }
}

/** 递归收集已勾选的菜单ID */
function collectCheckedKeys(nodes: MenuTreeNode[]): string[] {
  const keys: string[] = [];
  for (const node of nodes) {
    if (node.checked) {
      keys.push(node.id);
    }
    if (node.children?.length) {
      keys.push(...collectCheckedKeys(node.children));
    }
  }
  return keys;
}

/** 提交分配菜单 */
async function handleAssignSubmit() {
  assignLoading.value = true;
  try {
    await assignRoleMenus(assignRoleId.value, checkedKeys.value);
    message.success(
      $t('system.role.assignSuccess', [assignRoleName.value]),
    );
    assignModalVisible.value = false;
  } catch {
    // 错误已由全局拦截器处理
  } finally {
    assignLoading.value = false;
  }
}

function onRefresh() {
  gridApi.query();
}

function onCreate() {
  formDrawerApi.setData({}).open();
}
</script>
<template>
  <Page auto-content-height>
    <FormDrawer @success="onRefresh" />
    <Grid :table-title="$t('system.role.list')">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          {{ $t('ui.actionTitle.create', [$t('system.role.name')]) }}
        </Button>
      </template>
    </Grid>

    <!-- 分配菜单弹窗 -->
    <Modal
      v-model:open="assignModalVisible"
      :title="$t('system.role.assignMenusTitle', [assignRoleName])"
      :confirm-loading="assignLoading"
      width="600px"
      @ok="handleAssignSubmit"
    >
      <Tree
        v-model:checkedKeys="checkedKeys"
        :tree-data="menuTreeData"
        checkable
        :field-names="{ title: 'title', key: 'id', children: 'children' }"
        default-expand-all
      />
    </Modal>
  </Page>
</template>
