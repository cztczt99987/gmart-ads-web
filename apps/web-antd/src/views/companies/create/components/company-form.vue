<script lang="ts" setup>
import type { RuleObject } from 'ant-design-vue/es/form';

import type { AreaCode } from '#/api/area';
import type { CountryCode } from '#/api/country';

import { computed, onMounted, ref, watch } from 'vue';

import { $t } from '@vben/locales';

import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Upload,
} from 'ant-design-vue';

import { getCountryListApi } from '#/api/country';

import MultiLineLabel from './multi-line-label.vue';

// 定义组件属性
interface Props {
  // 模式：add-添加，view-查看，edit-编辑
  mode?: 'add' | 'edit' | 'view';
  // 表单数据
  model?: CompanyFormData;
  // 区域选项列表
  areaOptions?: AreaCode[];
  // 加载状态
  loading?: boolean;
}

// 定义表单数据结构 - 与 API 字段保持一致
export interface CompanyFormData {
  // 开户公司名称
  name: string;
  // 注册区域
  area: string;
  // 详细地址
  address: string;
  // 营业执照编号
  licenseNo: string;
  // 税号
  taxNumber: string;
  // 开票地址
  billingAddress: string;
  // 公司类型: 0总公司，1分公司
  type: 0 | 1;
  // 营业执照文件列表
  imageFile: any[];
  licenseFileId?: string;
  // 联系人
  contactName: string;
  // 联系邮箱
  contactEmail: string;
  // 国家区号
  countryCode: string;
  // 联系电话
  contactNumber: string;
}

// 定义组件属性和默认值
const props = withDefaults(defineProps<Props>(), {
  mode: 'add',
  model: () => ({
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
  }),
  areaOptions: () => [],
  loading: false,
});

// 定义组件事件
const emit = defineEmits<{
  // 提交表单
  (e: 'submit', data: CompanyFormData): void;
  // 取消操作
  (e: 'cancel'): void;
}>();

// 表单引用
const formRef = ref<typeof Form>();

// 表单数据
const formData = ref<CompanyFormData>({ ...props.model });

// 国家区号选项列表
const countryOptions = ref<CountryCode[]>([]);

// 获取国家区号列表
const fetchCountryList = async () => {
  try {
    const data = await getCountryListApi();
    countryOptions.value = data || [];
  } catch (error) {
    console.error('获取国家区号列表失败:', error);
  }
};

// 组件挂载时获取国家区号列表
onMounted(() => {
  fetchCountryList();
});

// 监听 props.model 变化
watch(
  () => props.model,
  (newModel) => {
    if (newModel) {
      formData.value = { ...newModel };
    }
  },
  { deep: true },
);

// 计算表单是否可编辑
const isEditable = computed(() => {
  return props.mode !== 'view';
});

// 判断是否为拉美国家（巴西、墨西哥）- 需要显示税号和开票地址
const isLatAmCountry = computed(() => {
  const area = formData.value.area || '';
  return ['巴西', '墨西哥', 'Brazil', 'Mexico', 'BR', 'MX'].some((keyword) =>
    area.includes(keyword),
  );
});

// 区域选项转换为 Select 组件需要的格式
const areaSelectOptions = computed(() => {
  return props.areaOptions.map((item) => ({
    label: item.area,
    value: item.area,
  }));
});

