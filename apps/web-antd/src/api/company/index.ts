import { requestClient } from '#/api/request';

/**
 * 公司类型: 0总公司，1分公司
 */
export type CompanyType = 0 | 1;

/**
 * 公司状态枚举
 */
export type CompanyStatus = -1 | 0 | 1 | 2;

/**
 * 开户公司数据 - 列表返回值
 */
export interface Company {
  /** 公司ID */
  id: string;
  /** 用户ID */
  uid: string;
  /** 公司名称 */
  name: string;
  /** 注册地 */
  area: string;
  /** 注册地代码 */
  areaCode: string;
  /** 详细地址 */
  address: string;
  /** 营业执照编号 */
  licenseNo: string;
  /** 税号 */
  taxNumber: string;
  /** 公司类型：0:总公司，1:分公司 */
  type: string;
  /** 营业执照URL */
  licenseUrl: string;
  /** tk 资质图片ID */
  licenseFileId: string;
  /** 联系人 */
  contactName: string;
  /** 联系邮箱 */
  contactEmail: string;
  /** 联系电话 */
  contactNumber: string;
  countryCode: string;
  /** 状态: 0审核中, 2已拒绝, 1已通过, -1已禁用 */
  status: CompanyStatus;
  /** 是否启用: 0启用，1未启用 */
  isEnabled: number;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

export interface CompanyList {
  list: Company[];
  total: number;
}

/**
 * 新增开户公司参数
 */
export interface CreateCompanyParams {
  /** 开户公司名称 */
  name: string;
  /** 注册区域 */
  area: string;
  /** 注册区域代码 */
  areaCode: string;
  /** 详细地址 */
  address: string;
  /** 营业执照编号 */
  licenseNo: string;
  /** 税号 */
  taxNumber: string;
  /** 公司类型: 0总公司，1分公司 */
  type: CompanyType;
  /** 资质证书文件，仅支持图片格式(JPG/JPEG/PNG)。文件大小最大为10 MB */
  imageFile?: File;
  /** 资质证书文件ID */
  licenseFileId?: string;
  /** 联系人 */
  contactName: string;
  /** 联系邮箱 */
  contactEmail: string;
  /** 联系电话 */
  contactNumber: string;
  countryCode: string;
}

/**
 * 更新开户公司参数
 */
export interface UpdateCompanyParams {
  /** 公司ID */
  id: string;
  /** 开户公司名称 */
  name: string;
  /** 注册区域 */
  area: string;
  /** 注册区域代码 */
  areaCode: string;
  /** 详细地址 */
  address: string;
  /** 营业执照编号 */
  licenseNo: string;
  /** 税号 */
  taxNumber: string;
  /** 公司类型: 0总公司，1分公司 */
  type: CompanyType;
  /** 资质证书文件，仅支持图片格式(JPG/JPEG/PNG)。文件大小最大为10 MB */
  imageFile?: File;
  /** 资质证书文件ID */
  licenseFileId?: string;
  /** 联系人 */
  contactName: string;
  /** 联系邮箱 */
  contactEmail: string;
  /** 联系电话 */
  contactNumber: string;
  countryCode: string;
  /** 资质证书文件URL */
  imageUrl?: string;
}

/**
 * 获取公司列表参数
 */
export interface GetCompanyListParams {
  /** 公司Id */
  id?: string;
  /** 公司名称 */
  name?: string;
  /** 状态 */
  status?: CompanyStatus;
  /** 是否启用 */
  isEnabled?: number;
  page?: number;
  pageSize?: number;
}

/**
 * 新增开户公司
 * @param params 开户公司参数
 */
export async function createCompanyApi(params: CreateCompanyParams) {
  const formData = new FormData();
  formData.append('name', params.name);
  formData.append('area', params.area);
  formData.append('areaCode', params.areaCode);
  formData.append('address', params.address);
  formData.append('licenseNo', params.licenseNo);
  formData.append('taxNumber', params.taxNumber);
  formData.append('type', String(params.type));
  if (params.licenseFileId) {
    formData.append('licenseFileId', params.licenseFileId);
  }
  if (params.imageFile) {
    formData.append('imageFile', params.imageFile);
  }
  formData.append('contactName', params.contactName);
  formData.append('contactEmail', params.contactEmail);
  formData.append('countryCode', params.countryCode);
  formData.append('contactNumber', params.contactNumber);

  return requestClient.post<Company>('/v1/company', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 获取公司列表
 * @param params 查询参数
 */
export async function getCompanyListApi(params?: GetCompanyListParams) {
  return requestClient.get<CompanyList>('/v1/company', {
    params,
  });
}

/**
 * 更新开户公司
 * @param params 更新参数
 */
export async function updateCompanyApi(params: UpdateCompanyParams) {
  const formData = new FormData();
  formData.append('id', params.id);
  formData.append('name', params.name);
  formData.append('area', params.area);
  formData.append('areaCode', params.areaCode);
  formData.append('address', params.address);
  formData.append('licenseNo', params.licenseNo);
  formData.append('taxNumber', params.taxNumber);
  formData.append('type', String(params.type));
  formData.append('contactName', params.contactName);
  formData.append('contactEmail', params.contactEmail);
  formData.append('countryCode', params.countryCode);
  formData.append('contactNumber', params.contactNumber);

  if (params.licenseFileId) {
    formData.append('licenseFileId', params.licenseFileId);
  }
  if (params.imageFile) {
    formData.append('imageFile', params.imageFile);
  }
  if (params.imageUrl) {
    formData.append('imageUrl', params.imageUrl);
  }

  return requestClient.put<Company>('/v1/company', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

/**
 * 删除公司
 * @param id 公司ID
 */
export async function deleteCompanyApi(id: string) {
  return requestClient.delete(`/v1/company/${id}`);
}
