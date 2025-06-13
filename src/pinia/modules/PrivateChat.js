import { defineStore } from 'pinia'
import { ref, computed, triggerRef } from 'vue'
import { useUserStore } from './user'

// 定义私聊消息的pinia
export const usePrivateChat = defineStore('private-chat', () => {
  // 私聊会话列表
  const conversations = ref(new Map())
  
  // 当前聊天对象ID
  const currentChatUserId = ref('')
  
  // 添加消息到会话
  const addMessage = (userId, message) => {
    if (!conversations.value.has(userId)) {
      conversations.value.set(userId, {
        userId,
        userInfo: null,
        messages: [],
        unreadCount: 0,
        lastMessage: null,
        lastMessageTime: 0,
        isOnline: false,
        isPinned: false,
        isMuted: false
      })
    }
    
    const conversation = conversations.value.get(userId)
    conversation.messages.push(message)
    conversation.lastMessage = message
    conversation.lastMessageTime = message.timestamp
    
    // 如果不是当前聊天对象，增加未读数
    if (userId !== currentChatUserId.value && !message.isSelf) {
      conversation.unreadCount++
    }
    
    conversations.value.set(userId, conversation)
  }
  
  // 获取会话列表
  const getConversations = computed(() => {
    const result = Array.from(conversations.value.values())
      .sort((a, b) => {
        // 置顶的会话优先
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        // 按最后消息时间排序
        return b.lastMessageTime - a.lastMessageTime
      });
    
    console.log('PrivateChat getConversations computed 执行:', {
      mapSize: conversations.value.size,
      resultLength: result.length,
      mapKeys: Array.from(conversations.value.keys()),
      result
    });
    
    return result;
  })
  
  // 获取指定用户的会话
  const getConversation = (userId) => {
    return conversations.value.get(userId) || null
  }
  
  // 获取指定用户的消息列表
  const getMessages = (userId) => {
    const conversation = conversations.value.get(userId)
    return conversation ? conversation.messages : []
  }
  
  // 标记会话为已读
  const markAsRead = (userId) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      conversation.unreadCount = 0
      conversations.value.set(userId, conversation)
    }
  }
  
  // 删除会话
  const deleteConversation = (userId) => {
    conversations.value.delete(userId)
  }
  
  // 置顶/取消置顶会话
  const togglePin = (userId) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      conversation.isPinned = !conversation.isPinned
      conversations.value.set(userId, conversation)
    }
  }
  
  // 静音/取消静音会话
  const toggleMute = (userId) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      conversation.isMuted = !conversation.isMuted
      conversations.value.set(userId, conversation)
    }
  }
  
  // 设置用户信息
  const setUserInfo = (userId, userInfo) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      conversation.userInfo = userInfo
      conversations.value.set(userId, conversation)
    }
  }
  
  // 设置用户在线状态
  const setUserOnlineStatus = (userId, isOnline) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      conversation.isOnline = isOnline
      conversations.value.set(userId, conversation)
    }
  }
  
  // 设置当前聊天用户
  const setCurrentChatUser = (userId) => {
    currentChatUserId.value = userId
    // 标记为已读
    if (userId) {
      markAsRead(userId)
    }
  }
  
  // 获取总未读数
  const getTotalUnreadCount = computed(() => {
    let total = 0
    conversations.value.forEach(conversation => {
      if (!conversation.isMuted) {
        total += conversation.unreadCount
      }
    })
    return total
  })
  
  // 更新消息状态
  const updateMessageStatus = (userId, messageId, status) => {
    const conversation = conversations.value.get(userId)
    if (conversation) {
      const message = conversation.messages.find(msg => msg.id === messageId)
      if (message) {
        message.status = status
        conversations.value.set(userId, conversation)
      }
    }
  }
  
  // 初始化会话（从历史记录中加载）
  const initConversations = (currentUserOpenid = null) => {
    try {
      // 如果没有传入用户ID，尝试从userStore获取
      if (!currentUserOpenid) {
        try {
          const userStore = useUserStore();
          currentUserOpenid = userStore.openid;
        } catch (e) {
          console.warn('无法获取当前用户openid，使用默认值');
          // 从本地存储获取
          const userInfo = uni.getStorageSync('userInfo');
          currentUserOpenid = userInfo?.openid;
        }
      }
      
      console.log('initConversations 使用的用户ID:', currentUserOpenid);
      
      // 从本地存储加载历史消息
      const storedMessages = uni.getStorageSync('message_history');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        
        // 遍历每个用户的消息历史
        Object.entries(parsedMessages).forEach(([conversationUserId, userMessages]) => {
          console.log(`处理会话 ${conversationUserId} 的历史消息:`, userMessages);
          
          // 确保userMessages是数组
          const messages = Array.isArray(userMessages) ? userMessages : [userMessages];
          
          // 初始化会话
          if (!conversations.value.has(conversationUserId)) {
            conversations.value.set(conversationUserId, {
              userId: conversationUserId,
              userInfo: null,
              messages: [],
              unreadCount: 0,
              lastMessage: null,
              lastMessageTime: 0,
              isOnline: false,
              isPinned: false,
              isMuted: false
            });
          }
          
          const conversation = conversations.value.get(conversationUserId);
          
          messages.forEach(msg => {
            // 转换消息格式以适应store
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
            };
            
            console.log(`处理消息:`, formattedMessage);
            
            // 检查消息是否已存在（避免重复）
            const messageExists = conversation.messages.some(existingMsg => existingMsg.id === formattedMessage.id);
            if (!messageExists) {
              conversation.messages.push(formattedMessage);
              conversation.lastMessage = formattedMessage;
              conversation.lastMessageTime = formattedMessage.timestamp;
            }
          });
          
          // 排序消息（按时间）
          conversation.messages.sort((a, b) => a.timestamp - b.timestamp);
          
          // 更新最后一条消息
          if (conversation.messages.length > 0) {
            const lastMsg = conversation.messages[conversation.messages.length - 1];
            conversation.lastMessage = lastMsg;
            conversation.lastMessageTime = lastMsg.timestamp;
          }
        });
        
        // 强制触发响应式更新 - 重新创建 Map 并手动触发
        const newConversations = new Map(conversations.value);
        conversations.value = newConversations;
        triggerRef(conversations);
        
        console.log('成功加载历史会话数据', conversations.value.size, '个会话');
        console.log('加载的会话列表:', Array.from(conversations.value.keys()));
        console.log('getConversations computed 值:', getConversations.value);
        
        conversations.value.forEach((conv, userId) => {
          console.log(`会话 ${userId}:`, {
            消息数量: conv.messages.length,
            最后消息: conv.lastMessage?.content,
            最后消息时间: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleString() : '无',
            会话详情: conv
          });
        });
      }
    } catch (error) {
      console.error('初始化私聊会话失败:', error);
    }
  }
  
  return {
    conversations,
    currentChatUserId,
    getConversations,
    getConversation,
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
})