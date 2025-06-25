<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/layout/index.vue'
import { formatTime } from '@/utils/time'
import { useRouter } from 'uni-mini-router'
import { useCommentAndMention } from '@/pinia/modules/CommentAndMention'
import { useToast } from '@/composables/toast'
import events from '@/utils/events'
import User from "/static/images/user.png"

const router = useRouter()
const commentAndMentionStore = useCommentAndMention()
const toast = useToast()

// 标签页状态
const activeTab = ref('comments')

// 获取评论消息
const commentMessages = computed(() => commentAndMentionStore.commentMessages)

// 获取@消息
const mentionMessages = computed(() => commentAndMentionStore.mentionMessages)

// 获取当前显示的消息列表
const currentMessages = computed(() => {
  return activeTab.value === 'comments' ? commentMessages.value : mentionMessages.value
})

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
}

// 标记消息为已读
const markAsRead = (id) => {
  commentAndMentionStore.markAsRead(id, activeTab.value)
}

// 标记所有消息为已读
const markAllAsRead = () => {
  commentAndMentionStore.markAllAsRead(activeTab.value)
  toast.show('已全部标为已读')
}

// 删除消息（使用公共弹窗）
const deleteMessage = (messageItem) => {
  const actions = [
    {
      name: "删除消息",
      callback: () => {
        commentAndMentionStore.deleteMessage(messageItem.id, activeTab.value)
        toast.show('已删除消息')
      }
    }
  ]
  
  events.emit('openActionSheet', actions, '操作消息')
}

