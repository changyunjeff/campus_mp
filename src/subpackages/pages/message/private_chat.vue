<script setup>
import Layout from '@/layout/index.vue'
import InputSection from "@/components/InputSection.vue"
import {formatTime} from '@/utils/time'
import {useUserStore} from '@/pinia/modules/user'
import {usePrivateChat} from '@/pinia/modules/PrivateChat'
import {useRouter} from 'uni-mini-router'
import {useMessage} from '@/composables/message'
import {useErrorHandler} from '@/subpackages/utils/error-handler'
import {onLoad, onUnload} from "@dcloudio/uni-app"
import {generateID} from '@/utils/id'
import GoodsPreview from '@/subpackages/components/goods/goods-preview.vue'
import {UserApi} from "@/api/user"
import User from "/static/images/user.png"
import Anonymous from "/static/images/anonymous.png"
import {useConversations} from "@/composables/Conversations";

const router = useRouter()
const userStore = useUserStore()
const privateChatStore = usePrivateChat()
const message = useMessage()
const errorHandler = useErrorHandler()
const conversationManager = useConversations()

// 路由参数
const targetId = ref('')
const goodsId = ref(null)
const isAnonymousChat = ref(false) // 是否为匿名会话

// 在线状态
const isOnline = ref(false)
// 取消订阅函数
let unsubscribeOnlineStatus = null

const conversationItem = reactive({
  id: '',
  avatar: '',
  lastMessage: '',
  muted: false,
  pinned: false,
  type: 'user',
  name: '',
  unread: 0,
  time: '',
})

// 获取路由参数
onLoad(async (options) => {
  console.debug('options:', options)

  if (options.item || options.id) {

    let item = options.item
    if (options.item) {
      item = JSON.parse(options.item)
      console.debug('item:', item)
      Object.assign(conversationItem, item)
    }

    targetId.value = item?.id || options.id
    console.debug('targetId:', targetId.value)
    // 页面加载时，清空未读消息
    conversationManager.clearUnreadCount(targetId.value)
    isAnonymousChat.value = targetId.value.includes('_anonymous')
    
    // 如果是匿名会话，获取真实用户ID用于在线状态订阅
    const realUserId = isAnonymousChat.value ? targetId.value.replace('_anonymous', '') : targetId.value
    
    try {
      // 匿名会话不获取用户信息，直接使用匿名信息
      if (!isAnonymousChat.value) {
        await fetchUserInfo()
      } else {
        userInfo.value = {
          nickname: '匿名用户',
          avatar: Anonymous,
          openid: targetId.value
        }
      }
    } catch (e) {
      console.error(e)
      toast.error('获取用户信息失败')
    }

    // 订阅用户在线状态
    try {
      unsubscribeOnlineStatus = message.subscribeUserOnlineStatus(realUserId, (onlineStatus) => {
        console.debug('收到用户在线状态更新：', onlineStatus)
        isOnline.value = !!onlineStatus
      })
      
      // 发送一次检测请求获取当前状态
      await message.sendCheckOnline(realUserId)
    } catch (e) {
      console.error(e)
      toast.error('订阅用户在线状态失败')
    }

    try {
      await fetchHistoryMessages()
    } catch (e) {
      console.error(e)
      toast.error('获取历史消息失败')
    }
    
    // 如果是匿名会话，强制设置为非匿名状态（实名回复）
    if (isAnonymousChat.value) {
      input.anonymous = false
    }
  }

  // 如果有商品ID，加载商品信息
  if (options.goodsId) {
    goodsId.value = options.goodsId
    try {
      await fetchGoodsInfo(options.goodsId)
    } catch (e) {
      console.error(e)
      toast.error('获取商品信息失败')
    }
  }
})

// 页面卸载时取消订阅
onUnload(() => {
  if (unsubscribeOnlineStatus) {
    unsubscribeOnlineStatus()
    unsubscribeOnlineStatus = null
    console.log('页面卸载，取消订阅用户在线状态')
  }
  // 页面卸载时清空未读消息
  if (targetId.value) {
    conversationManager.clearUnreadCount(targetId.value)
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
    query: {id}
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
  nickname: '',
  avatar: User,
  openid: ''
})

// 使用store中的消息数据
const messages = computed(() => {
  if (!targetId.value) return [];
  return privateChatStore.getMessages(targetId.value);
})

const selfAvatar = computed(() => userStore.getAvatarUrl() || User)

// 输入组件
const inputRef = ref(null)

// 输入相关状态
/**
 * @typedef input
 * @property { String } text
 * @property { Boolean } isSending
 * @property { Boolean } focus
 * @property { Boolean } anonymous
 * */
const input = reactive({
  text: '',
  isSending: false,
  focus: false,
  anonymous: false,
})

const toView = ref('')

// 获取用户信息
const fetchUserInfo = async () => {
  // 获取用户信息
  try{
    const res = await UserApi.getUserProfile(targetId.value)
    console.debug('res:', res)
    userInfo.value.openid = targetId.value
    userInfo.value.nickname = res.nickname
    userInfo.value.avatar = res.avatar[0]?.url || User
  } catch (err) {
    console.error('获取用户信息失败:', err.message)
  }
}

// 获取历史消息（现在由store管理，这个方法简化）
const fetchHistoryMessages = async () => {
  if (!targetId.value) return;

  try {
    // 如果store中没有数据，可以在这里加载历史数据
    // 现在消息已经通过store管理，这里主要是滚动到底部
    scrollToBottom();
  } catch (error) {
    errorHandler.handleMessageError(error, {action: 'fetchHistory', userId: targetId.value});
  }
}

// 发送消息
const handleSend = async () => {
  if (input.isSending || !input.text.trim()) return;

  const messageContent = input.text.trim();
  input.isSending = true;

  // 清空输入框
  input.text = '';

  try {
    // 生成消息ID
    const id = await generateID();

    // 获取真实接收者ID（如果是匿名会话，需要发送给真实用户）
    const realTargetId = isAnonymousChat.value ? targetId.value.replace('_anonymous', '') : targetId.value;

    // 在匿名会话中，强制以实名发送回复（不允许双方都匿名）
    const shouldSendAnonymous = isAnonymousChat.value ? false : input.anonymous;

    // 发送消息（消息的添加和状态管理现在在message composable中处理）
    // 传入当前会话ID，确保消息添加到正确的会话中
    await message.sendChat(id, realTargetId, messageContent, shouldSendAnonymous, targetId.value, userStore.getAvatarUrl());

    // 滚动到底部
    scrollToBottom();
  } catch (error) {
    errorHandler.handleMessageError(error, {
      action: 'sendMessage',
      userId: targetId.value,
      content: messageContent
    });
  } finally {
    input.isSending = false;
    handleInputBlur();
  }
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
    params: {id: userInfo.value.openid}
  })
}

