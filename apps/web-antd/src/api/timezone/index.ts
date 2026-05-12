import { requestClient } from '#/api/request';

/**
 * 时区信息
 */
export interface Timezone {
  /** 时区ID */
  timezone: string;
  /** 时区偏移量 */
  utcOffset: string;
  /** 时区显示名称（多语言） */
  displayNames: {
    en: string;
    id: string;
    ja: string;
    ms: string;
    th: string;
    vi: string;
    zh: string;
  };
}

/**
 * 获取时区列表
 */
export async function getTimezoneListApi() {
  return requestClient.get<Timezone[]>('/v1/bc/advertisers/timezone');
}