// 跳转到内容详情
const goToContent = (message) => {
  markAsRead(message.id)
  
  // 根据内容类型跳转到对应页面
  if (message.contentType === 'goods') {
    router.push({
      name: 'goods_details',
      params: { id: message.contentId }
    })
  } else if (message.contentType === 'community') {
    router.push({
      name: 'post_detail',  
      params: { id: message.contentId }
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

// 点赞消息
const likeMessage = (messageItem) => {
  toast.show('已点赞', messageItem)
  // 这里可以调用点赞API
}

// 回复评论
const replyComment = (message) => {
  // 跳转到内容详情页面并定位到评论区
  goToContent(message)
}

// 获取未读数量
const getUnreadCount = (type) => {
  return commentAndMentionStore.getUnreadCount(type)
}

// 获取消息图标
const getMessageIcon = (message) => {
  if (activeTab.value === 'comments') {
    return 'chat'
  } else {
    return 'at'
  }
}

// 获取消息标题前缀
const getMessageActionText = (message) => {
  if (activeTab.value === 'comments') {
    return '评论了你的'
  } else {
    return '在'
  }
}

// 获取消息标题后缀
const getMessageSuffix = (message) => {
  const contentType = message.contentType === 'goods' ? '商品' : '动态'
  if (activeTab.value === 'comments') {
    return contentType
  } else {
    return `${contentType}中@了你`
  }
}

// 处理长按事件
const handleLongpress = (messageItem) => {
  deleteMessage(messageItem)
}

// 页面加载时获取消息
onMounted(() => {
  commentAndMentionStore.fetchMessages()
})
</script>

<template>
  <Layout>
    <template #center>
      收到的评论和@
    </template>
    <template #right>
      <view class="flex items-center" @tap="markAllAsRead">
        <text class="text-sm text-blue-500">全部已读</text>
      </view>
    </template>
    
    <!-- 标签页 -->
    <view class="tab-container">
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'comments' }"
        @tap="switchTab('comments')"
      >
        <text>评论</text>
        <view v-if="getUnreadCount('comments') > 0" class="unread-badge">
          {{ getUnreadCount('comments') }}
        </view>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: activeTab === 'mentions' }"
        @tap="switchTab('mentions')"
      >
        <text>@我的</text>
        <view v-if="getUnreadCount('mentions') > 0" class="unread-badge">
          {{ getUnreadCount('mentions') }}
        </view>
      </view>
    </view>
    
    <view class="message-container">
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :show-scrollbar="false" scroll-anchoring>
        <view class="message-list-content">
          <view v-if="currentMessages.length === 0" class="empty-state">
            <WdIcon :name="activeTab === 'comments' ? 'chat' : 'at'" size="64" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">
              {{ activeTab === 'comments' ? '暂无评论消息' : '暂无@消息' }}
            </text>
          </view>
          
          <view v-else v-for="messageItem in currentMessages" :key="messageItem.id"
            class="message-item" :class="{ 'unread': !messageItem.read }">
            <!-- 用户头像 -->
            <image 
              :src="messageItem?.avatar || User" 
              class="user-avatar"
              @tap="goToUser(messageItem?.id)"
            />
            
            <!-- 消息内容 -->
            <view class="message-content" @tap="goToContent(messageItem)" @longpress="handleLongpress(messageItem)">
              <view class="message-header">
                <view class="message-info">
                  <view class="message-icon">
                    <WdIcon 
                      :name="getMessageIcon(messageItem)" 
                      size="16" 
                      :color="activeTab === 'comments' ? '#2196f3' : '#ff9800'" 
                    />
                  </view>
                  <view class="message-text">
                    <text class="user-name" :class="{ 'font-bold': !messageItem.read }">
                      {{ messageItem?.nickname }}
                    </text>
                    <text class="action-text">{{ getMessageActionText(messageItem) }}</text>
                    <text class="content-type">{{ getMessageSuffix(messageItem) }}</text>
                  </view>
                </view>
                <text class="message-time">{{ formatTime(messageItem.timestamp) }}</text>
              </view>
              
              <!-- 评论内容 -->
              <view v-if="messageItem.commentContent" class="comment-content">
                <text class="comment-text">{{ messageItem.commentContent }}</text>
              </view>
              
              <!-- 内容预览 -->
              <view class="content-preview">
                <view class="content-text">
                  <text class="content-title">{{ messageItem?.title }}</text>
                  <text v-if="messageItem?.description" class="content-desc">
                    {{ messageItem?.description }}
                  </text>
                </view>
                <image 
                  v-if="messageItem?.image" 
                  :src="messageItem?.image" 
                  class="content-image"
                />
                
                <!-- 操作按钮 -->
                <view class="action-buttons">
                  <view class="action-btn like-btn" @click.stop="likeMessage(messageItem)">
                    <WdIcon name="heart" size="14" color="#666" />
                    <text>赞</text>
                  </view>
                  <view class="action-btn reply-btn" @click.stop="replyComment(messageItem)">
                    <WdIcon name="chat" size="14" color="#666" />
                    <text>回复</text>
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
.tab-container {
  @apply flex bg-white border-b border-gray-200;
}

.tab-item {
  @apply flex-1 flex items-center justify-center py-3 relative;
  
  &.active {
    @apply text-blue-500 border-b-2 border-blue-500;
  }
}

.unread-badge {
  @apply absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-4 h-4 flex items-center justify-center px-1;
  font-size: 10px;
}

.message-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 240rpx);
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
  @apply text-base text-gray-800;
}

.action-text {
  @apply text-base text-gray-600;
}

.content-type {
  @apply text-base text-gray-600;
}

.message-time {
  @apply text-xs text-gray-400;
}

.comment-content {
  @apply p-3 bg-blue-50 rounded-lg mb-3;
}

.comment-text {
  @apply text-sm text-gray-700;
  word-break: break-word;
  line-height: 1.5;
}

.content-preview {
  @apply flex items-center p-3 bg-gray-50 rounded-lg relative;
}

.content-text {
  @apply flex-1;
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
  @apply w-12 h-12 rounded mr-3 flex-shrink-0;
  object-fit: cover;
}

.action-buttons {
  @apply absolute bottom-2 right-2 flex items-center space-x-2;
}

.action-btn {
  @apply flex items-center space-x-1 px-2 py-1 bg-white rounded-full shadow-sm;
  font-size: 12px;
  
  &:active {
    @apply bg-gray-100;
  }
}

.like-btn {
  @apply text-gray-600;
  
  &:active {
    @apply text-red-500;
  }
}

.reply-btn {
  @apply text-gray-600;
  
  &:active {
    @apply text-blue-500;
  }
}

.unread-dot {
  @apply absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500;
}
</style>