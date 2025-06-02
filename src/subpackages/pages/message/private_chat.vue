<script setup>
import Layout from '@/layout/index.vue'
import InputSection from "@/components/InputSection.vue"
import {formatTime} from '@/utils/time'
import {useUserStore} from '@/pinia/modules/user'
import {useRouter} from 'uni-mini-router'
import {useMessage} from '@/composables/message'
import {useMessageHisotry} from '@/composables/message_history'
import {useToast} from "@/composables/toast"
import {onLoad} from "@dcloudio/uni-app"
import {generateID} from '@/utils/id'
import GoodsPreview from '@/subpackages/components/goods/goods-preview.vue'

const router = useRouter()
const userStore = useUserStore()
const message = useMessage()
const toast = useToast()

// 路由参数
const targetId = ref('o9IBj7I0g0pwid_Xp1wPEf_oo3aE')
const goodsId = ref(null)

// 获取路由参数
onLoad((options) => {
  console.debug('options:', options)
  
  if (options.id) {
    targetId.value = options.id
    fetchUserInfo()
    fetchHistoryMessages()
  }
  
  // 如果有商品ID，加载商品信息
  if (options.goodsId) {
    goodsId.value = options.goodsId
    fetchGoodsInfo(options.goodsId)
  }
})

// 商品信息
const goodsInfo = ref(null)

// 加载商品信息
const fetchGoodsInfo = async (id) => {
  // 实际应用中应该从API获取商品信息
  // 这里使用模拟数据
  goodsInfo.value = {
    id: id || '1',
    name: 'OPPO A8 石榴红 6G+128G 国行版本',
    price: 215,
    image: 'https://picsum.photos/600/600?random=1',
    status: 'selling' // 'selling', 'reserved', 'sold'
  }
}

// 处理查看商品详情
const handleGoToDetail = (id) => {
  router.push({
    name: 'goods_details',
    query: { id }
  })
}

// 处理标记商品为已售出
const handleMarkSold = (id) => {
  uni.showModal({
    title: '确认操作',
    content: '确定要将商品标记为已售出吗？',
    success: (res) => {
      if (res.confirm) {
        // 实际应用中应该调用API更新商品状态
        goodsInfo.value.status = 'sold'
        toast.success('操作成功')
      }
    }
  })
}

// 聊天信息
const userInfo = ref({
  nickname: '张三',
  avatar: {
    url: '/static/images/user.png'
  },
  openid: 'user123'
})
const messages = ref([
  {
    id: 1,
    content: '你好，我是张三',
    timestamp: Date.now() - 3600000,
    isSelf: false,
    status: 'success'
  },
  {
    id: 2,
    content: '你好，很高兴认识你',
    timestamp: Date.now() - 3000000,
    isSelf: true,
    status: 'success'
  },
  {
    id: 3,
    content: '最近在忙什么呢？',
    timestamp: Date.now() - 2400000,
    isSelf: false,
    status: 'success'
  },
  {
    id: 4,
    content: '我在准备期末考试，好多要复习的',
    timestamp: Date.now() - 1800000,
    isSelf: true,
    status: 'success'
  },
  {
    id: 5,
    content: '加油，相信你一定能考出好成绩',
    timestamp: Date.now() - 1200000,
    isSelf: false,
    status: 'success'
  },
  {
    id: 6,
    content: '谢谢你的鼓励！',
    timestamp: Date.now() - 600000,
    isSelf: true,
    status: 'sending'
  },
  {
    id: 7,
    content: '网络不太好，这条消息发送失败了',
    timestamp: Date.now(),
    isSelf: true,
    status: 'failed'
  }
])
const selfAvatar = computed(() => userStore.userInfo?.avatar?.url || '/static/images/user.png')

// 输入组件
const inputRef = ref(null)

// 输入相关状态
/**
 * @typedef input
 * @property { String } text
 * @property { Boolean } isSending
 * @property { Boolean } focus
 * */
const input = reactive({
    text: '',
    isSending: false,
    focus: false,
})

const toView = ref('')

