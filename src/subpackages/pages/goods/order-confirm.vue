<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import {useToast} from '@/composables/toast'
import {GoodsApi} from "@/api/goods";

const router = useRouter()
const toast = useToast()

// 商品ID
const goodsId = ref(null)

// 加载状态
const loading = ref(false)

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
  region: '浙江省 宁波市',
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
  { 
    id: 1, 
    name: '快递配送', 
    price: 0, 
    selected: true,
    icon: 'truck',
    description: '快递到付',
    detail: '卖家发快递，买家收件时支付快递费',
    priceNote: '快递费到付，由买家承担'
  },
  { 
    id: 2, 
    name: '校园内自提', 
    price: 0, 
    selected: false,
    icon: 'school',
    description: '校园内面交',
    detail: '与卖家协商校园内自提地点，当面交易',
    needCommunication: true,
    communicationNote: '请与卖家协商具体自提地点和时间'
  }
])

// 配送方式选择弹窗
const showDeliveryModal = ref(false)

// 优惠券
const coupon = ref(null)

// 红包
const redPacket = ref(null)

// 买家备注
const buyerRemark = ref('')

// 获取已选择的配送方式
const selectedDelivery = computed(() => {
  return deliveryOptions.find(option => option.selected)
})

// 检查是否满足提交条件
const hasAddress = computed(() => {
  // 校园内自提时不需要收货地址，直接返回true
  if (selectedDelivery.value && selectedDelivery.value.id === 2) {
    return true
  }
  // 快递配送需要收货地址
  return address.id && address.name && address.phone
})

