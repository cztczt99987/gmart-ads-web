import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:home-city-outline',
      // icon: 'ant-design:bank-twotone',
      title: $t('page.company.title'),
      keepAlive: true,
    },
    name: 'Companies',
    path: '/companies',
    redirect: '/companies/create/index',
    children: [
      {
        name: 'CreateCompany',
        path: '/companies/create/index',
        component: () => import('#/views/companies/create/index.vue'),
        meta: {
          // fullPathKey: false,
          title: $t('page.company.create.title'),
        },
      },
    ],
  },
];

export default routes;
