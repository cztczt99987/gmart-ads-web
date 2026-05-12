<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page, Tippy } from '@vben/common-ui';
import { $t } from '@vben/locales';
import { preferences } from '@vben/preferences';

import { message } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { applyAdvertiserApi, updateAdvertiserApplyApi } from '#/api/advertiser';
import { getCompanyListApi } from '#/api/company';
import { getIndustryListApi } from '#/api/industry';
import { getTimezoneListApi } from '#/api/timezone';
// 导入运营顾问头像
import yunyingAvatar from '#/assets/yunying.jpeg';

import CompanyEntitySelector from './components/CompanyEntitySelector.vue';

// 公司主体选项
const companyOptions = ref([
  { label: $t('page.common.pleaseSelect'), value: '' },
]);

// 公司列表数据
const companyList = ref<any[]>([]);

// 选中的公司ID
const companyEntityValue = ref('');

// 分页相关状态
// const currentPage = ref(1);
const totalCompanies = ref(0);
const loadingCompanies = ref(false);

// 获取公司列表
const fetchCompanyList = async () => {
  try {
    loadingCompanies.value = true;
    // 移除page和pageSize参数，使用较大的pageSize获取完整的公司列表
    const response = await getCompanyListApi({
      status: 1, // 只获取已通过的公司
      isEnabled: 1, // 只获取启用的公司
      // page: 1,
      // pageSize: 1000, // 设置一个较大的值，确保获取所有公司
    });

    // 更新公司列表数据
    companyList.value = response.list;
    totalCompanies.value = response.total;

    // 转换为选择器选项格式
    companyOptions.value = [
      { label: $t('page.common.pleaseSelect'), value: '' },
      ...response.list.map((company: any) => ({
        label: company.name,
        value: company.id,
        area: company.area, // 存储公司的注册区域
      })),
    ];

    // 如果是编辑模式，确保编辑的公司在选项中
    if (isEditMode.value && editData.value && editData.value.company) {
      const editedCompanyId = editData.value.company.id;
      const existingOption = companyOptions.value.find(
        (option: any) => option.value === editedCompanyId,
      );

      // 如果编辑的公司不在选项中，添加它
      if (!existingOption) {
        const editedCompanyOption = {
          label: editData.value.company.name,
          value: editedCompanyId,
          area: editData.value.area || '',
        };
        companyOptions.value.push(editedCompanyOption);
      }
    }
  } catch (error) {
    console.error('获取公司列表失败:', error);
    message.error($t('page.advertiser.create.fetchCompanyListFailed'));
  } finally {
    loadingCompanies.value = false;
  }
};

// 弹窗状态
const submitting = ref(false);

// 表单数据
// const formData = reactive({
//   companyEntity: '',
// });

// 广告账号币种选项
const currencyOptions = [
  { label: $t('page.common.pleaseSelect'), value: '' },
  { label: 'USD', value: 'USD' },
  { label: 'CNY', value: 'CNY' },
];

// 广告账户行业选项
const industryOptions = ref([
  { label: $t('page.common.pleaseSelect'), value: '' },
]);

// 广告账户时区选项
const regionOptions = ref([
  { label: $t('page.common.pleaseSelect'), value: '' },
]);

// 原始时区数据
const timezoneList = ref<any[]>([]);

// 原始行业数据
const industryList = ref<any[]>([]);

// 路由实例
const route = useRoute();
const router = useRouter();

// 是否为编辑模式
const isEditMode = computed(() => route.query.mode === 'edit');
const domainPattern =
  /^(?=.{1,253}$)(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}(?::\d{1,5})?(?:\/.*)?$/i;

// 编辑数据
const editData = computed(() => {
  try {
    return route.query.data ? JSON.parse(route.query.data as string) : null;
  } catch {
    return null;
  }
});

