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

// 购物车商品列表
const cartItems = ref([
  {
    id: 1,
    goodsId: 101,
    name: 'OPPO A8 石榴红 6G+128G 国行版本',
    price: 215,
    originPrice: 999,
    image: 'https://picsum.photos/600/600?random=1',
    count: 1,
    selected: true,
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
    count: 1,
    selected: true,
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
    count: 2,
    selected: false,
    seller: {
      id: 203,
      nickname: '数码回收站',
      avatar: 'https://picsum.photos/100/100?random=3',
      isVerified: true
    }
  }
])

// 是否全选
const isAllSelected = computed(() => {
  return cartItems.value.length > 0 && cartItems.value.every(item => item.selected)
})

// 选中商品的数量
const selectedCount = computed(() => {
  return cartItems.value.filter(item => item.selected).reduce((total, item) => total + item.count, 0)
})

// 选中商品的总价
const totalPrice = computed(() => {
  return cartItems.value
    .filter(item => item.selected)
    .reduce((total, item) => total + item.price * item.count, 0)
})

// 总优惠金额
const totalDiscount = computed(() => {
  return cartItems.value
    .filter(item => item.selected)
    .reduce((total, item) => total + (item.originPrice - item.price) * item.count, 0)
})

// 选择或取消选择所有商品
const toggleSelectAll = () => {
  const newStatus = !isAllSelected.value
  cartItems.value.forEach(item => {
    item.selected = newStatus
  })
}

// 选择或取消选择单个商品
const toggleSelectItem = (item) => {
  item.selected = !item.selected
}

// 增加商品数量
const increaseCount = (item) => {
  // 实际项目中可能需要添加最大数量限制
  item.count++
}

// 减少商品数量
const decreaseCount = (item) => {
  if (item.count > 1) {
    item.count--
  }
}