// 表单验证规则
const rules = computed(() => {
  const dynamicRules: Record<string, RuleObject[]> = {
    name: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.companyName')}`,
        trigger: 'blur',
        type: 'string',
      },
    ],
    area: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredSelect')}${$t('page.company.create.form.registrationAddress')}`,
        trigger: 'change',
        type: 'string',
      },
    ],
    address: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.address')}`,
        trigger: 'blur',
        type: 'string',
      },
    ],
    licenseNo: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.businessLicenseNumber')}`,
        trigger: 'blur',
        type: 'string',
      },
    ],
    contactName: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.contactName')}`,
        trigger: 'blur',
        type: 'string',
      },
    ],
    contactEmail: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.contactEmail')}`,
        trigger: 'blur',
        type: 'email',
      },
    ],
    contactNumber: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.bankPhoneNumber')}`,
        trigger: 'blur',
        type: 'string',
      },
    ],
    countryCode: [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.countryCode')}`,
        trigger: 'change',
        type: 'string',
      },
    ],
  };

  // 巴西或墨西哥时，税号和开票地址为必填
  if (isLatAmCountry.value) {
    dynamicRules.taxNumber = [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.companyTaxNumber')}`,
        trigger: 'blur',
        type: 'string',
      },
    ];
    dynamicRules.billingAddress = [
      {
        required: true,
        message: `${$t('page.company.create.form.requiredField')}${$t('page.company.create.form.billingAddress')}`,
        trigger: 'blur',
        type: 'string',
      },
    ];
  }

  return dynamicRules as Record<string, RuleObject[]>;
});

// 处理表单提交
const handleSubmit = () => {
  if (!formRef.value) return;

  formRef.value
    .validate()
    .then(() => {
      emit('submit', formData.value);
    })
    .catch((error: any) => {
      console.warn('表单验证失败:', error);
    });
};

// 处理取消操作
const handleCancel = () => {
  // 在添加或编辑模式下，取消时显示确认提示
  if (props.mode === 'add' || props.mode === 'edit') {
    Modal.confirm({
      title: $t('page.company.create.form.cancelConfirm'),
      content: $t('page.company.create.form.cancelConfirmContent'),
      onOk: () => {
        emit('cancel');
      },
      onCancel: () => {
        // 不执行任何操作，保持弹窗打开
      },
    });
  } else {
    // 查看模式下直接关闭
    emit('cancel');
  }
};

// 处理文件上传
const handleUpload = (file: File) => {
  console.warn('上传文件:', file);
  // 这里可以实现文件上传逻辑
  return false; // 返回false以阻止默认上传行为
};
</script>