function isValidPromotionLink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes(' ')) return false;
  let target = trimmed;
  if (target.startsWith('https://')) {
    target = target.slice('https://'.length);
  } else if (target.startsWith('http://')) {
    target = target.slice('http://'.length);
  }
  return domainPattern.test(target);
}

// 表单提交处理
async function onSubmit(values: Record<string, any>) {
  if (submitting.value) return;
  submitting.value = true;
  try {
    // 处理前缀：为广告账户名称和推广链接添加正确的前缀
    const advertiserName = values.advertisingAccountName.startsWith('Gmart-')
      ? values.advertisingAccountName
      : `Gmart-${values.advertisingAccountName}`;

    const promotionLink = values.promotionLink.startsWith('https://')
      ? values.promotionLink
      : `https://${values.promotionLink}`;

    const applyParams = {
      companyId: companyEntityValue.value,
      currency: values.advertisingAccountCode,
      type: 'AUCTION',
      advertiserName,
      timezoneCode: values.advertisingAccountRegion,
      timezone: values.advertisingAccountRegion,
      promotionLink,
      industryId: Number.parseInt(values.advertisingAccountIndustry),
      industry: values.advertisingAccountIndustry,
    };

    const isEdit = isEditMode.value && editData.value;
    const submitParams = isEdit
      ? {
          ...applyParams,
        }
      : applyParams;

    await (isEdit
      ? updateAdvertiserApplyApi(editData.value.id, submitParams)
      : applyAdvertiserApi(submitParams));

    message.success(
      isEdit
        ? $t('page.advertiser.create.updateSuccess')
        : $t('page.advertiser.create.submitSuccess'),
    );

    // 提交成功后跳转到开户记录页面
    setTimeout(() => {
      router.push('/advertisers/apply/record/index');
    }, 1000);
  } catch (error) {
    console.error('提交失败:', error);
    message.error($t('page.advertiser.create.submitFailed'));
  } finally {
    submitting.value = false;
  }
}

// 保存草稿处理
function handleSaveDraft() {
  message.success($t('page.advertiser.create.draftSaveSuccess'));
}

// 处理新建开户公司 - 跳转到公司管理页面
function handleCreateCompany() {
  router.push('/companies/create/index');
}

// 获取时区列表
const fetchTimezoneList = async () => {
  try {
    const response = await getTimezoneListApi();
    // 检查响应格式，提取data字段
    timezoneList.value = response || [];
    updateTimezoneOptions();
  } catch (error) {
    console.error('获取时区列表失败:', error);
    message.error($t('page.advertiser.create.fetchTimezoneListFailed'));
    timezoneList.value = [];
    updateTimezoneOptions();
  }
};

// 更新时区选项（支持多语言）
const updateTimezoneOptions = () => {
  const currentLang = preferences.app.locale;
  // 映射语言代码
  const langMap: Record<string, string> = {
    'zh-CN': 'zh',
    'en-US': 'en',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'th-TH': 'th',
    'vi-VN': 'vi',
    'id-ID': 'id',
    'ms-MY': 'ms',
  };
  const langKey = langMap[currentLang] || 'en';

  regionOptions.value = [
    { label: $t('page.common.pleaseSelect'), value: '' },
    ...timezoneList.value.map((timezone: any) => {
      const displayName =
        timezone.displayNames?.[langKey] ||
        timezone.displayNames?.en ||
        $t('page.advertiser.create.unknownTimezone');
      return {
        label: `${timezone.utcOffset || ''} (${displayName})`,
        value: timezone.timezone || '',
      };
    }),
  ];
};

// 获取行业列表
const fetchIndustryList = async () => {
  try {
    const response = await getIndustryListApi();
    // 检查响应格式，提取data字段
    industryList.value = response || [];
    updateIndustryOptions();
  } catch (error) {
    console.error('获取行业列表失败:', error);
    message.error($t('page.advertiser.create.fetchIndustryListFailed'));
    industryList.value = [];
    updateIndustryOptions();
  }
};

