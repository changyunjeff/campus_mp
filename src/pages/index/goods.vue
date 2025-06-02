<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive } from 'vue'
import { useRouter } from 'uni-mini-router'
import { formatTime } from '@/utils/time'
import User from '/static/images/user.png'
import events from '@/utils/events'
import { debounce, throttle } from 'lodash'
import {onLoad, onPullDownRefresh, onReachBottom} from '@dcloudio/uni-app'

const { show } = useTabbar()
const router = useRouter()

// 商品分类
const categories = [
  {id: 1, name: '手机', icon: 'phone-o', color: '#ff7043'},
  {id: 2, name: '数码', icon: 'watch-o', color: '#26a69a'},
  {id: 3, name: '美妆', icon: 'gift-o', color: '#ec407a'},
  {id: 4, name: '四级', icon: 'bookmark-o', color: '#5c6bc0'},
  {id: 5, name: '明星周边', icon: 'star-o', color: '#ffc107'},
  {id: 6, name: '母婴', icon: 'cart-o', color: '#8d6e63'},
  {id: 7, name: '游戏交易', icon: 'play-circle-o', color: '#7e57c2'},
  {id: 8, name: '潮玩动漫', icon: 'smile-o', color: '#42a5f5'},
  {id: 9, name: '交通工具', icon: 'logistics', color: '#ef5350'},
  {id: 10, name: '家电', icon: 'bulb-o', color: '#66bb6a'}
]

// 模拟商品数据
const goods = reactive([
  {
    id: 1,
    title: 'iPhone 13 红色 128G 99新',
    price: 3899,
    originPrice: 4599,
    images: [User],
    location: '东莞',
    publishTime: Date.now() - 2 * 60 * 60 * 1000,
    seller: {
      id: 101,
      nickname: '科技数码控',
      avatar: User
    },
    isReal: true, // 实拍
    isCertified: true, // 官方验证
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
    seller: {
      id: 102,
      nickname: '玩具收藏家',
      avatar: User
    },
    isReal: false,
    isCertified: true,
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
    seller: {
      id: 103,
      nickname: '数码回收站',
      avatar: User
    },
    isReal: true,
    isCertified: false,
    views: 78,
    likes: 12
  },
  {
    id: 4,
    title: '行者 明星亲笔签名照片 限量版',
    price: 46,
    originPrice: 99,
    images: [User],
    location: '重庆',
    publishTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    seller: {
      id: 104,
      nickname: '明星周边铺',
      avatar: User
    },
    isReal: true,
    isCertified: false,
    views: 256,
    likes: 64
  },
  {
    id: 5,
    title: '2023 iPad Pro 12.9寸 M2芯片 256G WIFI',
    price: 4500,
    originPrice: 8999,
    images: [User],
    location: '东莞',
    publishTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    seller: {
      id: 105,
      nickname: '苹果数码专营',
      avatar: User
    },
    isReal: true,
    isCertified: true,
    views: 320,
    likes: 76
  }
])

// 搜索关键词
const searchKeyword = ref('')

// 处理tab切换
const handleTabChange = throttle((tabName) => {
  console.log('切换到标签:', tabName)
  // 这里可以根据选中的tab加载不同的内容
}, 1000)

// 处理分类点击
const handleCategoryClick = throttle((category) => {
  console.log('选择分类:', category.name)
  // 跳转到分类详情页
  router.push({
    name: 'categories',
    params: {
      name: category.name,
      id: category.id
    }
  })
}, 1000)

// 处理商品点击
const viewGoodsDetail = throttle((goodsId) => {
  console.log('查看商品详情:', goodsId)
  // 跳转到商品详情页
  router.push({
    name: 'goods-details',
    params: {
      id: goodsId
    }
  })
}, 1000)

// 收藏商品
const handleLike = throttle((goods, event) => {
  event.stopPropagation()
  goods.likes = goods.likes ? goods.likes - 1 : 0
  console.log('收藏商品:', goods.id)
}, 1000)

// 跳转到搜索页
const goToSearch = () => {
  router.push({
    name: 'search',
    params: {
      type: 'goods'
    }
  })
}

// 长按操作
const actions = [
  {
    name: "收藏",
  },
  {
    name: "分享",
  },
  {
    name: "举报",
  }
]

const title = "商品操作"

const handleLongPress = (goods) => {
  console.log('长按商品:', goods.id)
  events.emit('openActionSheet', actions, title)
}

onMounted(() => {
  show()
})
</script>

