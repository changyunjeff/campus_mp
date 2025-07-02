import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义系统通知类消息的pinia
export const useSystemNotification = defineStore('system-notification', () => {
  // 系统通知消息列表
  const notifications = ref([])
  
  // 模拟数据初始化
  const initMockData = () => {
    notifications.value = [
      {
        id: 1,
        title: '系统通知',
        content: '欢迎使用校园通知系统，这里将显示所有与您相关的系统通知。',
        timestamp: Date.now() - 3600000 * 24 * 3,
        read: true,
        type: 'welcome',
        priority: 'normal'
      },
      {
        id: 2,
        title: '活动提醒',
        content: '您关注的「校园歌手大赛」将于明天下午2点在大礼堂举行，不要错过哦！',
        timestamp: Date.now() - 3600000 * 12,
        read: false,
        type: 'event',
        priority: 'high'
      },
      {
        id: 3,
        title: '课程变更',
        content: '您的「高等数学」课程时间已变更为周三上午10:00-11:30，请及时查看。',
        timestamp: Date.now() - 1800000,
        read: false,
        type: 'course',
        priority: 'high'
      },
      {
        id: 4,
        title: '系统维护',
        content: '系统将于本周六凌晨2:00-4:00进行例行维护，期间部分功能可能无法使用。',
        timestamp: Date.now() - 600000,
        read: false,
        type: 'system',
        priority: 'normal'
      },
      {
        id: 5,
        title: '成绩发布',
        content: '您的「数据结构」课程成绩已发布，请前往成绩查询页面查看。',
        timestamp: Date.now() - 300000,
        read: false,
        type: 'grade',
        priority: 'high'
      }
    ]
  }
  
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
  }
  
  // 删除通知
  const deleteNotification = (id) => {
    const index = notifications.value.findIndex(item => item.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }
  
  // 获取未读通知数量
  const getUnreadCount = computed(() => {
    return notifications.value.filter(item => !item.read).length
  })
  
  // 获取高优先级未读通知数量
  const getHighPriorityUnreadCount = computed(() => {
    return notifications.value.filter(item => !item.read && item.priority === 'high').length
  })
  
  // 根据类型获取通知
  const getNotificationsByType = (type) => {
    return notifications.value.filter(item => item.type === type)
  }
  
  // 获取最新的通知
  const getLatestNotifications = (limit = 5) => {
    return notifications.value
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  // 添加新通知
  const addNotification = (notification) => {
    notifications.value.unshift({
      ...notification,
      read: false
    })
  }
  
  // 批量删除通知
  const batchDeleteNotifications = (ids) => {
    ids.forEach(id => deleteNotification(id))
  }
  
  // 清空所有通知
  const clearAllNotifications = () => {
    notifications.value = []
  }
  
  // 根据优先级排序通知
  const getSortedNotifications = computed(() => {
    return notifications.value.sort((a, b) => {
      // 先按已读状态排序（未读在前）
      if (a.read !== b.read) {
        return a.read ? 1 : -1
      }
      // 再按优先级排序（高优先级在前）
      if (a.priority !== b.priority) {
        return a.priority > b.priority ? -1 : 1
      }
      // 最后按时间排序（新的在前）
      return b.timestamp - a.timestamp
    })
  })
  
  // 根据类型获取通知图标
  const getNotificationIcon = (type) => {
    const iconMap = {
      welcome: 'home',
      event: 'calendar',
      course: 'book',
      system: 'setting',
      grade: 'star'
    }
    return iconMap[type] || 'notification'
  }
  
  // 根据类型获取通知图标背景色
  const getNotificationIconBg = (type) => {
    const bgMap = {
      welcome: 'bg-green-50',
      event: 'bg-blue-50',
      course: 'bg-purple-50',
      system: 'bg-gray-50',
      grade: 'bg-yellow-50'
    }
    return bgMap[type] || 'bg-blue-50'
  }
  
  // 根据类型获取通知图标颜色
  const getNotificationIconColor = (type) => {
    const colorMap = {
      welcome: '#22c55e',
      event: '#3b82f6',
      course: '#8b5cf6',
      system: '#6b7280',
      grade: '#eab308'
    }
    return colorMap[type] || '#3b82f6'
  }
  
  const clearAllData = () => {
    notifications.value = []
    console.log('SystemNotification: 已清除所有数据')
  }

  return {
    notifications,
    getSortedNotifications,
    getUnreadCount,
    getHighPriorityUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationsByType,
    getLatestNotifications,
    addNotification,
    batchDeleteNotifications,
    clearAllNotifications,
    getNotificationIcon,
    getNotificationIconBg,
    getNotificationIconColor,
    clearAllData
  }
})