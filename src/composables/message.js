import { useConnection } from "./connection";
import { useUserStore } from "@/pinia/modules/user";
import { usePrivateChat } from "@/pinia/modules/PrivateChat";
import { useUserInfo } from "./user-info";
import { MSG_TYPE, MSG_METHOD } from "@/constants/msg";
import { generateID } from "@/utils/id";
import Anonymous from "/static/images/anonymous.png"
import {useLikeAndFavorite} from "@/pinia/modules/LikeAndFavorite";
import {useNewFans} from "@/pinia/modules/NewFans";
import {useCommentAndMention} from "@/pinia/modules/CommentAndMention";

/**
 * 消息发送状态枚举
 */
export const MESSAGE_STATUS = {
  SENDING: 'sending',
  SUCCESS: 'success', 
  FAILED: 'failed',
  BLOCKED: 'blocked' // 新增：消息被屏蔽状态
}

/**
 * 消息类型定义
 * @typedef {Object} Message
 * @property {string} id - 消息ID
 * @property {number} timestamp - 时间戳
 * @property {string} from - 发送者ID
 * @property {string} to - 接收者ID
 * @property {string} content - 消息内容
 * @property {string} type - 消息类型
 * @property {number} method - 消息方法
 * @property {string} status - 消息状态
 */

let instance = null;