// 订单金额计算
const orderAmount = computed(() => {
  const subtotal = goods.price
  // 校园闲置平台不收取配送费，快递费到付
  const deliveryFee = 0
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

// 打开配送方式选择弹窗
const openDeliveryModal = () => {
  showDeliveryModal.value = true
}

// 选择配送方式
const selectDelivery = (id) => {
  const selectedOption = deliveryOptions.find(option => option.id === id)
  
  deliveryOptions.forEach(option => {
    option.selected = option.id === id
  })
  
  // 显示更具体的提示信息
  if (selectedOption) {
    toast.show(`已选择${selectedOption.name}`)
    
    // 校园内自提需要与卖家沟通
    if (id === 2) {
      setTimeout(() => {
        uni.showModal({
          title: '温馨提示',
          content: '请主动联系卖家协商校园内自提的具体地点和时间',
          showCancel: false,
          confirmText: '我知道了'
        })
        closeDeliveryModal()
      }, 800)
    } else {
      // 快递配送，自动关闭弹窗
      setTimeout(() => {
        closeDeliveryModal()
      }, 800)
    }
  }
}

// 获取卖家信息（用于校园内自提时的联系）
const getSellerContact = computed(() => {
  return {
    id: goods.seller.id,
    name: goods.seller.nickname,
    avatar: goods.seller.avatar
  }
})

// 关闭配送方式弹窗
const closeDeliveryModal = () => {
  showDeliveryModal.value = false
}



// 确认配送方式选择
const confirmDelivery = () => {
  const selected = selectedDelivery.value
  if (!selected) {
    toast.show('请选择配送方式')
    return
  }
  
  closeDeliveryModal()
  toast.show('配送方式设置成功')
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
  // 将回调函数存储到全局变量中
  const app = getApp()
  app.globalData = app.globalData || {}
  app.globalData.addressSelectCallback = (selectedAddress) => {
    // 更新地址信息
    console.debug('开始执行选择地址回调函数：', selectedAddress)
    Object.assign(address, {
      id: selectedAddress.id,
      name: selectedAddress.name,
      phone: selectedAddress.phone,
      region: selectedAddress.region,
      address: selectedAddress.address,
      isDefault: selectedAddress.isDefault
    })
    
    toast.show('地址选择成功')
  }
  
  router.push({
    name: 'goods_addresses',
    params: {
      from: "order",
    }
  })
}

// 前往支付页面
const goToPay = (orderId, amount) => {
  router.push({
    name: 'goods_pay_confirm',
    params: {
      orderId: orderId,
      orderNumber: unpaidOrder.value?.order_number || '',
      amount: amount
    }
  })
}

// 提交订单
const submitOrder = () => {
  // 检查配送方式
  const delivery = selectedDelivery.value
  if (!delivery) {
    toast.show('请选择配送方式')
    return
  }
  
  // 检查收货地址（快递配送需要收货地址）
  if (delivery.id === 1 && !address.id) {
    uni.showModal({
      title: '提示',
      content: '请先选择收货地址',
      showCancel: false,
      success: () => {
        goToAddress()
      }
    })
    return
  }
  
  // 校园内自提确认提示
  if (delivery.id === 2) {
    uni.showModal({
      title: '确认提交',
      content: '请确认您已与卖家协商好自提地点和时间',
      success: (res) => {
        if (res.confirm) {
          proceedSubmitOrder()
        }
      }
    })
    return
  }
  
  // 快递配送直接提交
  proceedSubmitOrder()
}

// 实际提交订单的函数
const proceedSubmitOrder = async () => {
  if (loading.value) return

  try {
    loading.value = true
    uni.showLoading({
      title: '提交中...'
    })

    const delivery = selectedDelivery.value
    
    // 构建订单数据，匹配API接口要求
    const orderParams = {
      goods_id: goods.id,
      goods_title: goods.name,
      price: goods.price,
      seller_id: goods.seller.id,
      deliver_method: delivery.id === 1 ? 1 : 2, // 1:快递, 2:自提
      buyer_remark: buyerRemark.value.trim(), // 买家备注
    }

    // 添加收货地址信息（快递配送时需要）
    if (delivery.id === 1 && address.id) {
      orderParams.address_info = {
        user_name: address.name,
        phone: address.phone,
        region: address.region,
        address: address.address
      }
    } else if (delivery.id === 2) {
      // 自提时的地址信息（可以是空或默认值）
      orderParams.address_info = {
        user_name: address.name || '自提',
        phone: address.phone || '',
        region: '校园内',
        address: '校园内自提'
      }
    }
    
    console.debug('提交订单参数:', orderParams)
    
    // 调用创建订单API
    const result = await GoodsApi.createOrder(orderParams)
    
    console.debug('订单创建成功:', result)
    
    uni.hideLoading()
    
    // 订单创建成功，显示支付选择
    uni.showModal({
      title: '订单提交成功',
      content: '是否立即支付？',
      confirmText: '立即支付',
      cancelText: '稍后支付',
      success: (res) => {
        if (res.confirm) {
          // 前往支付页面
          router.push({
            name: 'goods_pay_confirm',
            params: {
              orderId: result.id,
              orderNumber: result.order_number,
              amount: result.pay_amount
            }
          })
        } else {
          // 返回订单列表或商品页面
          uni.showToast({
            title: '可在订单中心查看',
            icon: 'success',
            duration: 2000
          })
          setTimeout(() => {
            router.back()
          }, 2000)
        }
      }
    })
    
  } catch (error) {
    console.error('订单提交失败:', error)
    uni.hideLoading()
    
    let errorMessage = '订单提交失败'
    if (error.message) {
      errorMessage = error.message
    } else if (typeof error === 'string') {
      errorMessage = error
    }
    
    uni.showModal({
      title: '提交失败',
      content: errorMessage,
      showCancel: false,
      confirmText: '我知道了'
    })
  } finally {
    loading.value = false
  }
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

// 检查是否有未支付订单
const checkUnpaidOrders = async () => {
  if (!goodsId.value) return

  try {
    const result = await GoodsApi.hasOrderUnpaid(goodsId.value)
    
    if (result && result.id) {
      // 有未支付订单
      unpaidOrder.value = {
        id: result.id,
        order_number: result.order_number,
        amount: parseFloat(result.pay_amount),
        createTime: new Date(result.create_time),
        expiryTime: Math.max(0, result.expire_time - Math.floor(Date.now()))
      }
      
      // 开始倒计时
      if (unpaidOrder.value.expiryTime > 0) {
        startCountdown(unpaidOrder.value.expiryTime)
      }
      
      console.debug('发现未支付订单:', unpaidOrder.value)
    }
  } catch (error) {
    console.error('检查未支付订单失败:', error)
    // 检查失败不影响正常流程，继续执行
  }
}

const fetchDefaultAddress = async () => {
  if (loading.value) return

  try {
    loading.value = true
    const res = await GoodsApi.getDefaultAddress()
    console.debug('获取地址成功, res:', res)
    
    if (res && res.id) {
      Object.assign(address, {
        id: res.id,
        name: res.user_name,
        phone: res.phone,
        region: res.region,
        address: res.address,
        isDefault: res.is_default
      })
    } else {
      // 如果没有默认地址，清空address对象
      Object.assign(address, {
        id: null,
        name: '',
        phone: '',
        region: '',
        address: '',
        isDefault: false
      })
    }
  } catch (err) {
    console.error(err)
    // 如果获取失败，也清空address对象
    Object.assign(address, {
      id: null,
      name: '',
      phone: '',
      region: '',
      address: '',
      isDefault: false
    })
    toast.show('获取地址失败')
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  console.debug("options", options)
  if (options.id) {
    goodsId.value = options.id
    goods.id = options.id
    goods.name = options.title
    goods.price = parseFloat(options.price)
    goods.originalPrice = parseFloat(options.original_price)
    goods.image = options.cover
    goods.seller.id = options.seller_id
    goods.seller.nickname = options.seller_nickname
    goods.seller.avatar = options.seller_avatar

    // 获取默认地址
    fetchDefaultAddress()
    
    // 检查是否有未支付订单
    checkUnpaidOrders()
  } else {
    setTimeout(() => {
      toast.show('未传入商品ID')
      router.back()
    }, 1500)
  }
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

    <view class="bg-#f8f8f8 h-full">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-screen flex items-center justify-center">
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
        
        <!-- 收货地址 (快递配送时显示) -->
        <view v-if="selectedDelivery.id === 1" class="bg-white mt-20rpx rounded-16rpx mx-30rpx">
          <view class="p-30rpx flex items-center justify-between" @tap="goToAddress">
            <!-- 地址信息 -->
            <view class="flex-1">
              <view v-if="address.id" class="animate-fade-in">
                <view class="flex items-center mb-10rpx">
                  <WdIcon name="location" size="36rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
                  <text class="text-30rpx font-medium">{{ address.name }}</text>
                  <text class="text-30rpx ml-20rpx">{{ address.phone }}</text>
                </view>
                <view class="text-28rpx text-gray-600 pl-46rpx">{{ address.address }}</view>
              </view>
              <view v-else class="flex items-center py-20rpx">
                <view class="flex items-center justify-center w-80rpx h-80rpx bg-pink-50 rounded-full mr-20rpx">
                  <WdIcon name="location" size="40rpx" custom-style="color:#f43f5e"/>
                </view>
                <view class="flex-1">
                  <view class="text-30rpx font-medium text-#333 mb-8rpx">选择收货地址</view>
                  <view class="text-26rpx text-gray-400">请先添加收货地址以便配送</view>
                </view>
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
            <image :src="goods.seller.avatar" class="w-40rpx h-40rpx rounded-full mr-15rpx" mode="aspectFill" />
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
          <view class="px-30rpx py-25rpx border-t border-gray-100" @tap="openDeliveryModal">
            <view class="flex justify-between items-center">
              <text class="text-28rpx text-gray-700">配送方式</text>
              <view class="flex items-center">
                <view class="flex items-center">
                  <WdIcon :name="selectedDelivery.icon" size="28rpx" custom-style="color:#f43f5e" class="mr-8rpx"/>
                  <view class="text-right">
                    <view class="text-26rpx text-#333">{{ selectedDelivery.name }}</view>
                    <view class="text-22rpx text-gray-500">{{ selectedDelivery.description }}</view>
                  </view>
                </view>
                <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-10rpx"/>
              </view>
            </view>
          </view>
          
          <!-- 配送详情 -->
          <view class="px-30rpx py-20rpx border-t border-gray-100 bg-gray-50">
            <view class="flex items-center text-24rpx text-gray-600">
              <WdIcon name="info" size="24rpx" custom-style="color:#999" class="mr-8rpx"/>
              <text>{{ selectedDelivery.detail }}</text>
            </view>
            
            <!-- 快递费用说明 -->
            <view v-if="selectedDelivery.id === 1 && selectedDelivery.priceNote" class="mt-10rpx text-24rpx text-orange-600">
              <WdIcon name="alert-circle" size="24rpx" custom-style="color:#f97316" class="mr-8rpx"/>
              <text>{{ selectedDelivery.priceNote }}</text>
            </view>
            
            <!-- 校园内自提说明 -->
            <view v-if="selectedDelivery.id === 2 && selectedDelivery.communicationNote" class="mt-10rpx text-24rpx text-blue-600">
              <WdIcon name="message-circle" size="24rpx" custom-style="color:#3b82f6" class="mr-8rpx"/>
              <text>{{ selectedDelivery.communicationNote }}</text>
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
        
        <!-- 买家备注 -->
        <view class="bg-white mt-20rpx rounded-16rpx mx-30rpx">
          <view class="px-30rpx py-25rpx">
            <view class="text-28rpx text-gray-700 mb-20rpx">买家备注</view>
            <textarea 
              v-model="buyerRemark"
              class="w-full p-20rpx bg-gray-50 rounded-12rpx text-26rpx border border-gray-100"
              placeholder="请输入备注信息（选填）"
              maxlength="200"
              style="height: 120rpx; resize: none;"
            />
            <view class="text-right text-22rpx text-gray-400 mt-10rpx">
              {{ buyerRemark.length }}/200
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
    
    <!-- 配送方式选择弹窗 -->
    <view v-if="showDeliveryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-200" @tap="closeDeliveryModal">
      <view class="w-full bg-white rounded-t-20rpx max-h-80vh overflow-hidden" @tap.stop>
        <!-- 弹窗头部 -->
        <view class="px-30rpx py-25rpx border-b border-gray-100 flex justify-between items-center">
          <text class="text-32rpx font-medium text-#333">选择配送方式</text>
          <WdIcon name="close" size="32rpx" custom-style="color:#999" @tap="closeDeliveryModal"/>
        </view>
        
        <!-- 配送方式列表 -->
        <scroll-view scroll-y class="max-h-60vh">
          <view class="px-30rpx py-20rpx">
                         <view 
               v-for="delivery in deliveryOptions" 
               :key="delivery.id"
               class="mb-20rpx rounded-16rpx border border-gray-200 overflow-hidden delivery-option"
               :class="{ 
                 'border-#f43f5e bg-pink-50': delivery.selected
               }"
               @tap="selectDelivery(delivery.id)"
             >
              <view class="p-25rpx">
                <view class="flex items-center justify-between mb-15rpx">
                                     <view class="flex items-center">
                     <WdIcon :name="delivery.icon" size="32rpx" custom-style="color:#f43f5e" class="mr-15rpx"/>
                     <view>
                       <text class="text-30rpx font-medium text-#333">{{ delivery.name }}</text>
                       <text v-if="delivery.id === 1" class="text-24rpx text-orange-500 ml-10rpx">快递费到付</text>
                       <text v-else class="text-24rpx text-green-500 ml-10rpx">免费</text>
                     </view>
                   </view>
                  <view class="w-36rpx h-36rpx rounded-full border-2 flex items-center justify-center"
                        :class="delivery.selected ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'">
                    <WdIcon v-if="delivery.selected" name="check" size="24rpx" color="#fff"/>
                  </view>
                </view>
                
                                 <view class="text-26rpx text-gray-600 mb-10rpx">{{ delivery.description }}</view>
                <view class="text-24rpx text-gray-500">{{ delivery.detail }}</view>
                
                <!-- 特殊说明 -->
                <view v-if="delivery.priceNote" class="mt-10rpx text-24rpx text-orange-600">
                  <WdIcon name="alert-circle" size="20rpx" custom-style="color:#f97316" class="mr-5rpx"/>
                  <text>{{ delivery.priceNote }}</text>
                </view>
                
                <view v-if="delivery.communicationNote" class="mt-10rpx text-24rpx text-blue-600">
                  <WdIcon name="message-circle" size="20rpx" custom-style="color:#3b82f6" class="mr-5rpx"/>
                  <text>{{ delivery.communicationNote }}</text>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>
        
        <!-- 弹窗底部 -->
        <view class="px-30rpx py-25rpx border-t border-gray-100 bg-white">
          <view class="flex">
            <view class="flex-1 h-80rpx rounded-full border border-gray-300 flex items-center justify-center mr-20rpx" @tap="closeDeliveryModal">
              <text class="text-28rpx text-gray-700">取消</text>
            </view>
            <view class="flex-1 h-80rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 flex items-center justify-center" @tap="confirmDelivery">
              <text class="text-28rpx text-white">确定</text>
            </view>
          </view>
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

/* 弹窗动画效果 */
.fixed.inset-0 {
  animation: fadeIn 0.3s ease-out;
}

.fixed.inset-0 > view {
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

/* 配送方式选择项悬停效果 */
.delivery-option:active {
  transform: scale(0.98);
  transition: transform 0.2s ease;
}

/* 门店选择项悬停效果 */
.store-option:active {
  transform: scale(0.98);
  transition: transform 0.2s ease;
}
</style>

