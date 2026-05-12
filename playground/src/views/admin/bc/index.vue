<script setup lang="ts">
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AdBcApi } from '#/api/admin';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createAdBcApi,
  deleteAdBcApi,
  getAdBcListAllApi,
  syncAdBcApi,
  updateAdBcApi,
} from '#/api/admin';

type BcRow = AdBcApi.BcInfo;

const statusMap: Record<number, { color: string; label: string }> = {
  0: { label: '未启用', color: 'default' },
  1: { label: '启用', color: 'success' },
};

const statusOptions = [
  { label: '全部', value: undefined },
  { label: '未启用', value: 0 },
  { label: '启用', value: 1 },
];

const addModalVisible = ref(false);
const addLoading = ref(false);
const syncLoading = ref(false);
const addForm = ref<{ bcId: string; description: string; name: string }>({
  bcId: '',
  name: '',
  description: '',
});

const editModalVisible = ref(false);
const editLoading = ref(false);
const editForm = ref<{
  description: string;
  id: string;
  name: string;
  status: number;
}>({
  id: '',
  name: '',
  status: 0,
  description: '',
});

function formatStatus(status: number) {
  return statusMap[status] ?? { label: String(status), color: 'default' };
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('zh-CN', { hour12: false });
}

function normalizeQueryParams(values: Record<string, unknown>) {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed === '') continue;
      result[key] = trimmed;
      continue;
    }
    result[key] = value;
  }
  return result;
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        options: statusOptions,
        placeholder: '请选择状态',
        allowClear: true,
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: false,
  resetButtonOptions: { text: '重置' },
  submitButtonOptions: { text: '搜索', type: 'primary' },
};

const gridOptions: VxeTableGridOptions<BcRow> = {
  align: 'left',
  columns: [
    { field: 'bcId', minWidth: 160, title: 'BC ID' },
    { field: 'name', minWidth: 160, title: 'BC 名称' },
    { field: 'description', minWidth: 200, title: '描述' },
    {
      field: 'status',
      minWidth: 100,
      title: '状态',
      slots: { default: 'status' },
    },
    {
      field: 'createdAt',
      minWidth: 180,
      title: '创建时间',
      slots: { default: 'createdAt' },
    },
    {
      field: 'updatedAt',
      minWidth: 180,
      title: '修改时间',
      slots: { default: 'updatedAt' },
    },
    {
      field: 'actions',
      fixed: 'right',
      minWidth: 160,
      slots: { default: 'actions' },
      title: '操作',
    },
  ],
  keepSource: true,
  pagerConfig: {
    pageSizes: [
      { label: '10 条/页', value: 10 },
      { label: '20 条/页', value: 20 },
      { label: '50 条/页', value: 50 },
    ],
  },
  proxyConfig: {
    ajax: {
      query: async ({ page: _page }, formValues) => {
        try {
          const normalized = normalizeQueryParams(formValues ?? {});
          const list = await getAdBcListAllApi(
            normalized as AdBcApi.BcListParams,
          );
          const data = Array.isArray(list) ? list : [];
          return { list: data, total: data.length };
        } catch {
          message.error('获取商务中心列表失败');
          return { list: [], total: 0 };
        }
      },
    },
    response: { result: 'list', total: 'total' },
  },
  rowConfig: { keyField: 'id' },
  scrollX: { enabled: true },
  size: 'medium',
  stripe: true,
  toolbarConfig: {
    custom: true,
    export: false,
    refresh: true,
    resizable: false,
    search: false,
    zoom: false,
  },
};

const [Grid, gridRef] = useVbenVxeGrid<BcRow>({
  formOptions,
  gridOptions,
} as any);

async function handleBcIdBlur() {
  const bcId = addForm.value.bcId.trim();
  if (!bcId) {
    addForm.value = { ...addForm.value, name: '' };
    return;
  }
  syncLoading.value = true;
  try {
    const info = await syncAdBcApi(bcId);
    addForm.value = {
      ...addForm.value,
      name: info.name ?? '',
      description: info.description ?? addForm.value.description,
    };
  } catch {
    addForm.value = { ...addForm.value, name: '' };
    message.warning('未找到该 BC ID 对应的信息，请确认后重新输入');
  } finally {
    syncLoading.value = false;
  }
}

function openAddModal() {
  addForm.value = { bcId: '', name: '', description: '' };
  addModalVisible.value = true;
}

