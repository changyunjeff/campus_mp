<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'

const router = useRouter()

// 用户信息
const userInfo = ref({
  id: 'user123',
  nickname: '校园淘客',
  avatar: 'https://picsum.photos/200/200?random=1',
  level: 5,
  totalDeals: 23,
  goodRating: '98.5%',
  isVerified: true
})

// 页面数据状态
const loading = ref(true)
const activeTab = ref('published') // published, liked, sold, draft

// 商品数据
const goodsData = reactive({
  published: [], // 已发布
  liked: [],     // 已收藏
  sold: [],      // 已售出
  draft: []      // 草稿箱
})

// 统计数据
const statistics = ref({
  publishedCount: 0,
  likedCount: 0,
  soldCount: 0,
  draftCount: 0,
  viewsCount: 0,
  totalEarnings: 0
})

// 标签页配置
const tabs = [
  { key: 'published', name: '已发布', icon: 'shop-o' },
  { key: 'liked', name: '收藏', icon: 'like-o' },
  { key: 'sold', name: '已售', icon: 'success' },
  { key: 'draft', name: '草稿', icon: 'edit' }
]

// 计算当前标签页的商品列表
const currentGoodsList = computed(() => {
  return goodsData[activeTab.value] || []
})

// 计算当前标签页的统计数量
const currentCount = computed(() => {
  const countMap = {
    published: statistics.value.publishedCount,
    liked: statistics.value.likedCount,
    sold: statistics.value.soldCount,
    draft: statistics.value.draftCount
  }
  return countMap[activeTab.value] || 0
})

// 切换标签页
const switchTab = (tabKey) => {
  if (activeTab.value === tabKey) return
  
  activeTab.value = tabKey
  loadGoodsList()
}

// 格式化价格
const formatPrice = (price) => {
  return parseFloat(price).toFixed(2)
}

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time)
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

// 跳转到商品详情
const viewGoodsDetail = (goodsId) => {
  router.push({
    name: 'goods_details',
    query: { id: goodsId }
  })
}

// 编辑商品
const editGoods = (goodsId) => {
  router.push({
    name: 'goods_publish_submit',
    query: { id: goodsId, mode: 'edit' }
  })
}

// 删除商品
const deleteGoods = async (goodsItem, index) => {
  uni.showModal({
    title: '删除商品',
    content: '确定要删除此商品吗？删除后将无法恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          await GoodsApi.deleteGoods(goodsItem.id)
          
          // 从列表中移除
          goodsData[activeTab.value].splice(index, 1)
          
          // 更新统计数据
          if (activeTab.value === 'published') {
            statistics.value.publishedCount--
          }
          
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } catch (error) {
          console.error('删除商品失败:', error)
          uni.showToast({
            title: '删除失败',
            icon: 'none'
          })
        }
      }
    }
  })
}

// 取消收藏
const unfavoriteGoods = async (goodsItem, index) => {
  try {
    await GoodsApi.unlikeGoods(goodsItem.id)
    
    // 从收藏列表中移除
    goodsData.liked.splice(index, 1)
    statistics.value.likedCount--
    
    uni.showToast({
      title: '已取消收藏',
      icon: 'success'
    })
  } catch (error) {
    console.error('取消收藏失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}

// 发布商品
const publishGoods = () => {
  router.push({
    name: 'goods_publish_category'
  })
}

// 跳转到地址管理
const goToAddresses = () => {
  router.push({
    name: 'goods_addresses'
  })
}

// 跳转到收藏页面
const goToFavorites = () => {
  router.push({
    name: 'goods_favorites'
  })
}

// 模拟数据
const mockGoodsData = () => {
  const mockGoods = (count, status = 'published') => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${status}_${Date.now()}_${i}`,
      title: `${status === 'liked' ? '收藏的' : ''}商品${i + 1} OPPO A8 石榴红 6G+128G 国行版本`,
      price: (Math.random() * 1000 + 100).toFixed(2),
      originalPrice: (Math.random() * 1000 + 500).toFixed(2),
      image: `https://picsum.photos/300/300?random=${Date.now() + i}`,
      status: status,
      views: Math.floor(Math.random() * 1000),
      likes: Math.floor(Math.random() * 100),
      publishTime: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      isReal: Math.random() > 0.5,
      isCertified: Math.random() > 0.7
    }))
  }

  goodsData.published = mockGoods(8, 'published')
  goodsData.liked = mockGoods(5, 'liked')
  goodsData.sold = mockGoods(3, 'sold')
  goodsData.draft = mockGoods(2, 'draft')

  statistics.value = {
    publishedCount: goodsData.published.length,
    likedCount: goodsData.liked.length,
    soldCount: goodsData.sold.length,
    draftCount: goodsData.draft.length,
    viewsCount: 2340,
    totalEarnings: 5680.50
  }
}

