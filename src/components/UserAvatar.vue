<template>
  <view 
    class="user-avatar" 
    :class="[sizeClass, { 'anonymous': isAnonymous, 'clickable': clickable }]"
    @tap="handleClick"
  >
    <!-- 头像图片 -->
    <image 
      :src="avatarUrl" 
      :class="['avatar-image', { 'anonymous-style': isAnonymous }]"
      mode="aspectFill"
      @error="handleImageError"
    />
    
    <!-- 匿名标识 -->
    <view v-if="isAnonymous && showAnonymousIcon" class="anonymous-badge">
      <WdIcon name="user" size="12rpx" color="#fff" />
    </view>
    
    <!-- 在线状态指示器 -->
    <view v-if="showOnlineStatus && onlineStatus" class="online-indicator"></view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import DefaultAvatar from '/static/images/user.png'
import Anonymous from '/static/images/anonymous.png'
import AnonymousMale from '/static/images/anonymous_male.png'
import AnonymousFemale from '/static/images/anonymous_female.png'

const props = defineProps({
  // 用户信息
  user: {
    type: Object,
    default: () => ({})
  },
  // 头像URL
  avatar: {
    type: String,
    default: ''
  },
  // 是否匿名
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // 头像尺寸：xs, sm, md, lg, xl
  size: {
    type: String,
    default: 'md',
    validator: (value) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(value)
  },
  // 是否显示匿名图标
  showAnonymousIcon: {
    type: Boolean,
    default: true
  },
  // 是否显示在线状态
  showOnlineStatus: {
    type: Boolean,
    default: false
  },
  // 在线状态
  onlineStatus: {
    type: Boolean,
    default: false
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['click', 'error'])

// 头像映射逻辑 - 根据性别显示不同的匿名头像
const getAvatarByGender = (user) => {
  if (user?.is_anonymous) {
    const avatars = {
      'unknown': Anonymous,
      'male': AnonymousMale,
      'female': AnonymousFemale
    }
    return avatars[user.gender] || Anonymous
  }
  return user?.avatar || DefaultAvatar
}

// 头像URL计算
const avatarUrl = computed(() => {
  if (props.isAnonymous) {
    return getAvatarByGender(props.user)
  }
  
  if (props.avatar) {
    return props.avatar
  }
  
  if (props.user?.avatar) {
    return props.user.avatar
  }
  
  return DefaultAvatar
})

// 尺寸样式类
const sizeClass = computed(() => {
  const sizeMap = {
    'xs': 'size-xs',     // 40rpx
    'sm': 'size-sm',     // 60rpx
    'md': 'size-md',     // 80rpx
    'lg': 'size-lg',     // 100rpx
    'xl': 'size-xl'      // 120rpx
  }
  return sizeMap[props.size] || 'size-md'
})

// 点击处理
const handleClick = () => {
  if (props.clickable) {
    emit('click', {
      user: props.user,
      isAnonymous: props.isAnonymous
    })
  }
}

// 图片加载错误处理
const handleImageError = (e) => {
  console.warn('头像加载失败:', e)
  emit('error', e)
}
</script>

<style scoped lang="scss">
.user-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  overflow: hidden;
  background: #f5f5f5;
  transition: all 0.3s ease;
  
  &.clickable {
    cursor: pointer;
    
    &:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
  }
  
  &.anonymous {
    border: 2rpx solid rgba(59, 130, 246, 0.3);
    box-shadow: 0 0 0 4rpx rgba(59, 130, 246, 0.1);
  }
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &.anonymous-style {
    filter: brightness(0.9);
  }
}

.anonymous-badge {
  position: absolute;
  bottom: -2rpx;
  right: -2rpx;
  width: 20rpx;
  height: 20rpx;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  z-index: 1;
}

.online-indicator {
  position: absolute;
  bottom: 2rpx;
  right: 2rpx;
  width: 16rpx;
  height: 16rpx;
  background: #10b981;
  border-radius: 50%;
  border: 2rpx solid #fff;
  z-index: 1;
}

/* 尺寸样式 */
.size-xs {
  width: 40rpx;
  height: 40rpx;
  
  .anonymous-badge {
    width: 14rpx;
    height: 14rpx;
    bottom: -1rpx;
    right: -1rpx;
  }
  
  .online-indicator {
    width: 12rpx;
    height: 12rpx;
  }
}

.size-sm {
  width: 60rpx;
  height: 60rpx;
  
  .anonymous-badge {
    width: 18rpx;
    height: 18rpx;
  }
  
  .online-indicator {
    width: 14rpx;
    height: 14rpx;
  }
}

.size-md {
  width: 80rpx;
  height: 80rpx;
  
  .anonymous-badge {
    width: 20rpx;
    height: 20rpx;
  }
  
  .online-indicator {
    width: 16rpx;
    height: 16rpx;
  }
}

.size-lg {
  width: 100rpx;
  height: 100rpx;
  
  .anonymous-badge {
    width: 24rpx;
    height: 24rpx;
  }
  
  .online-indicator {
    width: 18rpx;
    height: 18rpx;
  }
}

.size-xl {
  width: 120rpx;
  height: 120rpx;
  
  .anonymous-badge {
    width: 28rpx;
    height: 28rpx;
  }
  
  .online-indicator {
    width: 20rpx;
    height: 20rpx;
  }
}
</style> 