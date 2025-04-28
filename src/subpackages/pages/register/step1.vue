<template>
  <common :step="1">
    <view class="flex flex-col h-full relative">
      <!-- 顶部说明文字 -->
      <view class="mb-48rpx animate animate-slide-down">
        <view
            class="text-40rpx font-semibold mb-16rpx bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent relative inline-block">
          选择身份
          <view
              class="absolute -bottom-4rpx left-0 right-0 h-3rpx bg-gradient-to-r from-blue-500/50 to-blue-300/30 rounded-full"></view>
        </view>
        <view class="text-28rpx text-gray-600 leading-normal">请选择您的身份类型，我们将为您提供相应的验证服务</view>
      </view>

      <!-- 角色选择卡片 -->
      <view class="flex-1 flex flex-col gap-32rpx mb-48rpx" v-if="!isLoading && !shouldRedirect">
        <view
            v-for="(role, index) in validationStore.roles"
            :key="role.id"
            :class="[
                'flex items-center p-32rpx bg-white rounded-24rpx shadow-md transition-all duration-300 ease-bounce relative overflow-hidden animate animate-slide-right stagger-item', 
                { 'scale-102 shadow-lg shadow-blue-100/70 translate-x-8rpx': selectedRole?.id === role.id }
              ]"
            @tap="handleSelectRole(role)"
        >
          <!-- 左侧装饰线 -->
          <view
              :class="[
                'absolute left-0 top-12rpx bottom-12rpx w-6rpx rounded-full transition-all duration-300',
                selectedRole?.id === role.id ? 'bg-gradient-to-b from-blue-400 to-blue-500 h-85-percent' : 'bg-blue-100/50 h-30-percent'
              ]"
          ></view>

          <!-- 背景渐变层 -->
          <view
              class="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 transition-opacity duration-300"
              :class="{ 'opacity-100': selectedRole?.id === role.id }"
          ></view>

          <!-- 背景装饰气泡 -->
          <view
              class="absolute right-30rpx bottom-20rpx w-120rpx h-120rpx rounded-full bg-white/10 opacity-0 transition-opacity duration-300"
              :class="{ 'opacity-60': selectedRole?.id === role.id }"></view>
          <view
              class="absolute right-60rpx top-30rpx w-60rpx h-60rpx rounded-full bg-white/10 opacity-0 transition-opacity duration-300"
              :class="{ 'opacity-40': selectedRole?.id === role.id }"></view>

          <!-- 角色图标 -->
          <view
              :class="[
                'w-120rpx h-120rpx rounded-20rpx flex items-center justify-center mr-24rpx relative z-1 transition-all duration-300',
                selectedRole?.id === role.id ? 'bg-white/20 scale-110 rotate-3deg' : 'bg-blue-50/60'
              ]"
          >
            <wd-icon
                :name="role.icon"
                size="80rpx"
                :color="selectedRole?.id === role.id ? '#fff' : '#3182ce'"
            ></wd-icon>
          </view>

          <!-- 角色信息 -->
          <view class="flex-1 relative z-1">
            <text
                :class="[
                  'block text-32rpx font-semibold mb-12rpx transition-colors duration-300',
                  selectedRole?.id === role.id ? 'text-white' : 'text-gray-800'
                ]"
            >{{ role.name }}
            </text>
            <text
                :class="[
                  'block text-26rpx transition-colors duration-300',
                  selectedRole?.id === role.id ? 'text-white/90' : 'text-gray-600'
                ]"
            >{{ role.desc }}
            </text>
          </view>

          <!-- 选择指示器 -->
          <view
              class="w-48rpx h-48rpx rounded-full bg-white/20 flex items-center justify-center transition-all duration-500 relative z-1"
              :class="selectedRole?.id === role.id ? 'opacity-100 translate-x-0 scale-110' : 'opacity-0 translate-x-20rpx scale-90'"
          >
            <wd-icon name="check" size="40rpx" color="#fff"></wd-icon>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="isLoading" class="flex-1 flex flex-col items-center justify-center p-32rpx animate animate-fade-in">
        <view class="relative w-120rpx h-120rpx mb-48rpx">
          <view class="absolute inset-0 bg-blue-100/30 rounded-full animate-ping opacity-75"></view>
          <view class="relative flex items-center justify-center w-full h-full">
            <wd-loading size="36"/>
          </view>
        </view>
        <view class="flex items-center text-28rpx text-gray-600">
          <text>加载中</text>
          <text class="animate-dot-fade delay-0">.</text>
          <text class="animate-dot-fade delay-200">.</text>
          <text class="animate-dot-fade delay-400">.</text>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="py-32rpx animate animate-slide-up delay-5" v-if="!isLoading && !shouldRedirect">
        <wd-button
            block
            type="primary"
            :disabled="!selectedRole"
            @click="handleNext"
            custom-class="h-88rpx text-32rpx rounded-44rpx bg-gradient-to-r from-blue-400 to-blue-500 border-none transition-all duration-300 active-translate-y-2rpx disabled:opacity-60 disabled:bg-gray-100 shadow-md shadow-blue-300/20"
        >下一步
        </wd-button>
      </view>

      <!-- 装饰元素 -->
      <view
          class="absolute top-40rpx right-30rpx w-60rpx h-60rpx border-8rpx border-blue-100/60 rounded-full animate-spin-slow"></view>
      <view class="absolute bottom-150rpx left-20rpx w-40rpx h-40rpx bg-blue-100/40 rounded-full animate-float"></view>
    </view>
  </common>
