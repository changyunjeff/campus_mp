<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'
import { useToast } from '@/composables/toast'
import { formatTime } from '@/utils/time'

const router = useRouter()
const toast = useToast()

// 订单ID
const orderId = ref('')

// 加载状态
const loading = ref(false)

// 订单详情数据
const orderDetail = reactive({
  id: '',
  order_number: '',
  goods_id: '',
  goods_title: '',
  goods_price: 0,
  buyer_openid: '',
  seller_openid: '',
  receiver_name: '',
  receiver_phone: '',
  receiver_region: '',
  receiver_address: '',
  order_status: '',
  order_status_text: '',
  pay_status: 0,
  pay_status_text: '',
  pay_amount: '',
  pay_method: '',
  pay_time: 0,
  transaction_id: '',
  express_company: '',
  express_number: '',
  ship_time: 0,
  deliver_method: 0,
  deliver_method_text: '',
  deliver_status: 0,
  receive_time: 0,
  buyer_remark: '',
  seller_remark: '',
  cancel_reason: '',
  create_time: 0,
  update_time: 0,
  expire_time: 0,
  is_temp: false,
  can_cancel: false,
  can_pay: false,
  can_ship: false,
  can_receive: false,
  can_refund: false
})

// 获取订单状态颜色
const getStatusColor = (status) => {
  const colorMap = {
    'unpaid': '#f59e0b',
    'paid': '#3b82f6',
    'shipped': '#8b5cf6', 
    'completed': '#10b981',
    'cancelled': '#ef4444'
  }
  return colorMap[status] || '#6b7280'
}

// 获取订单状态图标
const getStatusIcon = (status) => {
  const iconMap = {
    'unpaid': 'clock',
    'paid': 'check-circle',
    'shipped': 'truck',
    'completed': 'shield-check',
    'cancelled': 'x-circle'
  }
  return iconMap[status] || 'info'
}

// 订单状态流程
const orderSteps = computed(() => {
  const steps = [
    { name: '提交订单', status: 'completed', time: orderDetail.create_time },
    { name: '付款', status: orderDetail.pay_time ? 'completed' : (orderDetail.can_pay ? 'current' : 'pending'), time: orderDetail.pay_time },
    { name: '发货', status: orderDetail.ship_time ? 'completed' : (orderDetail.can_ship ? 'current' : 'pending'), time: orderDetail.ship_time },
    { name: '收货', status: orderDetail.receive_time ? 'completed' : (orderDetail.can_receive ? 'current' : 'pending'), time: orderDetail.receive_time }
  ]
  
  // 如果订单被取消，只显示前面的步骤
  if (orderDetail.order_status === 'cancelled') {
    return steps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'completed' : 'cancelled'
    }))
  }
  
  return steps
})

// 获取订单详情
const getOrderDetail = async () => {
  if (!orderId.value || loading.value) return

  try {
    loading.value = true
    const data = await GoodsApi.getOrderDetail(orderId.value)
    
    console.debug('订单详情数据:', data)
    
    // 更新订单详情数据
    Object.assign(orderDetail, {
      ...data,
      // 确保时间戳格式正确
      create_time: data.create_time * 1000,
      pay_time: data.pay_time ? data.pay_time * 1000 : 0,
      ship_time: data.ship_time ? data.ship_time * 1000 : 0,
      receive_time: data.receive_time ? data.receive_time * 1000 : 0,
      update_time: data.update_time ? data.update_time * 1000 : 0,
      expire_time: data.expire_time ? data.expire_time * 1000 : 0
    })
    
  } catch (error) {
    console.error('获取订单详情失败:', error)
    toast.show('获取订单详情失败，请重试')
  } finally {
    loading.value = false
  }
}

