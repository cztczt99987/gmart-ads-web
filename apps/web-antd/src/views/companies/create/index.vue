<script lang="ts" setup>
import type { CompanyFormData } from './components/company-form.vue';

import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AreaCode } from '#/api/area';
import type {
  Company,
  CreateCompanyParams,
  UpdateCompanyParams,
} from '#/api/company';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { $t } from '@vben/locales';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAreaListApi } from '#/api/area';
import { deleteCompanyApi, getCompanyListApi } from '#/api/company';
import { requestClient } from '#/api/request';
import { uploadFileApi } from '#/api/wallet';

import CompanyForm from './components/company-form.vue';

// 弹窗状态
const companyFormModalVisible = ref(false);
const deleteConfirmVisible = ref(false);
const companyFormLoading = ref(false);

// 表单模式：add-添加，view-查看，edit-编辑
const formMode = ref<'add' | 'edit' | 'view'>('add');

// 选中的行数据
const selectedRow = ref<Company | null>(null);

// 区域选项列表
const areaOptions = ref<AreaCode[]>([]);

// 公司表单数据 - 与 API 字段保持一致
const companyFormData = ref<CompanyFormData>({
  name: '',
  area: '',
  address: '',
  licenseNo: '',
  taxNumber: '',
  type: 0,
  imageFile: [],
  licenseFileId: '',
  contactName: '',
  contactEmail: '',
  countryCode: '+86',
  contactNumber: '',
});

// 获取区域列表
const fetchAreaList = async () => {
  try {
    const data = await getAreaListApi();
    areaOptions.value = data || [];
  } catch (error) {
    console.error('获取区域列表失败:', error);
    message.error($t('page.company.create.fetchAreaListFailed'));
  }
};

// 页面加载时获取区域列表
onMounted(() => {
  fetchAreaList();
});

// 处理添加开户公司按钮点击事件
const handleAddCompany = () => {
  formMode.value = 'add';
  // 重置表单数据
  companyFormData.value = {
    name: '',
    area: '',
    address: '',
    licenseNo: '',
    taxNumber: '',
    billingAddress: '',
    type: 0,
    imageFile: [],
    licenseFileId: '',
    contactName: '',
    contactEmail: '',
    countryCode: '+86',
    contactNumber: '',
  };
  selectedRow.value = null;
  companyFormModalVisible.value = true;
};

const resolveLicenseUrl = (rawUrl?: string) => {
  if (!rawUrl) return '';
  return rawUrl;
};

// 将 API 公司数据转换为表单数据
const convertCompanyToFormData = (company: Company): CompanyFormData => {
  const resolvedLicenseUrl = resolveLicenseUrl(
    company.licenseUrl || (company as any).imageUrl,
  );
  return {
    name: company.name || '',
    area: company.area || '',
    address: company.address || '',
    licenseNo: company.licenseNo || '',
    taxNumber: company.taxNumber || '',
    billingAddress: (company as any).billingAddress || '',
    type: company.type === '1' ? 1 : 0,
    imageFile: resolvedLicenseUrl
      ? [
          {
            uid: String(company.id || company.licenseFileId || 'license'),
            name: $t('page.company.create.businessLicenseFileName'),
            status: 'done',
            url: resolvedLicenseUrl,
            thumbUrl: resolvedLicenseUrl,
          },
        ]
      : [],
    licenseFileId: company.licenseFileId || '',
    contactName: company.contactName || '',
    contactEmail: company.contactEmail || '',
    contactNumber: company.contactNumber,
    countryCode: company.countryCode,
  };
};

// 查看详情
const handleViewDetail = (row: Company) => {
  selectedRow.value = row;
  formMode.value = 'view';
  // 填充表单数据
  companyFormData.value = convertCompanyToFormData(row);
  companyFormModalVisible.value = true;
};

// 编辑
const handleEdit = (row: Company) => {
  selectedRow.value = row;
  formMode.value = 'edit';
  // 填充表单数据
  companyFormData.value = convertCompanyToFormData(row);
  companyFormModalVisible.value = true;
};

// 将表单数据转换为 API 参数
const convertFormDataToApiParams = (
  data: CompanyFormData,
): Omit<CreateCompanyParams, 'imageFile'> & {
  imageFile?: File;
  licenseFileId?: string;
} => {
  // 根据 area 查找对应的 areaCode
  const areaItem = areaOptions.value.find((item) => item.area === data.area);

  return {
    name: data.name,
    area: data.area,
    areaCode: areaItem?.code || '',
    address: data.address,
    licenseNo: data.licenseNo,
    taxNumber: data.taxNumber,
    billingAddress: data.billingAddress,
    type: data.type,
    contactName: data.contactName,
    contactEmail: data.contactEmail,
    contactNumber: data.contactNumber,
    countryCode: data.countryCode,
    licenseFileId: data.licenseFileId,
  };
};

// Grid 刷新方法
const gridRef = ref<any>(null);

