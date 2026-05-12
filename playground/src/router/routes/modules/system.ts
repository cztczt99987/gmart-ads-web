import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:settings',
      order: 99,
      title: 'system.title',
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemMenu',
        path: 'menu',
        component: () => import('#/views/system/menu/list.vue'),
        meta: {
          icon: 'lucide:menu',
          title: 'system.menu.title',
        },
      },
      {
        name: 'SystemDept',
        path: 'dept',
        component: () => import('#/views/system/dept/list.vue'),
        meta: {
          icon: 'lucide:building-2',
          title: 'system.dept.title',
        },
      },
      {
        name: 'SystemRole',
        path: 'role',
        component: () => import('#/views/system/role/list.vue'),
        meta: {
          icon: 'lucide:shield',
          title: 'system.role.title',
        },
      },
    ],
  },
];

export default routes;
