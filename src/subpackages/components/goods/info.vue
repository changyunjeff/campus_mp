<script setup>
import { ref, computed, watch } from 'vue'
import { getGoodsSpecConfig, getSpecConfigByType } from './goods-param.configs'

const props = defineProps({
  // 商品数据对象
  goods: {
    type: Object,
    required: true,
    default: () => ({})
  },
  // 商品类型，如果提供则优先使用
  goodsType: {
    type: String,
    default: ''
  }
})

// 根据商品名称或指定类型获取规格配置
const specConfig = computed(() => {
  if (props.goodsType) {
    return getSpecConfigByType(props.goodsType)
  }
  return getGoodsSpecConfig(props.goods.name || '')
})

// 规格信息配置
const specFields = computed(() => specConfig.value.specs || [])

// 详细信息配置
const detailFields = computed(() => specConfig.value.details || [])

// 获取规格值，如果对应字段不存在，返回空字符串
const getFieldValue = (field) => {
  return props.goods[field] || '暂无信息'
}
</script>

<template>
  <view class="goods-info bg-white px-30rpx py-20rpx rounded-12rpx">
    <view class="flex items-center mb-20rpx">
      <text class="text-30rpx text-#333 font-medium">宝贝信息</text>
      <text class="ml-15rpx text-24rpx text-gray-400">以下信息由卖家自行填选</text>
    </view>
    
    <!-- 规格信息 -->
    <view v-if="specFields.length" class="grid grid-cols-3 gap-y-20rpx">
      <view 
        v-for="(field, index) in specFields" 
        :key="index" 
        class="flex flex-col animate-fade-in"
        :style="{ 'animation-delay': `${index * 0.05}s` }"
      >
        <text class="text-26rpx text-gray-400">{{ field.label }}</text>
        <text class="text-28rpx text-#333 mt-6rpx truncate">{{ getFieldValue(field.field) }}</text>
      </view>
    </view>
    
    <!-- 分割线 -->
    <view class="h-2rpx bg-gray-100 my-30rpx"></view>
    
    <!-- 详细信息 -->
    <view v-if="detailFields.length">
      <view 
        v-for="(field, index) in detailFields" 
        :key="index" 
        class="flex justify-between mb-20rpx animate-fade-in"
        :style="{ 'animation-delay': `${(index + specFields.length) * 0.05}s` }"
        :class="{ 'mb-0': index === detailFields.length - 1 }"
      >
        <text class="text-28rpx text-gray-500">{{ field.label }}</text>
        <text class="text-28rpx text-#333 text-right w-60%">{{ getFieldValue(field.field) }}</text>
      </view>
    </view>
    
    <!-- 没有配置信息的情况 -->
    <view v-if="!specFields.length && !detailFields.length" class="py-30rpx flex justify-center">
      <text class="text-28rpx text-gray-400">暂无商品信息</text>
    </view>
  </view>
</template>

<style>
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
