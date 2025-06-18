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
          :class="{ 'active': anonymous }"
        >
          <view class="switch-track">
            <view class="switch-thumb"></view>
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

const inputValue = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const isEmojiShow = ref(false)
const inputRef = ref(null)

const canSend = computed(() => {
  return inputValue.value.trim().length > 0 && !props.disabled
})

// 匿名开关处理
const toggleAnonymous = throttle(() => {
  const newValue = !props.anonymous
  emit('update:anonymous', newValue)
  emit('anonymous-change', newValue)
}, 200)

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
  bottom: 92rpx; /* 输入区域高度(92rpx) + 间距(40rpx) */
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
      width: 100rpx;  /* 增加宽度以适应文字 */
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
        overflow: hidden; /* 改为 visible 确保文字不被裁剪 */
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
          font-size: 24rpx; /* 稍微增大字体 */
          font-weight: 500;
          color: #666;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
          pointer-events: none;
          white-space: nowrap; /* 防止文字换行 */
        }
      }

      /* 激活状态 */
      &.active {
        .switch-track {
          background: linear-gradient(135deg, rgb(60, 177, 255), #784ba0);
          box-shadow: 
            inset 0 2rpx 4rpx rgba(255, 60, 172, 0.2),
            0 2rpx 12rpx rgba(255, 60, 172, 0.3);

          .switch-thumb {
            left: 48rpx; /* 100rpx - 48rpx - 4rpx */
            background: linear-gradient(135deg, #fff, #f8f8f8);
            box-shadow: 
              0 2rpx 12rpx rgba(60, 177, 255, 0.3),
              0 1rpx 6rpx rgba(0, 0, 0, 0.15);
          }

          .switch-text {
            color: #fff;
            text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
          }
        }
      }

      /* 悬停效果 */
      &:hover {
        .switch-track {
          transform: translateY(-1rpx);
          box-shadow: 
            inset 0 2rpx 4rpx rgba(0, 0, 0, 0.1),
            0 4rpx 12rpx rgba(0, 0, 0, 0.1);
        }

        &.active .switch-track {
          box-shadow: 
            inset 0 2rpx 4rpx rgba(255, 60, 172, 0.2),
            0 4rpx 16rpx rgba(255, 60, 172, 0.4);
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
    background: linear-gradient(135deg, rgb(60, 177, 255), #784ba0);
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