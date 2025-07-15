<template>
  <view class="input-container">
    <!-- 遮罩层 -->
    <view 
      class="emoji-overlay" 
      v-show="isEmojiShow" 
      @tap.stop="isEmojiShow = false"
    ></view>
    

    <!-- Emoji表情弹窗 -->
    <view class="emoji-wrapper" v-show="isEmojiShow" @click.stop>
      <emoji
        @inputEmo="handleEmojiSelect"
        @delEmo="handleEmojiDelete"
      />
    </view>

    <!-- 匿名提示栏 -->
    <view v-if="showAnonymous && anonymousValue" class="anonymous-tip-bar">
      <view class="tip-content">
        <WdIcon name="info-o" size="28rpx" color="#f59e0b" />
        <text class="tip-text">将以"{{ anonymousNickname }}"的身份发布</text>
        <view class="help-btn" @tap.stop="showAnonymousHelp">
          <WdIcon name="help" size="24rpx" color="#999" />
        </view>
      </view>
    </view>

    <!-- 输入区域 -->
    <view class="input-area">
      <view class="input-box">
        <!-- 输入框装饰元素 -->
        <view class="input-decoration"></view>
        <!-- 匿名发送开关 -->
        <view 
          v-if="showAnonymous" 
          class="anonymous-switch" 
          @tap.stop="toggleAnonymous"
          :class="{ 'active': anonymousValue }"
        >
          <view class="switch-track">
            <view class="switch-thumb"></view>
            <text class="switch-text">{{ anonymousValue ? '匿名' : '实名' }}</text>
          </view>
        </view>
        <input
          class="text-input"
          v-model="inputValue"
          :placeholder="placeholder"
          :cursor-spacing="20"
          :confirm-type="confirmType"
          :focus="focus"
          ref="inputRef"
          @confirm="handleConfirm"
          @blur="handleBlur"
        />
        <view 
          v-if="showEmoji" 
          class="emoji-btn" 
          @tap.stop="toggleEmoji"
        >
          <wd-icon 
            :name="emojiIcon" 
            size="28"
            :color="isEmojiShow ? activeColor : defaultColor" 
          />
        </view>
      </view>
      <view 
        class="send-btn" 
        @tap.stop="handleSend" 
        :class="{ 
          'active': canSend, 
          'disabled': disabled 
        }"
      >
        <text>{{ sendButtonText }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { debounce, throttle } from "lodash";
import Emoji from "@/components/Emoji.vue";
import { useUserStore } from '@/pinia/modules/user'

const props = defineProps({
  // 输入框的值
  modelValue: {
    type: String,
    default: ''
  },
  // 占位符文本
  placeholder: {
    type: String,
    default: '请输入内容...'
  },
  // 确认按钮文字
  confirmType: {
    type: String,
    default: 'send'
  },
  // 是否显示emoji按钮
  showEmoji: {
    type: Boolean,
    default: true
  },
  // 发送按钮文字
  sendButtonText: {
    type: String,
    default: '发送'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 是否自动聚焦
  focus: {
    type: Boolean,
    default: false
  },
  // emoji按钮图标
  emojiIcon: {
    type: String,
    default: 'add-circle'
  },
  // 激活状态颜色
  activeColor: {
    type: String,
    default: '#ff3cac'
  },
  // 默认状态颜色
  defaultColor: {
    type: String,
    default: '#666'
  },
  // 是否显示匿名开关
  showAnonymous: {
    type: Boolean,
    default: false
  },
  // 匿名状态
  anonymous: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:modelValue',
  'update:anonymous',
  'send',
  'blur',
  'focus',
  'emoji-show',
  'emoji-hide',
  'anonymous-change'
])

const userStore = useUserStore()

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 添加匿名状态的双向绑定
const anonymousValue = computed({
  get: () => props.anonymous,
  set: (val) => emit('update:anonymous', val)
})

const isEmojiShow = ref(false)
const inputRef = ref(null)

const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.disabled
})

// 匿名昵称预览
const anonymousNickname = computed(() => {
  return userStore.getAnonymousNickname()
})

// 匿名开关处理
const toggleAnonymous = throttle(() => {
  const newValue = !anonymousValue.value
  anonymousValue.value = newValue // 使用computed setter更新值
  emit('anonymous-change', newValue)
  
  // 提供触觉反馈
  uni.vibrateShort?.({
    type: 'light'
  })
  
  // 显示状态提示
  uni.showToast({
    title: newValue ? '已开启匿名模式' : '已关闭匿名模式',
    icon: 'none',
    duration: 1500
  })
}, 200)

// 显示匿名功能说明
const showAnonymousHelp = () => {
  uni.showModal({
    title: '匿名发布说明',
    content: `开启匿名发布后，其他用户看到的将是"${anonymousNickname.value}"这样的信息，而不是您的真实姓名和头像。管理员仍可查看真实信息以确保内容安全。`,
    showCancel: false,
    confirmText: '我知道了'
  })
}

// Emoji相关处理
const handleEmojiSelect = throttle((emoji) => {
  inputValue.value += emoji
}, 100)

