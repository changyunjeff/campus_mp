<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useMessageHisotry } from '@/composables/message_history'
import { useToast } from '@/composables/toast'

const userInfo = ref({
  avatar: 'https://via.placeholder.com/100', // Placeholder avatar
  nickname: '甜甜圈🍩',
  isFollowing: false
})

// 路由参数
const targetId = ref(null)

// 加载页面参数
onLoad((options) => {
  if (options.id) {
    targetId.value = options.id
  }
})

const settings = ref({
  doNotDisturb: false,
  pinChat: false,
  blockMessages: false
})

const toggleFollow = () => {
  userInfo.value.isFollowing = !userInfo.value.isFollowing
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
        // 调用message_history的clear方法清空聊天记录
        const history = useMessageHisotry()
        history.clear(targetId.value)
        
        // 显示成功提示
        const toast = useToast()
        toast.show('聊天记录已清空')
      }
    }
  })
}

const test = ref(false)
</script>

<template>
  <Layout>
    <template #center></template>
    <div class="p-4 flex flex-col items-center mb-3">
      <div class="mb-4 relative">
        <img :src="userInfo.avatar" alt="avatar" class="w-20 h-20 rounded-full object-cover border-2 border-gray-100" />
      </div>
      <div class="mb-4 text-lg font-medium">{{ userInfo.nickname }}</div>
      <wd-button :type="userInfo.isFollowing ? 'info' : 'error'" size="medium" custom-class="px-8 py-2 rounded-full text-sm" @click="toggleFollow">
        {{ userInfo.isFollowing ? '已关注' : '关注' }}
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