import { requestClient } from '#/api/request';

/**
 * 行业信息
 */
export interface Industry {
  /** 一级行业ID */
  firstIndustryId: number;
  /** 一级行业名称（多语言） */
  firstIndustryName: {
    en: string;
    id: string;
    ja: string;
    ms: string;
    th: string;
    vi: string;
    zh: string;
  };
  /** 二级行业列表 */
  secondIndustryList: {
    secondIndustryId: number;
    secondIndustryName: {
      en: string;
      id: string;
      ja: string;
      ms: string;
      th: string;
      vi: string;
      zh: string;
    };
  }[];
}

/**
 * 获取行业列表
 */
export async function getIndustryListApi() {
  return requestClient.get<Industry[]>('/v1/bc/advertisers/industries');
}