// 获取用户信息
const fetchUserInfo = async () => {
    await time.sleep(1000)
    // try {
    //   const res = await profileApi.getTargetProfile(targetId.value)
    //   userInfo.value = res.user
    // 获取在线状态
    // } catch (err) {
    //   console.error('获取用户信息失败:', err.message)
    // }
}

// 获取历史消息
const fetchHistoryMessages = async () => {
  if (!targetId.value) return
  
  try {
    // 从message_history中获取历史消息
    const history = useMessageHisotry()
    const historyMessages = history.get(targetId.value)
    
    if (historyMessages && historyMessages.length > 0) {
      // 转换消息格式以适应UI显示
      // 更新消息列表
      messages.value = historyMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        timestamp: msg.timestamp,
        isSelf: msg.from === userStore.openid,
        status: 'success'
      }))
      // 滚动到底部
      scrollToBottom()
    }
  } catch (error) {
    console.error('获取历史消息失败:', error)
  }
}

// 发送消息
const handleSend = async () => {
    if (input.isSending || !input.text.trim()) return

    const messageContent = input.text.trim()
    input.isSending = true

    // 清空输入框
    input.text = ''
    
    // 创建一个临时消息对象，显示发送中状态
    const id = await generateID()
    const tempMessage = {
        id: id,
        content: messageContent,
        timestamp: Date.now(),
        isSelf: true,
        status: 'sending'
    }

    console.debug('tempMessage:', tempMessage)

    // 添加到消息列表
    // messages.value.push(tempMessage)


    try {
        // 发送消息
        await message.sendChat(tempMessage.id, targetId.value, messageContent)
        // 更新消息状态为成功
        tempMessage.status = 'success'
    } catch (error) {
        console.error('发送消息失败:', error)
        // 更新消息状态为失败
        tempMessage.status = 'failed'
        toast.error('发送失败，请重试')
    } finally {
        input.isSending = false
        handleInputBlur()
        await fetchHistoryMessages()
    }
}

// 监听新消息
const handleNewMessage = (chat) => {
    messages.value.push(chat)
    scrollToBottom()
}

// 滚动到底部
const scrollToBottom = () => {
    nextTick(() => {
        toView.value = 'msg-' + (messages.value.length - 1);
    })
}

// 输入框失焦
const handleInputBlur = () => {
    input.focus = false
}

// 跳转到用户主页
const gotoUser = (isSelf) => {
    if (isSelf || !userInfo.value.openid) {
        return
    }
    router.push({
        path: '/pages/profile/other',
        query: { id: userInfo.value.openid }
    })
}

// 添加计算属性来获取在线状态
const isOnline = computed(() => {
    return false
})

const gotoMore = () => {
    router.push({
        name: 'private_chat_more',
        query: { id: userInfo.value.openid }
    })
}

// 长按的引用组件对象
const longpressRef = ref(null)

// 操作菜单状态
const actionMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  message: null
})

// 处理长按事件
const handleLongpress = (e, msg) => {
    console.log("e:", e)
    console.log("msg:", msg)
    actionMenu.message = msg
    
    // 获取当前长按的气泡元素位置
    const bubbleId = `bubble-${msg.id}`
    // 获取气泡元素的位置信息
    uni.createSelectorQuery()
      .select(`#${bubbleId}`)
      .boundingClientRect(rect => {
        if (rect) {
          // 设置菜单位置在气泡上方中心位置
          actionMenu.x = rect.left + rect.width / 2
          actionMenu.y = rect.top - 10 // 在气泡上方留出一点间距
          actionMenu.visible = true
        } else {
          console.error('无法获取气泡位置')
          // 如果无法获取精确位置，使用备用方法（基于事件坐标）
          const touch = e.touches[0]
          actionMenu.x = touch.clientX
          actionMenu.y = touch.clientY - 60 // 在手指上方显示
          actionMenu.visible = true
        }
      })
      .exec()
}

