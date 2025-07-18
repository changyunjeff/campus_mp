<script setup>
import { ref, computed, onUnmounted, onMounted } from 'vue'
import Layout from '@/layout/index.vue'
import { useTabbar } from '@/composables/tabbar'
import { useRouter } from 'uni-mini-router'
import { useConversations } from '@/composables/Conversations'
import { formatTime } from '@/utils/time'
import events from '@/utils/events'
import User from "/static/images/user.png"
import {useLikeAndFavorite} from "@/pinia/modules/LikeAndFavorite";
import {useNewFans} from "@/pinia/modules/NewFans";
import {useCommentAndMention} from "@/pinia/modules/CommentAndMention";
import {useMessage} from "@/composables/message";
import { useToast } from '@/composables/toast'

const messageComposable = useMessage()
const { hiddened, show, hide } = useTabbar()
const router = useRouter()
const conversationsManager = useConversations()
const likeAndFavoriteStore = useLikeAndFavorite()
const newFansStore = useNewFans()
const commentAndMentionStore = useCommentAndMention()
const toast = useToast()

onMounted(() => {
  show()
})

// 使用统一的会话列表数据
const messageList = computed(() => {
  const conversations = conversationsManager.conversations?.value || [];
  console.log('对话列表：', conversations)
  console.log('conversationsManager.conversations 类型:', typeof conversationsManager.conversations);
  
  return conversations.map(conv => ({
    id: conv.userId,
    type: conv.type === 'private' ? 'user' : conv.type,
    name: conv.displayName,
    avatar: conv.displayAvatar || User,
    lastMessage: conv.displayLastMessage,
    time: formatTime(conv.displayTime),
    unread: conv.unreadCount,
    muted: conv.isMuted,
    pinned: conv.isPinned
  }))
})

// 跳转到聊天页面
const goToChat = (type, item) => {
  switch (type) {
    case 'user':
      router.push({
        name: 'private_chat',
        params: {
          item: JSON.stringify(item)
        }
      })
      break
    case 'system':
      router.push({
        name: 'notification_chat'
      })
      break
    default:
      console.log('未知类型')
      break
  }
}

const handleLongPress = (item) => {
  console.log("长按会话:", item)
  
  // 系统通知不支持操作
  if (item.type === 'system') {
    return
  }
  
  const actions = [
    {
      name: item.pinned ? '取消置顶' : '置顶聊天',
      callback: async () => {
        try {
          const newPinnedState = await conversationsManager.toggleConversationPin(item.id)
          toast.show(newPinnedState ? '已置顶聊天' : '已取消置顶')
        } catch (error) {
          console.error('切换置顶状态失败:', error)
          toast.error('操作失败')
        }
      }
    },
    {
      name: '删除会话',
      callback: () => {
        uni.showModal({
          title: '确认删除',
          content: '删除后聊天记录将无法恢复，确定要删除吗？',
          cancelText: '取消',
          confirmText: '删除',
          confirmColor: '#ff4444',
          success: (res) => {
            if (res.confirm) {
              try {
                conversationsManager.deletePrivateChat(item.id)
                toast.show('已删除会话')
              } catch (error) {
                console.error('删除会话失败:', error)
                toast.error('删除失败')
              }
            }
          }
        })
      }
    }
  ]
  
  events.emit('openActionSheet', actions)
}

const goToPage = (page) => {
  router.push({
    name: page
  })
}

const unreadOfLikeAndFavorite = computed(()=>likeAndFavoriteStore.getTotalUnreadCount)
const unreadOfNewFans = computed(()=>newFansStore.getUnreadCount())
const unreadOfCommentAndMention = computed(()=>commentAndMentionStore.getUnreadCount())

</script>

