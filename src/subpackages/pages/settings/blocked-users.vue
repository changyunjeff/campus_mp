# 屏蔽用户列表页面暂时使用简单版本

<script setup>
import Layout from '@/layout/index.vue'
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/toast'
import { UserApi } from '@/api/user'
import User from "/static/images/user.png"
import { formatTime } from '@/utils/time'

const toast = useToast()
const blockedUsers = ref([])
const loading = ref(false)
const hasMore = ref(true)
const currentPage = ref(1)
const pageSize = 20

const hasBlockedUsers = computed(() => blockedUsers.value.length > 0)

// 加载屏蔽用户列表
const loadBlockedUsers = async (loadMore = false) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    const page = loadMore ? currentPage.value + 1 : 1
    const res = await UserApi.getBlockedUsers({
      page: page,
      page_size: pageSize
    })
    
    console.log('屏蔽用户列表:', res)

    const list = res || []

    if (loadMore) {
      blockedUsers.value = [...blockedUsers.value, ...list]
      currentPage.value = page
    } else {
      blockedUsers.value = list
      currentPage.value = 1
    }
    
    hasMore.value = list.length === pageSize
  } catch (error) {
    console.error('加载屏蔽用户列表失败:', error)
    toast.error('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

// 取消屏蔽用户
const unblockUser = async (user) => {
  uni.showModal({
    title: '取消屏蔽',
    content: `确定要取消屏蔽用户"${user.nickname}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await UserApi.unblockUser(user.id)
          
          // 从列表中移除
          const index = blockedUsers.value.findIndex(u => u.id === user.id)
          if (index > -1) {
            blockedUsers.value.splice(index, 1)
          }
          
          toast.success('已取消屏蔽')
        } catch (error) {
          console.error('取消屏蔽失败:', error)
          toast.error('操作失败，请重试')
        }
      }
    }
  })
}

// 批量取消屏蔽
const batchUnblock = async () => {
  if (blockedUsers.value.length === 0) {
    toast.show('暂无屏蔽用户')
    return
  }
  
  uni.showModal({
    title: '批量取消屏蔽',
    content: `确定要取消屏蔽所有 ${blockedUsers.value.length} 个用户吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const userIds = blockedUsers.value.map(user => user.id)
          await UserApi.batchUnblockUsers(userIds)
          
          blockedUsers.value = []
          toast.success('已取消屏蔽所有用户')
        } catch (error) {
          console.error('批量取消屏蔽失败:', error)
          toast.error('操作失败，请重试')
        }
      }
    }
  })
}

// 下拉刷新
const onPullRefresh = async () => {
  await loadBlockedUsers(false)
}

// 加载更多
const onLoadMore = async () => {
  if (!hasMore.value) return
  await loadBlockedUsers(true)
}

onMounted(() => {
  loadBlockedUsers()
})
</script>

<template>
  <Layout>
    <template #center>
      <text class="text-32rpx font-bold">我的屏蔽</text>
    </template>
    
    <template #right>
      <view v-if="hasBlockedUsers" @tap="batchUnblock" class="p-16rpx active:opacity-60 transition-opacity">
        <text class="text-28rpx text-blue-500">全部取消</text>
      </view>
    </template>
    
    <!-- 加载状态 -->
    <view v-if="loading && !hasBlockedUsers" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <wd-loading>加载中...</wd-loading>
    </view>
    
    <!-- 空状态 -->
    <view v-else-if="!loading && !hasBlockedUsers" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <view class="text-center">
        <WdIcon name="secured" size="120rpx" color="#d1d5db" />
        <text class="text-28rpx text-gray-500 mt-4 block">暂无屏蔽用户</text>
      </view>
    </view>
    
    <!-- 用户列表 -->
    <scroll-view 
      v-else
      scroll-y 
      class="min-h-screen bg-gray-50"
      refresher-enabled
      refresher-triggered="false"
      @refresherrefresh="onPullRefresh"
      @scrolltolower="onLoadMore"
    >
      <view class="p-3">
        <view 
          v-for="user in blockedUsers" 
          :key="user.id"
          class="bg-white rounded-lg p-4 mb-3 shadow-sm"
        >
          <view class="flex items-center justify-between">
            <view class="flex items-center flex-1">
              <image 
                :src="user.avatar || User" 
                class="w-12 h-12 rounded-full mr-3"
                mode="aspectFill"
              />
              <view class="flex-1">
                <text class="text-32rpx font-medium text-gray-900 block">{{ user.nickname || '未知用户' }}</text>
                <text class="text-24rpx text-gray-500">屏蔽时间: {{ formatTime(user.blocked_at) }}</text>
              </view>
            </view>
            
            <wd-button 
              size="small" 
              type="info"
              @click="unblockUser(user)"
            >
              取消屏蔽
            </wd-button>
          </view>
        </view>
        
        <!-- 加载更多提示 -->
        <view v-if="loading && hasBlockedUsers" class="text-center py-4">
          <wd-loading>加载更多...</wd-loading>
        </view>
        
        <!-- 没有更多数据 -->
        <view v-if="!hasMore && hasBlockedUsers" class="text-center py-4">
          <text class="text-24rpx text-gray-500">没有更多数据了</text>
        </view>
      </view>
    </scroll-view>
  </Layout>
</template>

<style lang="scss" scoped>
// 样式已通过UnoCSS类处理
</style> 