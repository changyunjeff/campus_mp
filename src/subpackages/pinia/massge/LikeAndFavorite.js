import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义点赞与收藏消息的pinia
export const useLikeAndFavorite = defineStore('likeAndFavorite', () => {
  // 点赞消息列表
  const likeMessages = ref([])
  
  // 收藏消息列表
  const favoriteMessages = ref([])
  
  // 模拟数据初始化
  const initMockData = () => {
    likeMessages.value = [
      {
        id: 1,
        fromUser: {
          id: 'user1',
          nickname: '小明',
          avatar: '/static/images/user.png'
        },
        contentType: 'goods',
        contentId: 'goods1',
        content: {
          title: 'iPhone 15 Pro 256GB',
          description: '全新未拆封，原价购入',
          image: 'https://picsum.photos/300/300?random=1'
        },
        timestamp: Date.now() - 3600000,
        read: false
      },
      {
        id: 2,
        fromUser: {
          id: 'user2',
          nickname: '小红',
          avatar: '/static/images/user.png'
        },
        contentType: 'community',
        contentId: 'community1',
        content: {
          title: '今天天气真好',
          description: '阳光明媚，适合出去走走',
          image: 'https://picsum.photos/300/300?random=2'
        },
        timestamp: Date.now() - 7200000,
        read: true
      }
    ]
    
    favoriteMessages.value = [
      {
        id: 3,
        fromUser: {
          id: 'user3',
          nickname: '小李',
          avatar: '/static/images/user.png'
        },
        contentType: 'goods',
        contentId: 'goods2',
        content: {
          title: '二手自行车',
          description: '骑行2年，保养良好',
          image: 'https://picsum.photos/300/300?random=3'
        },
        timestamp: Date.now() - 1800000,
        read: false
      }
    ]
  }
  
  // 获取消息
  const fetchMessages = async () => {
    try {
      // 这里应该调用实际的API
      // const likeRes = await api.getLikeMessages()
      // const favoriteRes = await api.getFavoriteMessages()
      // likeMessages.value = likeRes.data
      // favoriteMessages.value = favoriteRes.data
      
      // 暂时使用模拟数据
      initMockData()
    } catch (error) {
      console.error('获取点赞收藏消息失败:', error)
    }
  }
  
  // 标记消息为已读
  const markAsRead = (id, type) => {
    const messages = type === 'likes' ? likeMessages.value : favoriteMessages.value
    const message = messages.find(msg => msg.id === id)
    if (message) {
      message.read = true
    }
  }
  
  // 标记所有消息为已读
  const markAllAsRead = (type) => {
    const messages = type === 'likes' ? likeMessages.value : favoriteMessages.value
    messages.forEach(message => {
      message.read = true
    })
  }
  
  // 删除消息
  const deleteMessage = (id, type) => {
    if (type === 'likes') {
      const index = likeMessages.value.findIndex(msg => msg.id === id)
      if (index !== -1) {
        likeMessages.value.splice(index, 1)
      }
    } else {
      const index = favoriteMessages.value.findIndex(msg => msg.id === id)
      if (index !== -1) {
        favoriteMessages.value.splice(index, 1)
      }
    }
  }
  
  // 获取未读数量
  const getUnreadCount = (type) => {
    const messages = type === 'likes' ? likeMessages.value : favoriteMessages.value
    return messages.filter(msg => !msg.read).length
  }
  
  // 获取总未读数量
  const getTotalUnreadCount = computed(() => {
    return getUnreadCount('likes') + getUnreadCount('favorites')
  })
  
  // 添加新的点赞消息
  const addLikeMessage = (message) => {
    likeMessages.value.unshift({
      ...message,
      id: Date.now(),
      timestamp: Date.now(),
      read: false
    })
  }
  
  // 添加新的收藏消息
  const addFavoriteMessage = (message) => {
    favoriteMessages.value.unshift({
      ...message,
      id: Date.now(),
      timestamp: Date.now(),
      read: false
    })
  }
  
  return {
    likeMessages,
    favoriteMessages,
    getTotalUnreadCount,
    fetchMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    getUnreadCount,
    addLikeMessage,
    addFavoriteMessage
  }
})