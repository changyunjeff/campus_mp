<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 加载状态
const loading = ref(true)

// 是否有登录
const isLoggedIn = ref(true)

// 收藏夹模式：grid 网格模式，list 列表模式
const viewMode = ref('grid')

// 切换查看模式
const toggleViewMode = () => {
  viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid'
}

// 收藏商品列表
const favorites = ref([
  {
    id: 1,
    goodsId: 101,
    name: 'OPPO A8 石榴红 6G+128G 国行版本',
    price: 215,
    originPrice: 999,
    image: 'https://picsum.photos/600/600?random=1',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    seller: {
      id: 201,
      nickname: '精品二手机',
      avatar: 'https://picsum.photos/100/100?random=1',
      isVerified: true
    }
  },
  {
    id: 2,
    goodsId: 102,
    name: 'JellyCAT 邦尼兔 30cm 全新正品',
    price: 215,
    originPrice: 329,
    image: 'https://picsum.photos/600/600?random=2',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    seller: {
      id: 202,
      nickname: '玩具收藏家',
      avatar: 'https://picsum.photos/100/100?random=2',
      isVerified: false
    }
  },
  {
    id: 3,
    goodsId: 103,
    name: 'VIVO X60 星夜蓝 256G 95新',
    price: 1299,
    originPrice: 2499,
    image: 'https://picsum.photos/600/600?random=3',
    time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    seller: {
      id: 203,
      nickname: '数码回收站',
      avatar: 'https://picsum.photos/100/100?random=3',
      isVerified: true
    }
  },
  {
    id: 4,
    goodsId: 104,
    name: '行者 明星亲笔签名照片 限量版',
    price: 46,
    originPrice: 99,
    image: 'https://picsum.photos/600/600?random=4',
    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    seller: {
      id: 204,
      nickname: '明星周边铺',
      avatar: 'https://picsum.photos/100/100?random=4',
      isVerified: false
    }
  },
  {
    id: 5,
    goodsId: 105,
    name: '2023 iPad Pro 12.9寸 M2芯片 256G WIFI',
    price: 4500,
    originPrice: 8999,
    image: 'https://picsum.photos/600/600?random=5',
    time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    seller: {
      id: 205,
      nickname: '苹果数码专营',
      avatar: 'https://picsum.photos/100/100?random=5',
      isVerified: true
    }
  },
  {
    id: 6,
    goodsId: 106,
    name: 'VIVO X100 Pro 自然棕 16G+512G 99新',
    price: 4999,
    originPrice: 6999,
    image: 'https://picsum.photos/600/600?random=6',
    time: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    seller: {
      id: 206,
      nickname: '手机数码优选',
      avatar: 'https://picsum.photos/100/100?random=6',
      isVerified: true
    }
  }
])

// 移除收藏
const removeFavorite = (itemId) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏此商品吗？',
    success: (res) => {
      if (res.confirm) {
        favorites.value = favorites.value.filter(item => item.id !== itemId)
        
        uni.showToast({
          title: '已取消收藏',
          icon: 'success'
        })
      }
    }
  })
}

// 跳转到商品详情页
const goToGoodsDetail = (goodsId) => {
  router.push({
    name: 'goods_details',
    query: {
      id: goodsId
    }
  })
}

// 继续购物
const continueToShop = () => {
  router.switchTab({
    name: 'index_goods'
  })
}

// 前往登录
const goToLogin = () => {
  router.push({
    name: 'login'
  })
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

onLoad(() => {
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
})

onShow(() => {
  // 每次显示页面时重新加载收藏数据
  // 实际项目中应调用接口获取最新收藏数据
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">我的收藏</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh pb-30rpx">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>
      
      <!-- 未登录提示 -->
      <view v-else-if="!isLoggedIn" class="h-100vh flex flex-col items-center justify-center">
        <WdIcon name="user-off" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
        <text class="text-30rpx text-gray-500 mb-50rpx">登录后才能查看收藏夹哦~</text>
        <view 
          class="px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-md shadow-pink-200"
          @tap="goToLogin"
        >
          <text class="text-30rpx text-white font-medium">立即登录</text>
        </view>
      </view>
      
      <!-- 收藏夹为空 -->
      <view v-else-if="favorites.length === 0" class="h-100vh flex flex-col items-center justify-center">
        <WdIcon name="heart" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
        <text class="text-30rpx text-gray-500 mb-50rpx">收藏夹空空如也~</text>
        <view 
          class="px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-md shadow-pink-200"
          @tap="continueToShop"
        >
          <text class="text-30rpx text-white font-medium">去逛逛</text>
        </view>
      </view>
      
      <!-- 收藏夹内容 -->
      <template v-else>
        <!-- 顶部操作栏 -->
        <view class="bg-white mb-20rpx px-30rpx py-20rpx flex justify-end">
          <view class="flex items-center" @tap="toggleViewMode">
            <WdIcon :name="viewMode === 'grid' ? 'list' : 'grid'" size="36rpx" custom-style="color:#666" class="mr-8rpx"/>
            <text class="text-26rpx text-gray-600">{{ viewMode === 'grid' ? '列表视图' : '网格视图' }}</text>
          </view>
        </view>
        
        <!-- 网格视图 -->
        <view v-if="viewMode === 'grid'" class="grid grid-cols-2 gap-20rpx px-20rpx">
          <view 
            v-for="(item, index) in favorites" 
            :key="item.id" 
            class="bg-white rounded-12rpx overflow-hidden animate-fade-in"
            :style="{ 'animation-delay': `${index * 0.05}s` }"
          >
            <!-- 商品图片 -->
            <view class="relative" @tap="goToGoodsDetail(item.goodsId)">
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
              <view @tap="goToGoodsDetail(item.goodsId)">
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
            v-for="(item, index) in favorites" 
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
                @tap="goToGoodsDetail(item.goodsId)"
              />
              
              <!-- 商品信息 -->
              <view class="flex-1 ml-20rpx flex flex-col justify-between">
                <view @tap="goToGoodsDetail(item.goodsId)">
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
      </template>
    </view>
  </layout>
</template>

<style scoped>
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 