const handleEmojiDelete = throttle(() => {
  if (inputValue.value.length > 0) {
    const lastTwo = inputValue.value.slice(-2)
    if (isEmojiSurrogatePair(lastTwo)) {
      inputValue.value = inputValue.value.slice(0, -2)
    } else {
      inputValue.value = inputValue.value.slice(0, -1)
    }
  }
}, 100)

const toggleEmoji = () => {
  isEmojiShow.value = !isEmojiShow.value
  emit(isEmojiShow.value ? 'emoji-show' : 'emoji-hide')
}

// 输入相关处理
const handleSend = debounce(() => {
  if (!canSend.value) {
    if (!inputValue.value.trim()) {
      uni.showToast({
        title: '请输入内容',
        icon: 'none'
      })
    }
    return
  }
  emit('send', inputValue.value)
}, 300)

const handleConfirm = () => {
  handleSend()
}

const handleBlur = () => {
  emit('blur')
}

// 辅助函数
const isEmojiSurrogatePair = (str) => {
  if (str.length !== 2) return false
  const high = str.charCodeAt(0)
  const low = str.charCodeAt(1)
  return high >= 0xD800 && high <= 0xDBFF && 
         low >= 0xDC00 && low <= 0xDFFF
}

// 对外暴露方法
defineExpose({
  focus: () => inputRef.value?.focus(),
  blur: () => inputRef.value?.blur(),
  clear: () => inputValue.value = ''
})
</script>

<style scoped lang="scss">
.input-container {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
}

/* 匿名提示栏 */
.anonymous-tip-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 92rpx; /* 输入区域高度之上 */
  background: rgba(245, 158, 11, 0.1);
  border-top: 1rpx solid rgba(245, 158, 11, 0.2);
  padding: 12rpx 24rpx;
  z-index: 102;

  .tip-content {
    display: flex;
    align-items: center;
    gap: 8rpx;

    .tip-text {
      flex: 1;
      font-size: 24rpx;
      color: #92400e;
    }

    .help-btn {
      padding: 8rpx;
      &:active {
        opacity: 0.6;
      }
    }
  }
}

/* 遮罩层 */
.emoji-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
}

/* Emoji弹窗 */
.emoji-wrapper {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 92rpx;
  height: 460rpx;
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  z-index: 100;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.1);
}

/* 输入区域 */
.input-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: $uni-input-area-height;
  padding: 0 24rpx;
  padding-bottom: env(safe-area-inset-bottom);
  background: #fff;
  box-shadow: 0 -2rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 16rpx;
  z-index: 101;

  .input-box {
    flex: 1;
    height: 72rpx;
    background: #f5f5f5;
    border-radius: 36rpx;
    padding: 0 20rpx;
    display: flex;
    align-items: center;
    gap: 12rpx;

    /* 匿名开关 */
    .anonymous-switch {
      flex-shrink: 0;
      width: 100rpx;
      height: 56rpx;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:active {
        transform: scale(0.95);
      }

      .switch-track {
        position: relative;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #e0e0e0, #f0f0f0);
        border-radius: 28rpx;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: visible;
        box-shadow: 
          inset 0 2rpx 4rpx rgba(0, 0, 0, 0.1),
          0 2rpx 8rpx rgba(0, 0, 0, 0.05);

        .switch-thumb {
          position: absolute;
          left: 4rpx;
          top: 4rpx;
          width: 48rpx;
          height: 48rpx;
          background: linear-gradient(135deg, #fff, #f8f8f8);
          border-radius: 24rpx;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 2rpx 8rpx rgba(0, 0, 0, 0.15),
            0 1rpx 4rpx rgba(0, 0, 0, 0.1);
          z-index: 2;
        }

        .switch-text {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24rpx;
          font-weight: 500;
          color: #666;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
          pointer-events: none;
          white-space: nowrap;
        }
      }

      /* 激活状态 */
      &.active {
        .switch-track {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          box-shadow: 
            inset 0 2rpx 4rpx rgba(59, 130, 246, 0.2),
            0 2rpx 12rpx rgba(59, 130, 246, 0.3);

          .switch-thumb {
            left: 48rpx;
            background: linear-gradient(135deg, #fff, #f8f8f8);
            box-shadow: 
              0 2rpx 12rpx rgba(59, 130, 246, 0.3),
              0 1rpx 6rpx rgba(0, 0, 0, 0.15);
          }

          .switch-text {
            color: #fff;
            text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
          }
        }
      }
    }

    .text-input {
      flex: 1;
      height: 100%;
      font-size: 28rpx;
      color: #333;

      &::placeholder {
        color: #999;
      }
    }

    .emoji-btn {
      width: 64rpx;
      height: 64rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        opacity: 0.7;
      }
    }
  }

  .send-btn {
    width: 120rpx;
    height: 72rpx;
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    border-radius: 36rpx;
    color: #fff;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;

    &.disabled {
      background: #e0e0e0;
      color: #999;
      cursor: not-allowed;
      pointer-events: none;
      opacity: 0.7;
    }

    &.active {
      &:active {
        transform: scale(0.95);
        opacity: 0.9;
      }
    }
  }
}
</style>