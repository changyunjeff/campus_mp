 /**
 * 消息状态枚举
 */
export type MessageStatus = 'sending' | 'success' | 'failed';

/**
 * 消息类型枚举
 */
export type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';

/**
 * 会话类型枚举  
 */
export type ConversationType = 'private' | 'group' | 'system';

/**
 * 基础消息接口
 */
export interface BaseMessage {
  id: string;
  timestamp: number;
  content: string;
  type: MessageType;
  status: MessageStatus;
}

/**
 * 聊天消息接口
 */
export interface ChatMessage extends BaseMessage {
  from: string;
  to: string;
  isSelf: boolean;
  method?: number;
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  openid: string;
  nickname: string;
  avatar: {
    url: string;
  };
}

/**
 * 会话接口
 */
export interface Conversation {
  userId: string;
  userInfo: UserInfo | null;
  messages: ChatMessage[];
  unreadCount: number;
  lastMessage: ChatMessage | null;
  lastMessageTime: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
}

/**
 * 系统通知接口
 */
export interface SystemNotification {
  id: number;
  title: string;
  content: string;
  timestamp: number;
  read: boolean;
  type: 'welcome' | 'event' | 'course' | 'system' | 'grade';
  priority: 'normal' | 'high';
}

/**
 * 商品信息接口
 */
export interface GoodsInfo {
  id: string;
  name: string;
  price: number;
  image: string;
  status: 'selling' | 'reserved' | 'sold';
}

/**
 * 错误处理结果接口
 */
export interface ErrorResult {
  type: string;
  message: string;
  originalError?: Error;
  field?: string;
}

/**
 * 会话显示项接口
 */
export interface ConversationDisplayItem {
  id: string;
  type: ConversationType;
  displayName: string;
  displayAvatar: string;
  displayLastMessage: string;
  displayTime: number;
  unreadCount: number;
  isPinned: boolean;
  isMuted: boolean;
}