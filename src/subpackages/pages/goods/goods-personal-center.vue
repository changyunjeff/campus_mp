<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import User from '/static/images/user.png'
import events from '@/utils/events'
import { throttle } from 'lodash'

const router = useRouter()

// 当前选中的标签
const activeTab = ref('published')

// 个人中心的tab选项
const personalTabs = [
  {name: 'published', label: '我发布的'},
  {name: 'favorite', label: '我收藏的'}
]

// 查看模式：grid 网格模式，list 列表模式 (针对收藏夹和发布商品)
const viewMode = ref('grid')

// 页面加载状态
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

// 模拟发布的商品数据
const publishedGoods = reactive([
  {
    id: 1,
    title: 'iPhone 13 红色 128G 99新',
    price: 3899,
    originPrice: 4599,
    images: [User],
    location: '东莞',
    publishTime: Date.now() - 2 * 60 * 60 * 1000,
    status: 'selling', // selling-在售, sold-已售出, removed-已下架
    views: 168,
    likes: 36
  },
  {
    id: 2,
    title: 'JellyCAT 邦尼兔 30cm 全新正品',
    price: 215,
    originPrice: 329,
    images: [User, User],
    location: '揭阳',
    publishTime: Date.now() - 5 * 60 * 60 * 1000,
    status: 'selling',
    views: 96,
    likes: 24
  },
  {
    id: 3,
    title: 'VIVO X60 星夜蓝 256G 95新',
    price: 1299,
    originPrice: 2499,
    images: [User],
    location: '广州',
    publishTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
    status: 'sold',
    views: 78,
    likes: 12
  }
])

// 收藏商品列表
const favoriteGoods = reactive([
  {
    id: 1,
    goodsId: 101,
    name: 'OPPO A8 石榴红 6G+128G 国行版本',
    price: 215,
    originPrice: 999,
    image: User,
    time: Date.now() - 2 * 24 * 60 * 60 * 1000,
    seller: {
      id: 201,
      nickname: '精品二手机',
      avatar: User,
      isVerified: true
    }
  },
  {
    id: 2,
    goodsId: 102,
    name: 'JellyCAT 邦尼兔 30cm 全新正品',
    price: 215,
    originPrice: 329,
    image: User,
    time: Date.now() - 3 * 24 * 60 * 60 * 1000,
    seller: {
      id: 202,
      nickname: '玩具收藏家',
      avatar: User,
      isVerified: false
    }
  },
  {
    id: 3,
    goodsId: 103,
    name: 'VIVO X60 星夜蓝 256G 95新',
    price: 1299,
    originPrice: 2499,
    image: User,
    time: Date.now() - 5 * 24 * 60 * 60 * 1000,
    seller: {
      id: 203,
      nickname: '数码回收站',
      avatar: User,
      isVerified: true
    }
  },
  {
    id: 4,
    goodsId: 104,
    name: '行者 明星亲笔签名照片 限量版',
    price: 46,
    originPrice: 99,
    image: User,
    time: Date.now() - 7 * 24 * 60 * 60 * 1000,
    seller: {
      id: 204,
      nickname: '明星周边铺',
      avatar: User,
      isVerified: false
    }
  },
  {
    id: 5,
    goodsId: 105,
    name: '2023 iPad Pro 12.9寸 M2芯片 256G WIFI',
    price: 4500,
    originPrice: 8999,
    image: User,
    time: Date.now() - 10 * 24 * 60 * 60 * 1000,
    seller: {
      id: 205,
      nickname: '苹果数码专营',
      avatar: User,
      isVerified: true
    }
  },
  {
    id: 6,
    goodsId: 106,
    name: 'VIVO X100 Pro 自然棕 16G+512G 99新',
    price: 4999,
    originPrice: 6999,
    image: User,
    time: Date.now() - 12 * 24 * 60 * 60 * 1000,
    seller: {
      id: 206,
      nickname: '手机数码优选',
      avatar: User,
      isVerified: true
    }
  }
])

// 获取当前标签的商品数据
const currentGoods = computed(() => {
  switch(activeTab.value) {
    case 'published':
      return publishedGoods
    case 'favorite':
      return favoriteGoods
    default:
      return []
  }
})

// 切换查看模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