async function handleAdd() {
  const { bcId, name } = addForm.value;
  if (!bcId.trim() || !name.trim()) {
    message.warning('BC ID 和 BC 名称为必填项');
    return;
  }
  addLoading.value = true;
  try {
    await createAdBcApi({
      bcId: bcId.trim(),
      name: name.trim(),
      description: addForm.value.description.trim() || undefined,
    });
    message.success('添加成功');
    addModalVisible.value = false;
    gridRef.reload?.();
  } catch (error: any) {
    message.error(error?.message || '添加失败');
  } finally {
    addLoading.value = false;
  }
}

function openEditModal(row: BcRow) {
  editForm.value = {
    id: row.id,
    name: row.name,
    status: row.status,
    description: row.description ?? '',
  };
  editModalVisible.value = true;
}

async function handleEdit() {
  const { id, name, status } = editForm.value;
  if (!name.trim()) {
    message.warning('BC 名称为必填项');
    return;
  }
  editLoading.value = true;
  try {
    await updateAdBcApi(id, {
      name: name.trim(),
      status,
      description: editForm.value.description.trim() || undefined,
    });
    message.success('修改成功');
    editModalVisible.value = false;
    gridRef.reload?.();
  } catch (error: any) {
    message.error(error?.message || '修改失败');
  } finally {
    editLoading.value = false;
  }
}

function handleDelete(row: BcRow) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除商务中心 "${row.name}" 吗？`,
    okType: 'danger',
    async onOk() {
      try {
        await deleteAdBcApi(row.id);
        message.success('删除成功');
        gridRef.reload?.();
      } catch (error: any) {
        message.error(error?.message || '删除失败');
      }
    },
  });
}
</script>

<template>
  <Page auto-content-height title="商务中心管理">
    <div class="flex flex-col gap-4">
      <Grid>
        <template #status="{ row }">
          <Tag :color="formatStatus(row.status).color">
            {{ formatStatus(row.status).label }}
          </Tag>
        </template>
        <template #createdAt="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
        <template #updatedAt="{ row }">
          {{ formatDateTime(row.updatedAt) }}
        </template>
        <template #toolbar-tools>
          <Button type="primary" @click="openAddModal">添加商务中心</Button>
        </template>
        <template #actions="{ row }">
          <Space>
            <Button size="small" type="link" @click="openEditModal(row)">
              编辑
            </Button>
            <Button danger size="small" type="link" @click="handleDelete(row)">
              删除
            </Button>
          </Space>
        </template>
      </Grid>

      <!-- Add Modal -->
      <Modal
        v-model:open="addModalVisible"
        title="添加商务中心"
        width="520px"
        :confirm-loading="addLoading"
        :ok-button-props="{ disabled: !addForm.name }"
        @ok="handleAdd"
      >
        <div class="py-4">
          <Form layout="vertical">
            <Form.Item label="BC ID" required>
              <Input
                v-model:value="addForm.bcId"
                placeholder="请输入BC ID"
                :loading="syncLoading"
                @blur="handleBcIdBlur"
              />
            </Form.Item>
            <Form.Item label="BC 名称" required>
              <Input
                v-model:value="addForm.name"
                placeholder="输入BC ID后自动获取"
                disabled
              />
            </Form.Item>
            <Form.Item label="描述">
              <Input.TextArea
                v-model:value="addForm.description"
                placeholder="请输入描述"
                :rows="3"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <!-- Edit Modal -->
      <Modal
        v-model:open="editModalVisible"
        title="编辑商务中心"
        width="520px"
        :confirm-loading="editLoading"
        @ok="handleEdit"
      >
        <div class="py-4">
          <Form layout="vertical">
            <Form.Item label="BC 名称" required>
              <Input v-model:value="editForm.name" placeholder="请输入BC名称" />
            </Form.Item>
            <Form.Item label="状态">
              <Select
                v-model:value="editForm.status"
                :options="[
                  { label: '未启用', value: 0 },
                  { label: '启用', value: 1 },
                ]"
                placeholder="请选择状态"
              />
            </Form.Item>
            <Form.Item label="描述">
              <Input.TextArea
                v-model:value="editForm.description"
                placeholder="请输入描述"
                :rows="3"
              />
            </Form.Item>
          </Form>
        </div>
      </Modal>
    </div>
  </Page>
</template>