onLoad(() => {
  // 模拟加载数据
  setTimeout(() => {
    mockGoodsData()
    loading.value = false
  }, 500)
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">我的商品</view>
    </template>
    <template #right>
      <view class="flex items-center h-full" @tap="publishGoods">
        <WdIcon
          name="plus"
          size="40rpx"
          color="#f43f5e"
        />
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 用户信息卡片 -->
      <view class="bg-white mx-20rpx mt-20rpx rounded-16rpx p-30rpx shadow-sm">
        <view class="flex items-center">
          <image :src="userInfo.avatar" class="w-100rpx h-100rpx rounded-full mr-20rpx"/>
          <view class="flex-1">
            <view class="flex items-center mb-10rpx">
              <text class="text-32rpx font-bold text-#333 mr-15rpx">{{ userInfo.nickname }}</text>
              <view v-if="userInfo.isVerified" class="px-10rpx py-4rpx bg-blue-500 bg-opacity-10 rounded-6rpx">
                <text class="text-20rpx text-blue-500">已认证</text>
              </view>
            </view>
            <view class="flex items-center text-26rpx text-gray-500">
              <text class="mr-30rpx">等级 LV{{ userInfo.level }}</text>
              <text class="mr-30rpx">交易{{ userInfo.totalDeals }}次</text>
              <text>好评{{ userInfo.goodRating }}</text>
            </view>
          </view>
        </view>
        
        <!-- 统计数据 -->
        <view class="grid grid-cols-3 gap-20rpx mt-30rpx pt-30rpx border-t border-gray-100">
          <view class="text-center">
            <text class="block text-32rpx font-bold text-#f43f5e">{{ statistics.viewsCount }}</text>
            <text class="text-24rpx text-gray-500">浏览量</text>
          </view>
          <view class="text-center">
            <text class="block text-32rpx font-bold text-#f43f5e">{{ statistics.soldCount }}</text>
            <text class="text-24rpx text-gray-500">已售出</text>
          </view>
          <view class="text-center">
            <text class="block text-32rpx font-bold text-#f43f5e">¥{{ formatPrice(statistics.totalEarnings) }}</text>
            <text class="text-24rpx text-gray-500">总收入</text>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="bg-white mx-20rpx mt-20rpx rounded-16rpx p-30rpx shadow-sm">
        <view class="flex justify-around">
          <view class="flex flex-col items-center" @tap="publishGoods">
            <view class="w-80rpx h-80rpx rounded-full bg-#f43f5e bg-opacity-10 flex items-center justify-center mb-10rpx">
              <WdIcon name="plus" size="40rpx" custom-style="color:#f43f5e"/>
            </view>
            <text class="text-26rpx text-gray-600">发布商品</text>
          </view>
          <view class="flex flex-col items-center" @tap="goToFavorites">
            <view class="w-80rpx h-80rpx rounded-full bg-orange-500 bg-opacity-10 flex items-center justify-center mb-10rpx">
              <WdIcon name="like-o" size="40rpx" custom-style="color:#f97316"/>
            </view>
            <text class="text-26rpx text-gray-600">我的收藏</text>
          </view>
          <view class="flex flex-col items-center" @tap="goToAddresses">
            <view class="w-80rpx h-80rpx rounded-full bg-blue-500 bg-opacity-10 flex items-center justify-center mb-10rpx">
              <WdIcon name="location-o" size="40rpx" custom-style="color:#3b82f6"/>
            </view>
            <text class="text-26rpx text-gray-600">地址管理</text>
          </view>
        </view>
      </view>

      <!-- 标签页导航 -->
      <view class="bg-white mx-20rpx mt-20rpx rounded-16rpx shadow-sm">
        <scroll-view scroll-x class="whitespace-nowrap">
          <view class="flex p-20rpx">
            <view 
              v-for="tab in tabs" 
              :key="tab.key"
              class="flex items-center px-30rpx py-15rpx rounded-full mr-20rpx transition-all duration-300"
              :class="activeTab === tab.key ? 'bg-#f43f5e text-white' : 'bg-gray-100 text-gray-600'"
              @tap="switchTab(tab.key)"
            >
              <WdIcon 
                :name="tab.icon" 
                size="28rpx" 
                :custom-style="activeTab === tab.key ? 'color:white' : 'color:#9ca3af'"
                class="mr-10rpx"
              />
              <text class="text-26rpx">{{ tab.name }}</text>
              <text v-if="currentCount > 0" class="ml-8rpx text-22rpx">({{ currentCount }})</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 商品列表 -->
      <view class="mx-20rpx mt-20rpx">
        <!-- 加载状态 -->
        <view v-if="loading" class="text-center py-80rpx">
          <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
          <text class="block text-26rpx text-gray-400 mt-20rpx">加载中...</text>
        </view>
        
        <!-- 空状态 -->
        <view v-else-if="currentGoodsList.length === 0" class="bg-white rounded-16rpx py-80rpx flex flex-col items-center">
          <WdIcon 
            :name="activeTab === 'liked' ? 'like-o' : 'shop-o'" 
            size="100rpx" 
            custom-style="color:#ddd" 
            class="mb-20rpx"
          />
          <text class="text-28rpx text-gray-400 mb-40rpx">
            {{ activeTab === 'liked' ? '还没有收藏任何商品' : activeTab === 'draft' ? '暂无草稿' : '还没有发布商品' }}
          </text>
          <view 
            v-if="activeTab === 'published' || activeTab === 'draft'"
            class="px-40rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full"
            @tap="publishGoods"
          >
            <text class="text-28rpx text-white">发布第一件商品</text>
          </view>
        </view>
        
        <!-- 商品网格 -->
        <view v-else class="grid grid-cols-2 gap-20rpx">
          <view 
            v-for="(item, index) in currentGoodsList" 
            :key="item.id"
            class="bg-white rounded-16rpx overflow-hidden shadow-sm transition-all duration-300 active:scale-98"
          >
            <!-- 商品图片 -->
            <view class="relative" @tap="viewGoodsDetail(item.id)">
              <image 
                :src="item.image" 
                mode="aspectFill" 
                class="w-full h-240rpx object-cover"
              />
              
              <!-- 状态标签 -->
              <view class="absolute top-10rpx left-10rpx flex">
                <view v-if="item.isReal" class="bg-black bg-opacity-60 rounded-6rpx px-8rpx py-4rpx mr-8rpx">
                  <text class="text-20rpx text-white">实拍</text>
                </view>
                <view v-if="item.status === 'sold'" class="bg-gray-600 bg-opacity-80 rounded-6rpx px-8rpx py-4rpx">
                  <text class="text-20rpx text-white">已售</text>
                </view>
                <view v-if="item.status === 'draft'" class="bg-orange-500 bg-opacity-80 rounded-6rpx px-8rpx py-4rpx">
                  <text class="text-20rpx text-white">草稿</text>
                </view>
              </view>
              
              <!-- 操作按钮 -->
              <view class="absolute top-10rpx right-10rpx">
                <view 
                  v-if="activeTab === 'liked'"
                  class="w-50rpx h-50rpx rounded-full bg-black bg-opacity-40 flex items-center justify-center"
                  @tap.stop="unfavoriteGoods(item, index)"
                >
                  <WdIcon name="heart-off" size="28rpx" color="#fff"/>
                </view>
              </view>
            </view>
            
            <!-- 商品信息 -->
            <view class="p-16rpx">
              <text class="text-26rpx text-#333 line-clamp-2 h-72rpx" @tap="viewGoodsDetail(item.id)">{{ item.title }}</text>
              <view class="flex items-center mt-10rpx">
                <text class="text-28rpx font-600 text-#f43f5e mr-8rpx">¥{{ formatPrice(item.price) }}</text>
                <text class="text-22rpx text-gray-400 line-through">¥{{ formatPrice(item.originalPrice) }}</text>
              </view>
              
              <!-- 统计信息 -->
              <view class="flex justify-between items-center mt-10rpx text-gray-400 text-22rpx">
                <view class="flex items-center">
                  <WdIcon name="eye-o" size="20rpx" custom-style="color:#999" class="mr-4rpx"/>
                  <text>{{ item.views }}</text>
                </view>
                <text>{{ formatTime(item.publishTime) }}</text>
              </view>
              
              <!-- 操作按钮 -->
              <view v-if="activeTab === 'published' || activeTab === 'draft'" class="flex mt-15rpx gap-15rpx">
                <view 
                  class="flex-1 h-60rpx rounded-8rpx border border-gray-300 flex items-center justify-center"
                  @tap="editGoods(item.id)"
                >
                  <text class="text-24rpx text-gray-600">编辑</text>
                </view>
                <view 
                  class="flex-1 h-60rpx rounded-8rpx bg-#f43f5e flex items-center justify-center"
                  @tap="deleteGoods(item, index)"
                >
                  <text class="text-24rpx text-white">删除</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 底部安全距离 -->
      <view class="h-30rpx"></view>
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

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
