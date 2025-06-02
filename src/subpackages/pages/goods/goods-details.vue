<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import GoodsInfo from '@/subpackages/components/goods/info.vue'
import InputSection from '@/components/InputSection.vue'

const router = useRouter()

// 商品ID
const goodsId = ref(null)

// 加载状态
const loading = ref(true)
const showAllDesc = ref(false)

// 商品数据
const goods = reactive({
  id: 1,
  name: 'OPPO A8 石榴红 6G+128G 国行版本',
  price: 215,
  originPrice: 999,
  images: [
    'https://picsum.photos/600/600?random=1',
    'https://picsum.photos/600/600?random=2',
    'https://picsum.photos/600/600?random=3',
    'https://picsum.photos/600/600?random=4',
    'https://picsum.photos/600/600?random=5',
    'https://picsum.photos/600/600?random=6'
  ],
  desc: '9新，无破损，无任何功能问题，机身完美，已贴膜，送充电器和数据线，ID账号已退出，可直接激活使用，不议价包邮',
  isReal: true,
  isCertified: true,
  views: 53,
  likes: 0,
  sales: 151,
  goodRate: '92%',
  location: '揭阳普宁',
  publishTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  
  // 动态规格信息字段 - 适配不同商品类型
  brand: 'OPPO',
  model: 'A8',
  version: '国行',
  capacity: '6G+128G',
  color: '石榴红',
  condition: '无磨损或缺失',
  display: '无明显异常',
  function: '无任何功能问题',
  purchaseTime: '2022年12月',
  
  seller: {
    id: 101,
    nickname: '精品二手机',
    avatar: 'https://picsum.photos/100/100?random=1',
    isVerified: true,
    totalDeals: 151,
    rating: 4.5
  },
  comments: [
    { id: 1, user: '甜甜宝贝', content: '不错', time: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000) },
    { id: 2, user: '张雨绮女士', content: '看着不错', time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }
  ]
})

// 当前轮播图索引
const currentSwiperIndex = ref(0)

// 设置商品类型
const goodsType = ref('phone')

// 商品描述是否超长（3行）
const descRef = ref(null)
const isDescOverflow = ref(false)

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

// 轮播图片轮播时触发
const onSwiperChange = (event) => {
  currentSwiperIndex.value = event.detail.current
}

// 收藏商品
const handleLike = () => {
  goods.likes = goods.likes ? 0 : 1
  uni.showToast({
    title: goods.likes ? '已收藏' : '已取消收藏',
    icon: 'none'
  })
}

// 展开/收起描述
const toggleDescription = () => {
  showAllDesc.value = !showAllDesc.value
}

// 分享商品
const shareGoods = () => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

// 跳转到商家店铺
const goToSeller = () => {
  router.push({
    name: 'seller_shop',
    query: {
      id: goods.seller.id
    }
  })
}

// 联系卖家
const contactSeller = () => {
  router.push({
    name: 'private_chat',
    params: {
      goodsId: 1001,
    }
  })
}

// 立即购买
const handleBuy = () => {
  uni.showModal({
    title: '提示',
    content: '确定要购买此商品吗？',
    success: (res) => {
      if (res.confirm) {
        router.push({
          name: 'order_confirm',
          query: {
            id: goods.id
          }
        })
      }
    }
  })
}

// 显示更多图片
const viewAllImages = () => {
  uni.previewImage({
    urls: goods.images,
    current: goods.images[currentSwiperIndex.value]
  })
}

// 留言弹窗相关
const commentsDialogVisible = ref(false)
const commentInput = ref('')
const isSubmitting = ref(false)

// 打开留言弹窗
const openCommentsDialog = () => {
  commentsDialogVisible.value = true
}

// 关闭留言弹窗
const closeCommentsDialog = () => {
  commentsDialogVisible.value = false
}