// 取消订单
const cancelOrder = () => {
  uni.showModal({
    title: '确认取消订单',
    content: '确定要取消这个订单吗？',
    confirmText: '确认取消',
    confirmColor: '#ef4444',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '取消中...' })
          
          await GoodsApi.cancelOrder({
            order_id: orderDetail.id,
            reason: '用户主动取消'
          })
          
          // 更新本地订单状态
          orderDetail.order_status = 'cancelled'
          orderDetail.order_status_text = '已取消'
          orderDetail.can_cancel = false
          orderDetail.cancel_reason = '用户主动取消'
          
          uni.hideLoading()
          toast.show('订单取消成功')
        } catch (error) {
          console.error('取消订单失败:', error)
          uni.hideLoading()
          toast.show('取消订单失败，请重试')
        }
      }
    }
  })
}

// 立即支付
const payNow = () => {
  router.push({
    name: 'goods_pay_confirm',
    params: {
      orderId: orderDetail.id,
      orderNumber: orderDetail.order_number,
      amount: orderDetail.pay_amount
    }
  })
}

// 确认收货
const confirmReceive = () => {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品并验收无误？',
    confirmText: '确认收货',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '确认中...' })
          
          // 这里应该调用确认收货的API，暂时没有这个接口
          // await GoodsApi.confirmReceive(orderDetail.id)
          
          // 模拟更新状态
          orderDetail.order_status = 'completed'
          orderDetail.order_status_text = '已完成'
          orderDetail.can_receive = false
          orderDetail.receive_time = Date.now()
          
          uni.hideLoading()
          toast.show('确认收货成功')
        } catch (error) {
          console.error('确认收货失败:', error)
          uni.hideLoading()
          toast.show('确认收货失败，请重试')
        }
      }
    }
  })
}

// 联系卖家
const contactSeller = () => {
  router.push({
    name: 'private_chat',
    params: {
      id: orderDetail.seller_openid,
      goodsId: orderDetail.goods_id
    }
  })
}

// 跳转到商品详情
const goToGoodsDetail = () => {
  router.push({
    name: 'goods_details',
    params: {
      id: orderDetail.goods_id
    }
  })
}

// 复制订单号
const copyOrderNumber = () => {
  uni.setClipboardData({
    data: orderDetail.order_number,
    success: () => {
      toast.show('订单号已复制')
    }
  })
}

// 复制快递单号
const copyExpressNumber = () => {
  if (!orderDetail.express_number) return
  
  uni.setClipboardData({
    data: orderDetail.express_number,
    success: () => {
      toast.show('快递单号已复制')
    }
  })
}

onLoad((options) => {
  if (options.id) {
    orderId.value = options.id
    getOrderDetail()
  } else {
    toast.show('订单ID不存在')
    setTimeout(() => {
      router.back()
    }, 1500)
  }
})