const gotoMore = () => {
  router.push({
    name: 'private_chat_more',
    params: {id: userInfo.value.openid}
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
  switch (action) {
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
    case 'resend':
      // 重发消息
      if (msg.isSelf && (msg.status === 'failed' || msg.status === 'blocked')) {
        handleResendMessage(msg)
      }
      break
    case 'delete':
      if (msg.isSelf) {
        // TODO: 实现删除逻辑
        toast.show('删除功能开发中')
      }
      break
  }
  actionMenu.visible = false
}

// 处理重发消息
const handleResendMessage = async (msg) => {
  try {
    // 使用当前会话ID进行重发（可能是匿名会话ID）
    await message.resendMessage(targetId.value, msg.id)
    uni.showToast({
      title: '重发成功',
      icon: 'success',
      duration: 1500
    })
  } catch (error) {
    console.error('重发消息失败:', error)
    uni.showToast({
      title: '重发失败',
      icon: 'none',
      duration: 2000
    })
  }
}

// 点击空白处关闭菜单
const handleTapOutside = () => {
  actionMenu.visible = false
}

// 获取用户头像
const userAvatarUrl = (msg) => {
  // 使用匿名头像
  if (msg.useAnonymousAvatar) {
    return conversationItem.avatar || Anonymous
  }
  if (msg.isSelf) {
    return selfAvatar
  }
  return msg.avatar || userInfo.value.avatar || User
}

const placeholder = computed(() => {
  if (isAnonymousChat.value) {
    return '回复匿名消息...'
  }
  return input.anonymous ? '匿名发送消息...' : '输入聊天内容...'
})

// 处理匿名状态改变
const handleAnonymousChange = (isAnonymous) => {
  console.log('isAnonymous:', isAnonymous)
  input.anonymous = isAnonymous
}
</script>

<template>
  <layout>
    <template #left>
      <WdIcon name="view-list" size="32rpx" color="#999" @tap="gotoMore"></WdIcon>
    </template>
    <template #center>
      {{ userInfo.nickname || "聊天窗口" }} ({{ isOnline ? '在线' : '离线' }})
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
            <image :src="userAvatarUrl(msg)" class="avatar"
                   :class="{ 'offline': !msg.isSelf && !isOnline }"
                   @tap.stop="msg.isSelf ? '' : gotoUser(msg.isSelf)">
            </image>
            <view class="message-content">
              <view class="message-bubble" :id="`bubble-${msg.id}`" :class="[{
                                'sending': msg.status === 'sending',
                                'failed': msg.status === 'failed',
                                'blocked': msg.status === 'blocked'
                            }]" @longpress="handleLongpress($event, msg)">
                <!-- 发送中状态 -->
                <view v-if="msg.isSelf && msg.status === 'sending'" class="message-status loading">
                  <view class="loading-spinner"></view>
                </view>
                <!-- 发送失败状态 -->
                <view v-if="msg.isSelf && msg.status === 'failed'" class="message-status error">
                  <view class="error-icon">!</view>
                </view>
                <!-- 消息被屏蔽状态 -->
                <view v-if="msg.isSelf && msg.status === 'blocked'" class="message-status blocked">
                  <view class="blocked-icon">🚫</view>
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
        <InputSection v-model="input.text" :placeholder="placeholder" :disabled="input.isSending"
                      :focus="input.focus" :send-button-text="input.isSending ? '发送中...' : '发送'"
                      :show-anonymous="!isAnonymousChat" v-model:anonymous="input.anonymous" @anonymous-change="handleAnonymousChange"
                      class="animate animate-slide-up" @send="handleSend" @blur="handleInputBlur" ref="inputRef"/>
      </view>
    </view>

    <!-- 操作菜单 -->
    <view v-if="actionMenu.visible" class="action-menu" :style="{
            left: actionMenu.x + 'px',
            top: actionMenu.y + 'px'
        }" @tap.stop>
      <view class="action-item" @tap="handleAction('copy')">复制</view>
      <view v-if="actionMenu.message?.isSelf && (actionMenu.message?.status === 'failed' || actionMenu.message?.status === 'blocked')" 
            class="action-item resend" @tap="handleAction('resend')">重发</view>
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

      &.blocked {
        background: linear-gradient(135deg, #ffa500, #ff8c00);
        opacity: 0.8;
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

  &.blocked .blocked-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32rpx;
    height: 32rpx;
    background: #ffa500;
    color: #fff;
    border-radius: 50%;
    font-size: 18rpx;
    line-height: 1;
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

  &.resend {
    color: #4caf50;
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


