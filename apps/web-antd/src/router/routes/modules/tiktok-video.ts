import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'mdi:video-outline',
      title: $t('page.tiktokVideo.title'),
      order: 4,
      keepAlive: true,
    },
    name: 'TiktokVideo',
    path: '/tiktok-video',
    redirect: '/tiktok-video/authorize/index',
    children: [
      {
        name: 'TiktokVideoAuthorize',
        path: '/tiktok-video/authorize/index',
        component: () => import('#/views/tiktok-video/authorize/index.vue'),
        meta: {
          title: $t('page.tiktokVideo.authorize.title'),
        },
      },
      {
        name: 'TiktokVideoUpload',
        path: '/tiktok-video/upload/index',
        component: () => import('#/views/tiktok-video/upload/index.vue'),
        meta: {
          title: $t('page.tiktokVideo.upload.title'),
        },
      },
      {
        name: 'TiktokVideoList',
        path: '/tiktok-video/list/index',
        component: () => import('#/views/tiktok-video/list/index.vue'),
        meta: {
          title: $t('page.tiktokVideo.list.title'),
        },
      },
    ],
  },
];

export default routes;
