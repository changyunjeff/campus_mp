<script setup>

// 定义属性
const props = defineProps({
  /**
   * 商品数据
   * @property {number} id - 商品ID
   * @property {string} name - 商品名称
   * @property {number} price - 商品价格
   * @property {string} image - 商品主图
   * @property {string} status - 商品状态: 'selling', 'reserved', 'sold'
   */
  goods: {
    type: Object,
    required: true
  },
  /**
   * 是否为卖家视角
   */
  isSeller: {
    type: Boolean,
    default: false
  }
})

// 定义事件
const emit = defineEmits(['goToDetail', 'markSold'])

// 查看商品详情
const handleViewDetail = () => {
  emit('goToDetail', props.goods.id)
}

// 标记为已售出（仅卖家操作）
const handleMarkSold = () => {
  emit('markSold', props.goods.id)
}

// 获取状态标签文本和颜色
const statusInfo = computed(() => {
  switch (props.goods.status) {
    case 'reserved':
      return { text: '已预订', bgColor: 'bg-orange-500', textColor: 'text-white' }
    case 'sold':
      return { text: '已售出', bgColor: 'bg-gray-500', textColor: 'text-white' }
    default:
      return { text: '出售中', bgColor: 'bg-green-500', textColor: 'text-white' }
  }
})
</script>

<template>
  <view class="goods-preview-card">
    <!-- 商品信息 -->
    <view class="content-wrapper" @tap="handleViewDetail">
      <!-- 商品图片 -->
      <image :src="goods.image" class="goods-image" mode="aspectFill" />
      
      <!-- 商品信息 -->
      <view class="goods-info">
        <!-- 商品名称 -->
        <view class="goods-name text-ellipsis">{{ goods.name }}</view>
        
        <!-- 商品价格和状态 -->
        <view class="price-status-row">
          <!-- 价格 -->
          <text class="goods-price">¥{{ goods.price }}</text>
          
          <!-- 状态标签 -->
          <view class="status-tag" :class="[statusInfo.bgColor, statusInfo.textColor]">
            {{ statusInfo.text }}
          </view>
        </view>
      </view>
    </view>
    
    <!-- 如果是卖家视角，显示标记为已售出的按钮 -->
    <view v-if="isSeller && goods.status === 'selling'" class="mark-sold-btn" @tap="handleMarkSold">
      <text>标记为已售出</text>
    </view>

    <!-- 底部分割线 -->
    <view class="divider"></view>
  </view>
</template>

<style scoped>
.goods-preview-card {
  width: 100%;
  background-color: #ffffff;
  margin-bottom: 1rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.content-wrapper {
  display: flex;
  padding: 20rpx 30rpx;
}

.goods-image {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 20rpx;
}

.goods-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.goods-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.price-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.goods-price {
  font-size: 30rpx;
  color: #f43f5e;
  font-weight: bold;
}

.status-tag {
  font-size: 22rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mark-sold-btn {
  padding: 12rpx 0;
  text-align: center;
  font-size: 26rpx;
  color: #666;
  background-color: #f8f8f8;
}

.mark-sold-btn:active {
  background-color: #f0f0f0;
}

.divider {
  height: 1rpx;
  background-color: #f0f0f0;
  width: 100%;
}
</style>
