import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {useMessage} from "@/composables/message";

// 定义新增关注的pinia
export const useNewFans = defineStore('newFans', () => {
  // 新增关注消息列表
  const fanMessages = ref([])

  // 标记消息为已读
  const markAsRead = (id) => {
    const message = fanMessages.value.find(msg => msg.id === id)
    if (message) {
      message.read = true
    }
  }
  
  // 标记所有消息为已读
  const markAllAsRead = () => {
    fanMessages.value.forEach(message => {
      message.read = true
    })
  }
  
  // 删除消息
  const deleteMessage = (id) => {
    const index = fanMessages.value.findIndex(msg => msg.id === id)
    if (index !== -1) {
      fanMessages.value.splice(index, 1)
    }
  }
  
  // 关注用户
  const followUser = async (userId) => {
    try {
      const messageComposable = useMessage()
      await messageComposable.sendFollowMessage(userId)

      // 更新本地状态
      const message = fanMessages.value.find(msg => msg.from === userId)
      if (message) {
        message.fromUser.isFollowing = true
        message.fromUser.followersCount += 1
      }
    } catch (error) {
      console.error('关注用户失败:', error)
      throw error
    }
  }
  
  // 取消关注用户
  const unfollowUser = async (userId) => {
    try {
      await UserApi.unfollowUser(userId)
      
      // 更新本地状态
      const message = fanMessages.value.find(msg => msg.from === userId)
      if (message) {
        message.fromUser.isFollowing = false
        message.fromUser.followersCount -= 1
      }
    } catch (error) {
      console.error('取消关注用户失败:', error)
      throw error
    }
  }
  
  // 获取未读数量
  const getUnreadCount = () => {
    return fanMessages.value.filter(msg => !msg.read).length
  }
  
  // 添加新的关注消息
  const addFanMessage = (message) => {
    fanMessages.value.unshift({
      ...message,
      read: false
    })
  }
  
  // 批量标记为已读
  const batchMarkAsRead = (ids) => {
    ids.forEach(id => markAsRead(id))
  }
  
  // 获取最新的关注消息
  const getLatestFanMessage = computed(() => {
    return fanMessages.value.length > 0 ? fanMessages.value[0] : null
  })
  
  const clearAllData = () => {
    fanMessages.value = []
    console.log('NewFans: 已清除所有数据')
  }

  return {
    fanMessages,
    getLatestFanMessage,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    followUser,
    unfollowUser,
    getUnreadCount,
    addFanMessage,
    batchMarkAsRead,
    clearAllData
  }
}, {
  persist: {
    key: 'newFans',
    paths: ['fanMessages'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    }
  }
})