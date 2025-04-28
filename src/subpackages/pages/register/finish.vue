<template>
  <common :step="4">
    <view class="flex flex-col h-full relative">
      <!-- 状态动画 -->
      <view class="flex justify-center my-48rpx relative animate animate-bounce">
        <!-- 状态图标容器 -->
        <view
            :class="[
              'w-200rpx h-200rpx rounded-full flex items-center justify-center shadow-xl z-2 relative overflow-hidden',
              validationStore.verifyStatus === 'success' ? 'bg-gradient-to-br from-pink-300 to-pink-500' :
              validationStore.verifyStatus === 'rejected' ? 'bg-gradient-to-br from-red-400 to-red-600' :
              'bg-gradient-to-br from-orange-300 to-orange-500'
            ]"
        >
          <!-- 背景装饰 -->
          <view class="absolute inset-0 bg-white/10">
            <view class="absolute top-0 left-0 w-full h-40-percent bg-white/10 skew-y-12 transform origin-left"></view>
            <view class="absolute bottom-0 right-0 w-70-percent h-30-percent bg-white/5 -skew-y-12 transform origin-right"></view>
          </view>

          <!-- 状态图标 -->
          <wd-icon
              :name="statusIcon"
              size="120rpx"
              color="#fff"
              class="relative z-1 animate-pulse-subtle"
          ></wd-icon>

          <!-- 成功状态下的波纹 -->
          <view class="absolute inset-0 flex items-center justify-center"
                v-if="validationStore.verifyStatus === 'success'">
            <view
                class="absolute w-240rpx h-240rpx border-4 border-pink-400/80 rounded-full animate-ripple delay-0"></view>
            <view
                class="absolute w-240rpx h-240rpx border-4 border-pink-400/70 rounded-full animate-ripple delay-500"></view>
            <view
                class="absolute w-240rpx h-240rpx border-4 border-pink-400/60 rounded-full animate-ripple delay-1000"></view>
          </view>
        </view>

        <!-- 外部装饰 -->
        <view
            class="absolute top-50% left-50% w-300rpx h-300rpx border-15rpx border-dashed border-pink-100/30 rounded-full animate-spin-slow -translate-x-1/2 -translate-y-1/2"></view>
      </view>

      <!-- 状态提示 -->
      <view class="text-center animate animate-fade-in delay-3">
        <view
            class="text-36rpx font-semibold mb-16rpx bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
          {{ statusTitle }}
        </view>
        <view class="text-28rpx text-gray-600 mb-24rpx max-w-80-percent mx-auto">{{ statusDesc }}</view>
        <view
            v-if="validationStore.verifyStatus === 'rejected'"
            class="mx-32rpx p-16rpx bg-gradient-to-r from-red-50 to-red-100/50 rounded-16rpx text-26rpx text-red-500 animate animate-fade-in delay-4 shadow-sm"
        >
          驳回原因：{{ validationStore.rejectReason || '信息填写有误，请重新提交' }}
        </view>
      </view>

      <!-- 用户信息卡片 -->
      <view
          class="mx-32rpx rounded-24rpx overflow-hidden bg-white/95 shadow-lg backdrop-blur-lg animate animate-slide-up delay-4 relative">
        <!-- 卡片装饰 -->
        <view
            class="absolute -top-30rpx right-30rpx w-130rpx h-130rpx bg-gradient-to-b from-pink-100/30 to-transparent rounded-full filter blur-lg"></view>
        <view
            class="absolute -bottom-20rpx left-20rpx w-100rpx h-100rpx bg-gradient-to-t from-pink-100/20 to-transparent rounded-full filter blur-lg"></view>

        <view class="relative">
          <view
              class="p-24rpx border-b border-gray-100 flex items-center gap-12rpx text-32rpx font-semibold text-gray-800">
            <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-pink-300 to-pink-500 mr-8rpx"></view>
            <wd-icon name="user" size="32rpx" color="#ff9090"></wd-icon>
            <text>认证信息</text>
          </view>

          <view class="p-30rpx relative">
            <view class="flex justify-between items-center">
              <text class="text-28rpx text-gray-600 flex items-center">
                <view class="w-8rpx h-8rpx bg-pink-300/80 rounded-full mr-12rpx"></view>
                认证身份
              </text>
              <text class="text-28rpx text-gray-800 font-medium">{{ verifyInfo.role }}</text>
            </view>
            <view class="flex justify-between items-center space-y-24rpx-child">
              <text class="text-28rpx text-gray-600 flex items-center">
                <view class="w-8rpx h-8rpx bg-pink-300/80 rounded-full mr-12rpx"></view>
                认证时间
              </text>
              <text class="text-28rpx text-gray-800 font-medium">{{ verifyInfo.time }}</text>
            </view>
            <view class="flex justify-between items-center space-y-24rpx-child">
              <text class="text-28rpx text-gray-600 flex items-center">
                <view class="w-8rpx h-8rpx bg-pink-300/80 rounded-full mr-12rpx"></view>
                认证状态
              </text>
              <text
                  :class="[
                    'text-28rpx font-medium px-16rpx py-4rpx rounded-full', 
                    validationStore.verifyStatus === 'success' ? 'bg-green-100/60 text-green-600' : 
                    validationStore.verifyStatus === 'rejected' ? 'bg-red-100/60 text-red-600' : 
                    'bg-orange-100/60 text-orange-600'
                  ]"
              >
                {{ verifyInfo.status }}
              </text>
            </view>
            <view class="flex justify-between items-center space-y-24rpx-child">
              <text class="text-28rpx text-gray-600 flex items-center">
                <view class="w-8rpx h-8rpx bg-pink-300/80 rounded-full mr-12rpx"></view>
                认证手机
              </text>
              <text class="text-28rpx text-gray-800 font-medium">{{ validationStore.phone }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 权益说明 - 仅在验证成功时显示 -->
      <view
          v-if="validationStore.verifyStatus === 'success'"
          class="mx-32rpx mt-32rpx rounded-24rpx overflow-hidden bg-white/95 shadow-lg backdrop-blur-lg animate animate-slide-up delay-5 relative"
      >
        <!-- 卡片装饰 -->
        <view
            class="absolute -top-20rpx right-20rpx w-140rpx h-60rpx bg-gradient-to-br from-green-100/30 to-transparent rounded-full filter blur-lg"></view>

        <view class="relative">
          <view
              class="p-24rpx border-b border-gray-100 flex items-center gap-12rpx text-32rpx font-semibold text-gray-800">
            <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-green-300 to-green-500 mr-8rpx"></view>
            <wd-icon name="gift" size="32rpx" color="#ff9090"></wd-icon>
            <text>认证权益</text>
          </view>

          <view class="p-24rpx">
            <view class="flex items-center gap-16rpx stagger-item-1">
              <view
                  class="w-48rpx h-48rpx rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-200/50">
                <wd-icon name="check-outline" size="32rpx" color="#52c41a"></wd-icon>
              </view>
              <text class="text-28rpx text-gray-700">可以发布内容和参与讨论</text>
            </view>
            <view class="flex items-center gap-16rpx stagger-item-2 space-y-24rpx-child">
              <view
                  class="w-48rpx h-48rpx rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-200/50">
                <wd-icon name="check-outline" size="32rpx" color="#52c41a"></wd-icon>
              </view>
              <text class="text-28rpx text-gray-700">可以参与校园活动和社团</text>
            </view>
            <view class="flex items-center gap-16rpx stagger-item-3 space-y-24rpx-child">
              <view
                  class="w-48rpx h-48rpx rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 shadow-sm shadow-green-200/50">
                <wd-icon name="check-outline" size="32rpx" color="#52c41a"></wd-icon>
              </view>
              <text class="text-28rpx text-gray-700">享受认证用户专属服务</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="mt-auto p-32rpx animate animate-slide-up delay-6">
        <wd-button
            block
            :type="validationStore.verifyStatus === 'success' ? 'primary' : 'danger'"
            @click="handleComplete"
            custom-class="h-88rpx text-32rpx rounded-44rpx bg-gradient-to-r from-pink-400 to-pink-500 border-none transition-all duration-300 active-translate-y-2rpx shadow-lg shadow-pink-300/30"
        >{{ buttonText }}
        </wd-button>
      </view>

      <!-- 装饰元素 -->
      <view
          class="absolute top-30rpx left-40rpx w-50rpx h-50rpx border-8rpx border-pink-100/40 rounded-full animate-spin-slow opacity-60"></view>
      <view class="absolute bottom-150rpx right-30rpx w-40rpx h-40rpx bg-pink-100/40 rounded-full animate-float"></view>
    </view>
  </common>
</template>

<script setup>
import common from "./common.vue";
import {useRegisterStore} from "@/subpackages/pinia/register";
import {useRouter} from "uni-mini-router";
import {RegisterApi} from "@/subpackages/api/register";
import {useToast} from "@/composables/toast";

const validationStore = useRegisterStore()
const router = useRouter()
const toast = useToast()

// 页面加载时设置当前步骤
onMounted(() => {
  validationStore.setStage(3)
  
  // 为演示目的，可以在控制台添加一个切换状态的函数
  window._toggleStatus = (status, reason) => {
    validationStore.setVerifyStatus(status, reason)
    toast.success(`状态已切换为：${status}`)
  }
  
  console.log('=== 演示用状态切换方法 ===')
  console.log('可在控制台使用以下命令切换状态查看不同样式：')
  console.log('_toggleStatus("success") - 切换为成功状态')
  console.log('_toggleStatus("rejected", "证件照片不清晰") - 切换为驳回状态')
  console.log('_toggleStatus("pending") - 切换为等待审核状态')
})

// 状态相关的计算属性
const statusIcon = computed(() => {
  const icons = {
    success: 'check',
    rejected: 'close',
    pending: 'time'
  }
  return icons[validationStore.verifyStatus]
})

const statusTitle = computed(() => {
  const titles = {
    success: '验证成功',
    rejected: '验证未通过',
    pending: '等待审核'
  }
  return titles[validationStore.verifyStatus]
})

const statusDesc = computed(() => {
  const descs = {
    success: '您已完成身份认证，可以使用更多功能',
    rejected: '很抱歉，您的认证申请未通过审核',
    pending: '您的认证申请正在审核中，请耐心等待'
  }
  return descs[validationStore.verifyStatus]
})

const buttonText = computed(() => {
  const texts = {
    success: '开始体验',
    rejected: '重新认证',
    pending: '返回首页'
  }
  return texts[validationStore.verifyStatus]
})

// 认证信息
const verifyInfo = reactive({
  role: validationStore.selectedRole?.name || '学生',
  time: formatDate(validationStore.completedAt),
  status: computed(() => {
    const statusMap = {
      success: '已认证',
      rejected: '未通过',
      pending: '审核中'
    }
    return statusMap[validationStore.verifyStatus]
  })
})

// 日期格式化
function formatDate(dateString) {
  if (!dateString) return '未知时间'
  
  try {
    const date = new Date(dateString)
    return `${date.getFullYear()}-${padZero(date.getMonth() + 1)}-${padZero(date.getDate())} ${padZero(date.getHours())}:${padZero(date.getMinutes())}`
  } catch (e) {
    return '未知时间'
  }
}

function padZero(num) {
  return num < 10 ? '0' + num : num
}

// 处理按钮点击
const handleComplete = () => {
  if (validationStore.verifyStatus === 'rejected') {
    // 重新开始认证流程
    validationStore.resetProcess() // 重置整个注册流程
    router.replaceAll({
      name: 'validation-step1',
    })
  } else {
    // 成功提示
    toast.success('操作成功')
    
    // 返回首页
    setTimeout(() => {
      router.pushTab({
        name: 'home'
      })
    }, 500)
  }
}
</script>

<style>
/* 动画 */
.animate-bounce {
  animation: bounce 3s ease infinite;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-ripple {
  animation: ripple 2s ease-out infinite;
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
  animation: spin-slow 15s linear infinite;
}

/* 浮动动画 */
@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10rpx);
  }
}