// 删除购物车商品
const removeItem = (itemId) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除此商品吗？',
    success: (res) => {
      if (res.confirm) {
        cartItems.value = cartItems.value.filter(item => item.id !== itemId)
        // 实际项目中应调用接口删除购物车商品
        uni.showToast({
          title: '删除成功',
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

// 前往结算
const goToCheckout = () => {
  if (selectedCount.value === 0) {
    uni.showToast({
      title: '请选择要结算的商品',
      icon: 'none'
    })
    return
  }
  
  // 获取选中的商品
  const selectedItems = cartItems.value.filter(item => item.selected)
  
  // 实际项目中应将选中商品ID传递给结算页面
  router.push({
    name: 'order_confirm',
    params: {
      from: 'cart',
      items: JSON.stringify(selectedItems.map(item => item.id))
    }
  })
}

// 前往登录
const goToLogin = () => {
  router.push({
    name: 'login'
  })
}

onLoad(() => {
  // 模拟加载数据
  setTimeout(() => {
    loading.value = false
  }, 500)
})

onShow(() => {
  // 每次显示页面时重新加载购物车数据
  // 实际项目中应调用接口获取最新购物车数据
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">购物车</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh pb-150rpx">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>
      
      <!-- 未登录提示 -->
      <view v-else-if="!isLoggedIn" class="h-100vh flex flex-col items-center justify-center">
        <WdIcon name="user-off" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
        <text class="text-30rpx text-gray-500 mb-50rpx">登录后才能查看购物车哦~</text>
        <view 
          class="px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-md shadow-pink-200"
          @tap="goToLogin"
        >
          <text class="text-30rpx text-white font-medium">立即登录</text>
        </view>
      </view>
      
      <!-- 购物车为空 -->
      <view v-else-if="cartItems.length === 0" class="h-100vh flex flex-col items-center justify-center">
        <WdIcon name="shopping-cart" size="100rpx" custom-style="color:#ddd" class="mb-30rpx"/>
        <text class="text-30rpx text-gray-500 mb-50rpx">购物车空空如也~</text>
        <view 
          class="px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full shadow-md shadow-pink-200"
          @tap="continueToShop"
        >
          <text class="text-30rpx text-white font-medium">去逛逛</text>
        </view>
      </view>
      
      <!-- 购物车列表 -->
      <view v-else>
        <!-- 全选栏 -->
        <view class="bg-white px-30rpx py-25rpx flex items-center mb-20rpx">
          <view 
            class="w-40rpx h-40rpx rounded-full border-2 flex items-center justify-center mr-20rpx"
            :class="isAllSelected ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'"
            @tap="toggleSelectAll"
          >
            <WdIcon 
              v-if="isAllSelected" 
              name="check" 
              size="28rpx" 
              color="#fff" 
            />
          </view>
          <text class="text-28rpx text-#333">全选</text>
          
          <view class="ml-auto flex items-center">
            <text class="text-26rpx text-gray-500">共{{ cartItems.length }}件宝贝</text>
          </view>
        </view>
        
        <!-- 购物车商品列表 -->
        <view class="cart-items-list">
          <view 
            v-for="(item, index) in cartItems" 
            :key="item.id" 
            class="bg-white mb-20rpx animate-fade-in"
            :style="{ 'animation-delay': `${index * 0.05}s` }"
          >
            <!-- 卖家信息 -->
            <view class="px-30rpx py-20rpx border-b border-gray-100 flex items-center">
              <view 
                class="w-40rpx h-40rpx rounded-full border-2 flex items-center justify-center mr-20rpx"
                :class="item.selected ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'"
                @tap="toggleSelectItem(item)"
              >
                <WdIcon 
                  v-if="item.selected" 
                  name="check" 
                  size="28rpx" 
                  color="#fff" 
                />
              </view>
              
              <view class="flex items-center">
                <image :src="item.seller.avatar" class="w-40rpx h-40rpx rounded-full mr-10rpx"/>
                <text class="text-28rpx text-#333">{{ item.seller.nickname }}</text>
                <view v-if="item.seller.isVerified" class="ml-10rpx px-8rpx py-2rpx bg-blue-50 rounded-4rpx">
                  <text class="text-22rpx text-blue-500">已认证</text>
                </view>
              </view>
              
              <WdIcon name="chevron-right" size="28rpx" custom-style="color:#ccc" class="ml-auto"/>
            </view>
            
            <!-- 商品信息 -->
            <view class="px-30rpx py-20rpx flex">
              <view 
                class="w-40rpx h-40rpx rounded-full border-2 flex items-center justify-center mr-20rpx self-center"
                :class="item.selected ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'"
                @tap="toggleSelectItem(item)"
              >
                <WdIcon 
                  v-if="item.selected" 
                  name="check" 
                  size="28rpx" 
                  color="#fff" 
                />
              </view>
              
              <image 
                :src="item.image" 
                class="w-180rpx h-180rpx rounded-12rpx object-cover" 
                mode="aspectFill"
                @tap="goToGoodsDetail(item.goodsId)"
              />
              
              <view class="flex-1 ml-20rpx flex flex-col justify-between">
                <view @tap="goToGoodsDetail(item.goodsId)">
                  <view class="text-28rpx text-#333 line-clamp-2">{{ item.name }}</view>
                </view>
                
                <view class="flex justify-between items-end">
                  <view>
                    <text class="text-32rpx text-#f43f5e font-bold">¥{{ item.price }}</text>
                    <text class="text-24rpx text-gray-400 line-through ml-10rpx">¥{{ item.originPrice }}</text>
                  </view>
                  
                  <!-- 数量调整 -->
                  <view class="flex items-center">
                    <view 
                      class="w-50rpx h-50rpx flex items-center justify-center bg-gray-100 rounded-l-full"
                      @tap="decreaseCount(item)"
                    >
                      <WdIcon name="minus" size="24rpx" custom-style="color:#666"/>
                    </view>
                    <view class="w-70rpx h-50rpx flex items-center justify-center bg-gray-100">
                      <text class="text-28rpx text-#333">{{ item.count }}</text>
                    </view>
                    <view 
                      class="w-50rpx h-50rpx flex items-center justify-center bg-gray-100 rounded-r-full"
                      @tap="increaseCount(item)"
                    >
                      <WdIcon name="plus" size="24rpx" custom-style="color:#666"/>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 操作区 -->
            <view class="px-30rpx py-15rpx border-t border-gray-100 flex justify-end">
              <view 
                class="flex items-center px-20rpx" 
                @tap="removeItem(item.id)"
              >
                <WdIcon name="delete" size="28rpx" custom-style="color:#999" class="mr-8rpx"/>
                <text class="text-26rpx text-gray-600">删除</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 底部结算栏 -->
    <view v-if="isLoggedIn && cartItems.length > 0" class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-100">
      <view class="h-120rpx px-30rpx flex items-center justify-between">
        <view class="flex items-center">
          <view 
            class="w-40rpx h-40rpx rounded-full border-2 flex items-center justify-center mr-20rpx"
            :class="isAllSelected ? 'border-#f43f5e bg-#f43f5e' : 'border-gray-300'"
            @tap="toggleSelectAll"
          >
            <WdIcon 
              v-if="isAllSelected" 
              name="check" 
              size="28rpx" 
              color="#fff" 
            />
          </view>
          <text class="text-28rpx text-#333">全选</text>
        </view>
        
        <view class="flex items-end">
          <view class="mr-30rpx">
            <view class="flex items-baseline">
              <text class="text-26rpx text-gray-700">合计：</text>
              <text class="text-36rpx text-#f43f5e font-bold">¥{{ totalPrice }}</text>
            </view>
            <view class="flex justify-end">
              <text class="text-22rpx text-gray-400">已优惠 ¥{{ totalDiscount }}</text>
            </view>
          </view>
          
          <view 
            @tap="goToCheckout" 
            class="bg-gradient-to-r from-#f43f5e to-#ff7676 h-80rpx px-50rpx rounded-full flex items-center justify-center shadow-md shadow-pink-200 transform transition-all duration-300 active-scale active-shadow"
          >
            <text class="text-white text-32rpx font-medium">结算({{ selectedCount }})</text>
          </view>
        </view>
      </view>
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

/* 激活按钮时的动画效果 */
.active-scale:active {
  transform: scale(0.98);
}

.active-shadow:active {
  box-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.05);
}
</style> 