// 处理tab切换
const handleTabChange = throttle((tabName) => {
  console.log('切换到标签:', tabName)
  activeTab.value = tabName
  // 模拟切换标签时的数据加载
  refreshData()
}, 500)

// 查看商品详情
const viewGoodsDetail = throttle((goodsId) => {
  console.log('查看商品详情:', goodsId)
  // 跳转到商品详情页
  router.push({
    name: 'goods_details',
    query: {
      id: goodsId
    }
  })
}, 500)

// 获取商品状态文字
const getStatusText = (status) => {
  switch(status) {
    case 'selling':
      return '在售中'
    case 'sold':
      return '已售出'
    case 'removed':
      return '已下架'
    default:
      return '未知'
  }
}

// 获取商品状态颜色
const getStatusColor = (status) => {
  switch(status) {
    case 'selling':
      return 'text-green-500 bg-green-50'
    case 'sold':
      return 'text-blue-500 bg-blue-50'
    case 'removed':
      return 'text-gray-500 bg-gray-50'
    default:
      return 'text-gray-500 bg-gray-50'
  }
}

// 编辑商品
const editGoods = (goodsId, event) => {
  event.stopPropagation()
  router.push({
    name: 'publish_goods_edit',
    params: {
      id: goodsId
    }
  })
}

// 删除商品
const deleteGoods = (goodsIndex, event) => {
  event.stopPropagation()
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该商品吗？删除后无法恢复',
    success: function (res) {
      if (res.confirm) {
        publishedGoods.splice(goodsIndex, 1)
        uni.showToast({
          title: '已删除',
          icon: 'success',
          duration: 2000
        })
      }
    }
  })
}

// 更改商品状态
const changeGoodsStatus = (goods, event) => {
  event.stopPropagation()
  const actions = []
  
  if (goods.status === 'selling') {
    actions.push({
      name: '已售出',
      callback: () => {
        goods.status = 'sold'
        uni.showToast({
          title: '状态已更新',
          icon: 'success'
        })
      }
    })
    actions.push({
      name: '下架商品',
      callback: () => {
        goods.status = 'removed'
        uni.showToast({
          title: '已下架',
          icon: 'success'
        })
      }
    })
  } else if (goods.status === 'removed') {
    actions.push({
      name: '重新上架',
      callback: () => {
        goods.status = 'selling'
        uni.showToast({
          title: '已重新上架',
          icon: 'success'
        })
      }
    })
  }
  
  actions.push({
    name: '删除商品',
    color: '#ef4444',
    callback: () => {
      const index = publishedGoods.findIndex(item => item.id === goods.id)
      if (index !== -1) {
        deleteGoods(index, event)
      }
    }
  })
  
  events.emit('openActionSheet', actions, '商品操作')
}

// 商品长按操作
const handleLongPress = (goods, event) => {
  changeGoodsStatus(goods, event)
}

// 移除收藏
const removeFavorite = (goodsId) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏此商品吗？',
    success: (res) => {
      if (res.confirm) {
        const index = favoriteGoods.findIndex(item => item.id === goodsId)
        if (index !== -1) {
          favoriteGoods.splice(index, 1)
          
          uni.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        }
      }
    }
  })
}

// 发布新商品
const publishNewGoods = () => {
  router.push({
    name: 'publish_goods_category'
  })
}

// 继续购物
const continueToShop = () => {
  router.switchTab({
    name: 'index_goods'
  })
}

// 格式化时间
const formatTime = (time) => {
  const now = new Date()
  const diff = Math.floor((now - time) / 1000)
  
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
  
  const date = new Date(time)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  refreshing.value = false
  // 在这里可以重新加载数据
}

// 加载更多数据
const loadMoreData = async () => {
  if (!hasMore.value || loading.value) return
  
  loading.value = true
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  loading.value = false
  
  // 根据当前标签模拟加载更多数据
  // 在实际应用中，这里应该从服务器获取更多数据
  if (currentGoods.value.length >= 10) {
    hasMore.value = false
  }
}

onMounted(() => {
  // 初始加载数据
  refreshData()
})
</script>

