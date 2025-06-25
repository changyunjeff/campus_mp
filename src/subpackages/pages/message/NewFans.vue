<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/layout/index.vue'
import { formatTime } from '@/utils/time'
import { useRouter } from 'uni-mini-router'
import { useNewFans } from '@/pinia/modules/NewFans'
import { useToast } from '@/composables/toast'
import events from '@/utils/events'
import User from "/static/images/user.png"

const router = useRouter()
const newFansStore = useNewFans()
const toast = useToast()

// 获取新增关注消息
const fanMessages = computed(() => newFansStore.fanMessages)

// 获取未读数量
const unreadCount = computed(() => {
  return newFansStore.getUnreadCount()
})

// 标记消息为已读
const markAsRead = (id) => {
  newFansStore.markAsRead(id)
}

// 标记所有消息为已读
const markAllAsRead = () => {
  newFansStore.markAllAsRead()
  toast.show('已全部标为已读')
}

// 删除消息（使用公共弹窗）
const deleteMessage = (messageItem) => {
  const actions = [
    {
      name: "删除消息",
      callback: () => {
        newFansStore.deleteMessage(messageItem.id)
        toast.show('已删除消息')
      }
    }
  ]
  
  events.emit('openActionSheet', actions, '操作消息')
}

// 跳转到用户页面
const goToUser = (userId) => {
  router.push({
    name: 'other_index',
    params: { id: userId }
  })
}

// 关注用户
const followUser = async (messageItem) => {
  try {
    markAsRead(messageItem.id)
    await newFansStore.followUser(messageItem.fromUser.id)
    toast.show('已关注')
  } catch (error) {
    toast.show('关注失败')
  }
}

// 处理长按事件（使用公共ActionSheet）
const handleLongpress = (messageItem) => {
  deleteMessage(messageItem)
}

// 页面加载时获取消息
onMounted(() => {
  newFansStore.fetchMessages()
})
</script>

<template>
  <Layout>
    <template #center>
      新增关注
    </template>
    <template #right>
      <view class="flex items-center" @tap="markAllAsRead" v-if="unreadCount > 0">
        <text class="text-sm text-blue-500">全部已读</text>
      </view>
    </template>
    
    <view class="message-container">
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :show-scrollbar="false" scroll-anchoring>
        <view class="message-list-content">
          <view v-if="fanMessages.length === 0" class="empty-state">
            <WdIcon name="user-plus" size="64" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">暂无新增关注消息</text>
          </view>
          
          <view v-else v-for="messageItem in fanMessages" :key="messageItem.id"
            class="message-item" :class="{ 'unread': !messageItem.read }">
            
            <!-- 用户头像 -->
            <image 
              :src="messageItem.fromUser?.avatar || User"
              class="user-avatar"
              @tap="goToUser(messageItem.fromUser?.id)"
            />
            
            <!-- 消息内容 -->
            <view class="message-content" @tap="goToUser(messageItem?.id)" @longpress="handleLongpress(messageItem)">
              <view class="message-header">
                <view class="message-info">
                  <view class="message-icon">
                    <WdIcon name="user-plus" size="16" color="#4caf50" />
                  </view>
                  <view class="message-text">
                    <text class="user-name" :class="{ 'font-bold': !messageItem.read }">
                      {{ messageItem?.nickname }}
                    </text>
                    <text class="action-text">开始关注你了，期待你的回关</text>
                  </view>
                </view>
                <text class="message-time">{{ formatTime(messageItem.timestamp) }}</text>
              </view>
              
              <!-- 用户信息预览 -->
              <view class="user-preview">
                <view class="user-info">
                  <text class="user-nickname">{{ messageItem?.nickname }}</text>
                  <text v-if="messageItem?.introduction" class="user-intro">
                    {{ messageItem?.introduction }}
                  </text>
                  <view class="user-stats">
                    <text class="stat-item">{{ messageItem?.followersCount || 0 }} 粉丝</text>
                    <text class="stat-item">{{ messageItem?.followingCount || 0 }} 关注</text>
                  </view>
                </view>
                
                <!-- 关注按钮 -->
                <view class="action-buttons">
                  <view 
                    v-if="!messageItem?.isFollowing"
                    class="follow-btn"
                    @click.stop="followUser(messageItem)"
                  >
                    回关
                  </view>
                  <view 
                    v-else
                    class="followed-btn"
                  >
                    已关注
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 未读标记 -->
            <view v-if="!messageItem.read" class="unread-dot"></view>
          </view>
        </view>
      </scroll-view>
    </view>
  </Layout>
</template>

<style lang="scss" scoped>
.message-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180rpx);
  background-color: #f5f5f5;
  position: relative;
}

.message-list {
  flex: 1;
  overflow-y: auto;
}

.message-list-content {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.message-item {
  @apply flex items-start p-4 bg-white rounded-lg mb-3 relative;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &.unread {
    @apply border-l-4 border-blue-500;
  }
  
  &:active {
    @apply bg-gray-50;
  }
}

.user-avatar {
  @apply w-12 h-12 rounded-full mr-3 flex-shrink-0;
  object-fit: cover;
}

.message-content {
  @apply flex-1;
}

.message-header {
  @apply flex justify-between items-start mb-2;
}

.message-info {
  @apply flex items-start flex-1;
}

.message-icon {
  @apply mr-2 mt-1;
}

.message-text {
  @apply flex-1;
}

.user-name {
  @apply text-base text-gray-800 mr-1;
}

.action-text {
  @apply text-base text-gray-600;
}

.message-time {
  @apply text-xs text-gray-400 ml-2;
}

.user-preview {
  @apply flex items-center justify-between p-3 bg-gray-50 rounded-lg;
}

.user-info {
  @apply flex-1;
}

.user-nickname {
  @apply text-sm font-medium text-gray-800 block mb-1;
}

.user-intro {
  @apply text-xs text-gray-500 block mb-2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200rpx;
}

.user-stats {
  @apply flex items-center;
}

.stat-item {
  @apply text-xs text-gray-400 mr-3;
}

.action-buttons {
  @apply flex-shrink-0;
}

.follow-btn {
  @apply px-4 py-2 bg-blue-500 text-white text-sm rounded-full;
  transition: all 0.2s ease;
  
  &:active {
    @apply bg-blue-600;
  }
}

.followed-btn {
  @apply px-4 py-2 bg-gray-200 text-gray-500 text-sm rounded-full;
}

.unread-dot {
  @apply absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500;
}
</style>