import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from './user'

export const usePrivateChat = defineStore('private-chat', () => {
  const conversations = ref({})
  const currentChatUserId = ref('')

  const addMessage = (userId, message) => {
    if (!conversations.value[userId]) {
      conversations.value[userId] = {
        userId,
        userInfo: null,
        messages: [],
        unreadCount: 0,
        lastMessage: null,
        lastMessageTime: 0,
        isOnline: false,
        isPinned: false,
        isMuted: false
      }
    }

    const conv = { ...conversations.value[userId] }
    conv.messages = [...conv.messages, message]
    conv.lastMessage = message
    conv.lastMessageTime = message.timestamp

    if (userId !== currentChatUserId.value && !message.isSelf) {
      conv.unreadCount++
    }

    conversations.value[userId] = conv

    console.log('新消息添加完成:', {
      userId,
      messageId: message.id,
      conversationExists: !!conversations.value[userId],
      messageCount: conv.messages.length,
      lastMessage: conv.lastMessage?.content
    })
  }

  const getConversations = computed(() => {
    const convList = Object.values(conversations.value).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.lastMessageTime - a.lastMessageTime
    })

    console.log("PrivateChat getConversations computed 执行:", {
      mapSize: Object.keys(conversations.value).length,
      resultLength: convList.length,
      mapKeys: Object.keys(conversations.value),
      result: convList
    })

    return convList
  })

  const getConversation = (userId) => {
    return conversations.value[userId] || null
  }

  const addConversation = (userId) => {
    if (!(userId in conversations.value)) {
      const isAnonymous = userId.includes('_anonymous')
      conversations.value[userId] = {
        userId,
        userInfo: null,
        messages: [],
        unreadCount: 0,
        lastMessage: null,
        lastMessageTime: 0,
        isOnline: false,
        isPinned: false,
        isMuted: false,
        isAnonymous, // 标记是否为匿名会话
        realUserId: isAnonymous ? userId.replace('_anonymous', '') : userId // 保存真实用户ID
      }
    }
    return conversations.value[userId]
  }

  const getMessages = (userId) => {
    return conversations.value[userId]?.messages || []
  }

  const markAsRead = (userId) => {
    if (conversations.value[userId]) {
      const conv = { ...conversations.value[userId], unreadCount: 0 }
      conversations.value[userId] = conv
    }
  }

  const deleteConversation = (userId) => {
    delete conversations.value[userId]
  }

  const togglePin = (userId) => {
    if (conversations.value[userId]) {
      const conv = { ...conversations.value[userId] }
      conv.isPinned = !conv.isPinned
      conversations.value[userId] = conv
    }
  }

  const toggleMute = (userId) => {
    if (conversations.value[userId]) {
      const conv = { ...conversations.value[userId] }
      conv.isMuted = !conv.isMuted
      conversations.value[userId] = conv
    }
  }

  const setUserInfo = (userId, userInfo={}) => {
    if (conversations.value[userId]) {
      const conv = { ...conversations.value[userId], ...userInfo }
      conversations.value[userId] = conv
    }
  }

  const setUserOnlineStatus = (userId, isOnline) => {
    if (conversations.value[userId]) {
      const conv = { ...conversations.value[userId], isOnline }
      conversations.value[userId] = conv
    }
  }

  const setCurrentChatUser = (userId) => {
    currentChatUserId.value = userId
    if (userId) {
      markAsRead(userId)
    }
  }

  const getTotalUnreadCount = computed(() => {
    let total = 0
    Object.values(conversations.value).forEach(conversation => {
      if (!conversation.isMuted) {
        total += conversation.unreadCount
      }
    })
    return total
  })

  const updateMessageStatus = (userId, messageId, status) => {
    const conv = conversations.value[userId]
    if (conv) {
      const msgIndex = conv.messages.findIndex(msg => msg.id === messageId)
      if (msgIndex !== -1) {
        const updatedMsg = { ...conv.messages[msgIndex], status }
        const updatedMessages = [...conv.messages]
        updatedMessages[msgIndex] = updatedMsg
        conversations.value[userId] = { ...conv, messages: updatedMessages }
      }
    }
  }

  const initConversations = (currentUserOpenid = null) => {
    try {
      if (!currentUserOpenid) {
        try {
          const userStore = useUserStore()
          currentUserOpenid = userStore.openid
        } catch (e) {
          console.warn('无法获取当前用户openid，使用默认值')
          const userInfo = uni.getStorageSync('userInfo')
          currentUserOpenid = userInfo?.openid
        }
      }

      console.log('initConversations 使用的用户ID:', currentUserOpenid)

      const storedMessages = uni.getStorageSync('message_history')
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages)

        Object.entries(parsedMessages).forEach(([conversationUserId, userMessages]) => {
          console.log(`处理会话 ${conversationUserId} 的历史消息:`, userMessages)

          const messages = Array.isArray(userMessages) ? userMessages : [userMessages]

          if (!(conversationUserId in conversations.value)) {
            const isAnonymous = conversationUserId.includes('_anonymous')
            conversations.value[conversationUserId] = {
              userId: conversationUserId,
              userInfo: null,
              messages: [],
              unreadCount: 0,
              lastMessage: null,
              lastMessageTime: 0,
              isOnline: false,
              isPinned: false,
              isMuted: false,
              isAnonymous, // 标记是否为匿名会话
              realUserId: isAnonymous ? conversationUserId.replace('_anonymous', '') : conversationUserId // 保存真实用户ID
            }
          }

          const conv = conversations.value[conversationUserId]

          messages.forEach(msg => {
            const formattedMessage = {
              id: msg.id,
              content: msg.content,
              timestamp: msg.timestamp,
              isSelf: msg.from === currentUserOpenid,
              status: msg.status || 'success',
              from: msg.from,
              to: msg.to,
              type: msg.type,
              method: msg.method
            }

            const exists = conv.messages.some(m => m.id === formattedMessage.id)
            if (!exists) {
              conv.messages.push(formattedMessage)
              conv.lastMessage = formattedMessage
              conv.lastMessageTime = formattedMessage.timestamp
            }
          })

          conv.messages.sort((a, b) => a.timestamp - b.timestamp)

          if (conv.messages.length > 0) {
            const lastMsg = conv.messages[conv.messages.length - 1]
            conv.lastMessage = lastMsg
            conv.lastMessageTime = lastMsg.timestamp
          }

          conversations.value[conversationUserId] = { ...conv }
        })

        console.log('成功加载历史会话数据', Object.keys(conversations.value).length, '个会话')
        console.log('加载的会话列表:', Object.keys(conversations.value))
        console.log('getConversations computed 值:', getConversations.value)

        Object.entries(conversations.value).forEach(([userId, conv]) => {
          console.log(`会话 ${userId}:`, {
            消息数量: conv.messages.length,
            最后消息: conv.lastMessage?.content,
            最后消息时间: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleString() : '无',
            会话详情: conv
          })
        })
      }
    } catch (error) {
      console.error('初始化私聊会话失败:', error)
    }
  }

  return {
    conversations,
    currentChatUserId,
    getConversations,
    getConversation,
    addConversation,
    getMessages,
    getTotalUnreadCount,
    addMessage,
    markAsRead,
    deleteConversation,
    togglePin,
    toggleMute,
    setUserInfo,
    setUserOnlineStatus,
    setCurrentChatUser,
    updateMessageStatus,
    initConversations
  }
}, {
  persist: {
    key: 'private-chat',
    paths: ['conversations'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync
    }
  }
})