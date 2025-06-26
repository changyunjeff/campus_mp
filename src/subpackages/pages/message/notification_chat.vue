<script setup>
import Layout from '@/layout/index.vue'
import {formatTime} from '@/utils/time'
import {useRouter} from 'uni-mini-router'
import {useToast} from "@/composables/toast"
import {useSystemNotification} from '@/pinia/modules/SystemNotification'
import {useConversations} from '@/composables/Conversations'
import {onLoad, onUnload} from "@dcloudio/uni-app"

const router = useRouter()
const toast = useToast()
const systemNotification = useSystemNotification()
const conversationManager = useConversations()

// 使用store中的通知列表
const notifications = computed(() => systemNotification.getSortedNotifications)

// 获取未读通知数量
const unreadCount = computed(() => systemNotification.getUnreadCount)

// 标记通知为已读
const markAsRead = (id) => {
  systemNotification.markAsRead(id)
}

// 标记所有通知为已读
const markAllAsRead = () => {
  systemNotification.markAllAsRead()
  toast.show('已全部标为已读')
}

// 删除通知
const deleteNotification = (id) => {
  systemNotification.deleteNotification(id)
  toast.show('已删除通知')
}

// 获取通知图标（使用store中的方法）
const getNotificationIcon = (type) => {
  return systemNotification.getNotificationIcon(type)
}

// 获取通知图标背景色（使用store中的方法）
const getNotificationIconBg = (type) => {
  return systemNotification.getNotificationIconBg(type)
}

// 获取通知图标颜色（使用store中的方法）
const getNotificationIconColor = (type) => {
  return `color:${systemNotification.getNotificationIconColor(type)}`
}

// 操作菜单状态
const actionMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  notification: null
})

// 处理长按事件
const handleLongpress = (e, notification) => {
  actionMenu.notification = notification
  
  // 获取当前长按的气泡元素位置
  const bubbleId = `bubble-${notification.id}`
  // 获取气泡元素的位置信息
  uni.createSelectorQuery()
    .select(`#${bubbleId}`)
    .boundingClientRect(rect => {
      if (rect) {
        // 设置菜单位置在气泡上方中心位置
        actionMenu.x = rect.left + rect.width / 2
        actionMenu.y = rect.top - 10 // 在气泡上方留出一点间距
        actionMenu.visible = true
      } else {
        console.error('无法获取气泡位置')
        // 如果无法获取精确位置，使用备用方法（基于事件坐标）
        const touch = e.touches[0]
        actionMenu.x = touch.clientX
        actionMenu.y = touch.clientY - 60 // 在手指上方显示
        actionMenu.visible = true
      }
    })
    .exec()
}

// 处理菜单操作
const handleAction = (action) => {
  const notification = actionMenu.notification
  switch(action) {
    case 'copy':
      uni.setClipboardData({
        data: notification.content,
        success: () => toast.show('已复制')
      })
      break
    case 'mark':
      markAsRead(notification.id)
      toast.show('已标为已读')
      break
    case 'delete':
      deleteNotification(notification.id)
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
  <layout>
    <template #center>
      系统通知
    </template>
    <template #right>
      <view class="flex items-center" @tap="markAllAsRead">
        <text class="text-sm text-blue-500">全部已读</text>
      </view>
    </template>
    
    <view class="notification-container">
      <!-- 通知消息列表 -->
      <scroll-view class="notification-list" scroll-y :show-scrollbar="false" scroll-anchoring>
        <view class="notification-list-content">
          <view v-if="notifications.length === 0" class="empty-state">
            <WdIcon name="notification" size="64rpx" color="#ccc"></WdIcon>
            <text class="mt-3 text-gray-400">暂无系统通知</text>
          </view>
          
          <view v-else v-for="(notification, index) in notifications" :key="notification.id"
            class="notification-item" :class="{ 'unread': !notification.read }">
            <!-- 通知图标 -->
            <view :class="['notification-icon', getNotificationIconBg(notification.notification_type)]">
              <WdIcon 
                custom-class="iconfont" 
                class-prefix="icon" 
                :name="getNotificationIcon(notification.notification_type)"
                :size="20" 
                :custom-style="getNotificationIconColor(notification.notification_type)"
              />
            </view>
            
            <!-- 通知内容 -->
            <view class="notification-content" @tap="markAsRead(notification.id)" @longpress="handleLongpress($event, notification)">
              <view class="flex justify-between items-start mb-1">
                <text class="notification-title" :class="{ 'font-bold': !notification.read }">{{ notification.title }}</text>
                <text class="notification-time">{{ formatTime(notification.timestamp) }}</text>
              </view>
              <view class="notification-message" :id="`bubble-${notification.id}`">{{ notification.content }}</view>
            </view>
            
            <!-- 未读标记 -->
            <view v-if="!notification.read" class="unread-dot"></view>
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
      <view v-if="!actionMenu.notification?.read" class="action-item" @tap="handleAction('mark')">标为已读</view>
      <view class="action-item delete" @tap="handleAction('delete')">删除</view>
    </view>
    <view v-if="actionMenu.visible" class="mask" @tap="handleTapOutside"></view>
  </layout>
</template>

<style lang="scss" scoped>
.notification-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 190rpx);
  background-color: #f5f5f5;
  position: relative;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
}

.notification-list-content {
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

.notification-item {
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

.notification-icon {
  @apply w-10 h-10 rounded-full flex items-center justify-center mr-3 flex-shrink-0;
}

.notification-content {
  @apply flex-1;
}

.notification-title {
  @apply text-base text-gray-800;
}

.notification-time {
  @apply text-xs text-gray-400;
}

.notification-message {
  @apply text-sm text-gray-600 mt-1 break-words;
  line-height: 1.5;
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