<script setup>
import { ref } from 'vue'
import Layout from '@/layout/index.vue'
import { useTabbar } from '@/composables/tabbar'
import { useRouter } from 'uni-mini-router'
import events from '@/utils/events'

const { hiddened, show, hide } = useTabbar()
const router = useRouter()

const switchShow = () => {
  console.log(hiddened.value)
  hiddened.value ? show() : hide()
}

onMounted(() => {
  show()
})

// 消息列表数据
const messageList = ref([
  {
    id: 1,
    type: 'group',
    name: '程序员接单群',
    avatar: '/static/images/user.png',
    lastMessage: '"吃口饭"加入了群聊',
    time: '19:11',
    unread: 0,
    muted: false,
    pinned: true
  },
  {
    id: 2,
    type: 'user',
    name: '猫猫东京留学群聊',
    avatar: '/static/images/user.png',
    lastMessage: '[99+]猫猫在日本、群主｜猫猫在日本｜开...',
    time: '17:32',
    unread: 0,
    muted: true,
    pinned: false
  },
  {
    id: 3,
    type: 'system',
    name: '活动消息',
    avatar: '',
    lastMessage: '思路打开！投票小众有趣新职业赢周边',
    time: '10:28',
    unread: 1,
    muted: false,
    pinned: false
  },
  {
    id: 4,
    type: 'user',
    name: '甜甜圈🍩',
    avatar: '/static/images/user.png',
    lastMessage: '额，我只接项目，不帮忙答疑哈',
    time: '昨天',
    unread: 0,
    muted: false,
    pinned: false
  },
  {
    id: 5,
    type: 'user',
    name: 'IDC小白变大神进阶版',
    avatar: '/static/images/user.png',
    lastMessage: '还需要服务器吗',
    time: '星期四',
    unread: 0,
    muted: false,
    pinned: false
  },
  {
    id: 6,
    type: 'system',
    name: '系统消息',
    avatar: '',
    lastMessage: '快来参加REDGALA活动小调研哦',
    time: '04-12',
    unread: 0,
    muted: false,
    pinned: false
  },
  {
    id: 7,
    type: 'user',
    name: '且从容',
    avatar: '/static/images/user.png',
    lastMessage: '你好，是要买A100吗？',
    time: '04-10',
    unread: 0,
    muted: false,
    pinned: false
  },
  {
    id: 8,
    type: 'user',
    name: '总有一朵云适合你',
    avatar: '/static/images/user.png',
    lastMessage: '不说就可以不用再说了',
    time: '04-07',
    unread: 0,
    muted: false,
    pinned: false
  },
  {
    id: 9,
    type: 'user',
    name: '遨游云上',
    avatar: '/static/images/user.png',
    lastMessage: '不放心，我也可以给您🍒',
    time: '04-07',
    unread: 0,
    muted: false,
    pinned: false
  }
])

// 跳转到聊天页面
const goToChat = (type, id) => {
  switch (type) {
    case 'user':
      router.push({
        name: 'private_chat',
        query: {
          id: id
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

const actions = [
  { name: '选项1', callback: () => console.log('选择了选项1') },
  { name: '选项2', callback: () => console.log('选择了选项2') },
  { name: '选项3', callback: () => console.log('选择了选项3') },
]

const handleLongPress = (item) => {
  console.log("item:", item)
  events.emit('openActionSheet', actions)
}

</script>

<template>
  <layout>
    <template #left></template>
    <!-- 消息分类图标区域 -->
    <div class="flex justify-around py-5 bg-white mb-2">
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="heart" :size="24" custom-style="color:#ef4444" />
        </div>
        <div class="text-xs">赞和收藏</div>
      </div>
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="user" :size="24" custom-style="color:#3b82f6" />
        </div>
        <div class="text-xs">新增关注</div>
      </div>
      <div class="flex flex-col items-center">
        <div class="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mb-2">
          <WdIcon custom-class="iconfont" class-prefix="icon" name="message" :size="24" custom-style="color:#22c55e" />
        </div>
        <div class="text-xs">评论和@</div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list">
      <div
          v-for="item in messageList"
          :key="item.id"
          class="message-item flex p-3 border-b border-gray-100 active:bg-gray-50"
          @click="goToChat(item.type, item.id)"
          @longpress="handleLongPress(item)"
      >
        <!-- 头像 -->
        <div class="relative mr-3">
          <img
              v-if="item.type !== 'system'"
              :src="item.avatar"
              class="w-12 h-12 rounded-full object-cover"
              alt="avatar"
          >
          <div
              v-else
              class="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center"
          >
            <WdIcon custom-class="iconfont" class-prefix="icon" name="notification" :size="18" custom-style="color:#fff" />
          </div>
          <div
              v-if="item.unread > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center px-1"
          >
            {{ item.unread }}
          </div>
          <div
              v-if="item.muted"
              class="absolute bottom-0 right-0 bg-gray-200 rounded-full w-4 h-4 flex items-center justify-center"
          >
            <i class="iconfont icon-mute text-gray-500 text-xs"></i>
          </div>
        </div>

        <!-- 消息内容 -->
        <div class="flex-1 overflow-hidden">
          <div class="flex justify-between items-center mb-1">
            <div class="font-medium truncate mr-2">{{ item.name }}</div>
            <div class="text-xs text-gray-400 whitespace-nowrap">{{ item.time }}</div>
          </div>
          <div class="text-sm text-gray-500 truncate">{{ item.lastMessage }}</div>
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