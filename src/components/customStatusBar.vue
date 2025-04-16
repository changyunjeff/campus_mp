<script setup>
// 自定义状态栏组件
import { ref, onMounted } from 'vue'
const router = useRouter()
const route = useRoute()

// 获取当前页面标题
const pageTitle = ref('')

// 返回上一页
const goBack = () => {
    router.back()
}

// 获取当前页面标题
onMounted(() => {
    console.log(route)
    pageTitle.value = route?.meta?.title || '未知标题'
})
</script>

<template>
  <view class="custom-status-bar">
    <!-- 左侧内容 - 左对齐 -->
    <view class="custom-status-bar-left">
      <slot name="left">
        <!-- 默认显示返回箭头 -->
        <view @click="goBack">
          <IconFont name="left" size="16px" color="#333" />
        </view>
      </slot>
    </view>
    
    <!-- 中间内容 - 居中对齐 -->
    <view class="custom-status-bar-center">
      <slot name="center">
        <!-- 默认显示页面标题 -->
        <text class="page-title" v-if="pageTitle">{{ pageTitle }}</text>
      </slot>
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
  height: 88rpx;
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