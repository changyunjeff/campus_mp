<template>
  <common :step="3">
    <view class="flex flex-col h-full relative">
      <!-- 顶部说明文字 -->
      <view class="mb-48rpx animate animate-slide-down">
        <view
            class="text-40rpx font-semibold mb-16rpx bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent relative inline-block">
          完善联系信息
          <view
              class="absolute -bottom-4rpx left-0 right-0 h-3rpx bg-gradient-to-r from-blue-500/50 to-blue-300/30 rounded-full"></view>
        </view>
        <view class="text-28rpx text-gray-600 leading-normal">请填写您的联系方式，方便我们与您取得联系</view>
      </view>

      <!-- 联系方式表单 -->
      <view
          class="p-32rpx mb-48rpx bg-white/95 rounded-24rpx shadow-lg backdrop-blur-md animate animate-fade-in delay-100 relative overflow-hidden">
        <!-- 装饰元素 -->
        <view
            class="absolute right-20rpx top-20rpx w-80rpx h-80rpx bg-gradient-to-br from-indigo-100/30 to-transparent rounded-tr-3xl rounded-bl-3xl -rotate-15deg"></view>
        <view
            class="absolute left-70rpx bottom-30rpx w-140rpx h-40rpx bg-indigo-50/40 rounded-full blur-xl transform -rotate-15deg"></view>

        <view class="relative z-1">
          <!-- 手机号 -->
          <view class="mb-32rpx">
            <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
              <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-indigo-300 to-blue-500"></view>
              手机号码
              <text class="text-indigo-500 ml-4rpx">*</text>
            </view>

            <view class="mb-24rpx">
              <view class="relative group" :class="{'group-focused': phoneInputFocused}">
                <view
                    class="absolute left-16rpx top-1/2 transform -translate-y-1/2 w-6rpx h-6rpx bg-indigo-400 rounded-full opacity-60"></view>
                <view
                    class="flex items-center bg-gradient-to-r from-indigo-50/80 to-white/95 rounded-16rpx px-24rpx h-88rpx transition-all duration-300 focus-within:shadow-sm focus-within:shadow-indigo-200/50 border border-indigo-100/30 pl-40rpx">
                  <text class="text-28rpx text-gray-800 pr-24rpx border-r border-gray-200/50">+86</text>
                  <input
                      type="number"
                      v-model="formData.phone"
                      maxlength="11"
                      placeholder="请输入手机号码"
                      class="flex-1 h-full text-28rpx text-gray-800 pl-24rpx outline-none bg-transparent"
                      @focus="phoneInputFocused = true"
                      @blur="phoneInputFocused = false"
                  />
                  <view
                      v-if="formData.phone"
                      class="p-16rpx -m-16rpx transition-opacity duration-200 active-opacity-70"
                  >
                    <wd-icon @tap.stop="formData.phone = ''" name="close" size="32rpx" color="#999"></wd-icon>
                  </view>
                </view>
                <view
                    class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx bg-indigo-100/50 rounded-full opacity-0 scale-0 group-focus-within-opacity-100 group-focus-within-scale-100 transition-all duration-300"></view>
              </view>
            </view>

            <!-- 验证码输入 -->
            <view class="animate animate-fade-in delay-2">
              <view class="text-32rpx font-medium text-gray-700 mb-16rpx flex items-center">
                <view class="w-8rpx h-32rpx bg-blue-400 rounded-4rpx mr-16rpx"></view>
                验证码
              </view>
              <view class="flex items-center gap-24rpx">
                <view class="relative group flex-1">
                  <input
                      type="number"
                      v-model="formData.verifyCode"
                      placeholder="请输入验证码"
                      maxlength="6"
                      class="w-full h-88rpx bg-blue-50/50 rounded-16rpx px-24rpx text-28rpx text-gray-800 transition-all duration-300 focus:bg-blue-100/20 focus:shadow-sm focus:shadow-blue-200/50"
                  />
                  <view class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx rounded-full bg-blue-100/80 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></view>
                </view>
                <button 
                    @tap="handleSendCode" 
                    :disabled="countdown > 0"
                    class="h-88rpx px-32rpx bg-blue-100/80 text-blue-500 rounded-16rpx border-none text-28rpx transition-all duration-300 hover:bg-blue-200/50 active:bg-blue-300/30 disabled:bg-gray-100 disabled:text-gray-400 disabled:opacity-80"
                >
                  {{ countdown > 0 ? `${countdown}秒后重新获取` : '获取验证码' }}
                </button>
              </view>
            </view>
          </view>

          <!-- 邮箱 -->
          <view class="mb-32rpx">
            <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
              <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-indigo-300 to-blue-500"></view>
              邮箱地址
            </view>

            <view class="relative group" :class="{'group-focused': emailInputFocused}">
              <view
                  class="absolute left-16rpx top-1/2 transform -translate-y-1/2 w-6rpx h-6rpx bg-indigo-400 rounded-full opacity-60"></view>
              <input
                  type="text"
                  v-model="formData.email"
                  placeholder="请输入邮箱地址"
                  class="w-full h-88rpx bg-gradient-to-r from-indigo-50/80 to-white/95 rounded-16rpx pl-40rpx pr-24rpx text-28rpx text-gray-800 transition-all duration-300 focus:shadow-sm focus:shadow-indigo-200/50 border border-indigo-100/30 outline-none"
                  @focus="emailInputFocused = true"
                  @blur="emailInputFocused = false"
              />
              <view
                  class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx bg-indigo-100/50 rounded-full opacity-0 scale-0 group-focus-within-opacity-100 group-focus-within-scale-100 transition-all duration-300"></view>
            </view>
          </view>

          <!-- 昵称 -->
          <view class="">
            <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
              <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-indigo-300 to-blue-500"></view>
              昵称
              <text class="text-24rpx font-normal text-gray-400 ml-8rpx">(选填)</text>
            </view>

            <view class="relative group" :class="{'group-focused': nicknameInputFocused}">
              <view
                  class="absolute left-16rpx top-1/2 transform -translate-y-1/2 w-6rpx h-6rpx bg-indigo-400 rounded-full opacity-60"></view>
              <input
                  type="text"
                  v-model="formData.nickname"
                  placeholder="请输入昵称，不填将自动生成"
                  class="w-full h-88rpx bg-gradient-to-r from-indigo-50/80 to-white/95 rounded-16rpx pl-40rpx pr-24rpx text-28rpx text-gray-800 transition-all duration-300 focus:shadow-sm focus:shadow-indigo-200/50 border border-indigo-100/30 outline-none"
                  @focus="nicknameInputFocused = true"
                  @blur="nicknameInputFocused = false"
              />
              <view
                  class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx bg-indigo-100/50 rounded-full opacity-0 scale-0 group-focus-within-opacity-100 group-focus-within-scale-100 transition-all duration-300"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- 隐私提示 -->
      <view
          class="p-32rpx mb-48rpx bg-gradient-to-tr from-indigo-50/90 to-white/80 rounded-24rpx animate animate-fade-in delay-200 relative overflow-hidden">
        <!-- 装饰元素 -->
        <view class="absolute -right-20rpx -top-20rpx w-120rpx h-120rpx bg-indigo-100/30 rounded-full blur-lg"></view>
        <view class="absolute left-40rpx bottom-30rpx w-80rpx h-80rpx bg-indigo-100/40 rounded-full blur-md"></view>

        <view class="relative">
          <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
            <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-indigo-300 to-blue-500"></view>
            隐私协议
          </view>

          <view class="bg-white/60 p-24rpx rounded-16rpx shadow-sm mb-24rpx">
            <scroll-view scroll-y class="h-220rpx text-26rpx text-gray-700 leading-normal">
              <view class="pb-16rpx text-28rpx text-gray-800 font-medium">《用户隐私政策》</view>
              <view class="mb-16rpx">
                欢迎使用我们的服务！我们非常重视您的个人隐私和数据安全，本协议旨在向您说明我们如何收集、使用和保护您的个人信息。
              </view>
              <view class="mb-16rpx">
                我们会收集您在注册和使用过程中提供的个人信息，包括但不限于手机号码、邮箱等。这些信息将用于身份验证和服务提供，不会在未经您授权的情况下向第三方分享您的个人信息。
              </view>
            </scroll-view>
          </view>

          <view
              class="flex items-center"
              @tap="formData.agreement = !formData.agreement"
          >
            <view
                class="w-36rpx h-36rpx rounded-full border-2 border-indigo-300 flex items-center justify-center transition-all duration-300 mr-16rpx"
                :class="formData.agreement ? 'bg-indigo-400 border-indigo-400' : 'bg-white'"
            >
              <view
                  class="w-18rpx h-18rpx rounded-full bg-white transform transition-all duration-300"
                  :class="formData.agreement ? 'scale-100' : 'scale-0'"
              ></view>
            </view>
            <text class="text-28rpx text-gray-700">我已阅读并同意《用户隐私政策》</text>
          </view>
        </view>
      </view>

      <!-- 底部按钮 -->
      <view class="mt-auto py-32rpx animate animate-slide-up delay-300">
        <wd-button
            block
            type="primary"
            :disabled="!canSubmit"
            :loading="isSubmitting"
            @tap="handleSubmit"
            custom-class="h-88rpx text-32rpx rounded-44rpx bg-gradient-to-r from-blue-400 to-blue-500 border-none transition-all duration-300 active-translate-y-2rpx disabled:opacity-60 disabled:bg-gray-100 shadow-md shadow-indigo-300/30"
        >提交注册
        </wd-button>
      </view>

      <!-- 装饰元素 -->
      <view
          class="absolute top-40rpx right-20rpx w-50rpx h-50rpx border-8rpx border-indigo-100/40 rounded-full animate-pulse-slow"></view>
      <view
          class="absolute bottom-200rpx left-25rpx w-30rpx h-30rpx bg-indigo-100/30 rounded-full animate-float"></view>
    </view>
  </common>
