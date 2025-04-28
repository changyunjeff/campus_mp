<template>
  <view v-if="show" class="fixed inset-0 z-9999 flex items-center justify-center bg-black/70 animate animate-fade-in">
    <view class="w-480rpx p-48rpx bg-white/10 rounded-24rpx shadow-2xl backdrop-blur-2xl flex flex-col items-center relative overflow-hidden">
      <!-- 装饰光晕 -->
      <view class="absolute -top-40rpx left-1/2 -translate-x-1/2 w-200rpx h-60rpx bg-pink-200/40 rounded-full filter blur-lg"></view>
      <view class="absolute -bottom-40rpx right-0 w-120rpx h-120rpx bg-pink-100/30 rounded-full filter blur-md"></view>
      
      <!-- 进度条 -->
      <view class="w-full h-24rpx bg-pink-50/60 rounded-full overflow-hidden shadow-inner relative mb-32rpx">
        <view
          class="h-full rounded-full bg-gradient-to-r from-pink-400 via-pink-500 to-pink-300 transition-all duration-500 ease-bounce relative animate animate-slide-right"
          :style="{ width: `${percentage}%` }"
        >
          <!-- 动态光斑 -->
          <view class="absolute top-0 right-0 h-full w-40rpx bg-gradient-to-r from-transparent to-white/60 filter blur-md animate-glow-move" />
          <!-- 波纹动画 -->
          <view v-if="percentage === 100" class="absolute inset-0 flex items-center justify-center pointer-events-none">
            <view class="w-120rpx h-24rpx rounded-full border-2 border-pink-400/60 animate-ripple"></view>
          </view>
        </view>
      </view>
      
      <!-- 进度数字 -->
      <view class="text-40rpx font-bold text-pink-500 drop-shadow mb-8rpx animate animate-fade-in">
        {{ percentage < 100 ? `${percentage}%` : '100%' }}
      </view>
      <!-- 状态提示 -->
      <view v-if="percentage < 100" class="text-26rpx text-gray-500">正在上传，请稍候…</view>
      <view v-else class="text-28rpx text-green-500 animate-bounce">上传完成！</view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  },
  percentage: {
    type: Number,
    default: 0
  }
})
</script>

<style>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-right {
  animation: slideRight 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes slideRight {
  from { width: 0; }
  to { width: 100%; }
}

.animate-glow-move {
  animation: glowMove 1.5s ease-in-out infinite;
}
@keyframes glowMove {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-ripple {
  animation: ripple 1.2s ease-out infinite;
}
@keyframes ripple {
  0% { transform: scaleX(0.8); opacity: 0.7; }
  100% { transform: scaleX(1.4); opacity: 0; }
}

.backdrop-blur-2xl {
  backdrop-filter: blur(20px);
}

.shadow-2xl {
  box-shadow: 0 12rpx 48rpx rgba(255, 72, 128, 0.18), 0 2rpx 8rpx rgba(0,0,0,0.08);
}

.filter {
  filter: blur(8rpx);
}

.blur-md {
  filter: blur(12rpx);
}

.blur-lg {
  filter: blur(16rpx);
}

.drop-shadow {
  text-shadow: 0 2rpx 8rpx #ffb6c1, 0 1rpx 2rpx #fff;
}

.ease-bounce {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>