<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Layout from '@/layout/index.vue'
import { formatTime } from '@/utils/time'
import { useRouter } from 'uni-mini-router'
import { useLikeAndFavorite } from '@/pinia/modules/LikeAndFavorite'
import { useToast } from '@/composables/toast'
import { MSG_TYPE } from '@/constants/msg'
import events from '@/utils/events'
import User from "/static/images/user.png"

const router = useRouter()
const likeAndFavoriteStore = useLikeAndFavorite()
const toast = useToast()

// 获取合并的消息列表（已按时间排序）
const allMessages = computed(() => likeAndFavoriteStore.allMessages)

// 获取总未读数量
const totalUnreadCount = computed(() => likeAndFavoriteStore.getTotalUnreadCount)

// 标记消息为已读
const markAsRead = (id) => {
  likeAndFavoriteStore.markAsRead(id)
}

// 标记所有消息为已读
const markAllAsRead = () => {
  likeAndFavoriteStore.markAllAsRead()
  toast.show('已全部标为已读')
}

// 删除消息（使用公共弹窗）
const deleteMessage = (messageItem) => {
  // 使用公共ActionSheet弹窗
  const actions = [
    {
      name: "删除消息",
      callback: () => {
        likeAndFavoriteStore.deleteMessage(messageItem.id)
        toast.show('已删除消息')
      }
    }
  ]
  
  events.emit('openActionSheet', actions, '操作消息')
}

// 跳转到内容详情
const goToContent = (messageItem) => {
  markAsRead(messageItem.id)
  
  // 根据内容类型跳转到对应页面
  if (messageItem.contentType === 'goods') {
    router.push({
      name: 'goods_details',
      params: { id: messageItem.contentId }
    })
  } else if (messageItem.contentType === 'community') {
    router.push({
      name: 'post_detail',
      params: { id: messageItem.contentId }
    })
  }
}

// 跳转到用户页面
const goToUser = (userId) => {
  router.push({
    name: 'other_index',
    params: { id: userId }
  })
}

// 获取消息标题
const getMessageTitle = (messageItem) => {
  const actionText = parseInt(messageItem.type) === MSG_TYPE.Like ? '赞了你的' : '收藏了你的'
  const contentType = messageItem.contentType === 'goods' ? '商品' : '动态'
  return `${actionText}${contentType}`
}

// 处理长按事件（使用公共ActionSheet）
const handleLongpress = (messageItem) => {
  deleteMessage(messageItem)
}
</script>

<template>
  <Layout>
    <template #center>
      收到的赞和收藏
    </template>
    <template #right>
      <view class="flex items-center" @tap="markAllAsRead" v-if="totalUnreadCount > 0">
        <text class="text-sm text-blue-500">全部已读</text>
      </view>
    </template>
    
    <view class="message-container">
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :show-scrollbar="false" scroll-anchoring>
        <view class="message-list-content">
          <view v-if="allMessages.length === 0" class="empty-state">
            <WdIcon name="heart" size="64rpx" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">暂无点赞和收藏消息</text>
          </view>
          
          <view v-else v-for="messageItem in allMessages" :key="messageItem.id"
            class="message-item" :class="{ 'unread': !messageItem.read }">
            <!-- 用户头像 -->
            <image 
              :src="messageItem?.avatar || User"
              class="user-avatar"
              @tap="goToUser(messageItem?.from)"
            />
            
            <!-- 消息内容 -->
            <view class="message-content" @tap="goToContent(messageItem)" @longpress="handleLongpress(messageItem)">
              <view class="message-header">
                <view class="message-info">
                  <view class="message-icon">
                    <WdIcon 
                      :name="messageItem.type === MSG_TYPE.Like ? 'heart' : 'star'"
                      size="16" 
                      :color="messageItem.type === MSG_TYPE.Like ? '#ff6b6b' : '#ffc107'"
                    />
                  </view>
                  <view class="message-text">
                    <text class="user-name" :class="{ 'font-bold': !messageItem.read }">
                      {{ messageItem?.nickname }}
                    </text>
                    <text class="action-text">{{ getMessageTitle(messageItem) }}</text>
                  </view>
                </view>
                <text class="message-time">{{ formatTime(messageItem.timestamp) }}</text>
              </view>
              
              <!-- 内容预览 -->
              <view class="content-preview">
                <view class="content-text">
                  <text class="content-title">{{ messageItem.title }}</text>
                  <text v-if="messageItem.description" class="content-desc">
                    {{ messageItem.description }}
                  </text>
                </view>
                <image 
                  v-if="messageItem.image"
                  :src="messageItem.image"
                  class="content-image"
                />
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
  @apply w-10 h-10 rounded-full mr-3 flex-shrink-0;
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

.content-preview {
  @apply flex items-center p-3 bg-gray-50 rounded-lg;
}

.content-text {
  @apply flex-1 mr-3;
}

.content-title {
  @apply text-sm font-medium text-gray-800 block mb-1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-desc {
  @apply text-xs text-gray-500 block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-image {
  @apply w-12 h-12 rounded flex-shrink-0;
  object-fit: cover;
}

.unread-dot {
  @apply absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500;
}
</style>
