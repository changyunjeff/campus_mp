import { useConnection } from "./connection";
import { useUserStore } from "@/pinia/modules/user";
import { usePrivateChat } from "@/pinia/modules/PrivateChat";
import { useUserInfo } from "./user-info";
import { MSG_TYPE, MSG_METHOD } from "@/constants/msg";
import { generateID } from "@/utils/id";

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

      // 检查是否是状态反馈消息（发送给自己的状态更新）
      console.debug("if statement: ", !!msg.original_to && msg.status)
      if (!!msg.original_to && msg.status) {
        // 这是状态反馈消息，更新对应消息的状态
        // 使用 original_to 字段确定原始接收者，如果没有则使用当前逻辑
        const targetUserID = msg.original_to;

        if (msg.status === 'success') {
          privateChat.updateMessageStatus(targetUserID, msg.id, MESSAGE_STATUS.SUCCESS);
        } else if (msg.status === 'failed') {
          privateChat.updateMessageStatus(targetUserID, msg.id, MESSAGE_STATUS.FAILED);
        } else if (msg.status === 'blocked') {
          // 新增：处理消息被屏蔽状态
          privateChat.updateMessageStatus(targetUserID, msg.id, MESSAGE_STATUS.BLOCKED);
        }
        return;
      }

      const isSelf = msg.from === userStore.openid;

      const messageWithStatus = {
        ...msg,
        isSelf: isSelf, // 根据消息发送者正确判断
        status: MESSAGE_STATUS.SUCCESS
      };

      console.log('🔍 消息处理结果:', {
        originalMsg: msg,
        processedMsg: messageWithStatus,
        willAddToConversation: msg.from
      });

      // 获取发送者用户信息（如果还没有的话）
      let conversation = privateChat.getConversation(msg.from);
      if (!conversation) {
        console.log(`还没有来自${msg.from}的会话:`);
        conversation = await privateChat.addConversation(msg.from);
      }
      if (!conversation?.userInfo) {
        console.log('收到消息时获取发送者用户信息:', msg.from);
        await userInfo.setConversationUserInfo(msg.from);
      }

      privateChat.addMessage(msg.from, messageWithStatus)
    });

    connect.registerHandler(MSG_TYPE.Notification, async (msg) => {
      console.log('收到通知消息', msg);
    });

    connect.registerHandler(MSG_TYPE.System, async (msg) => {
      console.log('收到系统消息', msg);
    });

    connect.registerHandler(MSG_TYPE.CheckOnline, async (msg) => {
      console.log('收到在线状态消息', msg); // 收到在线状态消息 {msg_id: 17550941670567686, status: "offline", type: 4}

      // 处理在线状态回调
      const targetId = msg.to || msg.user_id;
      const isOnline = msg.status === "online";

      // 如果存在对应的回调函数集合，则调用所有回调
      if (targetId && onlineStatusCallbacks.has(targetId)) {
        const callbacks = onlineStatusCallbacks.get(targetId);
        callbacks.forEach(callback => {
          if (typeof callback === 'function') {
            callback(isOnline);
          }
        });
      }
    });
  }

  /**
   * sendCheckOnline 发送检测目标用户是否在线消息
   * @param {string} to - 目标用户ID
   * @param {function} callback - 回调函数
   * */
  const sendCheckOnline = async (to, callback=undefined) => {

    if (!to?.trim()) {
      throw new Error('请输入对方的openid');
    }

    const id = await generateID();

    // 将目标用户to添加到回调映射表中，注册回调函数
    if (typeof callback === 'function') {
      if (!onlineStatusCallbacks.has(to)) {
        onlineStatusCallbacks.set(to, new Set());
      }
      onlineStatusCallbacks.get(to).add(callback);
    }

    const msg = {
      id: id,
      timestamp: new Date().getTime(),
      from: userStore.openid,
      to: to,
      type: MSG_TYPE.CheckOnline
    }

    try {
      await connect.send(msg);
      console.log('发送检测在线消息成功', msg);
    } catch (err) {
      console.error('发送检测在线消息失败:', err);
      // 发送失败时，如果有回调函数，从映射表中移除该回调函数
      if (callback && onlineStatusCallbacks.has(to)) {
        onlineStatusCallbacks.get(to).delete(callback);
        // 如果集合为空，删除整个条目
        if (onlineStatusCallbacks.get(to).size === 0) {
          onlineStatusCallbacks.delete(to);
        }
      }
      throw err;
    }
  }

  /**
   * sendChat 发送聊天消息
   * @param {string} id - 消息ID
   * @param {string} userID - 接收用户ID
   * @param {string} content - 消息内容
   * @returns {Promise<Message>} 发送的消息对象
   */
  const sendChat = async (id, userID, content) => {
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
      method: MSG_METHOD.CheckSensitive | MSG_METHOD.Redirect,
      status: MESSAGE_STATUS.SENDING
    };

    // 先添加到UI显示（发送中状态）
    const messageForUI = {
      ...msg,
      isSelf: true
    };
    privateChat.addMessage(userID, messageForUI);
    
    // 获取接收者用户信息（如果还没有的话）
    const conversation = privateChat.getConversation(userID);
    if (!conversation?.userInfo) {
      console.log('发送消息时获取接收者用户信息:', userID);
      // 异步获取，不阻塞发送流程
      userInfo.setConversationUserInfo(userID).catch(err => {
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
      privateChat.updateMessageStatus(userID, id, MESSAGE_STATUS.FAILED);
      
      throw err;
    }
  };

  /**
   * 重新发送失败的消息
   * @param {string} userID - 接收用户ID
   * @param {string} messageId - 消息ID
   * @returns {Promise<void>}
   */
  const resendMessage = async (userID, messageId) => {
    const messages = privateChat.getMessages(userID);
    const message = messages.find(msg => msg.id === messageId);
    
    if (!message || (message.status !== MESSAGE_STATUS.FAILED && message.status !== MESSAGE_STATUS.BLOCKED)) {
      throw new Error('消息不存在或状态不正确');
    }

    // 更新状态为发送中
    privateChat.updateMessageStatus(userID, messageId, MESSAGE_STATUS.SENDING);

    try {
      // 重新发送消息，移除状态字段让服务器重新处理
      const { status, ...messageToSend } = message;
      await connect.send(messageToSend);
      
      console.log('消息重发成功，等待服务器处理结果反馈...');
      // 注意：不在这里设置SUCCESS状态，等待服务器反馈
      // 服务器会返回处理结果，在消息处理器中更新状态
      
    } catch (err) {
      // 网络发送失败，更新状态为失败
      privateChat.updateMessageStatus(userID, messageId, MESSAGE_STATUS.FAILED);
      throw err;
    }
  };

  instance = {
    sendChat,
    resendMessage,
    sendCheckOnline,
    registerHandlers,
    MESSAGE_STATUS
  }
  return instance;
}
