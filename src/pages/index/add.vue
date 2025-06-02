<script setup>
import { onShow } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 页面显示时触发
onShow(() => {
  // 显示选择弹窗
  uni.showActionSheet({
    itemList: ['发布帖子', '发布闲置'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 跳转到发布帖子页面
        router.push({
          name: 'publish_post'
        })
      } else if (res.tapIndex === 1) {
        // 跳转到发布闲置页面
        router.push({
          name: 'publish_goods_category'
        })
      }
    },
    fail: () => {
      // 用户取消选择，返回上一页
      uni.navigateBack()
    },
    complete: () => {
      // 无论成功失败都返回上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 100)
    }
  })
})
</script>

<template>
  <view class="flex items-center justify-center h-100vh">
    <text class="text-32rpx text-gray-400">选择发布类型...</text>
  </view>
</template>

<style scoped>
/* 使用UnoCSS原子类 */
</style>