<template>
  <layout>
    <template #center>
      <text class="text-32rpx font-bold">我的商品</text>
    </template>

    <view class="bg-#f8f8f8 min-h-screen">
      <!-- 标签切换 -->
      <view class="sticky top-0 z-10 bg-white shadow-sm">
        <tab-group
          :tabs="personalTabs"
          v-model:active-tab="activeTab"
          @change="handleTabChange"
        />
      </view>

      <!-- 内容区域 -->
      <view class="pb-30rpx">
        <!-- 下拉刷新指示器 -->
        <view v-if="refreshing" class="flex justify-center items-center py-20rpx">
          <WdIcon name="loading" size="40rpx" custom-style="color:#666" />
          <text class="ml-10rpx text-26rpx text-#666">正在刷新...</text>
        </view>

        <!-- 我发布的商品列表 -->
        <template v-if="activeTab === 'published'">
          <!-- 顶部操作栏 -->
          <view class="bg-white mb-20rpx px-30rpx py-20rpx flex justify-end">
            <view class="flex items-center" @tap="toggleViewMode">
              <WdIcon :name="viewMode === 'grid' ? 'list' : 'grid'" size="36rpx" custom-style="color:#666" class="mr-8rpx"/>
              <text class="text-26rpx text-gray-600">{{ viewMode === 'grid' ? '列表视图' : '网格视图' }}</text>
            </view>
          </view>
          <view v-if="publishedGoods.length > 0">
            <!-- 网格视图 -->
            <view v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-20rpx px-20rpx">
              <view 
                v-for="(goods, index) in publishedGoods" 
                :key="goods.id" 
                class="bg-white rounded-12rpx overflow-hidden animate-fade-in transition-all duration-300 active:scale-98 active:bg-gray-50"
                :style="{ 'animation-delay': `${index * 0.05}s` }"
                @tap="viewGoodsDetail(goods.id)"
                @longpress="handleLongPress(goods, $event)"
              >
                <!-- 商品图片 -->
                <image 
                  :src="goods.images[0]" 
                  mode="aspectFill" 
                  class="w-full h-350rpx object-cover"
                ></image>
                <!-- 商品信息 -->
                <view class="p-20rpx flex flex-col justify-between">
                  <view>
                    <view class="flex justify-between items-start">
                      <text class="text-28rpx text-#333 line-clamp-2 flex-1">{{ goods.title }}</text>
                      <view 
                        class="ml-10rpx py-4rpx px-12rpx rounded-6rpx text-22rpx flex-shrink-0" 
                        :class="getStatusColor(goods.status)"
                      >
                        {{ getStatusText(goods.status) }}
                      </view>
                    </view>
                    <view class="mt-10rpx">
                      <text class="text-30rpx text-#f43f5e font-bold">¥{{ goods.price }}</text>
                      <text v-if="goods.originPrice" class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ goods.originPrice }}</text>
                    </view>
                  </view>
                  <view class="mt-10rpx">
                    <view class="flex items-center text-24rpx text-gray-500 mb-10rpx">
                      <text class="mr-20rpx">浏览 {{ goods.views }}</text>
                      <text>收藏 {{ goods.likes }}</text>
                    </view>
                    <view class="flex flex-wrap">
                      <button 
                        v-if="goods.status === 'selling'"
                        class="mr-10rpx px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white mb-6rpx"
                        @tap.stop="editGoods(goods.id, $event)"
                      >编辑</button>
                      <button 
                        v-if="goods.status === 'selling'"
                        class="mr-10rpx px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white mb-6rpx"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >更多</button>
                      <button 
                        v-if="goods.status === 'removed'"
                        class="mr-10rpx px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white mb-6rpx"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >重新上架</button>
                      <button 
                        v-if="goods.status === 'removed'"
                        class="mr-10rpx px-16rpx py-6rpx border border-red-300 rounded-full text-22rpx text-red-500 bg-white mb-6rpx"
                        @tap.stop="deleteGoods(index, $event)"
                      >删除</button>
                      <button 
                        v-if="goods.status !== 'selling' && goods.status !== 'removed'"
                        class="px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white mb-6rpx"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >操作</button>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            <!-- 列表视图 -->
            <view v-else class="px-30rpx">
              <view 
                v-for="(goods, index) in publishedGoods" 
                :key="goods.id" 
                class="bg-white rounded-12rpx overflow-hidden mb-20rpx animate-fade-in transition-all duration-300 active:scale-98 active:bg-gray-50"
                :style="{ 'animation-delay': `${index * 0.05}s` }"
                @tap="viewGoodsDetail(goods.id)"
                @longpress="handleLongPress(goods, $event)"
              >
                <view class="p-20rpx flex">
                  <!-- 商品图片 -->
                  <image 
                    :src="goods.images[0]" 
                    mode="aspectFill" 
                    class="w-180rpx h-180rpx rounded-12rpx object-cover"
                  ></image>
                  <!-- 商品信息 -->
                  <view class="flex-1 ml-20rpx flex flex-col justify-between">
                    <view>
                      <view class="flex justify-between items-start">
                        <text class="text-28rpx text-#333 line-clamp-2">{{ goods.title }}</text>
                        <view 
                          class="ml-10rpx py-4rpx px-12rpx rounded-6rpx text-22rpx" 
                          :class="getStatusColor(goods.status)"
                        >
                          {{ getStatusText(goods.status) }}
                        </view>
                      </view>
                      <view class="mt-10rpx">
                        <text class="text-30rpx text-#f43f5e font-bold">¥{{ goods.price }}</text>
                        <text v-if="goods.originPrice" class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ goods.originPrice }}</text>
                      </view>
                      <view class="mt-10rpx flex items-center text-24rpx text-gray-500">
                        <text class="mr-20rpx">浏览 {{ goods.views }}</text>
                        <text>收藏 {{ goods.likes }}</text>
                      </view>
                    </view>
                    <view class="flex justify-end mt-10rpx">
                      <button 
                        v-if="goods.status === 'selling'"
                        class="mr-10rpx px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white"
                        @tap.stop="editGoods(goods.id, $event)"
                      >编辑</button>
                      <button 
                        v-if="goods.status === 'selling'"
                        class="px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >更多</button>
                      <button 
                        v-if="goods.status === 'removed'"
                        class="mr-10rpx px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >重新上架</button>
                      <button 
                        v-if="goods.status === 'removed'"
                        class="px-16rpx py-6rpx border border-red-300 rounded-full text-22rpx text-red-500 bg-white"
                        @tap.stop="deleteGoods(index, $event)"
                      >删除</button>
                      <button 
                        v-if="goods.status !== 'selling' && goods.status !== 'removed'"
                        class="px-16rpx py-6rpx border border-gray-300 rounded-full text-22rpx text-gray-600 bg-white"
                        @tap.stop="changeGoodsStatus(goods, $event)"
                      >操作</button>
                    </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <!-- 无内容显示 -->
          <view v-else-if="!refreshing" class="flex flex-col items-center justify-center py-100rpx">
            <WdIcon name="info-circle" size="80rpx" custom-style="color:#ccc" />
            <text class="mt-20rpx text-28rpx text-#999">暂无发布的商品</text>
            <view 
              class="mt-40rpx px-40rpx py-16rpx bg-#f43f5e rounded-full"
              @tap="publishNewGoods"
            >
              <text class="text-28rpx text-white">立即发布商品</text>
            </view>
          </view>
        </template>
        
        <!-- 我收藏的商品列表 -->
        <template v-else-if="activeTab === 'favorite'">
          <!-- 顶部操作栏 -->
          <view class="bg-white mb-20rpx px-30rpx py-20rpx flex justify-end">
            <view class="flex items-center" @tap="toggleViewMode">
              <WdIcon :name="viewMode === 'grid' ? 'list' : 'grid'" size="36rpx" custom-style="color:#666" class="mr-8rpx"/>
              <text class="text-26rpx text-gray-600">{{ viewMode === 'grid' ? '列表视图' : '网格视图' }}</text>
            </view>
          </view>
          
          <view v-if="favoriteGoods.length > 0">
            <!-- 网格视图 -->
            <view v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-20rpx px-20rpx">
              <view 
                v-for="(item, index) in favoriteGoods" 
                :key="item.id" 
                class="bg-white rounded-12rpx overflow-hidden animate-fade-in"
                :style="{ 'animation-delay': `${index * 0.05}s` }"
              >
                <!-- 商品图片 -->
                <view class="relative" @tap="viewGoodsDetail(item.goodsId)">
                  <image 
                    :src="item.image" 
                    class="w-full h-350rpx object-cover" 
                    mode="aspectFill"
                  />
                  <view 
                    class="absolute top-20rpx right-20rpx z-10 w-60rpx h-60rpx rounded-full bg-black bg-opacity-50 flex items-center justify-center"
                    @tap.stop="removeFavorite(item.id)"
                  >
                    <WdIcon name="heart-off" size="32rpx" color="#fff"/>
                  </view>
                </view>
                
                <!-- 商品信息 -->
                <view class="p-20rpx">
                  <view @tap="viewGoodsDetail(item.goodsId)">
                    <view class="text-28rpx text-#333 line-clamp-2 h-80rpx">{{ item.name }}</view>
                  </view>
                  
                  <view class="flex justify-between items-end mt-10rpx">
                    <view>
                      <text class="text-30rpx text-#f43f5e font-bold">¥{{ item.price }}</text>
                      <text class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ item.originPrice }}</text>
                    </view>
                    <text class="text-22rpx text-gray-500">{{ formatTime(item.time) }}</text>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 列表视图 -->
            <view v-else class="px-30rpx">
              <view 
                v-for="(item, index) in favoriteGoods" 
                :key="item.id" 
                class="bg-white rounded-12rpx overflow-hidden mb-20rpx animate-fade-in"
                :style="{ 'animation-delay': `${index * 0.05}s` }"
              >
                <view class="p-20rpx flex">
                  <!-- 商品图片 -->
                  <image 
                    :src="item.image" 
                    class="w-180rpx h-180rpx rounded-12rpx object-cover" 
                    mode="aspectFill"
                    @tap="viewGoodsDetail(item.goodsId)"
                  />
                  
                  <!-- 商品信息 -->
                  <view class="flex-1 ml-20rpx flex flex-col justify-between">
                    <view @tap="viewGoodsDetail(item.goodsId)">
                      <view class="text-28rpx text-#333 line-clamp-2">{{ item.name }}</view>
                      
                      <!-- 店铺信息 -->
                      <view class="flex items-center mt-10rpx">
                        <image :src="item.seller.avatar" class="w-30rpx h-30rpx rounded-full mr-8rpx"/>
                        <text class="text-24rpx text-gray-500">{{ item.seller.nickname }}</text>
                        <view v-if="item.seller.isVerified" class="ml-10rpx px-6rpx py-2rpx bg-blue-50 rounded-4rpx">
                          <text class="text-20rpx text-blue-500">已认证</text>
                        </view>
                      </view>
                    </view>
                    
                    <view class="flex justify-between items-end">
                      <view>
                        <text class="text-30rpx text-#f43f5e font-bold">¥{{ item.price }}</text>
                        <text class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ item.originPrice }}</text>
                      </view>
                      
                      <view 
                        class="px-20rpx py-8rpx border border-gray-300 rounded-full"
                        @tap="removeFavorite(item.id)"
                      >
                        <text class="text-24rpx text-gray-600">取消收藏</text>
                      </view>
                    </view>
                  </view>
                </view>
                
                <!-- 收藏时间 -->
                <view class="px-20rpx py-10rpx border-t border-gray-100">
                  <text class="text-22rpx text-gray-500">收藏于 {{ formatTime(item.time) }}</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 收藏夹为空 -->
          <view v-else-if="!refreshing" class="h-100vh flex flex-col items-center justify-center">
            <WdIcon name="heart" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
            <text class="text-30rpx text-gray-500 mb-50rpx">收藏夹空空如也~</text>
            <view 
              class="px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-md shadow-pink-200"
              @tap="continueToShop"
            >
              <text class="text-30rpx text-white font-medium">去逛逛</text>
            </view>
          </view>
        </template>

        <!-- 加载更多指示器 -->
        <view v-if="loading" class="flex justify-center items-center py-20rpx">
          <WdIcon name="loading" size="40rpx" custom-style="color:#666" />
          <text class="ml-10rpx text-26rpx text-#666">加载更多...</text>
        </view>
        
        <!-- 无更多数据提示 -->
        <view v-if="!hasMore && currentGoods.length > 0" class="flex justify-center items-center py-20rpx">
          <text class="text-26rpx text-#999">— 没有更多内容了 —</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
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
</style>
