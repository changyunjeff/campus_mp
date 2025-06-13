<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/layout/index.vue'
import { formatTime } from '@/utils/time'
import { useRouter } from 'uni-mini-router'
import { useNewFans } from '@/subpackages/pinia/massge/NewFans'
import { useToast } from '@/composables/toast'

const router = useRouter()
const newFansStore = useNewFans()
const toast = useToast()

// 获取新增关注消息
const fanMessages = computed(() => newFansStore.fanMessages)

// 标记消息为已读
const markAsRead = (id) => {
  newFansStore.markAsRead(id)
}

// 标记所有消息为已读
const markAllAsRead = () => {
  newFansStore.markAllAsRead()
  toast.show('已全部标为已读')
}

// 删除消息
const deleteMessage = (id) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条消息吗？',
    success: (res) => {
      if (res.confirm) {
        newFansStore.deleteMessage(id)
        toast.show('已删除消息')
      }
    }
  })
}

// 跳转到用户页面
const goToUser = (userId) => {
  router.push({
    name: 'user_profile',
    query: { id: userId }
  })
}

// 关注用户
const followUser = (userId) => {
  newFansStore.followUser(userId)
  toast.show('已关注')
}

// 回关用户
const followBack = (message) => {
  markAsRead(message.id)
  followUser(message.fromUser.id)
}

// 获取未读数量
const unreadCount = computed(() => {
  return newFansStore.getUnreadCount()
})

// 页面加载时获取消息
onMounted(() => {
  newFansStore.fetchMessages()
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
    case 'mark':
      markAsRead(message.id)
      toast.show('已标为已读')
      break
    case 'delete':
      deleteMessage(message.id)
      break
    case 'follow':
      followBack(message)
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
      新增关注
    </template>
    <template #right>
      <view class="flex items-center" @tap="markAllAsRead">
        <text class="text-sm text-blue-500">全部已读</text>
      </view>
    </template>
    
    <view class="message-container">
      <!-- 消息列表 -->
      <scroll-view class="message-list" scroll-y :show-scrollbar="false" scroll-anchoring>
        <view class="message-list-content">
          <view v-if="fanMessages.length === 0" class="empty-state">
            <WdIcon name="user-plus" size="64rpx" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">暂无新增关注消息</text>
          </view>
          
          <view v-else v-for="message in fanMessages" :key="message.id"
            class="message-item" :class="{ 'unread': !message.read }">
            <!-- 用户头像 -->
            <image 
              :src="message.fromUser.avatar || '/static/images/user.png'" 
              class="user-avatar"
              @tap="goToUser(message.fromUser.id)"
            />
            
            <!-- 消息内容 -->
            <view class="message-content" @tap="goToUser(message.fromUser.id)" @longpress="handleLongpress($event, message)">
              <view class="message-header">
                <view class="message-info">
                  <view class="message-icon">
                    <WdIcon name="user-plus" size="16" color="#4caf50" />
                  </view>
                  <text class="message-title" :class="{ 'font-bold': !message.read }">
                    {{ message.fromUser.nickname }} 关注了你
                  </text>
                </view>
                <text class="message-time">{{ formatTime(message.timestamp) }}</text>
              </view>
              
              <!-- 用户信息预览 -->
              <view class="user-preview" :id="`bubble-${message.id}`">
                <view class="user-info">
                  <text class="user-nickname">{{ message.fromUser.nickname }}</text>
                  <text v-if="message.fromUser.introduction" class="user-intro">
                    {{ message.fromUser.introduction }}
                  </text>
                  <view class="user-stats">
                    <text class="stat-item">{{ message.fromUser.followersCount || 0 }} 粉丝</text>
                    <text class="stat-item">{{ message.fromUser.followingCount || 0 }} 关注</text>
                  </view>
                </view>
                
                <!-- 关注按钮 -->
                <view class="action-buttons">
                  <wd-button 
                    v-if="!message.fromUser.isFollowing"
                    type="primary" 
                    size="small"
                    @click.stop="followBack(message)"
                  >
                    回关
                  </wd-button>
                  <wd-button 
                    v-else
                    type="default" 
                    size="small"
                    disabled
                  >
                    已关注
                  </wd-button>
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
      <view v-if="!actionMenu.message?.read" class="action-item" @tap="handleAction('mark')">标为已读</view>
      <view v-if="!actionMenu.message?.fromUser?.isFollowing" class="action-item" @tap="handleAction('follow')">回关</view>
      <view class="action-item delete" @tap="handleAction('delete')">删除</view>
    </view>
    <view v-if="actionMenu.visible" class="mask" @tap="handleTapOutside"></view>
  </Layout>
</template>

<style lang="scss" scoped>
.message-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 190rpx);
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
  border: 2rpx solid #e5e5e5;
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
  padding: 16rpx 24rpx;
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