export function useMessage() {
  if (instance) return instance;

  const connect = useConnection();
  const userStore = useUserStore();
  const privateChat = usePrivateChat();
  const userInfo = useUserInfo();
  
  // 在线状态回调函数映射表 - 修改为Map<string, Set<Function>>结构
  const onlineStatusCallbacks = new Map();

  const registerHandlers = () => {
    // 注册消息接收处理
    connect.registerHandler(MSG_TYPE.Chat, async (msg) => {
      console.log('收到私聊消息', msg);
      console.log('🔍 消息处理开始:', {
        messageId: msg.id,
        from: msg.from,
        to: msg.to,
        anonymous: msg.anonymous,
        avatar: msg.avatar,
        currentUserOpenid: userStore.openid,
        hasOriginalTo: !!msg.original_to,
        hasStatus: !!msg.status
      });

      // 检查是否是状态反馈消息（发送给自己的状态更新）
      console.debug("if statement: ", !!msg.original_to && msg.status)
      if (!!msg.original_to && msg.status) {
        // 这是状态反馈消息，更新对应消息的状态
        // 使用 original_to 字段确定原始接收者
        const targetUserID = msg.original_to;
        
        // 确定应该更新状态的会话ID
        // 需要查找包含该消息的会话（可能是普通会话或匿名会话）
        let targetConversationId = targetUserID;
        
        // 检查是否是匿名消息的状态反馈
        if (msg.anonymous) {
          // 对于匿名消息，需要查找正确的匿名会话
          const anonymousConversationId = `${targetUserID}_anonymous`;
          const anonymousConversation = privateChat.getConversation(anonymousConversationId);
          
          // 如果匿名会话存在且包含该消息，使用匿名会话ID
          if (anonymousConversation && anonymousConversation.messages.some(m => m.id === msg.id)) {
            targetConversationId = anonymousConversationId;
          }
        }

        console.log('收到状态反馈消息:', {
          messageId: msg.id,
          targetUser: targetUserID,
          targetConversationId: targetConversationId,
          status: msg.status,
          isAnonymous: msg.anonymous
        });

        if (msg.status === 'success') {
          privateChat.updateMessageStatus(targetConversationId, msg.id, MESSAGE_STATUS.SUCCESS);
        } else if (msg.status === 'failed') {
          privateChat.updateMessageStatus(targetConversationId, msg.id, MESSAGE_STATUS.FAILED);
        } else if (msg.status === 'blocked') {
          // 新增：处理消息被屏蔽状态
          privateChat.updateMessageStatus(targetConversationId, msg.id, MESSAGE_STATUS.BLOCKED);
        }
        return;
      }

      const isSelf = msg.from === userStore.openid;
      
      console.log('🔍 消息身份判断:', {
        msgFrom: msg.from,
        userStoreOpenid: userStore.openid,
        isSelf: isSelf,
        anonymous: msg.anonymous
      });

      const messageWithStatus = {
        ...msg,
        isSelf: isSelf, // 根据消息发送者正确判断
        status: MESSAGE_STATUS.SUCCESS,
        useAnonymousAvatar: msg.anonymous && !isSelf // 只有接收方看到匿名头像
      };

      console.log('🔍 消息处理结果:', {
        originalMsg: msg,
        processedMsg: messageWithStatus,
        isAnonymous: msg.anonymous,
        isSelf: isSelf,
        willAddToConversation: msg.from
      });

      // 根据消息是否匿名决定会话ID
      let conversationId = msg.from;
      console.log(`🔍 会话ID判断条件:`, {
        isAnonymous: msg.anonymous,
        isSelf: isSelf,
        shouldCreateAnonymousChat: msg.anonymous && !isSelf
      });
      
      if (msg.anonymous && !isSelf) {
        // 接收到匿名消息时，创建匿名会话
        conversationId = `${msg.from}_anonymous`;
        console.log(`🎭 收到匿名消息，创建匿名会话ID: ${conversationId}`);
      } else {
        console.log(`📝 收到普通消息，使用会话ID: ${conversationId}`);
        // 如果是非匿名消息，确保使用真实用户ID作为会话ID
        conversationId = msg.from;
      }

      // 获取发送者用户信息（如果还没有的话）
      let conversation = privateChat.getConversation(conversationId);
      if (!conversation) {
        console.log(`还没有来自${conversationId}的会话，创建新会话`);
        conversation = await privateChat.addConversation(conversationId);
        
        // 为匿名会话设置特殊信息
        if (msg.anonymous && !isSelf) {
          console.log(`🎭 为匿名会话设置特殊信息: ${conversationId}`);

          privateChat.setUserInfo(conversationId, {
            nickname: '匿名用户',
            avatar: { url: Anonymous },
            isAnonymous: true,
            realUserId: msg.from // 保存真实用户ID用于后端处理
          });
        }
      } else {
        console.log(`会话 ${conversationId} 已存在，消息数量: ${conversation.messages?.length || 0}`);
      }
      
      // 只有非匿名会话才获取真实用户信息
      if (!conversation?.userInfo && !(msg.anonymous && !isSelf)) {
        console.log('收到消息时获取发送者用户信息:', msg.from);
        await userInfo.setConversationUserInfo(conversationId);
      }

      console.log(`📨 添加消息到会话: ${conversationId}，消息内容: ${messageWithStatus.content}`);
      privateChat.addMessage(conversationId, messageWithStatus)
    });

    connect.registerHandler(MSG_TYPE.Notification, async (msg) => {
      console.log('收到通知消息', msg);
    });

    connect.registerHandler(MSG_TYPE.System, async (msg) => {
      console.log('收到系统消息', msg);
    });

    connect.registerHandler(MSG_TYPE.Like, async (msg) => {
      console.log("收到点赞类消息", msg)
      const likeAndFavoriteStore = useLikeAndFavorite();
      likeAndFavoriteStore.addLikeMessage(msg)
    })

    connect.registerHandler(MSG_TYPE.Notification, async (msg) => {
      console.log("收到收藏类消息", msg)
      const likeAndFavoriteStore = useLikeAndFavorite();
      likeAndFavoriteStore.addFavoriteMessage(msg)
    })

    connect.registerHandler(MSG_TYPE.Follow, async (msg) => {
      console.log("收到关注类消息", msg)
      const newFansStore = useNewFans();
      newFansStore.addFanMessage(msg)
    })

    connect.registerHandler(MSG_TYPE.Comment, async (msg) => {
      console.log("收到评论类消息", msg)
      const commentAndMentionStore = useCommentAndMention();
      commentAndMentionStore.addCommentMessage(msg)
    })

    connect.registerHandler(MSG_TYPE.Mention, async (msg) => {
      console.log("收到@提及类消息", msg)
      const commentAndMentionStore = useCommentAndMention();
      commentAndMentionStore.addMentionMessage(msg)
    })

    connect.registerHandler(MSG_TYPE.CheckOnline, async (msg) => {
      console.log('收到在线状态消息', msg);

      // 处理在线状态回调
      const targetId = msg.to || msg.user_id;
      const isOnline = msg.status === "online";

      // 验证消息的合法性
      if (!targetId) {
        console.error('在线状态消息缺少目标用户ID:', msg);
        return;
      }

      if (!msg.status || (msg.status !== "online" && msg.status !== "offline")) {
        console.error('在线状态消息状态值无效:', msg);
        return;
      }

      console.log(`接收到用户 ${targetId} 的在线状态: ${msg.status}`);

      // 判断消息类型：有event字段的是状态变化广播，否则是直接检测响应
      const isStatusChangeEvent = !!msg.event && msg.event === "user_status_change";
      const isDirectResponse = !isStatusChangeEvent && !!msg.msg_id;

      // 如果存在对应的回调函数集合，则调用所有回调
      if (targetId && onlineStatusCallbacks.has(targetId)) {
        const callbacks = onlineStatusCallbacks.get(targetId);
        
        console.log(`调用用户 ${targetId} 的 ${callbacks.size} 个在线状态回调，状态：${msg.status}`);
        
        // 调用所有回调函数
        callbacks.forEach(callback => {
          if (typeof callback === 'function') {
            try {
              callback(isOnline);
            } catch (error) {
              console.error('在线状态回调执行出错:', error);
            }
          }
        });
        
        if (isDirectResponse) {
          console.log(`收到用户 ${targetId} 的直接检测响应`);
        } else if (isStatusChangeEvent) {
          console.log(`收到用户 ${targetId} 的状态变化广播`);
        }
      } else {
        if (isStatusChangeEvent) {
          console.log(`收到用户 ${targetId} 的状态变化广播，但没有订阅者`);
        } else {
          console.log(`收到用户 ${targetId} 的检测响应，但没有订阅者`);
        }
      }
    });
  }

  /**
   * subscribeUserOnlineStatus 订阅用户在线状态
   * @param {string} userId - 目标用户ID
   * @param {function} callback - 回调函数
   * @returns {function} 取消订阅函数
   * */
  const subscribeUserOnlineStatus = (userId, callback) => {
    if (!userId?.trim()) {
      throw new Error('用户ID不能为空');
    }
    
    if (typeof callback !== 'function') {
      throw new Error('回调函数必须是function类型');
    }

    // 添加回调到订阅列表
    if (!onlineStatusCallbacks.has(userId)) {
      onlineStatusCallbacks.set(userId, new Set());
    }
    onlineStatusCallbacks.get(userId).add(callback);
    
    console.log(`订阅用户 ${userId} 的在线状态，当前订阅者数量: ${onlineStatusCallbacks.get(userId).size}`);

    // 返回取消订阅函数
    return () => {
      if (onlineStatusCallbacks.has(userId)) {
        onlineStatusCallbacks.get(userId).delete(callback);
        if (onlineStatusCallbacks.get(userId).size === 0) {
          onlineStatusCallbacks.delete(userId);
        }
        console.log(`取消订阅用户 ${userId} 的在线状态`);
      }
    };
  };

  /**
   * sendCheckOnline 发送检测目标用户是否在线消息
   * @param {string} to - 目标用户ID
   * */
  const sendCheckOnline = async (to) => {
    if (!to?.trim()) {
      throw new Error('请输入对方的openid');
    }

    const id = await generateID();

    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      to: to,
      type: MSG_TYPE.CheckOnline
    }

    try {
      // 检查连接状态
      if (!connect.connected.value) {
        throw new Error('WebSocket连接未建立');
      }
      
      await connect.send(msg);
      console.log('发送检测在线消息成功', msg);
    } catch (err) {
      console.error('发送检测在线消息失败:', err);
      throw err;
    }
  }

  /**
   * sendChat 发送聊天消息
   * @param {string} id - 消息ID
   * @param {string} userID - 接收用户ID（真实用户ID）
   * @param {string} content - 消息内容
   * @param {boolean} anonymous - 是否匿名发送消息
   * @param {string} conversationId - 会话ID（可能是匿名会话ID）
   * @param {string} avatar - 发送者的头像url
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendChat = async (id, userID, content, anonymous, conversationId = null, avatar='') => {
    // 参数验证
    if (!userID?.trim()) {
      throw new Error('请输入对方的openid');
    }
    if (!content?.trim()) {
      throw new Error('请输入消息内容');
    }
    if (!userStore.openid) {
      throw new Error('用户未登录');
    }

    // 构造消息对象
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      to: userID,
      content: content.trim(),
      type: MSG_TYPE.Chat,
      method: MSG_METHOD.CheckSensitive | MSG_METHOD.Redirect | MSG_METHOD.NeedFeedback,
      status: MESSAGE_STATUS.SENDING,
      anonymous: anonymous,
      avatar: avatar,
    };

    // 先添加到UI显示（发送中状态）
    const messageForUI = {
      ...msg,
      isSelf: true,
      useAnonymousAvatar: anonymous,
    };
    
    // 确定要添加消息的会话ID
    // 如果提供了conversationId，使用它；否则使用userID
    const targetConversationId = conversationId || userID;
    console.log(`🔍 发送消息到会话: ${targetConversationId}, 实际接收者: ${userID}`);
    
    privateChat.addMessage(targetConversationId, messageForUI);
    
    // 获取接收者用户信息（如果还没有的话）
    const conversation = privateChat.getConversation(targetConversationId);
    if (!conversation?.userInfo && !targetConversationId.includes('_anonymous')) {
      console.log('发送消息时获取接收者用户信息:', userID);
      // 异步获取，不阻塞发送流程
      userInfo.setConversationUserInfo(targetConversationId).catch(err => {
        console.error('获取接收者用户信息失败:', err);
      });
    }

    try {
      // 发送消息到服务器
      await connect.send(msg);
      console.log('消息已发送到服务器，等待处理结果反馈...');
    } catch (err) {
      console.error('发送消息失败:', err.message);
      
      // 网络发送失败，直接更新状态为失败
      msg.status = MESSAGE_STATUS.FAILED;
      privateChat.updateMessageStatus(targetConversationId, id, MESSAGE_STATUS.FAILED);
      
      throw err;
    }
  };

  /**
   * 重新发送失败的消息
   * @param {string} conversationId - 会话ID（可能是匿名会话ID）
   * @param {string} messageId - 消息ID
   * @returns {Promise<void>}
   */
  const resendMessage = async (conversationId, messageId) => {
    const messages = privateChat.getMessages(conversationId);
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message || (message.status !== MESSAGE_STATUS.FAILED && message.status !== MESSAGE_STATUS.BLOCKED)) {
      throw new Error('消息不存在或状态不正确');
    }

    // 更新状态为发送中
    privateChat.updateMessageStatus(conversationId, messageId, MESSAGE_STATUS.SENDING);

    try {
      // 重新发送消息，移除状态字段让服务器重新处理
      const { status, ...messageToSend } = message;
      await connect.send(messageToSend);
      
      console.log('消息重发成功，等待服务器处理结果反馈...');
      // 注意：不在这里设置SUCCESS状态，等待服务器反馈
      // 服务器会返回处理结果，在消息处理器中更新状态
      
    } catch (err) {
      // 网络发送失败，更新状态为失败
      privateChat.updateMessageStatus(conversationId, messageId, MESSAGE_STATUS.FAILED);
      throw err;
    }
  };

  /**
   * 发送点赞消息
   * @param {string} userID - 接收用户ID
   * @param {string} postId - 帖子ID
   * @param {string} title
   * @param {string} image
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendLikeMessage = async (userID, postId, title, image) => {
    const id = await generateID();
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      nickname: userStore.getNickname(),
      avatar: userStore.getAvatarUrl(),
      to: userID,
      type: MSG_TYPE.Like,
      method: MSG_METHOD.Redirect,
      contentType: 'community',
      contentId: postId,
      title: title || '',
      image: image || '',
    }
    try {
      await connect.send(msg);
      console.log('发送点赞消息成功', msg);
    } catch (err) {
      console.error('发送点赞消息失败:', err);
      throw err;
    }
  }

  /**
   * 发送收藏消息
   * @param {string} userID - 接收用户ID
   * @param {string} postId - 帖子ID
   * @param {string} title - 帖子标题
   * @param {string} image - 帖子封面图片
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendFavoriteMessage = async (userID, postId, title, image) => {
    const id = await generateID();
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      nickname: userStore.getNickname(),
      avatar: userStore.getAvatarUrl(),
      to: userID,
      type: MSG_TYPE.Favorite,
      method: MSG_METHOD.Redirect,
      contentType: 'community',
      contentId: postId,
      title: title || '',
      image: image || '',
    }
    try {
      await connect.send(msg);
      console.log('发送收藏消息成功', msg);
    } catch (err) {
      console.error('发送收藏消息失败:', err);
      throw err;
    }
  }

  /**
   * 发送关注消息
   * @param {string} userID - 接收用户ID
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendFollowMessage = async (userID) => {
    const id = await generateID();
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      nickname: userStore.getNickname(),
      avatar: userStore.getAvatarUrl(),
      to: userID,
      type: MSG_TYPE.Follow,
      method: MSG_METHOD.Redirect,
    }
    try {
      await connect.send(msg);
      console.log('发送关注消息成功', msg);
    } catch (err) {
      console.error('发送关注消息失败:', err);
      throw err;
    }
  }

  /**
   * 发送评论消息
   * @param {string} userID - 接收用户ID
   * @param {string} contentId - 内容ID
   * @param {string} contentType - 内容类型
   * @param {string} commentContent - 评论内容
   * @param {string} title - 内容标题
   * @param {string} image - 内容图片
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendCommentMessage = async (userID, contentId, contentType, commentContent, title, image) => {
    const id = await generateID();
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      nickname: userStore.getNickname(),
      avatar: userStore.getAvatarUrl(),
      to: userID,
      type: MSG_TYPE.Comment,
      method: MSG_METHOD.Redirect,
      contentType: contentType,
      contentId: contentId,
      commentContent: commentContent,
      title: title || '',
      image: image || '',
    }
    try {
      await connect.send(msg);
      console.log('发送评论消息成功', msg);
    } catch (err) {
      console.error('发送评论消息失败:', err);
      throw err;
    }
  }

  /**
   * 发送@提及消息
   * @param {string} userID - 接收用户ID
   * @param {string} contentId - 内容ID
   * @param {string} contentType - 内容类型
   * @param {string} commentContent - 评论内容
   * @param {string} title - 内容标题
   * @param {string} image - 内容图片
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendMentionMessage = async (userID, contentId, contentType, commentContent, title, image) => {
    const id = await generateID();
    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      nickname: userStore.getNickname(),
      avatar: userStore.getAvatarUrl(),
      to: userID,
      type: MSG_TYPE.Mention,
      method: MSG_METHOD.Redirect,
      contentType: contentType,
      contentId: contentId,
      commentContent: commentContent,
      title: title || '',
      image: image || '',
    }
    try {
      await connect.send(msg);
      console.log('发送@提及消息成功', msg);
    } catch (err) {
      console.error('发送@提及消息失败:', err);
      throw err;
    }
  }

  instance = {
    sendChat,
    resendMessage,
    sendCheckOnline,
    registerHandlers,
    MESSAGE_STATUS,
    subscribeUserOnlineStatus,
    sendLikeMessage,
    sendFavoriteMessage,
    sendFollowMessage,
    sendCommentMessage,
    sendMentionMessage
  }
  return instance;
}