</template>

<script setup>
import common from "./common.vue"
import {useRegisterStore} from "@/subpackages/pinia/register";
import {RegisterApi} from "@/subpackages/api/register"
import {SMSApi} from "@/subpackages/api/sms";
import {useToast} from "@/composables/toast";
import {useRouter} from "uni-mini-router";
import events from "@/utils/events";

const validationStore = useRegisterStore()
const toast = useToast()
const router = useRouter()

// 页面加载时设置当前步骤并预填充数据
onMounted(() => {
  validationStore.setStage(2)
  
  // 从store中预填充表单数据
  formData.phone = validationStore.phone || ''
  formData.email = validationStore.email || ''
  formData.nickname = validationStore.nickname || ''
  
  console.log('step3页面加载，预填充数据:', {
    formData: formData,
    storeData: {
      phone: validationStore.phone,
      email: validationStore.email,
      nickname: validationStore.nickname
    }
  })
})

// 表单数据
const formData = reactive({
  phone: '',
  verifyCode: '',
  email: '',
  nickname: '',
  agreement: false
})

// 倒计时
const countdown = ref(0)
let timer = null

// 是否可以发送验证码
const canSendCode = computed(() => {
  return /^1[3-9]\d{9}$/.test(formData.phone)
})

// 是否可以提交
const canSubmit = computed(() => {
  return formData.phone &&
      formData.verifyCode &&
      (!formData.email || /^[\w-]+(\.[\w-]+)*@[\w-]+(\.[\w-]+)+$/.test(formData.email)) &&
      formData.agreement
})

