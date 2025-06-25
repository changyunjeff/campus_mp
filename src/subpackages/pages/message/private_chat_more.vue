<script setup>
import { ref, watch, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useToast } from '@/composables/toast'
import { useRouter } from "uni-mini-router";
import { UserApi } from "@/api/user";
import { useConversations } from '@/composables/Conversations'
import { useChatSettings } from '@/composables/chat-settings'
import events, { 
  CHAT_SETTINGS_UPDATED, 
  CHAT_PINNED, 
  CHAT_UNPINNED, 
  CHAT_MUTED, 
  CHAT_UNMUTED, 
  CHAT_BLOCKED, 
  CHAT_UNBLOCKED 
} from '@/utils/events'

const toast = useToast()
const router = useRouter()
const conversations = useConversations()
const chatSettings = useChatSettings()

// 用户信息
const userInfo = ref({
  avatar: 'https://via.placeholder.com/100',
  nickname: '甜甜圈🍩',
  isFollowing: false
})

// 路由参数
const targetId = ref(null)
const isLoading = ref(false)
const isSettingsLoading = ref(false)

// 聊天设置
const settings = ref({
  doNotDisturb: false,
  pinChat: false,
  blockMessages: false
})

// 计算属性：设置是否已更改
const hasSettingsChanged = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value)
})

// 保存原始设置用于比较
const originalSettings = ref({})

// 获取用户信息
const fetchUserInfo = async () => {
  if (isLoading.value) return
  
  isLoading.value = true
  try {
    const res = await UserApi.getUserProfile(targetId.value)
    console.debug('用户信息:', res)
    userInfo.value = res
    settings.value = {
      doNotDisturb: res.chat_settings.do_not_disturb,
      pinChat: res.chat_settings.set_top,
      blockMessages: res.chat_settings.blocking
    }
  } catch (e) {
    toast.error('获取用户信息失败')
    console.error(e)
  } finally {
    isLoading.value = false
  }
}

// 获取聊天设置（优先使用缓存）
const fetchChatSettings = async () => {
  if (isSettingsLoading.value || !targetId.value) return
  
  isSettingsLoading.value = true
  try {
    // 使用新的聊天设置缓存系统
    const loadedSettings = await chatSettings.getSettings(targetId.value)
    console.debug('获取到的聊天设置:', loadedSettings)
    
    // 更新设置
    settings.value = {
      doNotDisturb: loadedSettings.isMuted,
      pinChat: loadedSettings.isPinned,
      blockMessages: loadedSettings.isBlocked
    }
    
    // 保存原始设置
    originalSettings.value = {...settings.value}
    
  } catch (e) {
    toast.error('获取聊天设置失败')
    console.error(e)
    
    // 使用默认设置
    const defaultSettings = chatSettings.getDefaultSettings()
    settings.value = {
      doNotDisturb: defaultSettings.isMuted,
      pinChat: defaultSettings.isPinned,
      blockMessages: defaultSettings.isBlocked
    }
    originalSettings.value = {...settings.value}
  } finally {
    isSettingsLoading.value = false
  }
}

// 更新聊天设置
const updateSettings = async (settingKey, value) => {
  if (!targetId.value || isUpdating.value) return
  
  isUpdating.value = true
  
  try {
    // 构建更新数据
    const updateData = {
      set_top: settings.value.pinChat,
      blocking: settings.value.blockMessages,
      do_not_disturb: settings.value.doNotDisturb
    }
    
    await UserApi.updateChatSettings(targetId.value, updateData)
    
    // 更新原始设置
    originalSettings.value = {...settings.value}
    
    // 更新聊天设置缓存
    chatSettings.updateSettings(targetId.value, {
      isPinned: settings.value.pinChat,
      isMuted: settings.value.doNotDisturb,
      isBlocked: settings.value.blockMessages
    })
    
    // 同时更新会话列表中的聊天设置缓存
    conversations.updateChatSettings(targetId.value, {
      isPinned: settings.value.pinChat,
      isMuted: settings.value.doNotDisturb,
      isBlocked: settings.value.blockMessages
    })
    
    // 触发相应的事件
    const eventData = {
      userId: targetId.value,
      settings: settings.value
    }
    
    events.emit(CHAT_SETTINGS_UPDATED, eventData)
    
    // 触发具体的设置事件
    switch (settingKey) {
      case 'doNotDisturb':
        events.emit(value ? CHAT_MUTED : CHAT_UNMUTED, eventData)
        break
      case 'pinChat':
        events.emit(value ? CHAT_PINNED : CHAT_UNPINNED, eventData)
        break
      case 'blockMessages':
        events.emit(value ? CHAT_BLOCKED : CHAT_UNBLOCKED, eventData)
        break
    }
    
    // 根据不同设置显示不同提示
    const messages = {
      doNotDisturb: value ? '已开启消息免打扰' : '已关闭消息免打扰',
      pinChat: value ? '已置顶聊天' : '已取消置顶',
      blockMessages: value ? '已屏蔽该用户消息' : '已取消屏蔽'
    }
    
    toast.show(messages[settingKey] || '设置已更新')
    
  } catch (e) {
    // 恢复原来的值，避免触发watch监听器
    settings.value[settingKey] = !value
    toast.error('设置更新失败')
    console.error(e)
  } finally {
    isUpdating.value = false
  }
}

