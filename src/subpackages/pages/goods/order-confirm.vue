<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 商品ID
const goodsId = ref(null)

// 加载状态
const loading = ref(true)

// 未支付订单信息
const unpaidOrder = ref(null)
const countdownTime = ref(0)
const countdownTimer = ref(null)
const formattedCountdown = computed(() => {
  if (countdownTime.value <= 0) return '00:00'
  const minutes = Math.floor(countdownTime.value / 60)
  const seconds = countdownTime.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

// 用户地址
const address = reactive({
  id: 1,
  name: '刘长运',
  phone: '180****6820',
  address: '庄市大道8号同心苑小区',
  isDefault: true
})

// 商品数据
const goods = reactive({
  id: 1,
  name: '苹果 iPhone 13 Pro 银色 256G 其他版本',
  price: 3899,
  originalPrice: 4399,
  image: 'https://picsum.photos/600/600?random=1',
  isRefundable: false,
  seller: {
    id: 101,
    nickname: '天宇数码优选',
    avatar: 'https://picsum.photos/100/100?random=1'
  }
})

// 配送方式
const deliveryOptions = reactive([
  { id: 1, name: '快递', price: 0, selected: true },
  { id: 2, name: '同城配送', price: 10, selected: false },
  { id: 3, name: '自提', price: 0, selected: false }
])

// 优惠券
const coupon = ref(null)

// 红包
const redPacket = ref(null)

// 获取已选择的配送方式
const selectedDelivery = computed(() => {
  return deliveryOptions.find(option => option.selected)
})

// 订单金额计算
const orderAmount = computed(() => {
  const subtotal = goods.price
  const deliveryFee = selectedDelivery.value ? selectedDelivery.value.price : 0
  const discountAmount = coupon.value ? coupon.value.amount : 0
  const redPacketAmount = redPacket.value ? redPacket.value.amount : 0
  
  return {
    subtotal,
    deliveryFee,
    discountAmount,
    redPacketAmount,
    total: subtotal + deliveryFee - discountAmount - redPacketAmount
  }
})

// 选择配送方式
const selectDelivery = (id) => {
  deliveryOptions.forEach(option => {
    option.selected = option.id === id
  })
}

// 选择优惠券
const selectCoupon = () => {
  uni.showToast({
    title: '暂无可用优惠券',
    icon: 'none'
  })
}

// 选择红包
const selectRedPacket = () => {
  uni.showToast({
    title: '暂无可用红包',
    icon: 'none'
  })
}

// 前往选择地址页面
const goToAddress = () => {
  router.push({
    name: 'addresses',
  })
}

// 前往支付页面
const goToPay = (orderId, amount) => {
  router.push({
    name: 'pay_confirm',
    params: {
      orderId: orderId,
      amount: amount
    }
  })
}

// 提交订单
const submitOrder = () => {
  uni.showLoading({
    title: '提交中...'
  })
  
  // 模拟提交订单
  setTimeout(() => {
    uni.hideLoading()
    uni.showModal({
      title: '订单提交成功',
      content: '是否前往支付？',
      success: (res) => {
        if (res.confirm) {
          // 前往支付页面
          router.push({
            name: 'pay_confirm',
            params: {
              orderId: Math.floor(Math.random() * 1000000),
              amount: orderAmount.total
            }
          })
        } else {
          // 返回订单列表
          router.push({
            name: 'order_list'
          })
        }
      }
    })
  }, 1500)
}

// 初始化倒计时
const startCountdown = (seconds) => {
  clearInterval(countdownTimer.value)
  countdownTime.value = seconds
  
  countdownTimer.value = setInterval(() => {
    if (countdownTime.value <= 0) {
      clearInterval(countdownTimer.value)
      // 订单超时
      unpaidOrder.value = null
      return
    }
    countdownTime.value -= 1
  }, 1000)
}

// 模拟检查是否有未支付订单
const checkUnpaidOrders = () => {
  // 50%概率出现未支付订单，实际项目中应从后端获取
  if (Math.random() > 0.5) {
    unpaidOrder.value = {
      id: Math.floor(Math.random() * 1000000),
      amount: 3899,
      createTime: new Date(),
      expiryTime: 15 * 60 // 15分钟倒计时
    }
    
    // 开始倒计时
    startCountdown(unpaidOrder.value.expiryTime)
  }
}

onLoad((options) => {
  goodsId.value = options.id
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
    // 检查是否有未支付订单
    checkUnpaidOrders()
  }, 500)
})