// 更新行业选项（支持多语言）
const updateIndustryOptions = () => {
  const currentLang = preferences.app.locale;
  // 映射语言代码
  const langMap: Record<string, string> = {
    'zh-CN': 'zh',
    'en-US': 'en',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'th-TH': 'th',
    'vi-VN': 'vi',
    'id-ID': 'id',
    'ms-MY': 'ms',
  };
  const langKey = langMap[currentLang] || 'en';

  // 转换为树形结构选项格式（支持二级列表）
  const formatIndustryOptions = (industries: any[]) => {
    const options: any[] = [];

    industries.forEach((industry: any) => {
      // 一级行业
      const firstIndustryName =
        industry.firstIndustryName?.[langKey] ||
        industry.firstIndustryName?.en ||
        $t('page.advertiser.create.unknownIndustry');
      const option: any = {
        title: firstIndustryName,
        value: industry.firstIndustryId?.toString() || '',
        selectable: false,
        children: [],
      };

      // 添加二级行业
      if (
        industry.secondIndustryList &&
        industry.secondIndustryList.length > 0
      ) {
        option.children = industry.secondIndustryList.map((child: any) => {
          const secondIndustryName =
            child.secondIndustryName?.[langKey] ||
            child.secondIndustryName?.en ||
            $t('page.advertiser.create.unknownSubIndustry');
          return {
            title: secondIndustryName,
            value: child.secondIndustryId?.toString() || '',
          };
        });
      }

      options.push(option);
    });

    return options;
  };

  industryOptions.value = [
    { label: $t('page.common.pleaseSelect'), value: '' },
    ...formatIndustryOptions(industryList.value),
  ];
};