// 表单提交状态
const isSubmitting = ref(false)

// 输入框焦点状态
const phoneInputFocused = ref(false)
const codeInputFocused = ref(false)
const emailInputFocused = ref(false)
const nicknameInputFocused = ref(false)

// 发送验证码
const handleSendCode = async () => {
  if (!canSendCode.value || countdown.value > 0) return

  countdown.value = 60
  timer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(timer)
    }
  }, 1000)

  // 发送验证码
  try{
    const res = await SMSApi.getSMSCode(formData.phone)
    toast.success('验证码发送成功，请注意查收')
  } catch(err) {
    toast.error(err.message || '验证码发送失败')
    clearInterval(timer)
    countdown.value = 0
  }
}

// 组件卸载时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 提交表单
const handleSubmit = async () => {
  if (!canSubmit.value) return

  try {
    isSubmitting.value = true
    events.emit('showUpload', 0)
    events.emit('updateUpload', 30)
    
    // 调用真实API提交第三步
    await RegisterApi.submitStep3({
      phone: formData.phone,
      sms_code: formData.verifyCode,
      email_address: formData.email,
      nick_name: formData.nickname
    })
    
    // 更新用户信息到store
    validationStore.updateUserInfo({
      phone: formData.phone,
      email: formData.email,
      nickname: formData.nickname
    })

    // 设置注册流程进度
    validationStore.setStage(3) // 完成第三步
    validationStore.setVerifyStatus('pending') // 设置为等待审核状态
    
    // 模拟上传完成
    events.emit('updateUpload', 100)
    
    setTimeout(() => {
      events.emit('hideUpload')
      
      // 跳转到完成页面
      router.push({
        name: 'validation-finish'
      })
    }, 500)
  } catch (err) {
    console.error('提交失败:', err)
    toast.error(err.message || '提交失败，请重试')
    events.emit('hideUpload')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>

/* 渐变文字 */
.gradient-text {
  background: linear-gradient(to right, #6366f1, #3b82f6);
  -webkit-background-clip: text;
  color: transparent;
}

/* 激活状态 */
.active-scale-95:active {
  transform: scale(0.95);
}

.active-opacity-70:active {
  opacity: 0.7;
}

.active-translate-y-2rpx:active {
  transform: translateY(2rpx);
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

/* 脉冲动画 */
@keyframes pulse-slow {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}

/* 滤镜样式 */
.blur-md {
  filter: blur(12rpx);
}

.blur-xl {
  filter: blur(24rpx);
}

/* 聚焦状态组合 - 修复 */
.group-focus-within-opacity-100 {
  opacity: 0;
}

.group-focus-within-scale-100 {
  transform: scale(0);
}

/* 组合样式辅助类 - 使用js控制 */
.group-focused .group-focus-within-opacity-100 {
  opacity: 1;
}

.group-focused .group-focus-within-scale-100 {
  transform: scale(1);
}

/* 阻止按钮被禁用时的背景变灰 */
:deep(.wd-button--disabled) {
  background: #f5f5f5 !important;
}
</style>