<template>
  <div class="company-form-container">
    <Spin :spinning="loading" :tip="$t('page.company.create.form.submitting')">
      <Form
        ref="formRef"
        :model="formData"
        :rules="rules"
        layout="horizontal"
        class="company-form"
        label-align="left"
        :label-col="{ span: 8 }"
        :wrapper-col="{ span: 15 }"
      >
        <!-- 公司名称 -->
        <Form.Item
          :label="$t('page.company.create.form.companyName')"
          name="name"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.name"
            :disabled="!isEditable"
            :placeholder="$t('page.company.create.form.companyNamePlaceholder')"
          />
        </Form.Item>

        <!-- 公司注册地址 -->
        <Form.Item
          :label="$t('page.company.create.form.registrationAddress')"
          name="area"
          required
          label-class-name="multi-line-label"
        >
          <Select
            v-model:value="formData.area"
            :disabled="!isEditable"
            :placeholder="
              $t('page.company.create.form.registrationAddressPlaceholder')
            "
            :options="areaSelectOptions"
          />
        </Form.Item>

        <!-- 详细地址 -->
        <Form.Item
          :label="$t('page.company.create.form.address')"
          name="address"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.address"
            :disabled="!isEditable"
            :placeholder="$t('page.company.create.form.addressPlaceholder')"
          />
        </Form.Item>

        <!-- 营业执照编号 -->
        <Form.Item
          :label="$t('page.company.create.form.businessLicenseNumber')"
          name="licenseNo"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.licenseNo"
            :disabled="!isEditable"
            :placeholder="
              $t('page.company.create.form.businessLicenseNumberPlaceholder')
            "
          />
          <div v-if="isEditable" class="form-hint">
            {{ $t('page.company.create.form.businessLicenseHint') }}
          </div>
        </Form.Item>

        <!-- 公司税号（巴西、墨西哥必填） -->
        <Form.Item
          v-if="isLatAmCountry"
          :label="$t('page.company.create.form.companyTaxNumber')"
          name="taxNumber"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.taxNumber"
            :disabled="!isEditable"
            :placeholder="
              $t('page.company.create.form.companyTaxNumberPlaceholder')
            "
          />
        </Form.Item>

        <!-- 开票地址（巴西、墨西哥必填） -->
        <Form.Item
          v-if="isLatAmCountry"
          :label="$t('page.company.create.form.billingAddress')"
          name="billingAddress"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.billingAddress"
            :disabled="!isEditable"
            :placeholder="
              $t('page.company.create.form.billingAddressPlaceholder')
            "
          />
        </Form.Item>

        <!-- 营业执照 -->
        <Form.Item
          :label="$t('page.company.create.form.businessLicense')"
          name="imageFile"
          required
          label-class-name="multi-line-label"
        >
          <Upload
            v-model:file-list="formData.imageFile"
            :disabled="!isEditable"
            :before-upload="handleUpload"
            list-type="picture-card"
            class="business-license-upload"
          >
            <div v-if="formData.imageFile.length === 0">
              <div style="margin-bottom: 8px; font-size: 32px">+</div>
              <div>
                {{ $t('page.company.create.form.businessLicenseUpload') }}
              </div>
            </div>
          </Upload>
          <div class="form-hint">
            {{ $t('page.company.create.form.businessLicenseFileHint') }}
          </div>
        </Form.Item>

        <!-- 联系人姓名 -->
        <Form.Item
          :label="$t('page.company.create.form.contactName')"
          name="contactName"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.contactName"
            :disabled="!isEditable"
            :placeholder="$t('page.company.create.form.contactNamePlaceholder')"
          />
        </Form.Item>

        <!-- 联系邮箱 -->
        <Form.Item
          :label="$t('page.company.create.form.contactEmail')"
          name="contactEmail"
          required
          label-class-name="multi-line-label"
        >
          <Input
            v-model:value="formData.contactEmail"
            :disabled="!isEditable"
            :placeholder="
              $t('page.company.create.form.contactEmailPlaceholder')
            "
          />
        </Form.Item>

        <!-- 联系电话 -->
        <Form.Item required label-class-name="multi-line-label">
          <template #label>
            <MultiLineLabel
              :text="$t('page.company.create.form.contactNumber')"
            />
          </template>
          <div style="display: flex; gap: 8px; align-items: stretch">
            <Select
              v-model:value="formData.countryCode"
              :disabled="!isEditable"
              :options="countryOptions"
              style="width: 180px"
              default-value="+86"
              :dropdown-style="{ minWidth: '300px' }"
            />
            <Input
              v-model:value="formData.contactNumber"
              :disabled="!isEditable"
              :placeholder="
                $t('page.company.create.form.contactNumberPlaceholder')
              "
              style="flex: 1; min-width: 0"
            />
          </div>
        </Form.Item>

        <!-- 表单操作按钮 -->
        <Form.Item
          v-if="isEditable"
          class="form-actions"
          style="margin-bottom: 0"
          :label-col="{ span: 0 }"
          :wrapper-col="{ span: 24 }"
        >
          <div
            style="display: flex; align-items: center; justify-content: center"
          >
            <Button type="primary" :loading="loading" @click="handleSubmit">
              {{ $t('page.company.create.form.submit') }}
            </Button>
            <Button
              :disabled="loading"
              @click="handleCancel"
              style="margin-left: 8px"
            >
              {{ $t('page.company.create.form.cancel') }}
            </Button>
          </div>
        </Form.Item>

        <!-- 查看模式下的关闭按钮 -->
        <Form.Item
          v-else
          class="form-actions"
          style="margin-bottom: 0"
          :label-col="{ span: 0 }"
          :wrapper-col="{ span: 24 }"
        >
          <div
            style="display: flex; align-items: center; justify-content: center"
          >
            <Button @click="handleCancel">
              {{ $t('page.company.create.form.close') }}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Spin>
  </div>
</template>

<style scoped>
.company-form-container {
  max-width: 800px;
  padding: 20px;
  margin: 0 auto;
}

.company-form {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
}

.form-hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: #666;
}

.business-license-upload {
  margin-top: 8px;
}

.form-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 30px;
}

.form-actions :deep(.ant-form-item-control) {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 0;
}
</style>
