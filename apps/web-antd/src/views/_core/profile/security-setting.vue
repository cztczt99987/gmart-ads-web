<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { message, Modal } from 'ant-design-vue';

import {
  changeEmailApi,
  getUserInfoApi,
  sendNewEmailCodeApi,
  sendOldEmailCodeApi,
} from '#/api/core/user';
import { useAuthStore } from '#/store';

const authStore = useAuthStore();

const currentEmail = ref('');
const oldCode = ref('');
const newEmail = ref('');
const newCode = ref('');
const loading = ref(false);
const oldCodeLoading = ref(false);
const newCodeLoading = ref(false);
const oldCodeCountdown = ref(0);
const newCodeCountdown = ref(0);
const currentStep = ref(0);
const oldCodeSent = ref(false);
const newCodeSent = ref(false);

let oldCodeTimer: null | ReturnType<typeof setInterval> = null;
let newCodeTimer: null | ReturnType<typeof setInterval> = null;

const canSubmit = computed(() => {
  return oldCode.value && newEmail.value && newCode.value;
});

const maskedEmail = computed(() => {
  if (!currentEmail.value) return '';
  const [name, domain] = currentEmail.value.split('@');
  const maskedName =
    name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
  return `${maskedName}@${domain}`;
});

const step1Valid = computed(() => oldCode.value.length >= 4);
const step2Valid = computed(
  () =>
    newEmail.value && /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(newEmail.value),
);
const step3Valid = computed(() => newCode.value.length >= 4);

onMounted(async () => {
  try {
    const data = await getUserInfoApi();
    currentEmail.value = data.email;
  } catch {
    message.error('获取用户信息失败');
  }
});

onUnmounted(() => {
  if (oldCodeTimer) clearInterval(oldCodeTimer);
  if (newCodeTimer) clearInterval(newCodeTimer);
});

function startOldCodeCountdown() {
  oldCodeCountdown.value = 60;
  oldCodeTimer = setInterval(() => {
    oldCodeCountdown.value--;
    if (oldCodeCountdown.value <= 0) {
      clearInterval(oldCodeTimer!);
      oldCodeTimer = null;
    }
  }, 1000);
}

function startNewCodeCountdown() {
  newCodeCountdown.value = 60;
  newCodeTimer = setInterval(() => {
    newCodeCountdown.value--;
    if (newCodeCountdown.value <= 0) {
      clearInterval(newCodeTimer!);
      newCodeTimer = null;
    }
  }, 1000);
}

async function handleSendOldCode() {
  try {
    oldCodeLoading.value = true;
    await sendOldEmailCodeApi();
    message.success(`验证码已发送到 ${maskedEmail.value}`);
    oldCodeSent.value = true;
    startOldCodeCountdown();
  } catch {
    message.error('发送验证码失败');
  } finally {
    oldCodeLoading.value = false;
  }
}

async function handleSendNewCode() {
  if (!step2Valid.value) {
    message.warning('请输入有效的邮箱地址');
    return;
  }
  try {
    newCodeLoading.value = true;
    await sendNewEmailCodeApi(newEmail.value, oldCode.value);
    message.success(`验证码已发送到 ${newEmail.value}`);
    newCodeSent.value = true;
    startNewCodeCountdown();
  } catch {
    message.error('发送验证码失败');
  } finally {
    newCodeLoading.value = false;
  }
}

function goStep2() {
  if (!oldCodeSent.value) {
    message.warning('请先获取验证码');
    return;
  }
  if (!step1Valid.value) {
    message.warning('请输入验证码');
    return;
  }
  currentStep.value = 1;
}

function goStep3() {
  if (!step2Valid.value) {
    message.warning('请输入有效的邮箱地址');
    return;
  }
  currentStep.value = 2;
}

