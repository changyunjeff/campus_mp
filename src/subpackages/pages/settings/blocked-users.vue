# 屏蔽用户列表页面暂时使用简单版本

<script setup>
import Layout from '@/layout/index.vue'
import { ref, computed } from 'vue'
import { useToast } from '@/composables/toast'

const toast = useToast()
const blockedUsers = ref([])

const hasBlockedUsers = computed(() => blockedUsers.value.length > 0)

const loadBlockedUsers = async () => {
  try {
    // TODO: 调用API加载屏蔽用户
    toast.show('功能开发中...')
  } catch (error) {
    toast.error('加载失败')
  }
}

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-32rpx font-bold">我的屏蔽</text>
    </template>
    
    <view class="min-h-screen bg-gray-50 flex items-center justify-center">
      <view class="text-center">
        <text class="text-28rpx text-gray-500">功能开发中...</text>
      </view>
    </view>
  </Layout>
</template> 