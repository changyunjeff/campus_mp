<script setup>
import Layout from '@/layout/index.vue'  
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { useSettingsStore } from '@/subpackages/pinia/settings'
import { useSchoolStore } from '@/pinia/modules/school'
import { usePrivateChat } from '@/pinia/modules/PrivateChat'
import { useSystemNotification } from '@/pinia/modules/SystemNotification'
import { useNewFans } from '@/pinia/modules/NewFans'
import { useLikeAndFavorite } from '@/pinia/modules/LikeAndFavorite'
import { useCommentAndMention } from '@/pinia/modules/CommentAndMention'
import { useUserStore } from '@/pinia/modules/user'
import { useChatSettings } from '@/composables/chat-settings'
import { UserApi } from '@/api/user'

const router = useRouter()
const toast = useToast()
const settingsStore = useSettingsStore()
const schoolStore = useSchoolStore()

// 消息相关的 stores
const privateChatStore = usePrivateChat()
const systemNotificationStore = useSystemNotification()
const newFansStore = useNewFans()
const likeAndFavoriteStore = useLikeAndFavorite()
const commentAndMentionStore = useCommentAndMention()
const userStore = useUserStore()

// 聊天设置缓存
const chatSettings = useChatSettings()

// 账户相关设置项
const accountSettings = [
  {
    id: 'auth',
    title: '我的认证',
    desc: '管理身份认证信息',
    icon: 'user',
    iconColor: '#007AFF',
    action: 'auth'
  },
  {
    id: 'blocked',
    title: '我的屏蔽',
    desc: '管理被屏蔽的用户',
    icon: 'secured',
    iconColor: '#FF3B30',
    action: 'blocked'
  }
]

// 应用相关设置项
const appSettings = [
  {
    id: 'school',
    title: '切换学校',
    desc: schoolStore.currentSchoolName || '选择您的学校',
    icon: 'translate-bold',
    iconColor: '#FF9500',
    action: 'school'
  },
  {
    id: 'cache',
    title: '清空缓存',
    desc: '清理本地存储的数据',
    icon: 'delete',
    iconColor: '#FF3B30',
    action: 'clearCache',
    isDestructive: true
  }
]

// 帮助相关设置项
const helpSettings = [
  {
    id: 'agreement',
    title: '用户协议',
    desc: '查看用户使用协议',
    icon: 'evaluation',
    iconColor: '#34C759',
    action: 'agreement'
  },
  {
    id: 'privacy',
    title: '隐私政策',
    desc: '查看隐私保护政策',
    icon: 'eye-close',
    iconColor: '#5856D6',
    action: 'privacy'
  },
  {
    id: 'contact',
    title: '联系我们',
    desc: '获取帮助与反馈',
    icon: 'phone',
    iconColor: '#007AFF',
    action: 'contact'
  }
]

// 加载状态
const loading = ref(false)

// 处理设置项点击
const handleSettingClick = async (option) => {
  switch (option.action) {
    case 'auth':
      // 跳转到认证页面
      router.push({
        name: 'validation-step1'
      })
      break
      
    case 'blocked':
      // 跳转到屏蔽列表页面
      router.push({
        name: 'blocked_users'
      })
      break
      
    case 'school':
      // 跳转到学校选择页面
      router.push({
        path: '/pages/choose-school'
      })
      break
      
    case 'clearCache':
      // 清空缓存
      await handleClearCache()
      break
      
    case 'agreement':
      // 跳转到用户协议页面
      router.push({
        name: 'user_agreement'
      })
      break
      
    case 'privacy':
      // 跳转到隐私政策页面  
      router.push({
        name: 'privacy_policy'
      })
      break
      
    case 'contact':
      // 跳转到联系我们页面
      router.push({
        name: 'contact_us'
      })
      break
  }
}

// 清空缓存处理
const handleClearCache = async () => {
  try {
    // 显示确认对话框
    const res = await new Promise((resolve) => {
      uni.showModal({
        title: '确认清空缓存',
        content: '清空缓存后将清除所有聊天记录、消息通知等数据，需要重新登录，是否继续？',
        showCancel: true,
        cancelText: '取消',
        confirmText: '确认',
        success: (result) => {
          resolve(result.confirm)
        },
        fail: () => {
          resolve(false)
        }
      })
    })
    
    if (!res) return
    
    // 显示加载提示
    uni.showLoading({
      title: '清理中...',
      mask: true
    })
    
    try {
      console.log('开始清理缓存...')
      
      // 1. 重置所有 Pinia stores（在清空存储之前）
      console.log('重置 Pinia stores...')
      
      // 重置设置和学校相关 stores
      try {
        if (settingsStore.$reset) {
          settingsStore.$reset()
        }
        if (schoolStore.resetAll) {
          schoolStore.resetAll()
        }
        console.log('已重置设置和学校stores')
      } catch (error) {
        console.warn('重置设置stores失败:', error)
      }
      
      // 使用各个 store 提供的清除函数
      console.log('清除各个store数据...')
      
      try {
        privateChatStore.clearAllData()
      } catch (error) {
        console.warn('清除私聊数据失败:', error)
      }
      
      try {
        systemNotificationStore.clearAllData()
      } catch (error) {
        console.warn('清除系统通知数据失败:', error)
      }
      
      try {
        newFansStore.clearAllData()
      } catch (error) {
        console.warn('清除新粉丝数据失败:', error)
      }
      
      try {
        likeAndFavoriteStore.clearAllData()
      } catch (error) {
        console.warn('清除点赞收藏数据失败:', error)
      }
      
      try {
        commentAndMentionStore.clearAllData()
      } catch (error) {
        console.warn('清除评论提及数据失败:', error)
      }
      
      // 2. 清空聊天设置缓存
      console.log('清空聊天设置缓存...')
      chatSettings.clearCache()
      
      // 3. 清空所有本地存储
      console.log('清空本地存储...')
      uni.clearStorageSync()
      
      // 4. 额外清理可能遗留的特定存储项
              const storageKeysToRemove = [
          'message_history',
          'private-chat',
          'system-notifications',
          'newFans',
          'likeAndFavorite',
          'commentAndMention',
          'userInfo',
          'chat_settings_cache_v2',
          'school_selection'
        ]
      
      console.log('清理特定存储项...')
      storageKeysToRemove.forEach(key => {
        try {
          uni.removeStorageSync(key)
        } catch (error) {
          console.warn(`清理存储项 ${key} 失败:`, error)
        }
      })
      
      console.log('缓存清理完成')
      
    } catch (error) {
      console.error('清理过程中出现错误:', error)
      throw error
    }
    
    uni.hideLoading()
    
    // 提示成功
    toast.success('缓存清理完成，即将重新启动应用')
    
    // 延迟跳转到学校选择页面
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/choose-school'
      })
    }, 1500)
    
  } catch (error) {
    console.error('清空缓存失败:', error)
    uni.hideLoading()
    toast.error('清理失败，请重试')
  }
}

