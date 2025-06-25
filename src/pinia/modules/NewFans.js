import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义新增关注的pinia
export const useNewFans = defineStore('newFans', () => {
  // 新增关注消息列表
  const fanMessages = ref([])
  
  // 模拟数据初始化
  const initMockData = () => {
    fanMessages.value = [
      {
        id: 1,
        fromUser: {
          id: 'user1',
          nickname: '小明',
          avatar: '/static/images/user.png',
          introduction: '热爱生活，喜欢摄影',
          followersCount: 123,
          followingCount: 45,
          isFollowing: false
        },
        timestamp: Date.now() - 3600000,
        read: false
      },
      {
        id: 2,
        fromUser: {
          id: 'user2',
          nickname: '小红',
          avatar: '/static/images/user.png',
          introduction: '设计师，追求美的生活',
          followersCount: 89,
          followingCount: 67,
          isFollowing: true
        },
        timestamp: Date.now() - 7200000,
        read: true
      },
      {
        id: 3,
        fromUser: {
          id: 'user3',
          nickname: '小李',
          avatar: '/static/images/user.png',
          introduction: '程序员，技术宅',
          followersCount: 234,
          followingCount: 12,
          isFollowing: false
        },
        timestamp: Date.now() - 1800000,
        read: false
      }
    ]
  }
  
  // 获取新增关注消息
  const fetchMessages = async () => {
    try {
      // 这里应该调用实际的API
      // const res = await api.getNewFansMessages()
      // fanMessages.value = res.data
      
      // 暂时使用模拟数据
      initMockData()
    } catch (error) {
      console.error('获取新增关注消息失败:', error)
    }
  }
  
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
      // 这里应该调用实际的API
      // await api.followUser(userId)
      
      // 更新本地状态
      const message = fanMessages.value.find(msg => msg.fromUser.id === userId)
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
      // 这里应该调用实际的API
      // await api.unfollowUser(userId)
      
      // 更新本地状态
      const message = fanMessages.value.find(msg => msg.fromUser.id === userId)
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
      id: Date.now(),
      timestamp: Date.now(),
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
  
  return {
    fanMessages,
    getLatestFanMessage,
    fetchMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    followUser,
    unfollowUser,
    getUnreadCount,
    addFanMessage,
    batchMarkAsRead
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