// 处理菜单操作
const handleAction = (action) => {
  const msg = actionMenu.message
  switch(action) {
    case 'copy':
      uni.setClipboardData({
        data: msg.content,
        success: () => toast.show('已复制')
      })
      break
    case 'forward':
      // TODO: 实现转发逻辑
      toast.show('转发功能开发中')
      break
    case 'quote':
      // TODO: 实现引用逻辑
      toast.show('引用功能开发中')
      break
    case 'delete':
      if(msg.isSelf) {
        // TODO: 实现删除逻辑
        toast.show('删除功能开发中')
      }
      break
  }
  actionMenu.visible = false
}

// 点击空白处关闭菜单
const handleTapOutside = () => {
  actionMenu.visible = false
}
</script>

<template>
    <layout>
        <template #left>
            <WdIcon name="view-list" size="32rpx" color="#999" @tap="gotoMore"></WdIcon>
        </template>
        <template #center>
            聊天窗口
        </template>
        <view class="chat-container">
            <!-- 商品预览卡片 -->
            <GoodsPreview 
              v-if="goodsInfo" 
              :goods="goodsInfo" 
              :is-seller="false"
              @go-to-detail="handleGoToDetail"
              @mark-sold="handleMarkSold"
            />
            
            <!-- 聊天消息列表 -->
            <scroll-view class="message-list" scroll-y :scroll-with-animation="true" :show-scrollbar="false"
                scroll-anchoring :scroll-into-view="toView">
                <view class="message-list-content">
                    <view v-for="(msg, index) in messages" :key="index"
                        :class="['message-item', msg.isSelf ? 'self' : 'other']" :id="`msg-${index}`">
                        <image :src="msg.isSelf ? selfAvatar : userInfo?.avatar?.url" class="avatar"
                            :class="{ 'offline': !msg.isSelf && !isOnline }"
                            @tap.stop="msg.isSelf ? '' : gotoUser(msg.isSelf)">
                        </image>
                        <view class="message-content">
                            <view class="message-bubble" :id="`bubble-${msg.id}`" :class="[{
                                'sending': msg.status === 'sending',
                                'failed': msg.status === 'failed'
                            }]" @longpress="handleLongpress($event, msg)">
                                <!-- 发送中状态 -->
                                <view v-if="msg.isSelf && msg.status === 'sending'" class="message-status loading">
                                    <view class="loading-spinner"></view>
                                </view>
                                <!-- 发送失败状态 -->
                                <view v-if="msg.isSelf && msg.status === 'failed'" class="message-status error">
                                    <view class="error-icon">!</view>
                                </view>
                                <text>{{ msg.content }}</text>
                            </view>
                            <text class="message-time">{{ formatTime(msg.timestamp) }}</text>
                        </view>
                    </view>
                </view>
            </scroll-view>

            <!-- 输入框 -->
            <view class="input-container">
                <InputSection v-model="input.text" placeholder="输入聊天内容..." :disabled="input.isSending"
                    :focus="input.focus" :send-button-text="input.isSending ? '发送中...' : '发送'"
                    class="animate animate-slide-up" @send="handleSend" @blur="handleInputBlur" ref="inputRef" />
            </view>
        </view>

        <!-- 操作菜单 -->
        <view v-if="actionMenu.visible" class="action-menu" :style="{
            left: actionMenu.x + 'px',
            top: actionMenu.y + 'px'
        }" @tap.stop>
            <view class="action-item" @tap="handleAction('copy')">复制</view>
            <view class="action-item" @tap="handleAction('forward')">转发</view>
            <view class="action-item" @tap="handleAction('quote')">引用</view>
            <view v-if="actionMenu.message?.isSelf" class="action-item delete" @tap="handleAction('delete')">删除</view>
        </view>
        <view v-if="actionMenu.visible" class="mask" @tap="handleTapOutside"></view>
    </layout>
</template>

<style scoped lang="scss">
.chat-header {
    display: flex;
    align-items: center;
    justify-content: center;

    .chat-title {
        font-size: 32rpx;
        font-weight: 500;
    }

    .offline-indicator {
        font-size: 24rpx;
        color: #999;
        margin-left: 8rpx;
    }
}