onMounted(async () => {
  // 页面加载时初始化设置信息
  console.log('设置页面加载完成')
  
  // 加载学校选择数据
  schoolStore.loadFromStorage()
})

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-lg font-semibold text-gray-800">设置</text>
    </template>
    
    <view class="min-h-screen bg-gray-50 pt-2">
      
      <!-- 账户设置 -->
      <wd-cell-group border custom-class="mb-3 rounded-none">
        <wd-cell-group title="账户" custom-class="bg-white">
          <wd-cell 
            v-for="item in accountSettings" 
            :key="item.id"
            :title="item.title" 
            center 
            clickable
            @click="handleSettingClick(item)"
          >
            <template #icon>
              <view class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" 
                    :style="{ backgroundColor: item.iconColor + '1A' }">
                <WdIcon :name="item.icon" size="16" :color="item.iconColor" />
              </view>
            </template>
            <template #right-icon>
              <view class="flex items-center">
                <WdIcon name="arrow-right" size="16" color="#c7c7cc" />
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </wd-cell-group>

      <!-- 应用设置 -->
      <wd-cell-group border custom-class="mb-3 rounded-none">
        <wd-cell-group title="应用" custom-class="bg-white">
          <wd-cell 
            v-for="item in appSettings" 
            :key="item.id"
            :title="item.title" 
            center 
            clickable
            @click="handleSettingClick(item)"
            :custom-class="item.isDestructive ? 'destructive-cell' : ''"
          >
            <template #icon>
              <view class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" 
                    :style="{ backgroundColor: item.iconColor + '1A' }">
                <WdIcon :name="item.icon" size="16" :color="item.iconColor" />
              </view>
            </template>
            <template #right-icon>
              <view class="flex items-center">
                <WdIcon name="arrow-right" size="16" color="#c7c7cc" />
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </wd-cell-group>

      <!-- 帮助与支持 -->
      <wd-cell-group border custom-class="mb-3 rounded-none">
        <wd-cell-group title="帮助与支持" custom-class="bg-white">
          <wd-cell 
            v-for="item in helpSettings" 
            :key="item.id"
            :title="item.title" 
            center 
            clickable
            @click="handleSettingClick(item)"
          >
            <template #icon>
              <view class="w-8 h-8 rounded-lg flex items-center justify-center mr-3" 
                    :style="{ backgroundColor: item.iconColor + '1A' }">
                <WdIcon :name="item.icon" size="16" :color="item.iconColor" />
              </view>
            </template>
            <template #right-icon>
              <view class="flex items-center">
                <WdIcon name="arrow-right" size="16" color="#c7c7cc" />
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </wd-cell-group>
      
      <!-- 版本信息 -->
      <view class="text-center py-6">
        <text class="text-xs text-gray-400">
          版本 1.0.0
        </text>
      </view>
    </view>
  </Layout>
</template>

<style scoped>
/* iOS风格的设置页面样式 */
:deep(.wd-cell-group__title) {
  color: #6d6d72;
  font-weight: 400;
  font-size: 13px;
  padding: 22px 16px 6px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: transparent;
}

:deep(.wd-cell-group) {
  border-radius: 10px;
  margin: 8px 16px 35px;
  overflow: hidden;
  background: #fff;
  box-shadow: none;
  border: none;
}

:deep(.wd-cell) {
  padding: 12px 16px;
  border-bottom: 0.33px solid #c6c6c8;
  background: #fff;
  min-height: 44px;
}

:deep(.wd-cell:last-child) {
  border-bottom: none;
}

:deep(.wd-cell__title) {
  font-weight: 400;
  color: #000;
  font-size: 17px;
  line-height: 22px;
}

:deep(.wd-cell__value) {
  color: #8e8e93;
  font-size: 17px;
}

/* iOS风格的点击效果 */
:deep(.wd-cell--clickable:active) {
  background-color: #d1d1d6;
  transition: background-color 0.1s ease;
}

/* 图标样式优化 */
.w-8 {
  width: 29px;
  height: 29px;
}

.h-8 {
  height: 29px;
}

.rounded-lg {
  border-radius: 6px;
}

/* 页面背景 */
.min-h-screen {
  background-color: #f2f1f6;
}

/* 破坏性操作样式 */
:deep(.destructive-cell .wd-cell__title) {
  color: #FF3B30 !important;
}
</style>
