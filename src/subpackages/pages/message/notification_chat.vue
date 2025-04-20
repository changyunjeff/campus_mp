<script setup>
import Layout from '@/layout/index.vue'
import {formatTime} from '@/utils/time'
import {useRouter} from 'uni-mini-router'
import {useToast} from "@/composables/toast"
import {onLoad} from "@dcloudio/uni-app"

const router = useRouter()
const toast = useToast()

// 通知列表
const notifications = ref([
  {
    id: 1,
    title: '系统通知',
    content: '欢迎使用校园通知系统，这里将显示所有与您相关的系统通知。',
    timestamp: Date.now() - 3600000 * 24 * 3,
    read: true,
    type: 'welcome'
  },
  {
    id: 2,
    title: '活动提醒',
    content: '您关注的「校园歌手大赛」将于明天下午2点在大礼堂举行，不要错过哦！',
    timestamp: Date.now() - 3600000 * 12,
    read: false,
    type: 'event'
  },
  {
    id: 3,
    title: '课程变更',
    content: '您的「高等数学」课程时间已变更为周三上午10:00-11:30，请及时查看。',
    timestamp: Date.now() - 1800000,
    read: false,
    type: 'course'
  },
  {
    id: 4,
    title: '系统维护',
    content: '系统将于本周六凌晨2:00-4:00进行例行维护，期间部分功能可能无法使用。',
    timestamp: Date.now() - 600000,
    read: false,
    type: 'system'
  },
  {
    id: 5,
    title: '成绩发布',
    content: '您的「数据结构」课程成绩已发布，请前往成绩查询页面查看。',
    timestamp: Date.now() - 300000,
    read: false,
    type: 'grade'
  }
])

// 标记通知为已读
const markAsRead = (id) => {
  const notification = notifications.value.find(item => item.id === id)
  if (notification) {
    notification.read = true
  }
}

// 标记所有通知为已读
const markAllAsRead = () => {
  notifications.value.forEach(notification => {
    notification.read = true
  })
  toast.show('已全部标为已读')
}

// 删除通知
const deleteNotification = (id) => {
  const index = notifications.value.findIndex(item => item.id === id)
  if (index !== -1) {
    notifications.value.splice(index, 1)
    toast.show('已删除通知')
  }
}

// 获取未读通知数量
const unreadCount = computed(() => {
  return notifications.value.filter(item => !item.read).length
})

// 获取通知图标
const getNotificationIcon = (type) => {
  switch(type) {
    case 'welcome': return 'home'
    case 'event': return 'calendar'
    case 'course': return 'book'
    case 'system': return 'setting'
    case 'grade': return 'star'
    default: return 'notification'
  }
}

// 获取通知图标背景色
const getNotificationIconBg = (type) => {
  switch(type) {
    case 'welcome': return 'bg-green-50'
    case 'event': return 'bg-blue-50'
    case 'course': return 'bg-purple-50'
    case 'system': return 'bg-gray-50'
    case 'grade': return 'bg-yellow-50'
    default: return 'bg-blue-50'
  }
}

// 获取通知图标颜色
const getNotificationIconColor = (type) => {
  switch(type) {
    case 'welcome': return 'color:#22c55e'
    case 'event': return 'color:#3b82f6'
    case 'course': return 'color:#8b5cf6'
    case 'system': return 'color:#6b7280'
    case 'grade': return 'color:#eab308'
    default: return 'color:#3b82f6'
  }
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
            <view :class="['notification-icon', getNotificationIconBg(notification.type)]">
              <WdIcon 
                custom-class="iconfont" 
                class-prefix="icon" 
                :name="getNotificationIcon(notification.type)" 
                :size="20" 
                :custom-style="getNotificationIconColor(notification.type)" 
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