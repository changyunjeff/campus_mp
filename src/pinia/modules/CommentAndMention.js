import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义评论与@消息的pinia
export const useCommentAndMention = defineStore('commentAndMention', () => {
  // 评论消息列表
  const commentMessages = ref([])
  
  // @消息列表
  const mentionMessages = ref([])
  
  // 模拟数据初始化
  const initMockData = () => {
    commentMessages.value = [
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
        commentContent: '这个价格很不错，还有其他颜色吗？',
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
          title: '今天的晚餐',
          description: '自己做的意大利面',
          image: 'https://picsum.photos/300/300?random=2'
        },
        commentContent: '看起来很好吃，能分享一下做法吗？',
        timestamp: Date.now() - 7200000,
        read: true
      }
    ]
    
    mentionMessages.value = [
      {
        id: 3,
        fromUser: {
          id: 'user3',
          nickname: '小李',
          avatar: '/static/images/user.png'
        },
        contentType: 'community',
        contentId: 'community2',
        content: {
          title: '校园活动讨论',
          description: '关于下周活动的讨论',
          image: 'https://picsum.photos/300/300?random=3'
        },
        commentContent: '@你 一起参加这个活动怎么样？',
        timestamp: Date.now() - 1800000,
        read: false
      },
      {
        id: 4,
        fromUser: {
          id: 'user4',
          nickname: '小王',
          avatar: '/static/images/user.png'
        },
        contentType: 'goods',
        contentId: 'goods2',
        content: {
          title: '二手教材',
          description: '大学物理教材，9成新',
          image: 'https://picsum.photos/300/300?random=4'
        },
        commentContent: '@你 这本书还在吗？我想要',
        timestamp: Date.now() - 900000,
        read: false
      }
    ]
  }
  
  // 获取消息
  const fetchMessages = async () => {
    try {
      // 这里应该调用实际的API
      // const commentRes = await api.getCommentMessages()
      // const mentionRes = await api.getMentionMessages()
      // commentMessages.value = commentRes.data
      // mentionMessages.value = mentionRes.data
      
      // 暂时使用模拟数据
      initMockData()
    } catch (error) {
      console.error('获取评论@消息失败:', error)
    }
  }
  
  // 标记消息为已读
  const markAsRead = (id, type) => {
    const messages = type === 'comments' ? commentMessages.value : mentionMessages.value
    const message = messages.find(msg => msg.id === id)
    if (message) {
      message.read = true
    }
  }
  
  // 标记所有消息为已读
  const markAllAsRead = (type) => {
    const messages = type === 'comments' ? commentMessages.value : mentionMessages.value
    messages.forEach(message => {
      message.read = true
    })
  }
  
  // 删除消息
  const deleteMessage = (id, type) => {
    if (type === 'comments') {
      const index = commentMessages.value.findIndex(msg => msg.id === id)
      if (index !== -1) {
        commentMessages.value.splice(index, 1)
      }
    } else {
      const index = mentionMessages.value.findIndex(msg => msg.id === id)
      if (index !== -1) {
        mentionMessages.value.splice(index, 1)
      }
    }
  }
  
  // 获取未读数量
  const getUnreadCount = (type) => {
    const messages = type === 'comments' ? commentMessages.value : mentionMessages.value
    return messages.filter(msg => !msg.read).length
  }
  
  // 获取总未读数量
  const getTotalUnreadCount = computed(() => {
    return getUnreadCount('comments') + getUnreadCount('mentions')
  })
  
  // 添加新的评论消息
  const addCommentMessage = (message) => {
    commentMessages.value.unshift({
      ...message,
      id: Date.now(),
      timestamp: Date.now(),
      read: false
    })
  }
  
  // 添加新的@消息
  const addMentionMessage = (message) => {
    mentionMessages.value.unshift({
      ...message,
      id: Date.now(),
      timestamp: Date.now(),
      read: false
    })
  }
  
  // 回复评论
  const replyComment = async (messageId, replyContent) => {
    try {
      // 这里应该调用实际的API
      // await api.replyComment(messageId, replyContent)
      
      console.log('回复评论:', messageId, replyContent)
    } catch (error) {
      console.error('回复评论失败:', error)
      throw error
    }
  }
  
  // 批量删除消息
  const batchDeleteMessages = (ids, type) => {
    ids.forEach(id => deleteMessage(id, type))
  }
  
  return {
    commentMessages,
    mentionMessages,
    getTotalUnreadCount,
    fetchMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    getUnreadCount,
    addCommentMessage,
    addMentionMessage,
    replyComment,
    batchDeleteMessages
  }
}, {
  persist: {
    key: 'commentAndMention',
    paths: ['commentMessages', 'mentionMessages'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    }
  }
})