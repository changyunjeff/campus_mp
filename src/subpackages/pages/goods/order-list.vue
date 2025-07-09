<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onShow, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'
import { useToast } from '@/composables/toast'
import { formatTime } from '@/utils/time'

const router = useRouter()
const toast = useToast()

// 加载状态
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)

// 订单列表
const orders = ref([])

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  hasMore: true,
  total: 0
})

// 订单状态筛选
const statusTabs = ref([
  { id: '', name: '全部', count: 0 },
  { id: 'unpaid', name: '待支付', count: 0 },
  { id: 'paid', name: '已支付', count: 0 },
  { id: 'shipped', name: '已发货', count: 0 },
  { id: 'completed', name: '已完成', count: 0 },
  { id: 'cancelled', name: '已取消', count: 0 }
])

const activeStatus = ref('')

// 获取订单状态对应的颜色
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

// 获取订单状态对应的图标
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

// 加载订单列表
const loadOrderList = async (isRefresh = false) => {
  if (loading.value && !isRefresh) return

  try {
    if (isRefresh) {
      refreshing.value = true
      pagination.page = 1
      orders.value = []
    } else {
      if (pagination.page === 1) {
        loading.value = true
      } else {
        loadingMore.value = true
      }
    }

    const response = await GoodsApi.getOrderList(pagination.page, pagination.pageSize)
    
    console.debug('订单列表响应:', response)

    // 处理响应数据
    let orderItems = []
    if (Array.isArray(response)) {
      orderItems = response
    } else if (response && Array.isArray(response.list)) {
      orderItems = response.list
      pagination.total = response.total || orderItems.length
      pagination.hasMore = response.has_more || (pagination.page * pagination.pageSize < pagination.total)
    } else if (response && Array.isArray(response.items)) {
      orderItems = response.items
      pagination.total = response.total || orderItems.length
      pagination.hasMore = response.has_more || (pagination.page * pagination.pageSize < pagination.total)
    }

    // 处理订单数据
    const processedOrders = orderItems.map(item => ({
      ...item,
      // 确保时间戳格式正确
      create_time: item.create_time * 1000,
      pay_time: item.pay_time ? item.pay_time * 1000 : null,
      ship_time: item.ship_time ? item.ship_time * 1000 : null,
      receive_time: item.receive_time ? item.receive_time * 1000 : null
    }))

    if (isRefresh || pagination.page === 1) {
      orders.value = processedOrders
    } else {
      orders.value.push(...processedOrders)
    }

    if (processedOrders.length > 0) {
      pagination.page++
    }

    // 更新状态标签数量（这里可以根据实际数据统计，暂时省略）
    
  } catch (error) {
    console.error('加载订单列表失败:', error)
    toast.show('加载订单列表失败，请重试')
  } finally {
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

// 切换状态筛选
const switchStatus = (status) => {
  if (activeStatus.value === status) return
  
  activeStatus.value = status
  pagination.page = 1
  orders.value = []
  loadOrderList(true)
}

// 跳转到订单详情
const goToOrderDetail = (order) => {
  router.push({
    name: 'goods_order_detail',
    params: {
      id: order.id
    }
  })
}

// 取消订单
const cancelOrder = (order) => {
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
            order_id: order.id,
            reason: '用户主动取消'
          })
          
          // 更新本地订单状态
          const index = orders.value.findIndex(item => item.id === order.id)
          if (index > -1) {
            orders.value[index].order_status = 'cancelled'
            orders.value[index].order_status_text = '已取消'
            orders.value[index].can_cancel = false
          }
          
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
const payNow = (order) => {
  router.push({
    name: 'goods_pay_confirm',
    params: {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.pay_amount
    }
  })
}

// 确认收货
const confirmReceive = (order) => {
  uni.showModal({
    title: '确认收货',
    content: '确认已收到商品并验收无误？',
    confirmText: '确认收货',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '确认中...' })
          
          // 这里应该调用确认收货的API，暂时没有这个接口
          // await GoodsApi.confirmReceive(order.id)
          
          // 模拟更新状态
          const index = orders.value.findIndex(item => item.id === order.id)
          if (index > -1) {
            orders.value[index].order_status = 'completed'
            orders.value[index].order_status_text = '已完成'
            orders.value[index].can_receive = false
            orders.value[index].receive_time = Date.now()
          }
          
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
const contactSeller = (order) => {
  router.push({
    name: 'private_chat',
    params: {
      id: order.seller_openid,
      goodsId: order.goods_id
    }
  })
}

onLoad(() => {
  loadOrderList()
})

onShow(() => {
  // 每次显示页面时刷新订单列表
  loadOrderList(true)
})

onPullDownRefresh(() => {
  loadOrderList(true)
  uni.stopPullDownRefresh()
})

onReachBottom(() => {
  if (pagination.hasMore && !loadingMore.value) {
    loadOrderList()
  }
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">我的订单</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 状态筛选标签 -->
      <view class="bg-white">
        <scroll-view scroll-x class="whitespace-nowrap">
          <view class="flex px-30rpx py-20rpx">
            <view 
              v-for="tab in statusTabs" 
              :key="tab.id"
              class="flex-shrink-0 mr-40rpx text-center"
              @tap="switchStatus(tab.id)"
            >
              <text 
                class="text-28rpx transition-colors duration-300"
                :class="activeStatus === tab.id ? 'text-#f43f5e font-medium' : 'text-gray-600'"
              >
                {{ tab.name }}
              </text>
              <view 
                v-if="activeStatus === tab.id"
                class="w-40rpx h-4rpx bg-#f43f5e rounded-full mx-auto mt-8rpx"
              />
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 加载状态 -->
      <view v-if="loading && orders.length === 0" class="flex items-center justify-center py-80rpx">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin mr-20rpx"/>
        <text class="text-gray-400">加载中...</text>
      </view>

      <!-- 空状态 -->
      <view v-else-if="orders.length === 0" class="flex flex-col items-center justify-center py-80rpx">
        <WdIcon name="receipt" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
        <text class="text-30rpx text-gray-400 mb-20rpx">暂无订单</text>
        <text class="text-26rpx text-gray-300">快去选购心仪的商品吧~</text>
      </view>

      <!-- 订单列表 -->
      <view v-else class="px-30rpx pb-30rpx">
        <view 
          v-for="order in orders" 
          :key="order.id"
          class="bg-white rounded-16rpx mb-20rpx overflow-hidden shadow-sm"
        >
          <!-- 订单头部 -->
          <view class="px-30rpx py-20rpx border-b border-gray-100 flex justify-between items-center">
            <view class="flex items-center">
              <text class="text-26rpx text-gray-600 mr-20rpx">{{ order.order_number }}</text>
              <view class="flex items-center">
                <WdIcon 
                  :name="getStatusIcon(order.order_status)" 
                  size="28rpx" 
                  :custom-style="`color: ${getStatusColor(order.order_status)}`"
                  class="mr-8rpx"
                />
                <text 
                  class="text-26rpx"
                  :style="`color: ${getStatusColor(order.order_status)}`"
                >
                  {{ order.order_status_text }}
                </text>
              </view>
            </view>
            <text class="text-24rpx text-gray-400">{{ formatTime(order.create_time) }}</text>
          </view>

          <!-- 商品信息 -->
          <view class="px-30rpx py-20rpx" @tap="goToOrderDetail(order)">
            <view class="flex">
              <!-- 商品图片 -->
              <view class="w-120rpx h-120rpx rounded-12rpx overflow-hidden mr-20rpx bg-gray-100">
                <!-- 这里需要商品图片，暂时用占位符 -->
                <view class="w-full h-full flex items-center justify-center">
                  <WdIcon name="image" size="40rpx" custom-style="color:#ccc"/>
                </view>
              </view>
              
              <!-- 商品详情 -->
              <view class="flex-1">
                <text class="text-28rpx text-#333 line-clamp-2">{{ order.goods_title }}</text>
                <view class="flex justify-between items-end mt-20rpx">
                  <text class="text-30rpx font-bold text-#f43f5e">¥{{ order.pay_amount }}</text>
                  <text class="text-24rpx text-gray-500">x1</text>
                </view>
              </view>
            </view>

            <!-- 配送信息 -->
            <view v-if="order.receiver_name" class="mt-20rpx pt-20rpx border-t border-gray-100">
              <view class="flex items-center text-24rpx text-gray-600">
                <WdIcon name="location" size="24rpx" custom-style="color:#999" class="mr-8rpx"/>
                <text>{{ order.receiver_name }} {{ order.receiver_phone }}</text>
              </view>
              <text class="text-24rpx text-gray-500 mt-5rpx">
                {{ order.receiver_region }} {{ order.receiver_address }}
              </text>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="px-30rpx py-20rpx border-t border-gray-100 flex justify-end">
            <view class="flex space-x-20rpx">
              <!-- 联系卖家 -->
              <view 
                class="px-30rpx py-12rpx border border-gray-300 rounded-full"
                @tap="contactSeller(order)"
              >
                <text class="text-26rpx text-gray-700">联系卖家</text>
              </view>

              <!-- 取消订单 -->
              <view 
                v-if="order.can_cancel"
                class="px-30rpx py-12rpx border border-gray-300 rounded-full"
                @tap="cancelOrder(order)"
              >
                <text class="text-26rpx text-gray-700">取消订单</text>
              </view>

              <!-- 立即支付 -->
              <view 
                v-if="order.can_pay"
                class="px-30rpx py-12rpx bg-#f43f5e rounded-full"
                @tap="payNow(order)"
              >
                <text class="text-26rpx text-white">立即支付</text>
              </view>

              <!-- 确认收货 -->
              <view 
                v-if="order.can_receive"
                class="px-30rpx py-12rpx bg-#f43f5e rounded-full"
                @tap="confirmReceive(order)"
              >
                <text class="text-26rpx text-white">确认收货</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="loadingMore" class="flex items-center justify-center py-40rpx">
          <WdIcon name="loading" size="40rpx" custom-style="color:#f43f5e" class="animate-spin mr-15rpx"/>
          <text class="text-gray-400">加载更多...</text>
        </view>

        <!-- 没有更多 -->
        <view v-else-if="orders.length > 0 && !pagination.hasMore" class="text-center py-40rpx">
          <text class="text-gray-400">没有更多订单了</text>
        </view>
      </view>
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

.space-x-20rpx > view + view,
.space-x-20rpx > text + text {
  margin-left: 20rpx;
}
</style>