// 发送留言
const handleSendComment = async (text) => {
  if (!text.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  // 模拟发送留言的网络请求
  try {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 添加新留言
    goods.comments.unshift({
      id: Date.now(),
      user: '我',
      content: text,
      time: new Date()
    })
    
    // 重置输入
    commentInput.value = ''
    
    uni.showToast({
      title: '留言成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: '留言失败，请重试',
      icon: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

onLoad((options) => {
  goodsId.value = options.id
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
})

onMounted(() => {
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
    // 检查描述是否超长
    checkDescOverflow()
  }, 500)
})

const checkDescOverflow = () => {
  if (!descRef.value) return
  // 这里假设每行44rpx，3行=132rpx，实际项目可根据字体和行高微调
  // 由于uniapp不支持直接获取scrollHeight，需用原生js
  const el = descRef.value.$el || descRef.value
  if (el && el.scrollHeight && el.offsetHeight) {
    isDescOverflow.value = el.scrollHeight > el.offsetHeight + 2 // 容错2px
  }
}
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">商品详情</view>
    </template>
    <template #right>
      <view class="flex items-center h-full" @tap="shareGoods">
        <WdIcon
          name="share-o"
          size="40rpx"
          color="#333"
        />
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>

      <template v-else>
        <!-- 商品轮播图 -->
        <view class="relative bg-white">
          <swiper 
            class="w-full h-750rpx" 
            circular 
            autoplay 
            indicator-dots 
            indicator-active-color="#f43f5e"
            @change="onSwiperChange"
          >
            <swiper-item v-for="(image, index) in goods.images" :key="index" @tap="viewAllImages">
              <image 
                :src="image" 
                mode="aspectFill" 
                class="w-full h-full transition-opacity duration-300"
              />
            </swiper-item>
          </swiper>
          
          <!-- 实拍标签 -->
          <view v-if="goods.isReal" class="absolute top-30rpx left-30rpx z-10 bg-#000000 bg-opacity-60 rounded-8rpx px-15rpx py-6rpx">
            <text class="text-24rpx text-white font-medium">实拍</text>
          </view>
          
          <!-- 页码提示 -->
          <view class="absolute bottom-30rpx right-30rpx z-10 bg-#000000 bg-opacity-60 rounded-full px-20rpx py-6rpx">
            <text class="text-24rpx text-white">{{ currentSwiperIndex + 1 }}/{{ goods.images.length }}</text>
          </view>
        </view>
        
        <!-- 价格区域 -->
        <view class="px-30rpx py-30rpx bg-white">
          <view class="flex items-end">
            <text class="text-46rpx font-bold text-#f43f5e mr-15rpx">¥{{ goods.price }}</text>
            <text class="text-28rpx text-gray-400 line-through">¥{{ goods.originPrice }}</text>
          </view>
          
          <!-- 商品名称和关注按钮 -->
          <view class="flex justify-between items-start mt-15rpx">
            <view class="flex-1 pr-20rpx">
              <text class="text-34rpx text-#333 leading-48rpx break-words">{{ goods.name }}</text>
            </view>
            <view 
              class="flex flex-col items-center justify-center"
              @tap="handleLike"
            >
              <view class="w-60rpx h-60rpx rounded-full flex items-center justify-center mb-6rpx transition-all duration-300" :class="goods.likes ? 'animate-heartbeat' : ''">
                <WdIcon 
                  :name="goods.likes ? 'like' : 'like-o'" 
                  size="44rpx" 
                  :custom-style="goods.likes ? 'color:#f43f5e' : 'color:#999'"
                />
              </view>
              <text class="text-22rpx text-gray-400">收藏</text>
            </view>
          </view>
          
          <!-- 浏览量 -->
          <view class="flex mt-15rpx">
            <text class="text-24rpx text-gray-400">浏览 {{ goods.views }}</text>
          </view>
        </view>
        
        <!-- 自由市场交易指南 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between">
            <text class="text-30rpx text-#333 font-medium">自由市场交易指南</text>
            <view class="flex items-center" @tap="router.push({name: 'market_guide'})">
              <text class="text-26rpx text-gray-500">点击查看，更懂自由市场</text>
              <WdIcon name="arrow" size="28rpx" custom-style="color:#999" class="ml-8rpx"/>
            </view>
          </view>
        </view>
        
        <!-- 宝贝信息 - 使用组件 -->
        <view class="mt-20rpx">
          <GoodsInfo :goods="goods" :goods-type="goodsType" />
        </view>
        
        <!-- 商品描述 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="mb-20rpx">
            <text class="text-30rpx text-#333 font-medium">商品描述</text>
          </view>
          <view class="relative">
            <text 
              ref="descRef"
              class="text-28rpx text-#333 leading-44rpx break-words"
              :class="{'line-clamp-3': !showAllDesc}"
            >{{ goods.desc }}</text>
            <view 
              v-if="isDescOverflow && !showAllDesc"
              class="flex justify-center items-center mt-10rpx" 
              @tap="toggleDescription"
            >
              <text class="text-26rpx text-#f43f5e">展开</text>
              <WdIcon 
                name="arrow-down" 
                size="24rpx" 
                custom-style="color:#f43f5e" 
                class="ml-8rpx"
              />
            </view>
            <view 
              v-if="isDescOverflow && showAllDesc"
              class="flex justify-center items-center mt-10rpx" 
              @tap="toggleDescription"
            >
              <text class="text-26rpx text-#f43f5e">收起</text>
              <WdIcon 
                name="arrow-up" 
                size="24rpx" 
                custom-style="color:#f43f5e" 
                class="ml-8rpx"
              />
            </view>
          </view>
        </view>
        
        <!-- 卖家信息 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between" @tap="goToSeller">
            <view class="flex items-center">
              <image :src="goods.seller.avatar" class="w-80rpx h-80rpx rounded-full mr-20rpx"/>
              <view class="flex flex-col">
                <view class="flex items-center">
                  <text class="text-30rpx text-#333 font-medium mr-10rpx">{{ goods.seller.nickname }}</text>
                  <view v-if="goods.seller.isVerified" class="px-8rpx py-4rpx bg-blue-500 bg-opacity-10 rounded-4rpx flex items-center">
                    <WdIcon name="certificate" size="24rpx" custom-style="color:#1989fa" class="mr-4rpx"/>
                    <text class="text-20rpx text-blue-500">实人认证</text>
                  </view>
                </view>
                <view class="flex items-center mt-8rpx">
                  <text class="text-24rpx text-gray-500">在自由市场交易了{{ goods.seller.totalDeals }}次，好评率{{ goods.goodRate }}，信用较好。</text>
                </view>
              </view>
            </view>
            <WdIcon name="arrow" size="32rpx" custom-style="color:#999"/>
          </view>
          
          <!-- 分割线 -->
          <view class="h-2rpx bg-gray-100 my-30rpx"></view>
          
          <!-- 卖家位置 -->
          <view class="flex items-center">
            <WdIcon name="location-o" size="32rpx" custom-style="color:#999" class="mr-15rpx"/>
            <text class="text-26rpx text-gray-500">发布于{{ goods.location }}</text>
            <text class="mx-15rpx text-gray-300">|</text>
            <text class="text-26rpx text-gray-500">{{ formatTime(goods.publishTime) }}</text>
          </view>
        </view>
        
        <!-- 留言区 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between mb-20rpx">
            <text class="text-30rpx text-#333 font-medium">留言区</text>
            <view class="flex items-center" @tap="openCommentsDialog">
              <text class="text-26rpx text-blue-500 font-medium hover:underline transition-all duration-300">查看全部{{ goods.comments.length ? goods.comments.length : '' }}条留言</text>
              <WdIcon name="arrow" size="28rpx" custom-style="color:#3b82f6" class="ml-8rpx"/>
            </view>
          </view>
          
          <!-- 留言列表预览 -->
          <view v-if="goods.comments.length">
            <view 
              v-for="comment in goods.comments.slice(0, 2)" 
              :key="comment.id"
              class="flex items-start py-20rpx border-b border-gray-100 last:border-none"
            >
              <image src="https://picsum.photos/100/100" class="w-60rpx h-60rpx rounded-full mr-20rpx"/>
              <view class="flex-1">
                <view class="flex justify-between items-center">
                  <text class="text-26rpx text-#333">{{ comment.user }}</text>
                  <text class="text-22rpx text-gray-400">{{ formatTime(comment.time) }}</text>
                </view>
                <text class="text-28rpx text-#333 mt-10rpx">{{ comment.content }}</text>
              </view>
            </view>
          </view>
          
          <!-- 无留言状态 -->
          <view v-else class="py-30rpx flex items-center justify-center flex-col">
            <WdIcon name="comment-o" size="60rpx" custom-style="color:#ddd" class="mb-15rpx"/>
            <text class="text-26rpx text-gray-400">暂无留言</text>
          </view>
          
          <!-- 留言输入框 -->
          <view class="flex items-center mt-30rpx bg-gray-100 rounded-full px-30rpx py-15rpx" @tap="openCommentsDialog">
            <WdIcon name="edit" size="32rpx" custom-style="color:#999" class="mr-15rpx"/>
            <text class="text-28rpx text-gray-400">问问更多细节问题</text>
          </view>
        </view>
        
        <!-- 官方提示 -->
        <view class="mt-20rpx mb-30rpx px-30rpx py-30rpx bg-white rounded-16rpx">
          <view class="flex items-start">
            <view class="flex-shrink-0 mr-20rpx">
              <WdIcon name="info-o" size="40rpx" custom-style="color:#f43f5e"/>
            </view>
            <view>
              <text class="text-26rpx text-#333 leading-40rpx">特别提示：请千万不要脱离平台进行交易，避免财物损失。谨防通过微信、支付宝加好友进行商品支付、转账、付押金等欺诈行为！</text>
            </view>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 h-130rpx bg-white border-t border-gray-100 flex items-center justify-between px-30rpx z-50">
      <view class="flex items-center">
        <view class="flex flex-col items-center mr-40rpx" @tap="handleLike">
          <WdIcon 
            :name="goods.likes ? 'star' : 'star-filled'" 
            size="44rpx" 
            :custom-style="goods.likes ? 'color:#f43f5e' : 'color:#999'"
          />
          <text class="text-22rpx text-gray-500 mt-5rpx">收藏</text>
        </view>
        <view class="flex flex-col items-center mr-40rpx" @tap="openCommentsDialog">
          <WdIcon name="chat1" size="44rpx" custom-style="color:#999"/>
          <text class="text-22rpx text-gray-500 mt-5rpx">留言</text>
        </view>
        <view class="flex flex-col items-center" @tap="contactSeller">
          <WdIcon name="service" size="44rpx" custom-style="color:#999"/>
          <text class="text-22rpx text-gray-500 mt-5rpx">联系</text>
        </view>
      </view>
      
      <view class="flex">
        <button 
          class="flex items-center justify-center h-90rpx w-240rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 text-white text-32rpx font-medium"
          @tap="handleBuy"
        >
          直接买¥{{ goods.price }}
        </button>
      </view>
    </view>
    
    <!-- 留言弹窗 -->
    <view 
      v-if="commentsDialogVisible" 
      @tap="closeCommentsDialog"
      class="fixed inset-0 bg-black bg-opacity-50 z-200 flex flex-col justify-end transition-all duration-300"
      :class="commentsDialogVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <!-- 弹窗内容 - 防止点击穿透 -->
      <view 
        @tap.stop 
        class="bg-white rounded-t-32rpx flex flex-col transform transition-all duration-300"
        :class="commentsDialogVisible ? 'translate-y-0' : 'translate-y-full'"
        style="max-height: 85vh;"
      >
        <!-- 弹窗头部 -->
        <view class="relative flex justify-center items-center py-30rpx border-b border-gray-100">
          <text class="text-32rpx font-bold">留言（{{ goods.comments.length }}）</text>
          <view class="absolute right-30rpx" @tap="closeCommentsDialog">
            <WdIcon name="x" size="40rpx" color="#666" />
          </view>
        </view>
        
        <!-- 留言列表 -->
        <scroll-view 
          scroll-y 
          class="px-30rpx py-20rpx"
          style="height: 60vh; overflow-y: auto;"
        >
          <view v-if="goods.comments.length">
            <view 
              v-for="comment in goods.comments" 
              :key="comment.id"
              class="flex items-start py-20rpx border-b border-gray-100 last:border-none"
            >
              <image src="https://picsum.photos/100/100" class="w-60rpx h-60rpx rounded-full mr-20rpx"/>
              <view class="flex-1">
                <view class="flex justify-between items-center">
                  <text class="text-26rpx text-#333 font-medium">{{ comment.user }}</text>
                  <text class="text-22rpx text-gray-400">{{ formatTime(comment.time) }}</text>
                </view>
                <text class="text-28rpx text-#333 mt-10rpx">{{ comment.content }}</text>
              </view>
            </view>
          </view>
          
          <!-- 无留言状态 -->
          <view v-else class="py-30rpx flex items-center justify-center flex-col">
            <WdIcon name="comment-o" size="60rpx" custom-style="color:#ddd" class="mb-15rpx"/>
            <text class="text-26rpx text-gray-400">暂无留言</text>
          </view>
        </scroll-view>
        
        <!-- 底部留言输入框 -->
        <view class="p-20rpx border-t border-gray-200 bg-white">
          <InputSection
            v-model="commentInput"
            placeholder="留言..."
            :show-emoji="true"
            send-button-text="发送"
            @send="handleSendComment"
          />
        </view>
      </view>
    </view>
  </layout>
</template>

<style>
.animate-heartbeat {
  animation: heartbeat 1.2s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.2);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.2);
  }
}
</style>