.chat-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 190rpx - var(--safe-area-inset-bottom));
    background-color: #f5f5f5;
    position: relative;
}

.message-list {
    flex: 1;
    overflow-y: auto;
    /* 已有商品预览时，需要调整消息列表的位置 */
    margin-top: 0;
}

.message-list-content {
    padding: 24rpx;
    display: flex;
    flex-direction: column;
}

.message-item {
    display: flex;
    margin-bottom: 32rpx;
    max-width: 80%;

    &.self {
        flex-direction: row-reverse;
        align-self: flex-end;

        .message-content {
            align-items: flex-end;
            margin-right: 16rpx;
        }

        .message-bubble {
            background: linear-gradient(135deg, #0a84ff, #0055d4);
            color: #fff;
            border-radius: 24rpx 4rpx 24rpx 24rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 122, 255, 0.3);
            position: relative;

            &.sending {
                opacity: 0.8;
            }

            &.failed {
                background: linear-gradient(135deg, #ff6b6b, #ff3333);
            }
        }

        .message-time {
            text-align: right;
        }
    }

    &.other {
        align-self: flex-start;

        .message-content {
            align-items: flex-start;
            margin-left: 16rpx;
        }

        .message-bubble {
            background: #ffffff;
            color: #333;
            border-radius: 4rpx 24rpx 24rpx 24rpx;
            box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
        }
    }

    .avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        border: 2rpx solid #fff;
        box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
        object-fit: cover;
        flex-shrink: 0;

        &.offline {
            filter: grayscale(100%);
            opacity: 0.7;
        }
    }

    .message-content {
        display: flex;
        flex-direction: column;
        max-width: calc(100% - 40rpx);
    }

    .message-bubble {
        padding: 16rpx 24rpx;
        font-size: 28rpx;
        line-height: 1.5;
        word-break: normal;
        white-space: pre-wrap;
        position: relative;
        transition: all 0.2s ease;
        display: inline-block;
        max-width: 100%;
    }

    .message-time {
        font-size: 22rpx;
        color: #999;
        margin-top: 8rpx;
        padding: 0 8rpx;
    }
}

.input-container {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 16rpx 24rpx;
    background: #fff;
    border-top: 1rpx solid rgba(0, 0, 0, 0.05);
    box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.03);
    z-index: 100;
    box-sizing: border-box;
    padding-bottom: calc(16rpx + var(--safe-area-inset-bottom));
    backdrop-filter: blur(10px);
}

// 消息状态动画
.message-status {
    position: absolute;
    left: -40rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 32rpx;
    height: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    &.loading {
        .loading-spinner {
            width: 32rpx;
            height: 32rpx;
            border-radius: 50%;
            border: 3rpx solid rgba(255, 255, 255, 0.3);
            border-top-color: #fff;
            animation: spin 1s linear infinite;
        }
    }

    &.error .error-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32rpx;
        height: 32rpx;
        background: #ff4444;
        color: #fff;
        border-radius: 50%;
        font-size: 24rpx;
        font-weight: bold;
    }
}

.action-menu {
  position: fixed;
  background: #333;
  border-radius: 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.3);
  z-index: 99;
  transform: translate(-50%, -100%);
  padding: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -16rpx;
    left: 50%;
    transform: translateX(-50%);
    border-width: 8rpx;
    border-style: solid;
    border-color: #333 transparent transparent transparent;
  }
}

.action-item {
  padding: 16rpx 20rpx;
  font-size: 24rpx;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  &:not(:last-child):after {
    content: '';
    position: absolute;
    right: 0;
    top: 25%;
    height: 50%;
    width: 1rpx;
    background-color: rgba(255, 255, 255, 0.2);
  }

  &:active {
    background-color: #444;
  }

  &.delete {
    color: #ff6b6b;
  }
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

// 添加消息气泡的动画效果
.message-bubble {
    animation: bubble-in 0.3s ease-out;
}

@keyframes bubble-in {
    0% {
        opacity: 0;
        transform: scale(0.8);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}
</style>