// 页面加载时获取区域列表、公司列表、时区列表和行业列表
onMounted(async () => {
  try {
    // 使用Promise.all并行请求，减少加载时间
    await Promise.all([
      fetchCompanyList(),
      fetchTimezoneList(),
      fetchIndustryList(),
    ]);

    // 如果是编辑模式，设置表单数据
    if (isEditMode.value && editData.value) {
      // 处理行业字段的默认值
      let industryValue = '';

      // 优先使用industryId（如果有）
      if (editData.value.industryId) {
        // 检查industryId是否存在于industryOptions中
        const industryExists = industryOptions.value.some((option: any) => {
          // 检查一级行业
          if (option.value === editData.value.industryId) {
            return true;
          }
          // 检查二级行业
          if (option.children && option.children.length > 0) {
            return option.children.some(
              (child: any) => child.value === editData.value.industryId,
            );
          }
          return false;
        });

        // eslint-disable-next-line unicorn/prefer-ternary
        if (industryExists) {
          industryValue = editData.value.industryId;
        } else {
          // 如果industryId不存在，使用默认的"请选择"项
          industryValue = '';
        }
      } else if (editData.value.industry) {
        // 如果没有industryId，使用原来的industry字段
        industryValue = editData.value.industry;
      }

      // 处理前缀：移除重复的前缀，确保编辑界面显示干净内容
      // 1. 广告账户名称：移除"Gmart-"前缀
      let cleanAccountName = editData.value.advertiserName || '';
      if (cleanAccountName.startsWith('Gmart-')) {
        cleanAccountName = cleanAccountName.slice('Gmart-'.length);
      }

      // 2. 推广链接：移除"https://"前缀
      let cleanPromotionLink = editData.value.promotionLink || '';
      if (cleanPromotionLink.startsWith('https://')) {
        cleanPromotionLink = cleanPromotionLink.slice('https://'.length);
      }

      // 字段映射：将AdvertiserRecordItem的字段映射到表单字段
      const formValues = {
        // 广告账户名称（移除前缀后的干净内容）
        advertisingAccountName: cleanAccountName,
        // 广告账号币种
        advertisingAccountCode: editData.value.currency,
        // 广告账户时区
        advertisingAccountRegion: editData.value.timezone,
        // 广告账户行业
        advertisingAccountIndustry: industryValue,
        // 推广链接（移除前缀后的干净内容）
        promotionLink: cleanPromotionLink,
        // 广告账户注册地
        advertisingAccountLocation: editData.value.area,
        // 广告账户类型
        advertisingAccountType: 'AUCTION',
      };

      // 设置表单值
      await formApi.setValues(formValues);

      // 设置公司主体
      if (editData.value.company && editData.value.company.id) {
        // 强制设置公司主体ID，确保下拉列表显示正确的默认值
        companyEntityValue.value = editData.value.company.id;
      }
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    // 即使部分请求失败，也确保所有选项列表都已初始化
    if (companyOptions.value.length === 0) {
      companyOptions.value = [
        { label: $t('page.common.pleaseSelect'), value: '' },
      ];
    }
    if (regionOptions.value.length === 0) {
      regionOptions.value = [
        { label: $t('page.common.pleaseSelect'), value: '' },
      ];
    }
    if (industryOptions.value.length === 0) {
      industryOptions.value = [];
    }
  }
});

// 创建表单
const [TikTokForm, formApi] = useVbenForm({
  // 所有表单项共用配置
  commonConfig: {
    componentProps: {
      class: 'w-full',
      style: {
        borderRadius: '8px',
      },
    },
  },
  // 提交函数
  handleSubmit: onSubmit,
  // 重置函数
  handleReset: handleSaveDraft,
  // 垂直布局
  layout: 'vertical',
  // 表单模式
  schema: [
    {
      component: 'Input',
      componentProps: {
        disabled: true,
        placeholder: $t(
          'page.advertiser.create.adAccountRegistrationLocationPlaceholder',
        ),
        style: 'width: 300px; border-radius: 8px;',
      },
      fieldName: 'advertisingAccountLocation',
      label: $t('page.advertiser.create.adAccountRegistrationLocation'),
      help: $t('page.advertiser.create.adAccountRegistrationLocationHelp'),
      description: $t(
        'page.advertiser.create.adAccountRegistrationLocationHelp',
      ),
    },
    {
      component: 'Select',
      componentProps: {
        options: currencyOptions,
        placeholder: $t('page.common.pleaseSelect'),
        style: 'width: 200px; border-radius: 8px;',
        disabled: true,
      },
      fieldName: 'advertisingAccountCode',
      label: $t('page.advertiser.create.selectCurrency'),
      help: $t('page.advertiser.create.selectCurrencyHelp'),
      rules: 'required',
      defaultValue: 'USD',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: $t('page.advertiser.create.auctionAd'), value: 'AUCTION' },
        ],
        disabled: true,
      },
      fieldName: 'advertisingAccountType',
      label: $t('page.advertiser.create.adAccountType'),
      help: $t('page.advertiser.create.adAccountTypeHelp'),
      rules: 'required',
      defaultValue: 'AUCTION',
    },
    {
      component: 'TreeSelect',
      componentProps: () => ({
        treeData: industryOptions,
        treeNodeFilterProp: 'title',
        placeholder: $t('page.common.pleaseSelect'),
        style: 'width: 300px; border-radius: 8px;',
        disabled: isEditMode.value,
      }),
      fieldName: 'advertisingAccountIndustry',
      label: $t('page.advertiser.create.adAccountIndustry'),
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 99,
        placeholder: $t('page.advertiser.create.adAccountNamePlaceholder'),
        showCount: true,
        style: 'width: 500px; border-radius: 8px;',
        prefix: 'Gmart-',
      },
      fieldName: 'advertisingAccountName',
      label: $t('page.advertiser.create.adAccountName'),
      help: $t('page.advertiser.create.adAccountNameHelp'),
      rules: z
        .string()
        .min(1, $t('page.advertiser.create.adAccountNameRequired'))
        .max(99, $t('page.advertiser.create.adAccountNameMaxLength')),
    },
    {
      component: 'Select',
      componentProps: () => ({
        options: regionOptions,
        placeholder: $t('page.common.pleaseSelect'),
        style: 'width: 300px; border-radius: 8px;',
        disabled: isEditMode.value,
      }),
      fieldName: 'advertisingAccountRegion',
      label: $t('page.advertiser.create.adAccountTimezone'),
      help: $t('page.advertiser.create.adAccountTimezoneHelp'),
      rules: 'required',
    },
    {
      component: 'Input',
      componentProps: {
        maxlength: 255,
        placeholder: $t('page.advertiser.create.promotionLinkPlaceholder'),
        showCount: true,
        style: 'width: 500px; border-radius: 8px;',
        prefix: 'https://',
      },
      fieldName: 'promotionLink',
      label: $t('page.advertiser.create.promotionLink'),
      help: $t('page.advertiser.create.promotionLinkHelp'),
      rules: z
        .string()
        .min(1, $t('page.advertiser.create.promotionLinkRequired'))
        .refine(
          isValidPromotionLink,
          $t('page.advertiser.create.promotionLinkInvalid'),
        ),
    },
    {
      component: 'InputNumber',
      componentProps: {
        disabled: true,
        max: 10,
        min: 1,
        style: 'width: 100px; border-radius: 8px;',
      },
      fieldName: 'applicationAccountSettings',
      label: $t('page.advertiser.create.applicationAccountCount'),
      defaultValue: 1,
    },
  ],
  // 操作按钮布局
  actionLayout: 'newLine',
  // 操作按钮位置
  actionPosition: 'center',
  // // 自定义提交按钮
  // submitButtonOptions: {
  //   text: '提交',
  //   style: {
  //     borderRadius: '8px',
  //     padding: '12px 40px',
  //     fontSize: '16px',
  //     fontWeight: '600',
  //   },
  // },
  // // 自定义重置按钮
  // resetButtonOptions: {
  //   text: '保存草稿',
  //   style: {
  //     borderRadius: '8px',
  //     padding: '12px 40px',
  //     fontSize: '16px',
  //     fontWeight: '600',
  //     marginLeft: '16px',
  //   },
  // },
  // 自定义操作按钮
  actionWrapperClass: 'flex justify-center mt-8 pt-4 border-t',
});