.animate-float {
  animation: float 5s ease-in-out infinite;
}

/* 轻微脉冲动画 */
@keyframes pulse-subtle {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.animate-pulse-subtle {
  animation: pulse-subtle 2s ease-in-out infinite;
}

/* 延迟 */
.delay-0 {
  animation-delay: 0s;
}

.delay-500 {
  animation-delay: 0.5s;
}

.delay-1000 {
  animation-delay: 1s;
}

/* 激活状态 */
.active-translate-y-2rpx:active {
  transform: translateY(2rpx);
}

/* 尺寸辅助类 */
.h-30-percent {
  height: 30%;
}

.h-40-percent {
  height: 40%;
}

.w-70-percent {
  width: 70%;
}

.max-w-80-percent {
  max-width: 80%;
}

/* 边框辅助类 */
.border-15rpx {
  border-width: 15rpx;
}

/* 变换辅助类 */
.skew-y-12 {
  transform: skewY(12deg);
}

.-skew-y-12 {
  transform: skewY(-12deg);
}

/* 间隔辅助类 - 修复选择器 */
.space-y-24rpx-child {
  margin-top: 24rpx;
}

/* 滤镜辅助类 */
.filter {
  filter: blur(8rpx);
}

.blur-lg {
  filter: blur(16rpx);
}

/* 间隔出现 */
.stagger-item-1 {
  animation-delay: 0.1s;
}

.stagger-item-2 {
  animation-delay: 0.3s;
}

.stagger-item-3 {
  animation-delay: 0.5s;
}
</style>