// 处理表单提交
const handleFormSubmit = async (data: CompanyFormData) => {
  companyFormLoading.value = true;
  try {
    const params = convertFormDataToApiParams(data);
    const currentFile = data.imageFile[0]?.originFileObj as File | undefined;
    if (currentFile) {
      const uploadResp = await uploadFileApi(currentFile, 1);
      params.licenseFileId = uploadResp.id;
    }

    if (formMode.value === 'add') {
      if (!params.licenseFileId) {
        message.error($t('page.company.create.pleaseUploadLicense'));
        return;
      }
      await requestClient.post('/v1/company', params as CreateCompanyParams);
      message.success($t('page.company.create.addCompanySuccess'));
    } else if (formMode.value === 'edit') {
      if (!selectedRow.value?.id) {
        message.error($t('page.company.create.companyIdNotExist'));
        return;
      }
      await requestClient.put('/v1/company', {
        id: selectedRow.value.id,
        ...params,
      } as UpdateCompanyParams);
      message.success($t('page.company.create.editCompanySuccess'));
    }

    companyFormModalVisible.value = false;
    // 刷新列表
    gridRef.value?.reload?.();
  } catch (error) {
    console.error('提交失败:', error);
    // message.error('操作失败，请重试');
  } finally {
    companyFormLoading.value = false;
  }
};

// 处理表单取消
const handleFormCancel = () => {
  companyFormModalVisible.value = false;
};

// 删除
const handleDelete = (row: Company) => {
  selectedRow.value = row;
  deleteConfirmVisible.value = true;
};

// 删除确认
const handleDeleteConfirm = async () => {
  if (selectedRow.value?.id) {
    try {
      gridRef.value?.setLoading(true); // loading
      await deleteCompanyApi(selectedRow.value.id);
      message.success($t('page.company.create.deleteSuccess'));
      deleteConfirmVisible.value = false;
      // 刷新列表
      gridRef.value?.reload?.();
    } catch (error) {
      console.error('删除失败:', error);
      // message.error('删除失败，请重试');
    } finally {
      gridRef.value?.setLoading(false);
    }
  }
};

const formOptions: VbenFormProps = {
  // 默认展开
  collapsed: true,
  schema: [
    {
      component: 'Input',
      fieldName: 'id',
      label: $t('page.company.create.companyId'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: $t('page.company.create.companyName'),
    },
  ],
  // 控制表单是否显示折叠按钮
  showCollapseButton: false,
  // 是否在字段值改变时提交表单
  submitOnChange: false,
  // 按下回车时是否提交表单
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<Company> = {
  // checkboxConfig: {
  //   highlight: true,
  //   labelField: 'name',
  // },
  columns: [
    // { title: $t('page.company.create.serialNumber'), type: 'seq', width: 50 }, // 序号
    { field: 'id', title: $t('page.company.create.companyId'), width: 150 }, // 公司ID
    { field: 'name', title: $t('page.company.create.companyName') }, // 公司名称
    {
      field: 'area',
      title: $t('page.company.create.registrationAddress'),
    }, // 公司注册地
    {
      title: $t('page.company.create.action'),
      slots: { default: 'action' },
      width: 240,
    }, // 操作类型
  ],
  exportConfig: {},
  stripe: true, // 斑马纹
  height: 'auto',
  keepSource: true,
  proxyConfig: {
    response: {
      result: 'data',
    },
    showLoading: true,
    ajax: {
      query: async ({ page }, formValues) => {
        try {
          const data = await getCompanyListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
          return {
            data: data.list,
            total: data.total,
          };
        } catch (error) {
          console.error('获取公司列表失败:', error);
          // message.error('获取公司列表失败');
          return {
            data: [],
            total: 0,
          };
        }
      },
    },
  },
  pagerConfig: {
    pageSizes: [
      { label: $t('page.company.create.page10'), value: 10 },
      { label: $t('page.company.create.page20'), value: 20 },
      { label: $t('page.company.create.page50'), value: 50 },
    ],
  },
};

// @ts-ignore
const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

// 将 gridApi 赋值给 gridRef
gridRef.value = gridApi;
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          type="primary"
          style="margin-right: 16px"
          @click="handleAddCompany"
        >
          {{ $t('page.company.create.addCompany') }}
        </Button>
      </template>
      <template #action="{ row }">
        <Button type="link" @click="handleViewDetail(row)">
          {{ $t('page.company.create.viewDetail') }}
        </Button>
        <Button type="link" @click="handleEdit(row)">
          {{ $t('page.company.create.edit') }}
        </Button>
        <Button type="link" danger @click="handleDelete(row)">
          {{ $t('page.company.create.delete') }}
        </Button>
      </template>
    </Grid>

    <!-- 公司表单弹窗（添加/查看/编辑） -->
    <Modal
      v-model:open="companyFormModalVisible"
      :title="
        formMode === 'add'
          ? $t('page.company.create.addCompanyTitle')
          : formMode === 'edit'
            ? $t('page.company.create.editCompanyTitle')
            : $t('page.company.create.viewCompanyTitle')
      "
      width="800px"
      :footer="null"
      :closable="!companyFormLoading"
      :mask-closable="!companyFormLoading"
    >
      <CompanyForm
        :mode="formMode"
        :model="companyFormData"
        :area-options="areaOptions"
        :loading="companyFormLoading"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
      />
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal
      v-model:open="deleteConfirmVisible"
      :title="$t('page.company.create.deleteConfirm')"
      width="400px"
      @ok="handleDeleteConfirm"
    >
      <p>
        {{ $t('page.company.create.deleteConfirmContent') }}
        <strong>{{ selectedRow?.name }}</strong>
        >{{ $t('page.company.create.deleteConfirmQuestion') }}
      </p>
    </Modal>
  </Page>
</template>
