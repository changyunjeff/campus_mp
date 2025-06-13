import {usePrivateChat} from "@/pinia/modules/PrivateChat"
import {useSystemNotification} from "@/pinia/modules/SystemNotification";
import {useUserStore} from "@/pinia/modules/user";
import {useUserInfo} from "./user-info";
import {UserApi} from "@/api/user";
import { computed, ref } from 'vue'
import { useChatSettings } from "./chat-settings";

const chatSettings = useChatSettings();
let instance = null;

// useConversations 用于监听会话列表的变化，并在消息主页显示会话列表，包括私聊消息和系统通知
export function useConversations()  {
    if (instance) {
        return instance;
    }
    
    const privateChat = usePrivateChat();
    const systemNotification = useSystemNotification();
    const userInfoService = useUserInfo();
    
    // 获取当前用户ID并初始化历史数据
    const userStore = useUserStore();
    const currentUserOpenid = userStore.openid;
    console.log('Conversations.js 当前用户ID:', currentUserOpenid);
    
    privateChat.initConversations(currentUserOpenid);
    
    // 初始化系统通知数据
    systemNotification.fetchNotifications();
    
    // 清理过期缓存
    chatSettings.cleanExpiredCache();
    
    // 延迟补充用户信息，避免阻塞初始化
    setTimeout(() => {
      userInfoService.enrichConversationsUserInfo();
      // 同时预加载聊天设置
      loadChatSettings();
    }, 500);
    
    // 加载所有会话的聊天设置（使用chat-settings.js的批量预加载）
    const loadChatSettings = async () => {
        const privateChatConversations = privateChat.getConversations || [];
        const userIds = privateChatConversations
            .map(conv => conv.userId)
            .filter(Boolean); // 过滤掉空值
        
        if (userIds.length === 0) {
            console.log('没有需要加载聊天设置的用户');
            return;
        }
        
        console.log(`开始批量预加载 ${userIds.length} 个用户的聊天设置`);
        
        try {
            // 使用chat-settings.js的批量预加载功能
            const settingsMap = await chatSettings.batchPreloadSettings(userIds);
            console.log(`聊天设置批量加载完成，成功加载 ${settingsMap.size} 个用户的设置`);
        } catch (error) {
            console.warn('批量加载聊天设置失败:', error);
        }
    };
    
    // 获取指定用户的聊天设置（使用chat-settings.js）
    const getChatSettings = async (userId) => {
        if (!userId) {
            return chatSettings.getDefaultSettings();
        }
        
        try {
            return await chatSettings.getSettings(userId);
        } catch (error) {
            console.warn('获取聊天设置失败:', userId, error);
            return chatSettings.getDefaultSettings();
        }
    };
    
    // 更新聊天设置缓存（使用chat-settings.js）
    const updateChatSettings = (userId, settings) => {
        if (!userId) return false;
        
        // 使用chat-settings.js的更新方法
        const success = chatSettings.updateSettings(userId, settings);
        
        if (success) {
            // 触发会话列表重新计算
            refreshConversations();
        }
        
        return success;
    };
    
    // 预加载聊天设置（使用chat-settings.js）
    const preloadChatSettings = async (userId) => {
        if (!userId) {
            return chatSettings.getDefaultSettings();
        }
        
        try {
            // 直接使用chat-settings.js的获取方法，它会自动处理缓存逻辑
            return await chatSettings.getSettings(userId);
        } catch (error) {
            console.warn('预加载聊天设置失败:', userId, error);
            return chatSettings.getDefaultSettings();
        }
    };
    
    // 合并会话列表：私聊 + 系统通知
    const conversations = computed(() => {
        // 确保数据存在 - Pinia computed 不需要 .value
        const privateChatConversations = privateChat.getConversations || [];
        console.log('Conversations.js - 私聊会话数据:', privateChatConversations);
        console.log('privateChat.getConversations 类型:', typeof privateChat.getConversations);
        console.log('privateChat.getConversations 值:', privateChat.getConversations);
        
        const privateChatList = privateChatConversations.map(conv => {
            // 同步获取缓存的聊天设置
            const chatSettingsData = getChatSettingsSync(conv.userId);
            
            const result = {
                ...conv,
                type: 'private',
                displayName: conv.userInfo?.nickname || `用户${conv.userId}`,
                displayAvatar: conv.userInfo?.avatar?.url || '/static/images/user.png',
                displayLastMessage: conv.lastMessage?.content || '',
                displayTime: conv.lastMessageTime,
                unreadCount: chatSettingsData.isMuted ? 0 : conv.unreadCount, // 免打扰时不显示未读数
                isPinned: chatSettingsData.isPinned,
                isMuted: chatSettingsData.isMuted,
                isBlocked: chatSettingsData.isBlocked
            };
            console.log('Conversations.js - 转换后的会话:', result);
            return result;
        });
        
        // 系统通知作为一个特殊会话
        const systemConv = {
            id: 'system',
            type: 'system',
            displayName: '系统通知',
            displayAvatar: '',
            displayLastMessage: getLatestSystemMessage(),
            displayTime: getLatestSystemTime(),
            unreadCount: systemNotification.getUnreadCount || 0,
            isPinned: false,
            isMuted: false,
            isBlocked: false
        };
        
        const finalResult = [systemConv, ...privateChatList].sort((a, b) => {
            // 置顶优先
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // 按时间排序
            return b.displayTime - a.displayTime;
        });
        
        console.log('Conversations.js - 最终合并结果:', finalResult);
        return finalResult;
    });
    
    // 同步获取聊天设置（用于computed中）
    const getChatSettingsSync = (userId) => {
        if (!userId) return chatSettings.getDefaultSettings();
        
        // 使用chat-settings.js提供的同步获取方法
        return chatSettings.getCachedSettings(userId);
    };
    
    // 获取最新系统消息内容
    const getLatestSystemMessage = () => {
        const latest = systemNotification.getLatestNotifications(1)[0];
        return latest ? latest.content : '暂无系统通知';
    };
    
    // 获取最新系统消息时间
    const getLatestSystemTime = () => {
        const latest = systemNotification.getLatestNotifications(1)[0];
        return latest ? latest.timestamp : 0;
    };
    
    // 获取总未读数（排除免打扰的会话）
    const totalUnreadCount = computed(() => {
        const privateChatUnread = (privateChat.getConversations || []).reduce((total, conv) => {
            const chatSettingsData = getChatSettingsSync(conv.userId);
            return total + (chatSettingsData.isMuted ? 0 : conv.unreadCount);
        }, 0);
        const systemUnread = systemNotification.getUnreadCount || 0;
        return privateChatUnread + systemUnread;
    });

    // 调试方法
    const debugConversations = () => {
        console.log('=== 调试会话数据 ===');
        console.log('私聊会话数:', privateChat.getConversations?.length || 0);
        console.log('系统通知未读数:', systemNotification.getUnreadCount || 0);
        console.log('合并后的会话数:', conversations.value?.length || 0);
        console.log('聊天设置缓存统计:', chatSettings.getStats());
        console.log('详细会话数据:', conversations.value);
        return {
            privateChats: privateChat.getConversations || [],
            systemUnread: systemNotification.getUnreadCount || 0,
            chatSettingsStats: chatSettings.getStats(),
            merged: conversations.value || []
        };
    };
    
    // 强制刷新会话数据
    const refreshConversations = async () => {
        console.log('强制刷新会话数据...');
        privateChat.initConversations(currentUserOpenid);
        systemNotification.fetchNotifications();
        
        // 补充用户信息和聊天设置
        setTimeout(() => {
          userInfoService.enrichConversationsUserInfo();
          loadChatSettings();
        }, 200);
        
        // 触发 computed 重新计算
        return conversations.value;
    };

    instance = {
        conversations,
        totalUnreadCount,
        debugConversations,
        refreshConversations,
        // 聊天设置相关方法（使用chat-settings.js）
        getChatSettings,
        updateChatSettings,
        loadChatSettings,
        preloadChatSettings,
        // 新增：获取缓存统计
        getChatSettingsStats: () => chatSettings.getStats(),
        // 新增：清理缓存
        clearChatSettingsCache: (userId) => chatSettings.clearCache(userId),
        // 用户信息相关方法
        enrichUserInfo: userInfoService.enrichConversationsUserInfo,
        fetchUserInfo: userInfoService.fetchUserInfo,
        // 代理方法
        markPrivateChatAsRead: privateChat.markAsRead,
        markSystemNotificationAsRead: systemNotification.markAsRead,
        deletePrivateChat: privateChat.deleteConversation,
        deleteSystemNotification: systemNotification.deleteNotification
    }
    return instance;
}