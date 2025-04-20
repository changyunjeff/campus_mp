<script setup>
</script>

<template>
  <view class="custom-status-bar">
    <!-- 左侧内容 - 左对齐 -->
    <view class="custom-status-bar-left">
      <slot name="left" />
    </view>
    
    <!-- 中间内容 - 居中对齐 -->
    <view class="custom-status-bar-center">
      <slot name="center" />
    </view>
    
    <!-- 右侧内容 - 右对齐 -->
    <view class="custom-status-bar-right">
      <slot name="right"></slot>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.custom-status-bar {
  width: 100%;
  height: $uni-navigator-bar-height;
  display: flex;
  align-items: center;
  position: relative;
  padding: 0 24rpx;
  box-sizing: border-box;
  // 磨砂玻璃效果
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  
  // 左侧内容 - 左对齐
  &-left {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    flex-shrink: 0;
    z-index: 2;
  }
  
  // 中间内容 - 居中对齐
  &-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1;
    .page-title {
      font-size: 30rpx;
      color: #333;
    }
  }
  
  // 右侧内容 - 右对齐，内容多时可向左延伸
  &-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-left: auto;
    flex-shrink: 1;
    overflow: hidden;
    z-index: 2;
  }
}
</style>