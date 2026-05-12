import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'ant-design:home-filled',
      title: $t('page.home.title'),
      order: 0,
    },
    name: 'Home',
    path: '/home',
    component: () => import('#/views/home/index.vue'),
  },
];

export default routes;
