<template>
  <layout>
    <template #center>
      <!-- 注册流程头部 -->
      <view class="text-center text-gray-800 text-36rpx font-semibold py-32rpx animate animate-slide-down relative">
        <view class="relative z-1">{{ stepLabels[step - 1] }}</view>
        <!-- 头部装饰元素 -->
        <view
            class="absolute left-50% top-0 transform -translate-x-1/2 w-220rpx h-6rpx bg-gradient-to-r from-transparent via-blue-300/60 to-transparent rounded-full"></view>
      </view>
    </template>

    <!-- 验证进度条 -->
    <view
        class="mx-32rpx p-32rpx bg-white/95 rounded-24rpx shadow-lg backdrop-blur-lg relative z-1 animate animate-fade-in">
      <!-- 上部装饰光晕 -->
      <view
          class="absolute -top-30rpx left-1/2 transform -translate-x-1/2 w-150rpx h-60rpx bg-blue-300/30 filter blur-lg rounded-full"></view>

      <!-- 进度条 -->
      <view class="h-10rpx rounded-full bg-blue-50/80 overflow-hidden mb-32rpx relative">
        <view
            class="h-full rounded-full gradient-animate transition-all duration-600 ease-bounce"
            :style="{ width: `${(step / total) * 100}%` }"
        ></view>
      </view>

      <!-- 步骤指示器 -->
      <view class="flex justify-between px-24rpx relative">
        <!-- 步骤连接线 -->
        <view class="absolute left-12% right-12% top-24rpx h-2rpx bg-blue-100/80 z-0"></view>

        <!-- 步骤点 -->
        <view
            v-for="(label, index) in stepLabels"
            :key="index"
            :class="[
              'flex flex-col items-center relative transition-all duration-300 ease-bounce',
              { 'transform scale-105': index + 1 <= step },
              `stagger-item-${index + 1}`
            ]"
        >
          <!-- 步骤数字圆点 -->
          <view
              :class="[
                'flex items-center justify-center w-48rpx h-48rpx rounded-full mb-12rpx transition-all duration-300 ease-bounce shadow-sm',
                index + 1 < step ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white scale-105 shadow-blue-200/70' : 
                index + 1 === step ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-120 shadow-md shadow-blue-300/60 relative' : 
                'bg-blue-50 text-gray-400'
              ]"
          >
            <text class="text-24rpx font-medium">{{ index + 1 }}</text>

            <!-- 当前步骤的波纹效果 -->
            <view
                v-if="index + 1 === step"
                class="absolute inset--8rpx border-2 border-blue-500/70 rounded-full animate-ripple"
            ></view>

            <!-- 完成步骤的勾选图标 -->
            <view v-if="index + 1 < step" class="absolute inset-0 flex items-center justify-center">
              <wd-icon name="check" size="28rpx" color="#fff"></wd-icon>
            </view>
          </view>

          <!-- 步骤标签 -->
          <view
              :class="[
                'text-24rpx whitespace-nowrap transition-all duration-300 origin-top',
                index + 1 < step ? 'text-blue-500 font-medium' : 
                index + 1 === step ? 'text-blue-600 font-semibold scale-110' : 
                'text-gray-400'
              ]"
          >
            {{ label }}
          </view>
        </view>
      </view>
    </view>

    <!-- 子页面内容区域 -->
    <view
        class="mx-32rpx my-32rpx p-32rpx bg-white/95 rounded-24rpx shadow-lg backdrop-blur-lg animate animate-slide-up relative">
      <!-- 右上角装饰 -->
      <view
          class="absolute -top-8rpx right-16rpx w-120rpx h-120rpx bg-gradient-to-br from-blue-100/50 to-transparent rounded-full filter blur-md"></view>
      <!-- 左下角装饰 -->
      <view
          class="absolute -bottom-16rpx left-32rpx w-100rpx h-100rpx bg-gradient-to-tr from-blue-100/30 to-transparent rounded-full filter blur-md"></view>

      <view class="relative z-1">
        <slot/>
      </view>
    </view>

    <!-- 背景装饰元素 -->
    <view
        class="fixed top-0 right-0 w-300rpx h-300rpx bg-gradient-to-bl from-blue-200/30 to-transparent rounded-full filter blur-xl -z-1 mt-0"></view>
    <view
        class="fixed top-0 left-0 w-300rpx h-300rpx bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full filter blur-xl -z-1 mt-0"></view>
    <view
        class="fixed bottom-0 left-0 w-400rpx h-400rpx bg-gradient-to-tr from-blue-200/20 to-transparent rounded-full filter blur-xl -z-1"></view>
  </layout>
</template>

<script setup>
import Layout from '@/layout/index.vue'
import {useRegisterStore} from "./pinia/register"

const validationStore = useRegisterStore()

const total = ref(4)
const stepLabels = reactive(['选择身份', '身份认证', '联系方式', '完成验证'])

// 计算当前步骤
const step = computed(() => {
  if (validationStore.isCompleted) return 4
  if (!validationStore.stage) return 1
  return validationStore.stage + 1
})
</script>

<style>
/* 自定义动画和渐变，UnoCSS无法直接覆盖的部分 */
.gradient-animate {
  background: linear-gradient(90deg, #4299e1, #3182ce, #4299e1);
  background-size: 200% 100%;
  animation: gradientMove 3s ease infinite;
}

@keyframes gradientMove {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 1.5s ease-out infinite;
}

.ease-bounce {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 保留原有的动画类 */
.animate {
  animation-duration: 0.6s;
  animation-fill-mode: both;
}

.animate-slide-down {
  animation-name: slideDown;
}

.animate-slide-up {
  animation-name: slideUp;
}

.animate-fade-in {
  animation-name: fadeIn;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 间隔出现 */
.stagger-item-1 {
  animation-delay: 0.1s;
}

.stagger-item-2 {
  animation-delay: 0.2s;
}

.stagger-item-3 {
  animation-delay: 0.3s;
}

.stagger-item-4 {
  animation-delay: 0.4s;
}

/* 定位辅助类 */
.-z-1 {
  z-index: -1;
}

/* 大小辅助类 */
.scale-120 {
  transform: scale(1.2);
}

/* 滤镜辅助类 */
.filter {
  filter: blur(8rpx);
}

.blur-md {
  filter: blur(12rpx);
}

.blur-lg {
  filter: blur(16rpx);
}

.blur-xl {
  filter: blur(24rpx);
}
</style>