<template>
  <layout>
    <template #left>

    </template>
    <template #center>
      <!-- 搜索框 -->
      <view class="p-20rpx">
        <view class="relative flex items-center bg-white rounded-full p-20rpx px-30rpx border border-gray-200 shadow-sm">
          <WdIcon name="search" size="40rpx" color="#999"/>
          <input
              type="text"
              v-model="searchKeyword"
              class="flex-1 ml-20rpx text-30rpx text-#333 placeholder-gray-400"
              placeholder="手机"
              disabled
              @tap="goToSearch"
          />
        </view>
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 免责声明 -->
      <view class="px-20rpx mb-20rpx">
        <view class="w-full py-10rpx text-center text-24rpx text-gray-500 bg-gray-100 bg-opacity-70 rounded-full">
          自由市场商品由个人发布，未经官方验证，请自行交流购买
        </view>
      </view>

      <!-- 分类导航 -->
      <view class="p-20rpx bg-white rounded-16rpx mx-20rpx mb-20rpx shadow-sm">
        <view class="grid grid-cols-5 gap-20rpx">
          <view 
            v-for="category in categories" 
            :key="category.id" 
            class="flex flex-col items-center transition-all duration-300 active:scale-95"
            @tap="handleCategoryClick(category)"
          >
            <view class="w-80rpx h-80rpx rounded-full mb-10rpx flex items-center justify-center" :style="`background-color: ${category.color}20;`">
              <WdIcon 
                custom-class="iconfont" class-prefix="icon"
                :name="category.icon" 
                size="40rpx" 
                :custom-style="`color: ${category.color}`"
              />
            </view>
            <text class="text-24rpx text-#333 truncate w-full text-center">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="px-20rpx">
        <view class="grid grid-cols-2 gap-20rpx">
          <view 
            v-for="item in goods" 
            :key="item.id" 
            class="bg-white rounded-16rpx overflow-hidden shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
            @tap="viewGoodsDetail(item.id)"
            @longpress="handleLongPress(item)"
          >
            <!-- 商品主图 -->
            <view class="relative">
              <image 
                :src="item.images[0]" 
                mode="aspectFill" 
                class="w-full h-240rpx object-cover"
              ></image>
              
              <!-- 实拍标签 -->
              <view v-if="item.isReal" class="absolute top-10rpx left-10rpx bg-black bg-opacity-60 rounded-8rpx px-10rpx py-4rpx">
                <text class="text-20rpx text-white font-medium">实拍</text>
              </view>
              
              <!-- 收藏按钮 -->
              <view 
                class="absolute top-10rpx right-10rpx w-60rpx h-60rpx rounded-full bg-black bg-opacity-40 flex items-center justify-center transition-all duration-300 active:scale-90 active:bg-opacity-60"
                @tap.stop="handleLike(item, $event)"
              >
                <WdIcon 
                  custom-class="iconfont" class-prefix="icon"
                  name="like-o" 
                  size="32rpx" 
                  custom-style="color:#fff"
                />
              </view>
            </view>
            
            <!-- 商品信息 -->
            <view class="p-16rpx">
              <!-- 标题和价格 -->
              <text class="text-26rpx text-#333 line-clamp-2 h-72rpx">{{ item.title }}</text>
              <view class="flex items-center mt-10rpx">
                <text class="text-28rpx font-600 text-#f43f5e mr-8rpx">¥{{ item.price }}</text>
                <text class="text-22rpx text-gray-400 line-through">¥{{ item.originPrice }}</text>
              </view>
              
              <!-- 卖家信息和位置 -->
              <view class="flex justify-between items-center mt-10rpx">
                <view class="flex items-center">
                  <image :src="item.seller.avatar" class="w-32rpx h-32rpx rounded-full mr-8rpx"></image>
                  <text class="text-22rpx text-gray-500 truncate max-w-120rpx">{{ item.seller.nickname }}</text>
                  <!-- 官方验证标签 -->
                  <view v-if="item.isCertified" class="ml-6rpx px-6rpx py-2rpx bg-blue-500 bg-opacity-10 rounded-4rpx">
                    <text class="text-18rpx text-blue-500">验</text>
                  </view>
                </view>
                <view class="flex items-center">
                  <WdIcon name="location-o" size="22rpx" custom-style="color:#999" class="mr-2rpx"/>
                  <text class="text-22rpx text-gray-500">{{ item.location }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <custom-tab-bar/>
  </layout>
</template>

<style>
/* 使用UnoCSS原子类，无需额外CSS */
</style>