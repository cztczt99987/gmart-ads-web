import type { Recordable, UserInfo } from '@vben/types';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { notification } from 'ant-design-vue';
import { defineStore } from 'pinia';

import { adminLoginApi, adminLogoutApi } from '#/api/admin';

const ADMIN_HOME_PATH = '/finance/recharge-audit';

export const useAdminAuthStore = defineStore('admin-auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  async function adminAuthLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    let userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { token, uid } = await adminLoginApi({
        account: params.account,
        password: params.password,
      });

      if (token) {
        accessStore.setAccessToken(token);

        userInfo = {
          avatar: '',
          desc: '管理员',
          userId: String(uid),
          username: params.account,
          realName: '管理员',
          roles: ['admin'],
          homePath: ADMIN_HOME_PATH,
          token,
        };

        userStore.setUserInfo(userInfo);
        accessStore.setAccessCodes(['admin']);

        if (accessStore.loginExpired) {
          accessStore.setLoginExpired(false);
        } else {
          onSuccess ? await onSuccess?.() : await router.push(ADMIN_HOME_PATH);
        }

        notification.success({
          description: `欢迎回来: ${userInfo?.realName}`,
          duration: 3,
          message: '登录成功',
        });
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function adminLogout(redirect: boolean = true) {
    try {
      await adminLogoutApi();
    } catch {
      // 不做任何处理
    }

    resetAllStores();
    accessStore.setLoginExpired(false);

    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    adminAuthLogin,
    adminLogout,
    loginLoading,
  };
});
