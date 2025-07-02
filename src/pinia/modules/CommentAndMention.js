import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 定义评论消息的pinia
export const useCommentAndMention = defineStore('commentAndMention', () => {
  // 评论消息列表
  const commentMessages = ref([])
  
  // 标记消息为已读
  const markAsRead = (id) => {
    const message = commentMessages.value.find(msg => msg.id === id)
    if (message) {
      message.read = true
    }
  }
  
  // 标记所有消息为已读
  const markAllAsRead = () => {
    commentMessages.value.forEach(message => {
      message.read = true
    })
  }
  
  // 删除消息
  const deleteMessage = (id) => {
    const index = commentMessages.value.findIndex(msg => msg.id === id)
    if (index !== -1) {
      commentMessages.value.splice(index, 1)
    }
  }
  
  // 获取未读数量
  const getUnreadCount = () => {
    return commentMessages.value.filter(msg => !msg.read).length
  }
  
  // 添加新的评论消息
  const addCommentMessage = (message) => {
    commentMessages.value.unshift({
      ...message,
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
  const batchDeleteMessages = (ids) => {
    ids.forEach(id => deleteMessage(id))
  }
  
  const clearAllData = () => {
    commentMessages.value = []
    console.log('CommentAndMention: 已清除所有数据')
  }

  return {
    commentMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage,
    getUnreadCount,
    addCommentMessage,
    replyComment,
    batchDeleteMessages,
    clearAllData
  }
}, {
  persist: {
    key: 'commentAndMention',
    paths: ['commentMessages'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    }
  }
})