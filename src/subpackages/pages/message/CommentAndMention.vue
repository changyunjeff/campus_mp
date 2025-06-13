<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/layout/index.vue'
import { formatTime } from '@/utils/time'
import { useRouter } from 'uni-mini-router'
import { useCommentAndMention } from '@/subpackages/pinia/massge/CommentAndMention'
import { useToast } from '@/composables/toast'

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

// 删除消息
const deleteMessage = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条消息吗？',
    success: (res) => {
      if (res.confirm) {
        commentAndMentionStore.deleteMessage(id, activeTab.value)
        toast.show('已删除消息')
      }
    }
  })
}

// 跳转到内容详情
const goToContent = (message) => {
  markAsRead(message.id)
  
  // 根据内容类型跳转到对应页面
  if (message.contentType === 'goods') {
    router.push({
      name: 'goods_details',
      query: { id: message.contentId }
    })
  } else if (message.contentType === 'community') {
    router.push({
      name: 'community_detail',
      query: { id: message.contentId }
    })
  }
}

// 跳转到用户页面
const goToUser = (userId) => {
  router.push({
    name: 'user_profile',
    query: { id: userId }
  })
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

// 获取消息标题
const getMessageTitle = (message) => {
  if (activeTab.value === 'comments') {
    return `${message.fromUser.nickname} 评论了你的${message.contentType === 'goods' ? '商品' : '动态'}`
  } else {
    return `${message.fromUser.nickname} 在${message.contentType === 'goods' ? '商品' : '动态'}中@了你`
  }
}

// 页面加载时获取消息
onMounted(() => {
  commentAndMentionStore.fetchMessages()
})

// 操作菜单状态
const actionMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  message: null
})

// 处理长按事件
const handleLongpress = (e, message) => {
  actionMenu.message = message
  
  const bubbleId = `bubble-${message.id}`
  uni.createSelectorQuery()
    .select(`#${bubbleId}`)
    .boundingClientRect(rect => {
      if (rect) {
        actionMenu.x = rect.left + rect.width / 2
        actionMenu.y = rect.top - 10
        actionMenu.visible = true
      } else {
        const touch = e.touches[0]
        actionMenu.x = touch.clientX
        actionMenu.y = touch.clientY - 60
        actionMenu.visible = true
      }
    })
    .exec()
}

// 处理菜单操作
const handleAction = (action) => {
  const message = actionMenu.message
  switch(action) {
    case 'copy':
      uni.setClipboardData({
        data: message.commentContent || message.content,
        success: () => toast.show('已复制')
      })
      break
    case 'mark':
      markAsRead(message.id)
      toast.show('已标为已读')
      break
    case 'reply':
      replyComment(message)
      break
    case 'delete':
      deleteMessage(message.id)
      break
  }
  actionMenu.visible = false
}

// 点击空白处关闭菜单
const handleTapOutside = () => {
  actionMenu.visible = false
}
</script>

<template>
  <Layout>
    <template #center>
      评论和@
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
            <WdIcon :name="activeTab === 'comments' ? 'chat' : 'at'" size="64rpx" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">
              {{ activeTab === 'comments' ? '暂无评论消息' : '暂无@消息' }}
            </text>
          </view>
          
          <view v-else v-for="message in currentMessages" :key="message.id"
            class="message-item" :class="{ 'unread': !message.read }">
            <!-- 用户头像 -->
            <image 
              :src="message.fromUser.avatar || '/static/images/user.png'" 
              class="user-avatar"
              @tap="goToUser(message.fromUser.id)"
            />
            
            <!-- 消息内容 -->
            <view class="message-content" @tap="goToContent(message)" @longpress="handleLongpress($event, message)">
              <view class="message-header">
                <view class="message-info">
                  <view class="message-icon">
                    <WdIcon 
                      :name="getMessageIcon(message)" 
                      size="16" 
                      :color="activeTab === 'comments' ? '#2196f3' : '#ff9800'" 
                    />
                  </view>
                  <text class="message-title" :class="{ 'font-bold': !message.read }">
                    {{ getMessageTitle(message) }}
                  </text>
                </view>
                <text class="message-time">{{ formatTime(message.timestamp) }}</text>
              </view>
              
              <!-- 评论内容 -->
              <view v-if="message.commentContent" class="comment-content">
                <text class="comment-text">{{ message.commentContent }}</text>
              </view>
              
              <!-- 内容预览 -->
              <view class="content-preview" :id="`bubble-${message.id}`">
                <image 
                  v-if="message.content.image" 
                  :src="message.content.image" 
                  class="content-image"
                />
                <view class="content-text">
                  <text class="content-title">{{ message.content.title }}</text>
                  <text v-if="message.content.description" class="content-desc">
                    {{ message.content.description }}
                  </text>
                </view>
                
                <!-- 回复按钮 -->
                <view class="reply-button" @click.stop="replyComment(message)">
                  <WdIcon name="reply" size="14" color="#666" />
                </view>
              </view>
            </view>
            
            <!-- 未读标记 -->
            <view v-if="!message.read" class="unread-dot"></view>
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 操作菜单 -->
    <view v-if="actionMenu.visible" class="action-menu" :style="{
      left: actionMenu.x + 'px',
      top: actionMenu.y + 'px'
    }" @tap.stop>
      <view class="action-item" @tap="handleAction('copy')">复制</view>
      <view v-if="!actionMenu.message?.read" class="action-item" @tap="handleAction('mark')">标为已读</view>
      <view class="action-item" @tap="handleAction('reply')">回复</view>
      <view class="action-item delete" @tap="handleAction('delete')">删除</view>
    </view>
    <view v-if="actionMenu.visible" class="mask" @tap="handleTapOutside"></view>
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
  @apply flex items-center;
}

.message-icon {
  @apply mr-2;
}

.message-title {
  @apply text-base text-gray-800;
}

.message-time {
  @apply text-xs text-gray-400;
}

.comment-content {
  @apply p-2 bg-blue-50 rounded-lg mb-2;
}

.comment-text {
  @apply text-sm text-gray-700;
  word-break: break-word;
  line-height: 1.5;
}

.content-preview {
  @apply flex items-center p-2 bg-gray-50 rounded-lg relative;
}

.content-image {
  @apply w-12 h-12 rounded mr-3 flex-shrink-0;
  object-fit: cover;
}

.content-text {
  @apply flex-1;
}

.content-title {
  @apply text-sm font-medium text-gray-800 block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-desc {
  @apply text-xs text-gray-500 mt-1 block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.reply-button {
  @apply absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white shadow-sm;
  
  &:active {
    @apply bg-gray-100;
  }
}

.unread-dot {
  @apply absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500;
}

.action-menu {
  position: fixed;
  background: #333;
  border-radius: 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  z-index: 1000;
  transform: translate(-50%, -100%);
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -16rpx;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8rpx;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
}

.action-item {
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 25%;
    height: 50%;
    width: 1rpx;
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    background-color: #444;
  }

  &.delete {
    color: #ff6b6b;
  }
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}
</style>