onPullDownRefresh(() => {
  getOrderDetail()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">订单详情</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载状态 -->
      <view v-if="loading" class="flex items-center justify-center py-80rpx">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin mr-20rpx"/>
        <text class="text-gray-400">加载中...</text>
      </view>

      <template v-else>
        <!-- 订单状态卡片 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="flex items-center justify-between mb-30rpx">
            <view class="flex items-center">
              <WdIcon 
                :name="getStatusIcon(orderDetail.order_status)" 
                size="40rpx" 
                :custom-style="`color: ${getStatusColor(orderDetail.order_status)}`"
                class="mr-15rpx"
              />
              <text 
                class="text-32rpx font-medium"
                :style="`color: ${getStatusColor(orderDetail.order_status)}`"
              >
                {{ orderDetail.order_status_text }}
              </text>
            </view>
          </view>

          <!-- 订单流程 -->
          <view class="order-steps">
            <view 
              v-for="(step, index) in orderSteps" 
              :key="index"
              class="flex items-center"
              :class="{ 'mb-30rpx': index < orderSteps.length - 1 }"
            >
              <!-- 步骤图标 -->
              <view 
                class="w-60rpx h-60rpx rounded-full flex items-center justify-center mr-20rpx"
                :class="{
                  'bg-#f43f5e': step.status === 'completed' || step.status === 'current',
                  'bg-gray-300': step.status === 'pending',
                  'bg-red-400': step.status === 'cancelled'
                }"
              >
                <WdIcon 
                  :name="step.status === 'completed' ? 'check' : (step.status === 'cancelled' ? 'x' : 'clock')"
                  size="32rpx" 
                  color="#fff"
                />
              </view>

              <!-- 步骤信息 -->
              <view class="flex-1">
                <text 
                  class="text-28rpx"
                  :class="{
                    'text-#333 font-medium': step.status === 'completed' || step.status === 'current',
                    'text-gray-400': step.status === 'pending',
                    'text-red-400': step.status === 'cancelled'
                  }"
                >
                  {{ step.name }}
                </text>
                <text 
                  v-if="step.time" 
                  class="block text-24rpx text-gray-500 mt-5rpx"
                >
                  {{ formatTime(step.time) }}
                </text>
              </view>

              <!-- 连接线 -->
              <view 
                v-if="index < orderSteps.length - 1"
                class="absolute w-4rpx bg-gray-200 ml-28rpx"
                style="height: 40rpx; top: 70rpx;"
                :class="{
                  'bg-#f43f5e': step.status === 'completed',
                  'bg-red-400': step.status === 'cancelled'
                }"
              />
            </view>
          </view>
        </view>

        <!-- 商品信息 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="text-30rpx font-medium text-#333 mb-20rpx">商品信息</view>
          
          <view class="flex" @tap="goToGoodsDetail">
            <!-- 商品图片占位符 -->
            <view class="w-120rpx h-120rpx rounded-12rpx overflow-hidden mr-20rpx bg-gray-100">
              <view class="w-full h-full flex items-center justify-center">
                <WdIcon name="image" size="40rpx" custom-style="color:#ccc"/>
              </view>
            </view>
            
            <!-- 商品详情 -->
            <view class="flex-1">
              <text class="text-28rpx text-#333 line-clamp-2 leading-40rpx">{{ orderDetail.goods_title }}</text>
              <view class="flex justify-between items-end mt-20rpx">
                <text class="text-30rpx font-bold text-#f43f5e">¥{{ orderDetail.pay_amount }}</text>
                <text class="text-24rpx text-gray-500">x1</text>
              </view>
            </view>
          </view>

          <!-- 买家备注 -->
          <view v-if="orderDetail.buyer_remark" class="mt-20rpx pt-20rpx border-t border-gray-100">
            <text class="text-26rpx text-gray-600">买家备注：{{ orderDetail.buyer_remark }}</text>
          </view>
        </view>

        <!-- 订单信息 -->
        <view class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="text-30rpx font-medium text-#333 mb-20rpx">订单信息</view>
          
          <view class="order-info-item">
            <text class="label">订单号</text>
            <view class="flex items-center">
              <text class="value mr-20rpx">{{ orderDetail.order_number }}</text>
              <view class="px-15rpx py-5rpx bg-blue-50 rounded-full" @tap="copyOrderNumber">
                <text class="text-22rpx text-blue-600">复制</text>
              </view>
            </view>
          </view>

          <view class="order-info-item">
            <text class="label">创建时间</text>
            <text class="value">{{ formatTime(orderDetail.create_time) }}</text>
          </view>

          <view v-if="orderDetail.pay_time" class="order-info-item">
            <text class="label">付款时间</text>
            <text class="value">{{ formatTime(orderDetail.pay_time) }}</text>
          </view>

          <view class="order-info-item">
            <text class="label">配送方式</text>
            <text class="value">{{ orderDetail.deliver_method_text }}</text>
          </view>

          <view v-if="orderDetail.transaction_id" class="order-info-item">
            <text class="label">交易单号</text>
            <text class="value">{{ orderDetail.transaction_id }}</text>
          </view>
        </view>

        <!-- 收货信息 -->
        <view v-if="orderDetail.receiver_name" class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="text-30rpx font-medium text-#333 mb-20rpx">收货信息</view>
          
          <view class="flex items-start">
            <WdIcon name="location" size="32rpx" custom-style="color:#f43f5e" class="mr-15rpx mt-5rpx"/>
            <view class="flex-1">
              <view class="flex items-center mb-10rpx">
                <text class="text-28rpx text-#333 font-medium mr-20rpx">{{ orderDetail.receiver_name }}</text>
                <text class="text-28rpx text-#333">{{ orderDetail.receiver_phone }}</text>
              </view>
              <text class="text-26rpx text-gray-600 leading-36rpx">
                {{ orderDetail.receiver_region }} {{ orderDetail.receiver_address }}
              </text>
            </view>
          </view>
        </view>

        <!-- 物流信息 -->
        <view v-if="orderDetail.express_company || orderDetail.express_number" class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="text-30rpx font-medium text-#333 mb-20rpx">物流信息</view>
          
          <view v-if="orderDetail.express_company" class="order-info-item">
            <text class="label">快递公司</text>
            <text class="value">{{ orderDetail.express_company }}</text>
          </view>

          <view v-if="orderDetail.express_number" class="order-info-item">
            <text class="label">快递单号</text>
            <view class="flex items-center">
              <text class="value mr-20rpx">{{ orderDetail.express_number }}</text>
              <view class="px-15rpx py-5rpx bg-blue-50 rounded-full" @tap="copyExpressNumber">
                <text class="text-22rpx text-blue-600">复制</text>
              </view>
            </view>
          </view>

          <view v-if="orderDetail.ship_time" class="order-info-item">
            <text class="label">发货时间</text>
            <text class="value">{{ formatTime(orderDetail.ship_time) }}</text>
          </view>
        </view>

        <!-- 取消原因 -->
        <view v-if="orderDetail.cancel_reason" class="bg-white mx-30rpx mt-20rpx rounded-16rpx p-30rpx">
          <view class="text-30rpx font-medium text-#333 mb-20rpx">取消原因</view>
          <text class="text-26rpx text-gray-600">{{ orderDetail.cancel_reason }}</text>
        </view>

        <!-- 底部操作区域 -->
        <view class="p-30rpx">
          <view class="flex justify-end space-x-20rpx">
            <!-- 联系卖家 -->
            <view 
              class="px-40rpx py-15rpx border border-gray-300 rounded-full"
              @tap="contactSeller"
            >
              <text class="text-28rpx text-gray-700">联系卖家</text>
            </view>

            <!-- 取消订单 -->
            <view 
              v-if="orderDetail.can_cancel"
              class="px-40rpx py-15rpx border border-red-300 rounded-full"
              @tap="cancelOrder"
            >
              <text class="text-28rpx text-red-500">取消订单</text>
            </view>

            <!-- 立即支付 -->
            <view 
              v-if="orderDetail.can_pay"
              class="px-40rpx py-15rpx bg-#f43f5e rounded-full"
              @tap="payNow"
            >
              <text class="text-28rpx text-white">立即支付</text>
            </view>

            <!-- 确认收货 -->
            <view 
              v-if="orderDetail.can_receive"
              class="px-40rpx py-15rpx bg-#f43f5e rounded-full"
              @tap="confirmReceive"
            >
              <text class="text-28rpx text-white">确认收货</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </layout>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.order-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f5f5f5;
}

.order-info-item:last-child {
  border-bottom: none;
}

.order-info-item .label {
  font-size: 26rpx;
  color: #666;
  width: 150rpx;
  flex-shrink: 0;
}

.order-info-item .value {
  font-size: 26rpx;
  color: #333;
  text-align: right;
  flex: 1;
}

/* 微信小程序不支持*选择器，改用类名选择器 */
.space-x-20rpx > view + view,
.space-x-20rpx > text + text,
.space-x-20rpx > button + button {
  margin-left: 20rpx;
}

.order-steps {
  position: relative;
}
</style>