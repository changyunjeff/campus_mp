<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 加载状态
const loading = ref(true)

// 时间范围选择：today 今天，week 本周，month 本月，year 本年
const timeRange = ref('week')

// 切换时间范围
const switchTimeRange = (range) => {
  timeRange.value = range
  // 重新加载数据
  loadSalesData()
}

// 加载销售数据
const loadSalesData = () => {
  loading.value = true
  
  // 模拟加载数据，实际项目中应该调用API获取数据
  setTimeout(() => {
    loading.value = false
  }, 800)
}

// 销售概览数据
const salesOverview = reactive({
  totalAmount: 15280.56,  // 总销售额
  todayAmount: 3250.00,   // 今日销售额
  orderCount: 42,         // 订单数量
  todayOrderCount: 8,     // 今日订单数量
  goodsCount: 15,         // 商品数量
  customerCount: 35,      // 客户数量
  refundAmount: 199.00,   // 退款金额
  refundCount: 1          // 退款订单数
})

// 销售走势数据
const salesTrendData = reactive({
  today: {
    labels: ['0时', '3时', '6时', '9时', '12时', '15时', '18时', '21时'],
    data: [0, 0, 0, 1200, 400, 800, 650, 200]
  },
  week: {
    labels: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
    data: [1500, 2000, 1800, 3200, 2400, 2700, 1800]
  },
  month: {
    labels: ['1日', '5日', '10日', '15日', '20日', '25日', '30日'],
    data: [3500, 4200, 3800, 5200, 4800, 5700, 4600]
  },
  year: {
    labels: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    data: [10500, 11200, 12300, 10800, 11500, 15280, 0, 0, 0, 0, 0, 0]
  }
})

// 商品销售排行
const topSellingProducts = ref([
  {
    id: 1,
    name: 'OPPO A8 石榴红 6G+128G 国行版本',
    count: 12,
    amount: 2580,
    image: 'https://picsum.photos/600/600?random=1',
  },
  {
    id: 2,
    name: '苹果 iPhone 13 Pro 银色 256G 其他版本',
    count: 8,
    amount: 7798,
    image: 'https://picsum.photos/600/600?random=2',
  },
  {
    id: 3,
    name: 'VIVO X60 星夜蓝 256G 95新',
    count: 6,
    amount: 1299,
    image: 'https://picsum.photos/600/600?random=3',
  },
  {
    id: 4,
    name: 'JellyCAT 邦尼兔 30cm 全新正品',
    count: 5,
    amount: 1075,
    image: 'https://picsum.photos/600/600?random=4',
  },
  {
    id: 5,
    name: '行者 明星亲笔签名照片 限量版',
    count: 4,
    amount: 184,
    image: 'https://picsum.photos/600/600?random=5',
  }
])

// 最近订单
const recentOrders = ref([
  {
    id: 'O20230715001',
    customerId: 1001,
    customerName: '张三',
    amount: 215,
    status: 'completed',
    items: 1,
    createTime: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'O20230714002',
    customerId: 1002,
    customerName: '李四',
    amount: 3899,
    status: 'completed',
    items: 1,
    createTime: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: 'O20230714001',
    customerId: 1003,
    customerName: '王五',
    amount: 2598,
    status: 'completed',
    items: 2,
    createTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'O20230713003',
    customerId: 1004,
    customerName: '赵六',
    amount: 199,
    status: 'refunded',
    items: 1,
    createTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    id: 'O20230713002',
    customerId: 1005,
    customerName: '孙七',
    amount: 4598,
    status: 'completed',
    items: 1,
    createTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
  }
])

// 格式化金额
const formatAmount = (amount) => {
  return amount.toFixed(2)
}

