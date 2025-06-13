<template>
  <view class="welcome-container" :class="{ 'fade-in': showContent }">
    <!-- 动画logo区域 -->
    <view class="logo-container" :class="{ 'logo-animate': startAnimation }">
      <image class="logo" src="/static/logo.webp" mode="aspectFit" />
      <view class="logo-shadow" :class="{ 'shadow-animate': startAnimation }"></view>
    </view>
    
    <!-- 标题和副标题 -->
    <view class="text-container" :class="{ 'text-animate': showContent }">
      <text class="title">校园助手</text>
      <text class="subtitle">您的校园生活好帮手</text>
    </view>
    
    <!-- 登录按钮 -->
    <view class="button-container" :class="{ 'button-animate': showContent }">
      <button 
        class="enter-button"
        :loading="isLoading"
        @tap="handleEnter"
        open-type="getUserInfo"
      >
        {{ buttonText }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { useRouter } from 'uni-mini-router'
import { sleep } from '@/utils/time'
import { useUserStore } from '@/pinia/modules/user'
import {useToast} from "@/composables/toast";

const router = useRouter()
const startAnimation = ref(false)
const showContent = ref(false)
const isLoading = ref(false)
const buttonText = ref('开始体验')
const userStore = useUserStore()
const toast = useToast()

// 处理进入应用
async function handleEnter() {
  if (isLoading.value) return

  isLoading.value = true
  buttonText.value = '正在进入...'

  uni.getUserProfile({
    desc: '用于登录到应用',
    lang: 'zh_CN',
    success: async ({userInfo}) => {
      console.debug('👤 获取微信用户信息', userInfo)
      try {
        await userStore.login()
        // 登录成功后直接跳转到社区页面
        router.pushTab('/pages/index/community')
      } catch (err) {
        toast.error(err.message || err.errMsg)
        console.error(err.message || err.errMsg)
      }
    },
    fail: (err) => {
      toast.error(err.message || err.errMsg)
      console.error('❌ 进入失败:', err.message || err.errMsg)
    },
    complete: () => {
      isLoading.value = false
      buttonText.value = '开始体验'
    }
  })
}

onMounted(async () => {
  // 启动动画
  startAnimation.value = true
  await sleep(500)
  showContent.value = true
})
</script>

<style lang="scss">
.welcome-container {
  position: relative;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  background: linear-gradient(
    135deg,
    #FFB6C1 0%,    /* 浅玫瑰粉 */
    #FFC0CB 50%,   /* 粉红色 */
    #FFE4E1 100%   /* 浅薄雾玫瑰色 */
  );
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  
  // 添加动态背景效果
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 60%
    );
    animation: rotateBackground 20s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    pointer-events: none;
  }
  
  &.fade-in {
    opacity: 1;
  }
}

.logo-container {
  position: relative;
  width: 220rpx;
  height: 220rpx;
  margin-bottom: 60rpx;
  transform: translateY(60rpx);
  opacity: 0;
  z-index: 1;
  
  &.logo-animate {
    animation: logoFloat 2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

.logo {
  width: 100%;
  height: 100%;
  z-index: 2;
  position: relative;
  filter: drop-shadow(0 8rpx 24rpx rgba(0, 0, 0, 0.2));
  animation: logoPulse 2s ease-in-out infinite;
}

.logo-shadow {
  position: absolute;
  bottom: -20rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 160rpx;
  height: 20rpx;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 50%;
  opacity: 0;
  filter: blur(8rpx);
  
  &.shadow-animate {
    animation: shadowPulse 2s ease-in-out infinite;
  }
}

.text-container {
  text-align: center;
  margin-bottom: 80rpx;
  opacity: 0;
  transform: translateY(30rpx);
  z-index: 1;
  
  &.text-animate {
    animation: fadeInUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 600;
  color: #fff;
  margin-bottom: 16rpx;
  letter-spacing: 2rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 1rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.button-container {
  opacity: 0;
  transform: translateY(30rpx);
  z-index: 1;
  
  &.button-animate {
    animation: fadeInUp 1s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
  }
}

.enter-button {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  color: white;
  border: none;
  padding: 24rpx 80rpx;
  border-radius: 76rpx;
  font-size: 32rpx;
  font-weight: 500;
  letter-spacing: 2rpx;
  box-shadow: 
    0 8rpx 24rpx rgba(255, 182, 193, 0.3),  /* 浅玫瑰粉阴影 */
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(255, 182, 193, 0.2);
  }
}

/* 动画定义 */
@keyframes rotateBackground {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes logoFloat {
  0% {
    opacity: 0;
    transform: translateY(60rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes logoPulse {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

@keyframes shadowPulse {
  0%, 100% {
    opacity: 0.3;
    transform: translateX(-50%) scale(1);
  }
  50% {
    opacity: 0.5;
    transform: translateX(-50%) scale(1.1);
  }
}

@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