onUnload(() => {
  // 页面卸载时清除定时器
  clearInterval(countdownTimer.value)
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">确认订单</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>

      <template v-else>
        <!-- 未支付订单提示 -->
        <view v-if="unpaidOrder" class="bg-white mb-20rpx animate-slide-down">
          <view class="p-30rpx border-b border-#FFE7E7">
            <view class="flex justify-between items-center">
              <view class="flex-1">
                <view class="flex items-center">
                  <WdIcon name="warning" size="36rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
                  <text class="text-30rpx font-medium text-#333">您有未支付的订单</text>
                </view>
                <view class="mt-12rpx text-26rpx text-gray-600 ml-46rpx">
                  订单将在 <text class="text-#f43f5e font-medium">{{ formattedCountdown }}</text> 后自动关闭
                </view>
              </view>
              <view 
                class="px-30rpx py-12rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-sm"
                @tap="goToPay(unpaidOrder.id, unpaidOrder.amount)"
              >
                <text class="text-26rpx text-white">去支付</text>
              </view>
            </view>
          </view>
          <view class="h-8rpx relative overflow-hidden">
            <view class="absolute top-0 left-0 right-0 h-8rpx">
              <view class="flex w-full">
                <view v-for="i in 40" :key="i" class="h-8rpx flex-1" :class="i % 2 === 0 ? 'bg-#FFE7E7' : 'bg-white'"></view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 收货地址 -->
        <view class="bg-white mt-20rpx rounded-16rpx mx-30rpx">
          <view class="p-30rpx flex items-center justify-between" @tap="goToAddress">
            <!-- 地址信息 -->
            <view class="flex-1">
              <view v-if="address" class="animate-fade-in">
                <view class="flex items-center mb-10rpx">
                  <WdIcon name="location" size="36rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
                  <text class="text-30rpx font-medium">{{ address.name }}</text>
                  <text class="text-30rpx ml-20rpx">{{ address.phone }}</text>
                </view>
                <view class="text-28rpx text-gray-600 pl-46rpx">{{ address.address }}</view>
              </view>
              <view v-else class="flex items-center">
                <WdIcon name="plus-circle" size="36rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
                <text class="text-30rpx text-gray-600">添加收货地址</text>
              </view>
            </view>
            
            <!-- 箭头 -->
            <view class="ml-20rpx">
              <WdIcon name="chevron-right" size="36rpx" custom-style="color:#ccc"/>
            </view>
          </view>
          
          <!-- 地址底部装饰 -->
          <view class="h-8rpx relative overflow-hidden">
            <view class="absolute top-0 left-0 right-0 h-8rpx">
              <view class="flex w-full">
                <view v-for="i in 40" :key="i" class="h-8rpx flex-1 alternate-color"></view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 商品信息 -->
        <view class="bg-white mt-20rpx rounded-16rpx mx-30rpx overflow-hidden">
          <!-- 店铺信息 -->
          <view class="px-30rpx py-20rpx flex items-center border-b border-gray-100">
            <image :src="goods.seller.avatar" class="w-40rpx h-40rpx rounded-full mr-15rpx"/>
            <text class="text-28rpx text-#333 font-medium">{{ goods.seller.nickname }}</text>
            <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-10rpx"/>
          </view>
          
          <!-- 商品卡片 -->
          <view class="p-30rpx flex">
            <image :src="goods.image" class="w-160rpx h-160rpx rounded-12rpx object-cover" mode="aspectFill"/>
            <view class="flex-1 ml-20rpx flex flex-col justify-between">
              <view>
                <view class="text-28rpx text-#333 line-clamp-2">{{ goods.name }}</view>
                <view class="mt-10rpx text-24rpx text-gray-500">
                  <text v-if="!goods.isRefundable" class="py-2rpx px-8rpx bg-red-50 text-red-500 rounded-4rpx mr-10rpx">不支持无理由退货</text>
                </view>
              </view>
              <view class="flex justify-between items-end">
                <view>
                  <text class="text-32rpx text-#f43f5e font-bold">¥{{ goods.price }}</text>
                  <text class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ goods.originalPrice }}</text>
                </view>
                <text class="text-26rpx text-gray-500">x1</text>
              </view>
            </view>
          </view>
          
          <!-- 配送方式 -->
          <view class="px-30rpx py-25rpx border-t border-gray-100">
            <view class="flex justify-between items-center">
              <text class="text-28rpx text-gray-700">配送方式</text>
              <view class="flex items-center">
                <text class="text-26rpx text-#333">{{ selectedDelivery.name }}</text>
                <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-10rpx"/>
              </view>
            </view>
          </view>
          
          <!-- 优惠券 -->
<!--          <view class="px-30rpx py-25rpx border-t border-gray-100" @tap="selectCoupon">-->
<!--            <view class="flex justify-between items-center">-->
<!--              <text class="text-28rpx text-gray-700">优惠券</text>-->
<!--              <view class="flex items-center">-->
<!--                <text class="text-26rpx text-gray-500">暂无可用</text>-->
<!--                <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-10rpx"/>-->
<!--              </view>-->
<!--            </view>-->
<!--          </view>-->
          
          <!-- 红包 -->
          <view class="px-30rpx py-25rpx border-t border-gray-100" @tap="selectRedPacket">
            <view class="flex justify-between items-center">
              <text class="text-28rpx text-gray-700">红包</text>
              <view class="flex items-center">
                <text class="text-26rpx text-gray-500">暂无可用红包</text>
                <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-10rpx"/>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 用户须知 -->
        <view class="mt-20rpx mx-30rpx">
          <view class="text-28rpx font-medium text-#333 mb-15rpx">用户须知</view>
          <view class="text-26rpx text-gray-500 pl-10rpx">
            <view class="mb-10rpx">1、自由市场商品，发货后不支持无理由退货</view>
            <view class="mb-10rpx">2、收到包裹时，请仔细验收并拍摄完整开箱视频（商品有问题时，这是强有力的凭证）</view>
            <view>3、不要轻信操作【确认收货】后才能给售后、返现、补差款等承诺</view>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 底部结算栏 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-100">
      <view class="h-120rpx px-30rpx flex items-center justify-between">
        <view class="flex items-baseline">
          <text class="text-26rpx text-gray-700">应付款：</text>
          <text class="text-36rpx text-#f43f5e font-bold">¥{{ orderAmount.total }}</text>
        </view>
        
        <view @tap="submitOrder" class="bg-gradient-to-r from-#f43f5e to-#ff7676 h-80rpx px-50rpx rounded-full flex items-center justify-center shadow-md shadow-pink-200 transform transition-all duration-300 active-scale active-shadow">
          <text class="text-white text-32rpx font-medium">确认购买</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style scoped>
.alternate-color:nth-child(odd) {
  background-color: #f43f5e;
}
.alternate-color:nth-child(even) {
  background-color: #ffffff;
}

/* 动画效果 */
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 激活按钮时的动画效果 */
.active-scale:active {
  transform: scale(0.98);
}

.active-shadow:active {
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}
</style>