</template>

<script setup>
import common from "./common.vue"
import {useRegisterStore} from "@/subpackages/pinia/register"
import {RegisterApi} from "@/subpackages/api/register"
import {useToast} from "@/composables/toast"
import {useRouter} from "uni-mini-router";
import {storeToRefs} from "pinia";

const validationStore = useRegisterStore()
const {selectedRole} = storeToRefs(validationStore)
const toast = useToast()
const router = useRouter()
const isLoading = ref(true)
const shouldRedirect = ref(false)

// 在组件挂载时检查当前进度
onMounted(async () => {
  try {
    // 模拟从API获取数据
    const response = await RegisterApi.check()
    validationStore.updateFromCheck(response)
    
    // 根据返回数据决定是否需要重定向
    if (validationStore.isCompleted) {
      router.replace({
        name: 'validation-finish'
      })
      shouldRedirect.value = true
    } else if (validationStore.stage > 0) {
      const nextStep = validationStore.stage + 1
      const routeName = `validation-step${nextStep}`
      router.replace({
        name: routeName
      })
      shouldRedirect.value = true
    }
  } catch (err) {
    console.error(err.message)
    toast.error(err.message || '加载失败')
  } finally {
    // 演示用：设置短延迟以便查看加载界面
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }
})

// 选择角色
const handleSelectRole = (role) => {
  validationStore.setSelectedRole(role)
}

// 下一步
const handleNext = async () => {
  if (!validationStore.selectedRole) return
  
  try {
    // 显示加载提示
    uni.showLoading({
      title: '提交中...',
      mask: true
    })
    
    // 模拟API提交
    await RegisterApi.process({
      roleFormData: {
        role: validationStore.selectedRole.id
      }
    })
    
    // 更新状态
    validationStore.setStage(0) // 完成第一步
    
    // 隐藏加载提示
    uni.hideLoading()
    
    // 跳转到下一步
    router.push({
      name: 'validation-step2'
    })
  } catch (err) {
    console.error(err.message)
    toast.error(err.message || '提交失败')
    uni.hideLoading()
  }
}
</script>

<style>
/* 点状动画 */
@keyframes dotFade {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.animate-dot-fade {
  animation: dotFade 1.5s infinite;
}

.delay-0 {
  animation-delay: 0s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-400 {
  animation-delay: 0.4s;
}

/* 活动样式 */
.scale-102 {
  transform: scale(1.02);
}

/* 旋转动画 */
@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin-slow {
  animation: spin-slow 12s linear infinite;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-15rpx);
  }
}

.animate-float {
  animation: float 5s ease-in-out infinite;
}

/* 脉冲动画 */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

/* 尺寸辅助类 */
.h-85-percent {
  height: 85%;
}

.h-30-percent {
  height: 30%;
}

/* 旋转辅助类 */
.rotate-3deg {
  transform: rotate(3deg);
}

/* 过渡效果 */
.ease-bounce {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 阻止按钮被禁用时的背景变灰 */
:deep(.wd-button--disabled) {
  background: #f5f5f5 !important;
}

/* 激活状态 */
.active-translate-y-2rpx:active {
  transform: translateY(2rpx);
}
</style>