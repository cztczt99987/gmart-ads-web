import type { Recordable, UserInfo } from '@vben/types';

import type { CurrentUserInfo } from '#/store/modules';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { resetAllStores, useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { getUserInfoApi, loginApi, logoutApi } from '#/api';

const HOME_PATH = '/home';

export const useAuthStore = defineStore('auth', () => {
  const accessStore = useAccessStore();
  const userStore = useUserStore();
  const router = useRouter();

  const loginLoading = ref(false);

  /**
   * 异步处理登录操作
   * Asynchronously handle the login process
   * @param params 登录表单数据
   * @param onSuccess
   */
  async function authLogin(
    params: Recordable<any>,
    onSuccess?: () => Promise<void> | void,
  ) {
    // 异步处理用户登录操作并获取 accessToken
    const userInfo: null | UserInfo = null;
    try {
      loginLoading.value = true;
      const { token, uid, hasTkAuth } = await loginApi(params);
      // 如果成功获取到 accessToken
      if (token) {
        // 将 accessToken 存储到 accessStore 中
        accessStore.setAccessToken(token);
        onSuccess ? await onSuccess?.() : await router.push(HOME_PATH);

        //   // 获取用户信息并存储到 accessStore 中
        //   const [fetchUserInfoResult, accessCodes] = await Promise.all([
        //     fetchUserInfo(),
        //     getAccessCodesApi(),
        //   ]);
        //
        //   userInfo = fetchUserInfoResult;
        //
        userStore.setUserInfo({ userId: uid, hasTkAuth } as CurrentUserInfo);
        //   accessStore.setAccessCodes(accessCodes);
        //
        //   if (accessStore.loginExpired) {
        //     accessStore.setLoginExpired(false);
        //   } else {
        //     onSuccess
        //       ? await onSuccess?.()
        //       : await router.push(
        //           userInfo.homePath || preferences.app.defaultHomePath,
        //         );
        //   }
        //
        //   if (userInfo?.realName) {
        //     ElNotification({
        //       message: `${$t('authentication.loginSuccessDesc')}:${userInfo?.realName}`,
        //       title: $t('authentication.loginSuccess'),
        //       type: 'success',
        //     });
        //   }
      }
    } finally {
      loginLoading.value = false;
    }

    return {
      userInfo,
    };
  }

  async function logout(redirect: boolean = true) {
    try {
      await logoutApi();
    } catch {
      // 不做任何处理
    }
    resetAllStores();
    accessStore.setLoginExpired(false);

    // 回登录页带上当前路由地址
    await router.replace({
      path: LOGIN_PATH,
      query: redirect
        ? {
            redirect: encodeURIComponent(router.currentRoute.value.fullPath),
          }
        : {},
    });
  }

  async function fetchUserInfo() {
    const userInfo = await getUserInfoApi();
    userStore.setUserInfo(userInfo);
    return userInfo;
  }

  function $reset() {
    loginLoading.value = false;
  }

  return {
    $reset,
    authLogin,
    fetchUserInfo,
    loginLoading,
    logout,
  };
});