// 标记是否正在更新设置，避免死循环
const isUpdating = ref(false)

// 监听设置变化
watch(
  () => settings.value.doNotDisturb,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal && !isUpdating.value) {
      updateSettings('doNotDisturb', newVal)
    }
  }
)

watch(
  () => settings.value.pinChat,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal && !isUpdating.value) {
      updateSettings('pinChat', newVal)
    }
  }
)

watch(
  () => settings.value.blockMessages,
  (newVal, oldVal) => {
    if (oldVal !== undefined && newVal !== oldVal && !isUpdating.value) {
      updateSettings('blockMessages', newVal)
    }
  }
)

// 加载页面参数
onLoad((options) => {
  if (options.id) {
    targetId.value = options.id
    // 并行获取用户信息和聊天设置
    Promise.all([
      fetchUserInfo(),
      fetchChatSettings()
    ])
  } else {
    toast.error('缺少参数id')
    setTimeout(()=>{
      router.back()
    }, 1500)
  }
})

// 关注/取消关注
const toggleFollow = async () => {
  if (!targetId.value) return
  
  try {
    if (userInfo.value.is_following) {
      await UserApi.unfollowUser(targetId.value)
      userInfo.value.is_following = false
      toast.show('已取消关注')
    } else {
      await UserApi.followUser(targetId.value)
      userInfo.value.is_following = true
      toast.show('关注成功')
    }
  } catch (e) {
    toast.error('操作失败')
    console.error(e)
  }
}

const searchChatHistory = () => {
  uni.showToast({ title: '查找聊天记录', icon: 'none' })
}

const reportUser = () => {
  uni.showToast({ title: '举报该用户', icon: 'none' })
}

const clearChatHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空与该用户的聊天记录吗？',
    success: (res) => {
      if (res.confirm && targetId.value) {
        // TODO 清空聊天记录
        // 显示成功提示
        toast.show('聊天记录已清空')
      }
    }
  })
}
</script>

<template>
  <Layout>
    <template #center></template>
    <div class="p-4 flex flex-col items-center mb-3">
      <div class="mb-4 relative">
        <image :src="userInfo.avatar[0]?.url" alt="avatar" class="w-20 h-20 rounded-full object-cover border-2 border-gray-100" mode="aspectFill" />
      </div>
      <div class="mb-4 text-lg font-medium">{{ userInfo.nickname }}</div>
      <wd-button :type="userInfo.is_following ? 'info' : 'error'" size="medium" custom-class="px-8 py-2 rounded-full text-sm" @click="toggleFollow">
        {{ userInfo.is_following ? '已关注' : '关注' }}
      </wd-button>
    </div>

    <wd-cell-group border custom-class="m-3 rounded-lg overflow-hidden shadow-sm">
      <wd-cell title="消息免打扰">
        <WdSwitch v-model="settings.doNotDisturb" size="20px" />
      </wd-cell>
      <wd-cell title="置顶聊天">
        <wd-switch v-model="settings.pinChat" size="20px" />
      </wd-cell>
    </wd-cell-group>

    <wd-cell-group border custom-class="m-3 rounded-lg overflow-hidden shadow-sm">
       <wd-cell title="屏蔽消息">
        <wd-switch v-model="settings.blockMessages" size="20px" />
      </wd-cell>
      <wd-cell title="举报该用户" is-link @click="reportUser" />
    </wd-cell-group>

    <wd-cell-group border custom-class="m-3 rounded-lg overflow-hidden shadow-sm">
      <wd-cell title="清空聊天记录" center custom-class="text-center text-red-500 py-2" @click="clearChatHistory" />
    </wd-cell-group>

  </Layout>
</template>

<style lang="scss" scoped>
// Add any additional scoped styles if needed
// Use UnoCSS classes primarily for styling
:deep(.text-center .wd-cell__title) {
  text-align: center;
  width: 100%;
}
:deep(.text-red-500 .wd-cell__title) {
    color: #ef4444; // Equivalent to text-red-500
}
</style>