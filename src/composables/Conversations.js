import {usePrivateChat} from "@/pinia/modules/PrivateChat"
import {useSystemNotification} from "@/pinia/modules/SystemNotification";
import {useUserStore} from "@/pinia/modules/user";
import {useUserInfo} from "./user-info";
import {UserApi} from "@/api/user";
import { computed, ref } from 'vue'
import { useChatSettings } from "./chat-settings";
import User from "/static/images/user.png"
import Anonymous from "/static/images/anonymous.png"
import AnonymousMale from "/static/images/anonymous_male.png"
import AnonymousFemale from "/static/images/anonymous_female.png"

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

    // 清理过期缓存
    chatSettings.cleanExpiredCache();

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
        // 正确访问 Pinia computed 属性需要使用 .value
        const privateChatConversations = privateChat.getConversations || [];
        console.log('Conversations.js - 私聊会话数据:', privateChatConversations);
        console.log('privateChat.getConversations 类型:', typeof privateChat.getConversations);
        console.log('privateChat.getConversations 值:', privateChat.getConversations);
        
        const privateChatList = privateChatConversations.map(conv => {
            // 同步获取缓存的聊天设置
            const chatSettingsData = getChatSettingsSync(conv.realUserId || conv.userId);
            const avatar = {
                0: Anonymous,
                1: AnonymousMale,
                2: AnonymousFemale
            }
            const result = {
                ...conv,
                type: 'private',
                displayName: conv.isAnonymous ? conv.anonymous_nickname : (conv.nickname || `用户${conv.userId}`),
                displayAvatar: conv.isAnonymous ? avatar[conv.gender] || Anonymous : conv.avatar,
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
        console.log('PrivateChat store state:', {
            conversationsMapSize: privateChat.conversations?.size || 0,
            getConversationsLength: privateChat.getConversations?.length || 0,
            getConversationsData: privateChat.getConversations
        });
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
        
        // 补充用户信息和聊天设置
        setTimeout(() => {
          userInfoService.enrichConversationsUserInfo();
          loadChatSettings();
        }, 200);
        
        // 触发 computed 重新计算
        return conversations.value;
    };

    /**
     * clearUnreadCount 清空会话的未读数量
     * @param {string} id - 会话id
     * */
    const clearUnreadCount = (id) => {
        if (!id) {
            console.warn('clearUnreadCount: 会话ID不能为空');
            return;
        }

        console.log(`清空会话 ${id} 的未读数量`);

        try {
            if (id === 'system') {
                // 系统通知的未读数量清空
                systemNotification.markAllAsRead();
                console.log('已清空系统通知的未读数量');
            } else {
                // 私聊消息的未读数量清空
                privateChat.markAsRead(id);
                console.log(`已清空私聊会话 ${id} 的未读数量`);
            }
        } catch (error) {
            console.error(`清空会话 ${id} 未读数量失败:`, error);
        }
    }

    /**
     * clearConversationMessages 清空特定会话的所有消息
     * @param {string} userId - 用户ID
     * @returns {boolean} 清空是否成功
     */
    const clearConversationMessages = (userId) => {
        if (!userId) {
            console.warn('clearConversationMessages: 用户ID不能为空');
            return false;
        }

        console.log(`清空会话 ${userId} 的所有消息`);

        try {
            const success = privateChat.clearConversationMessages(userId);
            if (success) {
                console.log(`已清空会话 ${userId} 的所有消息`);
                // 触发会话列表重新计算
                refreshConversations();
                return true;
            } else {
                console.warn(`清空会话 ${userId} 失败：会话不存在`);
                return false;
            }
        } catch (error) {
            console.error(`清空会话 ${userId} 消息失败:`, error);
            return false;
        }
    }

    /**
     * toggleConversationPin 切换会话置顶状态
     * @param {string} userId - 用户ID
     * @returns {boolean} 当前的置顶状态
     */
    const toggleConversationPin = async (userId) => {
        if (!userId) {
            console.warn('toggleConversationPin: 用户ID不能为空');
            return false;
        }

        try {
            // 获取当前设置
            const currentSettings = await getChatSettings(userId);
            const newPinnedState = !currentSettings.isPinned;
            
            // 更新聊天设置
            const success = updateChatSettings(userId, {
                ...currentSettings,
                isPinned: newPinnedState
            });

            if (success) {
                console.log(`会话 ${userId} 置顶状态已${newPinnedState ? '开启' : '关闭'}`);
                return newPinnedState;
            } else {
                console.warn(`会话 ${userId} 置顶状态切换失败`);
                return currentSettings.isPinned;
            }
        } catch (error) {
            console.error(`切换会话 ${userId} 置顶状态失败:`, error);
            return false;
        }
    }

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
        deleteSystemNotification: systemNotification.deleteNotification,
        clearUnreadCount,
        // 新增：会话操作方法
        clearConversationMessages,
        toggleConversationPin
    }
    return instance;
}