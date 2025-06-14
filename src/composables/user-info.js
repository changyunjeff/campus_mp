import { usePrivateChat } from "@/pinia/modules/PrivateChat";
import { UserApi } from "@/api/user";


/**
 * 用户信息管理服务
 */
let instance = null;

export function useUserInfo() {
  if (instance) return instance;
  
  const privateChatStore = usePrivateChat();
  
  // 内存缓存，避免重复请求
  const userInfoCache = new Map();
  
  /**
   * 获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Promise<Object|null>} 用户信息
   */
  const fetchUserInfo = async (userId) => {
    if (!userId) return null;
    
    // 先检查缓存
    if (userInfoCache.has(userId)) {
      return userInfoCache.get(userId);
    }
    
    try {
      const response = await UserApi.getUserProfile(userId);
      const userInfo = response;
      
      // 缓存用户信息
      if (userInfo) {
        userInfoCache.set(userId, userInfo);
        console.log(`获取用户信息成功: ${userId}`, userInfo);
      }
      
      return userInfo;
    } catch (error) {
      console.error(`获取用户信息失败: ${userId}`, error);
      return null;
    }
  };
  
  /**
   * 为会话设置用户信息
   * @param {string} userId - 用户ID
   * @param {Object} userInfo - 用户信息，如果不传则自动获取
   */
  const setConversationUserInfo = async (userId, userInfo = null) => {
    if (!userInfo) {
      userInfo = await fetchUserInfo(userId);
    }
    
    if (userInfo) {
      privateChatStore.setUserInfo(userId, userInfo);
      console.log(`设置会话用户信息: ${userId}`, userInfo.nickname);
    }
  };
  
  /**
   * 批量补充会话的用户信息
   */
  const enrichConversationsUserInfo = async () => {
    const conversations = privateChatStore.getConversations;
    console.log('开始批量获取用户信息，会话数量:', conversations.length);
    
    for (const conversation of conversations) {
      if (!conversation.userInfo) {
        await setConversationUserInfo(conversation.userId);
        // 添加小延迟，避免请求过快
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
    
    console.log('批量获取用户信息完成');
  };
  
  /**
   * 从缓存获取用户信息
   * @param {string} userId - 用户ID
   * @returns {Object|null} 缓存的用户信息
   */
  const getCachedUserInfo = (userId) => {
    return userInfoCache.get(userId) || null;
  };
  
  /**
   * 清除用户信息缓存
   * @param {string} userId - 用户ID，不传则清除所有
   */
  const clearUserInfoCache = (userId = null) => {
    if (userId) {
      userInfoCache.delete(userId);
    } else {
      userInfoCache.clear();
    }
  };
  
  instance = {
    fetchUserInfo,
    setConversationUserInfo,
    enrichConversationsUserInfo,
    getCachedUserInfo,
    clearUserInfoCache
  };
  
  return instance;
} 