<template>
  <layout>
    <template #left></template>
    <!-- 消息分类图标区域 -->
    <div class="flex justify-around py-5 bg-white mb-2">
      <div class="flex flex-col items-center relative" @tap.stop="goToPage('likesAndFavorite')">
        <!-- 未读徽标 -->
        <div
          v-if="unreadOfLikeAndFavorite > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 z-10"
        >
          {{ unreadOfLikeAndFavorite > 99 ? '99+' : unreadOfLikeAndFavorite }}
        </div>
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="heart" size="24" custom-style="color:#ef4444" />
        </div>
        <div class="text-xs">赞和收藏</div>
      </div>
      <div class="flex flex-col items-center relative" @tap.stop="goToPage('NewFans')">
        <!-- 未读徽标 -->
        <div
          v-if="unreadOfNewFans > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 z-10"
        >
          {{ unreadOfNewFans > 99 ? '99+' : unreadOfNewFans }}
        </div>
        <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="user" size="24" custom-style="color:#3b82f6" />
        </div>
        <div class="text-xs">新增关注</div>
      </div>
      <div class="flex flex-col items-center relative" @tap.stop="goToPage('CommentAndMention')">
        <!-- 未读徽标 -->
        <div
          v-if="unreadOfCommentAndMention > 0"
          class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1 z-10"
        >
          {{ unreadOfCommentAndMention > 99 ? '99+' : unreadOfCommentAndMention }}
        </div>
        <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="message" size="24" custom-style="color:#22c55e" />
        </div>
        <div class="text-xs">评论消息</div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list">
      <div
          v-for="item in messageList"
          :key="item.id"
          class="message-item flex p-3 border-b border-gray-100 active:bg-gray-50"
          @click="goToChat(item.type, item)"
          @longpress="handleLongPress(item)"
      >
        <!-- 头像 -->
        <div class="relative mr-3">
          <image
              v-if="item.type !== 'system'"
              :src="item.avatar"
              class="w-12 h-12 rounded-full object-cover"
              alt="avatar"
              mode="aspectFill"
          ></image>
          <div
              v-else
              class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center"
          >
            <WdIcon custom-class="iconfont" class-prefix="icon" name="notification" size="18" custom-style="color:#fff" />
          </div>
          
          <!-- 未读消息数 -->
          <div
              v-if="item.unread > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1"
          >
            {{ item.unread > 99 ? '99+' : item.unread }}
          </div>
          
          <!-- 免打扰标识 -->
          <div
              v-if="item.muted"
              class="absolute bottom-0 right-0 bg-gray-400 rounded-full w-4 h-4 flex items-center justify-center"
          >
            <WdIcon custom-class="iconfont" class-prefix="icon" name="mute" size="10" custom-style="color:#fff" />
          </div>
        </div>

        <!-- 消息内容 -->
        <div class="flex-1 overflow-hidden">
          <div class="flex justify-between items-center mb-1">
            <div class="flex items-center">
              <!-- 置顶标识 -->
              <WdIcon 
                v-if="item.pinned" 
                custom-class="iconfont mr-1" 
                class-prefix="icon" 
                name="pin" 
                size="12"
                custom-style="color:#f59e0b" 
              />
              <div class="font-medium truncate mr-2">{{ item.name }}</div>
            </div>
            <div class="text-xs text-gray-400 whitespace-nowrap">{{ item.time }}</div>
          </div>
          <div class="flex items-center">
            <div class="text-sm text-gray-500 truncate flex-1">{{ item.lastMessage }}</div>
            <!-- 会话状态标识 -->
            <div class="flex items-center ml-2 space-x-1">
              <!-- 已屏蔽标识 -->
              <div v-if="item.isBlocked" class="text-xs text-red-400 bg-red-50 px-2 py-1 rounded">
                已屏蔽
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <custom-tab-bar/>
    <template #action="{action}">
      <WdButton @tap="action.open">click</WdButton>
    </template>
  </layout>
</template>

<style lang="scss" scoped>
.message-list {
  background-color: #fff;
}

.message-item {
  transition: background-color 0.2s;
}
</style>