watch(
  submitting,
  (value) => {
    formApi.setState({
      submitButtonOptions: {
        loading: value,
        disabled: value,
      },
    });
  },
  { immediate: true },
);
</script>

<template>
  <Page
    :title="$t('page.advertiser.create.pageTitle')"
    :description="$t('page.advertiser.create.pageDescription')"
  >
    <template #extra>
      <div class="page-extra">
        <Tippy
          :content="
            () => `
            <div class='flex flex-col items-center group relative w-[604px]'>
              <div class='bg-white w-[604px] py-[24px] pl-[24px] pr-[24px] rounded-[8px]'>
                <div>
                  <div class='pl-[16px] pr-[16px] flex items-center bg-[#f8f8f8] rounded-[8px] ph-[16px] py-[12px] mb-[24px]'>
                    <div class='relative'>
                      <img src='${yunyingAvatar}' alt='gmart运营顾问' class='w-[96px] h-[96px] rounded-[8px] mr-[24px] overflow-hidden opacity-100 transition-opacity' />
                    </div>
                    <div>
                      <div class='font-bold text-[16px] text-[#303030]'>gmart运营顾问</div>
                      <div class='text-[14px] text-[#8a8a8a] mt-[6px]'>为您提供广告账户专属运营指导</div>
                    </div>
                  </div>
                  <div class='flex justify-around'>
                    <div class='flex flex-col items-center' style='width: 160px;'>
                      <div class='rounded-[8px] overflow-hidden relative' style='width: 160px; height: 160px;'>
                        <div class='relative' style='width: 160px; height: 160px; object-fit: contain;'>
                          <img src='/img_v3_02vh_5b8558b0-503c-4708-b76e-a299b11ee1fg.jpg' alt='gmart运营顾问二维码' class='rounded-[8px] opacity-100 transition-opacity' style='width: 160px; height: 160px; object-fit: contain;' />
                        </div>
                      </div>
                    </div>
                    <div class='flex flex-col items-center' style='width: 160px;'>
                      <div class='rounded-[8px] overflow-hidden relative' style='width: 160px; height: 160px;'>
                        <div class='relative' style='width: 160px; height: 160px; object-fit: contain;'>
                          <img src='/img_v3_02vh_e14e443b-6a37-4cdf-b6c7-757fcd5b7bdg.jpg' alt='gmart运营顾问二维码' class='rounded-[8px] opacity-100 transition-opacity' style='width: 160px; height: 160px; object-fit: contain;' />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
          "
          placement="bottom"
          trigger="mouseenter focusin"
          theme="light"
          :interactive="true"
          :arrow="true"
          animation="shift-away"
          :duration="200"
          :delay="[200, 200]"
          max-width="none"
        >
          <Button
            type="default"
            style="
              display: flex;
              gap: 8px;
              align-items: center;
              padding: 6px 12px;
              border-radius: 8px;
            "
          >
            <img :src="yunyingAvatar" alt="用户" class="user-avatar" />
            {{ $t('page.advertiser.create.addExclusiveOperation') }}
          </Button>
        </Tippy>
        <!-- <a href="#" class="guide-link">
          <Button type="link">TikTok开户指南</Button>
        </a> -->
      </div>
    </template>
    <!--      <h2 class="page-title">TikTok开户申请</h2>-->

    <div class="tiktok-application-container">
      <div class="form-card">
        <div class="form-header">
          <!--            <div class="form-section">-->
          <!--              <h3 class="section-title">-->
          <!--                <span class="required">*</span>请选择您的开户公司主体：-->
          <!--              </h3>-->
          <!--              <CompanyEntitySelector-->
          <!--                v-model:value="formData.companyEntity"-->
          <!--                :options="companyOptions"-->
          <!--                :placeholder="'请选择'"-->
          <!--                :on-create-company="handleCreateCompany"-->
          <!--              />-->
          <!--            </div>-->
          <!-- 公司主体选择器 -->
          <div class="form-section" style="margin-bottom: 12px">
            <h3 class="section-title" style="margin-bottom: 8px">
              <span style="margin-right: 4px; color: #ff4d4f">*</span>
              {{ $t('page.advertiser.create.selectCompanyEntity') }}
            </h3>
            <CompanyEntitySelector
              v-model="companyEntityValue"
              :options="companyOptions"
              :placeholder="$t('page.common.pleaseSelect')"
              :required="true"
              @create-company="handleCreateCompany"
              @company-selected="
                (_, companyArea) => {
                  // 更新广告账户注册地
                  formApi.setFieldValue(
                    'advertisingAccountLocation',
                    companyArea,
                  );
                }
              "
            />
          </div>
        </div>
        <TikTokForm />
      </div>
    </div>
  </Page>
</template>

<style scoped>
/* 响应式布局 */
@media (max-width: 768px) {
  .form-header {
    flex-direction: column;
    align-items: stretch;
  }

  .form-row input {
    margin-right: 0 !important;
  }

  .page-extra {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

.tiktok-application-container {
  padding: 24px;
  margin: 0 auto;
}

.form-card {
  padding: 24px;
  background-color: hsl(var(--card));
  border-radius: var(--radius);
}

.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

/* 页面右侧额外内容 */
.page-extra {
  display: flex;
  gap: 16px;
  align-items: center;
}

.user-avatar {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  vertical-align: middle;
}

.guide-link {
  margin-left: 16px;
}

.bc-tags .ant-select-selector {
  align-items: flex-start;
  height: auto;
}

.bc-tags .ant-select-selection-overflow {
  flex-wrap: wrap;
}

.form-help,
.vben-form-item-extra {
  font-size: 12px;
  line-height: 1.4;
  color: #999;
}
</style>
