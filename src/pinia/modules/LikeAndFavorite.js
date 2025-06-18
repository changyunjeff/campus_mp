import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义点赞与收藏消息的pinia
export const useLikeAndFavorite = defineStore('likeAndFavorite', () => {
  // 点赞消息列表
  const likeMessages = ref([])
  
  // 收藏消息列表
  const favoriteMessages = ref([])
  
  // 合并的消息列表，按时间降序排列（最新的在前面）
  const allMessages = computed(() => {
    const combined = [
      ...likeMessages.value.map(msg => ({ ...msg })),
      ...favoriteMessages.value.map(msg => ({ ...msg }))
    ]
    console.group("==============>>>  点赞和收藏的消息列表： <<<<====================")

    combined.forEach((item)=>{
      console.debug(item)
    })

    console.groupEnd()
    // 按时间戳降序排序（最新的在前面）
    return combined.sort((a, b) => b.timestamp - a.timestamp)
  })
  
  // 标记单个消息为已读
  const markAsRead = (id) => {
    // 在点赞消息中查找
    const likeMessage = likeMessages.value.find(msg => msg.id === id)
    if (likeMessage) {
      likeMessage.read = true
      return
    }
    
    // 在收藏消息中查找
    const favoriteMessage = favoriteMessages.value.find(msg => msg.id === id)
    if (favoriteMessage) {
      favoriteMessage.read = true
    }
  }
  
  // 标记所有消息为已读
  const markAllAsRead = () => {
    likeMessages.value.forEach(message => {
      message.read = true
    })
    favoriteMessages.value.forEach(message => {
      message.read = true
    })
  }
  
  // 删除消息
  const deleteMessage = (id) => {
    // 从点赞消息中删除
    const likeIndex = likeMessages.value.findIndex(msg => msg.id === id)
    if (likeIndex !== -1) {
      likeMessages.value.splice(likeIndex, 1)
      return
    }
    
    // 从收藏消息中删除
    const favoriteIndex = favoriteMessages.value.findIndex(msg => msg.id === id)
    if (favoriteIndex !== -1) {
      favoriteMessages.value.splice(favoriteIndex, 1)
    }
  }
  
  // 获取未读数量
  const getUnreadCount = (type) => {
    if (type === 'likes') {
      return likeMessages.value.filter(msg => !msg.read).length
    } else if (type === 'favorites') {
      return favoriteMessages.value.filter(msg => !msg.read).length
    }
    return 0
  }
  
  // 获取总未读数量
  const getTotalUnreadCount = computed(() => {
    return getUnreadCount('likes') + getUnreadCount('favorites')
  })
  
  // 添加新的点赞消息
  const addLikeMessage = (message) => {
    likeMessages.value.unshift({
      ...message,
      read: false
    })
  }
  
  // 添加新的收藏消息
  const addFavoriteMessage = (message) => {
    favoriteMessages.value.unshift({
      ...message,
      read: false
    })
  }
  
  // 处理从消息系统接收到的点赞/收藏通知
  const handleNotification = (notification) => {
    if (notification.type === 'like') {
      addLikeMessage(notification)
    } else if (notification.type === 'favorite') {
      addFavoriteMessage(notification)
    }
  }
  
  return {
    likeMessages,
    favoriteMessages,
    allMessages, // 新增：合并和排序的消息列表
    getTotalUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    getUnreadCount,
    addLikeMessage,
    addFavoriteMessage,
    handleNotification // 新增：处理消息系统通知
  }
}, {
  persist: {
    key: 'likeAndFavorite',
    paths: ['likeMessages', 'favoriteMessages'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    }
  }
})