// 格式化时间
const formatTime = (date) => {
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 获取订单状态文本和颜色
const getOrderStatusInfo = (status) => {
  switch (status) {
    case 'completed':
      return { text: '已完成', color: 'text-green-500', bgColor: 'bg-green-50' }
    case 'refunded':
      return { text: '已退款', color: 'text-red-500', bgColor: 'bg-red-50' }
    case 'pending':
      return { text: '待付款', color: 'text-orange-500', bgColor: 'bg-orange-50' }
    case 'shipped':
      return { text: '已发货', color: 'text-blue-500', bgColor: 'bg-blue-50' }
    default:
      return { text: '未知状态', color: 'text-gray-500', bgColor: 'bg-gray-50' }
  }
}

// 获取当前时间范围的销售走势数据
const currentTrendData = computed(() => {
  return salesTrendData[timeRange.value] || salesTrendData.week
})

// 跳转到订单详情
const goToOrderDetail = (orderId) => {
  router.push({
    name: 'order_detail',
    query: {
      id: orderId
    }
  })
}

// 跳转到商品详情
const goToGoodsDetail = (goodsId) => {
  router.push({
    name: 'goods_details',
    query: {
      id: goodsId
    }
  })
}

// 跳转到更多商品销售分析
const goToMoreProductAnalysis = () => {
  router.push({
    name: 'product_analysis'
  })
}

// 跳转到更多订单列表
const goToMoreOrders = () => {
  router.push({
    name: 'order_list'
  })
}

// 页面加载
onLoad(() => {
  loadSalesData()
})

// 在真实项目中，这里应该有绘制图表的代码
// 由于小程序环境限制，这里仅用模拟图表区域展示
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">销售统计</view>
    </template>
    
    <view class="bg-#f8f8f8 min-h-100vh pb-30rpx">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>
      
      <template v-else>
        <!-- 销售概览卡片 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx flex items-center">
            <text class="text-30rpx font-medium text-#333">销售概览</text>
          </view>
          
          <view class="grid grid-cols-2 gap-20rpx">
            <!-- 总销售额 -->
            <view class="bg-gradient-to-r from-#f43f5e to-#ff7676 p-20rpx rounded-12rpx text-white">
              <view class="text-24rpx mb-10rpx">总销售额(元)</view>
              <view class="text-36rpx font-bold">{{ formatAmount(salesOverview.totalAmount) }}</view>
            </view>
            
            <!-- 今日销售额 -->
            <view class="bg-gradient-to-r from-#3b82f6 to-#60a5fa p-20rpx rounded-12rpx text-white">
              <view class="text-24rpx mb-10rpx">今日销售额(元)</view>
              <view class="text-36rpx font-bold">{{ formatAmount(salesOverview.todayAmount) }}</view>
            </view>
            
            <!-- 订单数量 -->
            <view class="bg-white border border-gray-200 p-20rpx rounded-12rpx">
              <view class="text-24rpx text-gray-500 mb-10rpx">总订单数</view>
              <view class="text-36rpx font-bold text-#333">{{ salesOverview.orderCount }}</view>
            </view>
            
            <!-- 今日订单 -->
            <view class="bg-white border border-gray-200 p-20rpx rounded-12rpx">
              <view class="text-24rpx text-gray-500 mb-10rpx">今日订单数</view>
              <view class="text-36rpx font-bold text-#333">{{ salesOverview.todayOrderCount }}</view>
            </view>
            
            <!-- 商品数量 -->
            <view class="bg-white border border-gray-200 p-20rpx rounded-12rpx">
              <view class="text-24rpx text-gray-500 mb-10rpx">在售商品数</view>
              <view class="text-36rpx font-bold text-#333">{{ salesOverview.goodsCount }}</view>
            </view>
            
            <!-- 客户数量 -->
            <view class="bg-white border border-gray-200 p-20rpx rounded-12rpx">
              <view class="text-24rpx text-gray-500 mb-10rpx">总客户数</view>
              <view class="text-36rpx font-bold text-#333">{{ salesOverview.customerCount }}</view>
            </view>
          </view>
        </view>
        
        <!-- 销售趋势图 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx flex items-center justify-between">
            <text class="text-30rpx font-medium text-#333">销售趋势</text>
            
            <!-- 时间范围切换 -->
            <view class="flex items-center">
              <view 
                v-for="(label, range) in {today: '今天', week: '本周', month: '本月', year: '今年'}"
                :key="range"
                class="ml-20rpx px-15rpx py-6rpx rounded-full text-26rpx transition-colors duration-300"
                :class="timeRange === range ? 'bg-#f43f5e text-white' : 'bg-gray-100 text-gray-700'"
                @tap="switchTimeRange(range)"
              >
                {{ label }}
              </view>
            </view>
          </view>
          
          <!-- 图表区域（实际项目中应该使用图表组件） -->
          <view class="chart-container h-400rpx relative border border-gray-100 rounded-12rpx">
            <!-- 模拟图表 Y 轴 -->
            <view class="absolute left-20rpx top-0 bottom-0 flex flex-col justify-between py-20rpx">
              <text v-for="(value, index) in 6" :key="index" class="text-22rpx text-gray-400">
                {{ (Math.max(...currentTrendData.data) * (5 - index) / 5).toFixed(0) }}
              </text>
            </view>
            
            <!-- 模拟柱状图 -->
            <view class="flex items-end justify-between h-full px-80rpx pt-50rpx pb-70rpx">
              <view
                v-for="(value, index) in currentTrendData.data"
                :key="index"
                class="w-30rpx bg-gradient-to-t from-#f43f5e to-#ff7676 rounded-t-sm"
                :style="{
                  height: `${(value / Math.max(...currentTrendData.data)) * 100}%`,
                  'min-height': '4rpx'
                }"
              ></view>
            </view>
            
            <!-- 模拟图表 X 轴 -->
            <view class="absolute left-80rpx right-30rpx bottom-20rpx flex justify-between">
              <text 
                v-for="(label, index) in currentTrendData.labels" 
                :key="index" 
                class="text-22rpx text-gray-400 transform -rotate-45 origin-top-left"
              >
                {{ label }}
              </text>
            </view>
          </view>
        </view>
        
        <!-- 商品销售排行 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx flex items-center justify-between">
            <text class="text-30rpx font-medium text-#333">商品销售排行</text>
            <view class="flex items-center" @tap="goToMoreProductAnalysis">
              <text class="text-26rpx text-gray-500">查看更多</text>
              <WdIcon name="chevron-right" size="28rpx" custom-style="color:#999" class="ml-5rpx"/>
            </view>
          </view>
          
          <view class="product-list">
            <view 
              v-for="(product, index) in topSellingProducts" 
              :key="product.id" 
              class="flex items-center py-20rpx border-b border-gray-100 last:border-none"
              @tap="goToGoodsDetail(product.id)"
            >
              <!-- 排名 -->
              <view 
                class="w-40rpx h-40rpx rounded-full flex items-center justify-center mr-20rpx"
                :class="index < 3 ? 'bg-#f43f5e text-white' : 'bg-gray-100 text-gray-700'"
              >
                <text class="text-24rpx font-bold">{{ index + 1 }}</text>
              </view>
              
              <!-- 商品图片 -->
              <image :src="product.image" class="w-80rpx h-80rpx rounded-8rpx object-cover"/>
              
              <!-- 商品信息 -->
              <view class="flex-1 ml-20rpx">
                <view class="text-28rpx text-#333 truncate">{{ product.name }}</view>
                <view class="flex items-center mt-5rpx">
                  <text class="text-24rpx text-gray-500">销量 {{ product.count }}</text>
                  <text class="text-24rpx text-gray-500 ml-20rpx">
                    金额 ¥{{ formatAmount(product.amount) }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 最近订单 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx flex items-center justify-between">
            <text class="text-30rpx font-medium text-#333">最近订单</text>
            <view class="flex items-center" @tap="goToMoreOrders">
              <text class="text-26rpx text-gray-500">查看更多</text>
              <WdIcon name="chevron-right" size="28rpx" custom-style="color:#999" class="ml-5rpx"/>
            </view>
          </view>
          
          <view class="order-list">
            <view 
              v-for="order in recentOrders" 
              :key="order.id" 
              class="py-20rpx border-b border-gray-100 last:border-none"
              @tap="goToOrderDetail(order.id)"
            >
              <view class="flex justify-between items-center">
                <view class="flex items-center">
                  <text class="text-28rpx font-medium text-#333">{{ order.id }}</text>
                  <view 
                    class="ml-15rpx px-10rpx py-3rpx rounded-4rpx"
                    :class="getOrderStatusInfo(order.status).bgColor"
                  >
                    <text class="text-22rpx" :class="getOrderStatusInfo(order.status).color">
                      {{ getOrderStatusInfo(order.status).text }}
                    </text>
                  </view>
                </view>
                <text class="text-30rpx font-bold text-#f43f5e">¥{{ formatAmount(order.amount) }}</text>
              </view>
              
              <view class="flex justify-between items-center mt-10rpx">
                <view class="flex items-center">
                  <text class="text-26rpx text-gray-500">{{ order.customerName }}</text>
                  <text class="text-26rpx text-gray-500 mx-10rpx">·</text>
                  <text class="text-26rpx text-gray-500">{{ order.items }}件商品</text>
                </view>
                <text class="text-24rpx text-gray-500">{{ formatTime(order.createTime) }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </view>
  </layout>
</template>

<style scoped>
.chart-container {
  position: relative;
  overflow: hidden;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 