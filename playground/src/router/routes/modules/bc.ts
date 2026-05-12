import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:building-2',
      order: 1,
      title: '商务中心管理',
    },
    name: 'BusinessCenter',
    path: '/bc',
    children: [
      {
        name: 'BcList',
        path: 'list',
        component: () => import('#/views/admin/bc/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '商务中心列表',
        },
      },
    ],
  },
];

export default routes;