async function handleSubmit() {
  if (!newCodeSent.value) {
    message.warning('请先获取验证码');
    return;
  }
  if (!step3Valid.value) {
    message.warning('请输入验证码');
    return;
  }
  if (!canSubmit.value) {
    message.warning('请完成所有步骤');
    return;
  }
  try {
    loading.value = true;
    await changeEmailApi({
      email: newEmail.value,
      code: newCode.value,
    });
    message.success('邮箱修改成功');
    Modal.success({
      title: '邮箱修改成功',
      content: '您的邮箱已修改，请重新登录。',
      okText: '重新登录',
      onOk: async () => {
        await authStore.logout();
      },
    });
  } catch {
    message.error('邮箱修改失败');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="email-page">
    <!-- 当前邮箱 -->
    <div class="current-box">
      <IconifyIcon icon="lucide:mail" class="mail-icon" />
      <div>
        <div class="box-label">当前绑定邮箱</div>
        <div class="box-value">{{ maskedEmail || '未设置' }}</div>
      </div>
    </div>

    <!-- 步骤条 -->
    <div class="steps">
      <div
        class="step"
        :class="{ active: currentStep === 0, done: currentStep > 0 }"
      >
        <span class="num">{{ currentStep > 0 ? '✓' : '1' }}</span>
        <span class="txt">验证旧邮箱</span>
      </div>
      <div class="line" :class="{ done: currentStep > 0 }"></div>
      <div
        class="step"
        :class="{ active: currentStep === 1, done: currentStep > 1 }"
      >
        <span class="num">{{ currentStep > 1 ? '✓' : '2' }}</span>
        <span class="txt">输入新邮箱</span>
      </div>
      <div class="line" :class="{ done: currentStep > 1 }"></div>
      <div class="step" :class="{ active: currentStep === 2 }">
        <span class="num">3</span>
        <span class="txt">验证新邮箱</span>
      </div>
    </div>

    <!-- 步骤1 -->
    <div v-if="currentStep === 0" class="panel">
      <h3>验证当前邮箱</h3>
      <p class="desc">验证码将发送到 {{ maskedEmail }}</p>

      <div class="form-group">
        <label>验证码</label>
        <div class="input-row">
          <input
            v-model="oldCode"
            type="text"
            class="input code-input"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button
            class="btn btn-code"
            :disabled="oldCodeCountdown > 0"
            @click="handleSendOldCode"
          >
            {{ oldCodeCountdown > 0 ? `${oldCodeCountdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" @click="goStep2">下一步</button>
      </div>
    </div>

    <!-- 步骤2 -->
    <div v-if="currentStep === 1" class="panel">
      <h3>输入新邮箱</h3>
      <p class="desc">绑定后需要使用新邮箱登录</p>

      <div class="form-group">
        <label>新邮箱</label>
        <input
          v-model="newEmail"
          type="email"
          class="input"
          placeholder="请输入新邮箱地址"
        />
      </div>

      <div class="btn-row">
        <button class="btn btn-default" @click="currentStep = 0">上一步</button>
        <button class="btn btn-primary" @click="goStep3">下一步</button>
      </div>
    </div>

    <!-- 步骤3 -->
    <div v-if="currentStep === 2" class="panel">
      <h3>验证新邮箱</h3>
      <p class="desc">验证码将发送到 {{ newEmail }}</p>

      <div class="form-group">
        <label>验证码</label>
        <div class="input-row">
          <input
            v-model="newCode"
            type="text"
            class="input code-input"
            placeholder="请输入验证码"
            maxlength="6"
          />
          <button
            class="btn btn-code"
            :disabled="newCodeCountdown > 0"
            @click="handleSendNewCode"
          >
            {{ newCodeCountdown > 0 ? `${newCodeCountdown}s` : '获取验证码' }}
          </button>
        </div>
      </div>

      <div class="btn-row">
        <button class="btn btn-default" @click="currentStep = 1">上一步</button>
        <button
          class="btn btn-primary"
          :loading="loading"
          @click="handleSubmit"
        >
          确认修改
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.email-page {
  max-width: 500px;
  padding: 20px;
}

.current-box {
  display: flex;
  align-items: center;
  padding: 16px;
  margin-bottom: 24px;
  background: #e6f4ff;
  border-radius: 8px;
}

.mail-icon {
  margin-right: 12px;
  font-size: 24px;
  color: #1890ff;
}

.box-label {
  font-size: 12px;
  color: #69b1ff;
}

.box-value {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #86909c;
  background: #e5e6eb;
  border-radius: 50%;
}

.step.active .num {
  color: #fff;
  background: #1890ff;
}

.step.done .num {
  color: #fff;
  background: #52c41a;
}

.txt {
  font-size: 13px;
  color: #86909c;
}

.step.active .txt {
  font-weight: 500;
  color: #1890ff;
}

.line {
  width: 60px;
  height: 2px;
  margin: 0 8px 24px;
  background: #e5e6eb;
}

.line.done {
  background: #52c41a;
}

.panel {
  padding: 24px;
  background: #fafafa;
  border-radius: 8px;
}

.panel h3 {
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
}

.desc {
  margin-bottom: 20px;
  font-size: 14px;
  color: #86909c;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1d2129;
}

.input {
  box-sizing: border-box;
  width: 100%;
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  outline: none;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: border-color 0.2s;
}

.input:focus {
  border-color: #1890ff;
}

.input::placeholder {
  color: #bfbfbf;
}

.input-row {
  display: flex;
  gap: 12px;
}

.code-input {
  flex: 1;
  max-width: 180px;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-code {
  color: #fff;
  white-space: nowrap;
  background: #1890ff;
  border-color: #1890ff;
}

.btn-code:hover:not(:disabled) {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-code:disabled {
  color: #bfbfbf;
  cursor: not-allowed;
  background: #f5f5f5;
  border-color: #d9d9d9;
}

.btn-primary {
  color: #fff;
  background: #1890ff;
  border-color: #1890ff;
}

.btn-primary:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.btn-default {
  color: #1d2129;
  background: #fff;
  border-color: #d9d9d9;
}

.btn-default:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.btn-row {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}
</style>
