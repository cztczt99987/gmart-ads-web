import { defineOverridesPreferences } from '@vben/preferences';

import LogoImg from '#/assets/logo.webp';

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    name: import.meta.env.VITE_APP_TITLE,
    defaultHomePath: '/home',
  },
  theme: {
    mode: 'light',
  },
  copyright: {
    /** 版权公司名 */
    companyName: 'Gmart',
    /** 版权公司名链接 */
    companySiteLink: 'www.gmartmax.com',
    /** 版权日期 */
    date: '2026',
    /** 备案号 */
    icp: 'xxx',
    enable: true,
  },
  logo: {
    source: LogoImg,
  },
});
