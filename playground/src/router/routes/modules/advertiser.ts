import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:megaphone',
      order: 2,
      title: '广告账户',
    },
    name: 'Advertiser',
    path: '/advertiser',
    children: [
      {
        name: 'AdvertiserList',
        path: 'list',
        component: () => import('#/views/admin/advertiser/index.vue'),
        meta: {
          icon: 'lucide:list',
          title: '广告账户列表',
        },
      },
      {
        name: 'AdvertiserAudit',
        path: 'audit',
        component: () => import('#/views/admin/advertiser-audit/index.vue'),
        meta: {
          icon: 'lucide:clipboard-check',
          title: '广告账户审核',
        },
      },
      {
        name: 'RefundList',
        path: 'refund',
        component: () => import('#/views/admin/refund/index.vue'),
        meta: {
          icon: 'lucide:undo-2',
          title: '退款列表',
        },
      },
    ],
  },
];

export default routes;
