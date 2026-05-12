import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:home-city-outline',
      // icon: 'ant-design:bank-twotone',
      title: $t('page.advertiser.title'),
      order: 1,
      keepAlive: true,
    },
    name: 'Advertisers',
    path: '/advertisers',
    redirect: '/advertisers/apply/index',
    children: [
      {
        name: 'AdvertiserApply',
        path: '/advertisers/apply/index',
        component: () => import('#/views/advertisers/create/index.vue'),
        meta: {
          // fullPathKey: false,
          title: $t('page.advertiser.create.title'),
        },
      },
      {
        name: 'AdvertiserRecord',
        path: '/advertisers/apply/record/index',
        component: () => import('#/views/advertisers/record/index.vue'),
        meta: {
          // fullPathKey: false,
          title: $t('page.advertiser.record.title'),
        },
      },
    ],
  },
  {
    meta: {
      icon: 'mdi:account-box-outline',
      title: $t('page.adAccount.title'),
      order: 2,
      keepAlive: true,
    },
    name: 'AdAccounts',
    path: '/ad-accounts',
    redirect: '/ad-accounts/list/index',
    children: [
      {
        name: 'AdAccountList',
        path: '/ad-accounts/list/index',
        component: () => import('#/views/ad-accounts/list/index.vue'),
        meta: {
          title: $t('page.adAccount.list.title'),
        },
      },
      {
        name: 'AdAccountOperationRecord',
        path: '/ad-accounts/operation-record/index',
        component: () =>
          import('#/views/ad-accounts/operation-record/index.vue'),
        meta: {
          title: $t('page.adAccount.operationRecord.title'),
        },
      },
    ],
  },
  {
    meta: {
      icon: 'mdi:finance',
      title: $t('page.finance.title'),
      order: 3,
      keepAlive: true,
    },
    name: 'Finance',
    path: '/finance',
    redirect: '/finance/wallet-recharge/index',
    children: [
      {
        name: 'WalletRecharge',
        path: '/finance/wallet-recharge/index',
        component: () => import('#/views/finance/wallet-recharge/index.vue'),
        meta: {
          title: $t('page.finance.walletRecharge.title'),
        },
      },
      {
        name: 'WalletRechargeRecord',
        path: '/finance/wallet-recharge-record/index',
        component: () =>
          import('#/views/finance/wallet-recharge-record/index.vue'),
        meta: {
          title: $t('page.finance.walletRechargeRecord.title'),
        },
      },
      {
        name: 'WalletTransferRecord',
        path: '/finance/wallet-transfer-record/index',
        component: () =>
          import('#/views/finance/wallet-transfer-record/index.vue'),
        meta: {
          title: $t('page.finance.walletTransferRecord.title'),
        },
      },
    ],
  },
];

export default routes;
