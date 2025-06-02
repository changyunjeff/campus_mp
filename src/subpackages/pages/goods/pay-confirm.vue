<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { getAvailablePaymentMethods, getDefaultPaymentMethod } from './payment.config'

const router = useRouter()

// 订单ID和金额
const orderId = ref('')
const orderAmount = ref(0)

// 倒计时相关
const countdownTime = ref(900) // 15分钟 = 900秒
const countdownTimer = ref(null)
const formattedCountdown = computed(() => {
  const minutes = Math.floor(countdownTime.value / 60)
  const seconds = countdownTime.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 支付方式
const paymentMethods = ref([])
const selectedPaymentId = ref('')

// 初始化倒计时
const startCountdown = () => {
  clearInterval(countdownTimer.value)
  
  countdownTimer.value = setInterval(() => {
    if (countdownTime.value <= 0) {
      clearInterval(countdownTimer.value)
      handleOrderTimeout()
      return
    }
    countdownTime.value -= 1
  }, 1000)
}

// 处理订单超时
const handleOrderTimeout = () => {
  uni.showModal({
    title: '订单已超时',
    content: '支付已超时，请重新下单',
    showCancel: false,
    success: () => {
      router.back()
    }
  })
}

// 选择支付方式
const selectPayment = (id) => {
  selectedPaymentId.value = id
}

// 确认支付
const confirmPayment = () => {
  if (!selectedPaymentId.value) {
    uni.showToast({
      title: '请选择支付方式',
      icon: 'none'
    })
    return
  }
  
  uni.showLoading({
    title: '正在支付...'
  })
  
  // 模拟支付过程
  setTimeout(() => {
    uni.hideLoading()
    
    // 模拟支付结果，真实项目中应当接入真实支付API
    const isPaymentSuccess = Math.random() > 0.2 // 模拟80%成功率
    
    if (isPaymentSuccess) {
      uni.showModal({
        title: '支付成功',
        content: '订单支付成功，感谢您的购买！',
        showCancel: false,
        success: () => {
          // 支付成功后跳转到订单详情
          router.push({
            name: 'order_detail',
            query: {
              orderId: orderId.value
            }
          })
        }
      })
    } else {
      uni.showModal({
        title: '支付失败',
        content: '订单支付失败，请重试或选择其他支付方式',
        showCancel: false
      })
    }
  }, 1500)
}

// 返回按钮
const handleBack = () => {
  uni.showModal({
    title: '确认放弃支付',
    content: '订单将在倒计时结束后自动关闭，是否放弃支付？',
    success: (res) => {
      if (res.confirm) {
        router.back()
      }
    }
  })
}

onLoad((options) => {
  // 获取订单ID和金额
  orderId.value = options.orderId || '未知订单'
  orderAmount.value = parseFloat(options.amount) || 1538.00
  
  // 初始化支付方式
  paymentMethods.value = getAvailablePaymentMethods()
  
  // 设置默认支付方式
  const defaultMethod = getDefaultPaymentMethod()
  if (defaultMethod) {
    selectedPaymentId.value = defaultMethod.id
  }
  
  // 开始倒计时
  startCountdown()
})

onUnload(() => {
  // 页面卸载时清除定时器
  clearInterval(countdownTimer.value)
})

// 获取当前选中的支付方式
const selectedPayment = computed(() => {
  return paymentMethods.value.find(method => method.id === selectedPaymentId.value) || null
})
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="handleBack">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">收银台</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 顶部倒计时提示 -->
      <view class="bg-white py-20rpx">
        <view class="flex items-center justify-center text-26rpx text-gray-600">
          <text>剩余支付时间</text>
          <text class="mx-10rpx text-#f43f5e">{{ formattedCountdown }}</text>
          <text>，超时订单将自动关闭</text>
        </view>
      </view>
      
      <!-- 金额显示 -->
      <view class="bg-white py-30rpx flex flex-col items-center">
        <text class="text-28rpx text-gray-600 mb-10rpx">剩余支付时间 {{ formattedCountdown }}</text>
        <view class="flex items-baseline">
          <text class="text-32rpx text-gray-800">¥</text>
          <text class="text-60rpx font-bold text-gray-800">{{ orderAmount.toFixed(2) }}</text>
        </view>
      </view>
      
      <!-- 支付方式列表 -->
      <view class="mt-20rpx bg-white rounded-12rpx mx-30rpx overflow-hidden">
        <view class="px-30rpx py-25rpx border-b border-gray-100">
          <text class="text-30rpx font-medium text-#333">选择支付方式</text>
        </view>
        
        <view class="payment-methods">
          <view 
            v-for="method in paymentMethods" 
            :key="method.id"
            class="payment-method-item px-30rpx py-25rpx flex items-center border-b border-gray-100 last:border-none active:bg-gray-50 transition-colors duration-200"
            @tap="selectPayment(method.id)"
          >
            <!-- 支付方式图标 -->
            <view class="payment-icon flex-shrink-0 mr-20rpx" :style="`color: ${method.color}`">
              <WdIcon 
                :name="method.icon" 
                size="52rpx" 
                :custom-style="`color: ${method.color}`"
              />
            </view>
            
            <!-- 支付方式信息 -->
            <view class="flex-1">
              <view class="flex items-center">
                <text class="text-30rpx font-medium text-#333">{{ method.name }}</text>
                <view v-if="method.badge" class="ml-15rpx px-10rpx py-2rpx rounded text-22rpx text-#f43f5e bg-red-50">
                  {{ method.badge }}
                </view>
              </view>
              <text class="text-24rpx text-gray-500 mt-6rpx">{{ method.desc }}</text>
            </view>
            
            <!-- 选择标记 -->
            <view class="ml-20rpx flex items-center justify-center">
              <view 
                class="w-40rpx h-40rpx rounded-full border-2 flex items-center justify-center"
                :class="selectedPaymentId === method.id ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'"
              >
                <WdIcon 
                  v-if="selectedPaymentId === method.id" 
                  name="check" 
                  size="28rpx" 
                  color="#fff" 
                />
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部确认支付按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50">
      <view class="h-140rpx px-30rpx flex items-center justify-between">
        <view class="flex items-center">
          <text class="text-28rpx text-gray-700">支付金额:</text>
          <text class="text-36rpx text-#f43f5e font-bold ml-10rpx">¥{{ orderAmount.toFixed(2) }}</text>
        </view>
        
        <view 
          class="bg-gradient-to-r from-#f43f5e to-#ff7676 h-90rpx px-50rpx rounded-full flex items-center justify-center shadow-md shadow-pink-200 transition-all duration-300 active:scale-98 active:shadow-sm"
          @tap="confirmPayment"
        >
          <text class="text-white text-32rpx font-medium">
            {{ selectedPayment ? `${selectedPayment.name} 付款` : '确认付款' }}
          </text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style>
/* 动画和交互效果 */
.payment-method-item {
  position: relative;
  overflow: hidden;
}

.payment-method-item::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.03);
  border-radius: 50%;
  transform: scale(0) translate(-50%, -50%);
  transform-origin: center;
  opacity: 0;
  transition: transform 0.4s ease-out, opacity 0.4s ease-out;
}

.payment-method-item:active::after {
  transform: scale(2.5) translate(-50%, -50%);
  opacity: 1;
}

.payment-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
}
</style>
