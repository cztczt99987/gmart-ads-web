import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:wallet',
      order: 1,
      title: '财务管理',
    },
    name: 'Finance',
    path: '/finance',
    children: [
      {
        name: 'RechargeAudit',
        path: 'recharge-audit',
        component: () => import('#/views/admin/recharge-audit/index.vue'),
        meta: {
          icon: 'lucide:file-check',
          title: '充值审核',
        },
      },
    ],
  },
];

export default routes;
