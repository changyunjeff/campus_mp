<template>
  <view 
    class="author-info"
    :class="{ 'clickable': clickable, 'anonymous': isAnonymous }"
    @tap="handleClick"
  >
    <!-- 用户头像 -->
    <UserAvatar
      :user="author"
      :is-anonymous="isAnonymous"
      :size="avatarSize"
      :clickable="false"
      @click="handleAvatarClick"
    />
    
    <!-- 用户信息区域 -->
    <view class="user-details">
      <!-- 昵称和匿名标识 -->
      <view class="nickname-row">
        <text 
          class="nickname" 
          :class="{ 'anonymous-style': isAnonymous }"
        >
          {{ displayNickname }}
        </text>
        
        <!-- 匿名标识 -->
        <view v-if="isAnonymous" class="anonymous-tag">
          <WdIcon name="user" size="20rpx" color="#3b82f6" />
          <text class="tag-text">匿名</text>
        </view>
        
        <!-- 认证标识 -->
        <view v-if="author.verified && !isAnonymous" class="verified-badge">
          <WdIcon name="check-circle" size="20rpx" color="#10b981" />
        </view>
      </view>
      
      <!-- 时间和位置信息 -->
      <view class="meta-info">
        <text v-if="publishTime" class="time">{{ formattedTime }}</text>
        <text v-if="location && !isAnonymous" class="location">
          <WdIcon name="location" size="20rpx" color="#9ca3af" />
          {{ location }}
        </text>
      </view>
      
      <!-- 扩展信息（年级、学院等） -->
      <view v-if="showExtendedInfo && !isAnonymous" class="extended-info">
        <text v-if="author.grade" class="grade">{{ author.grade }}</text>
        <text v-if="author.college" class="college">{{ author.college }}</text>
      </view>
    </view>
    
    <!-- 关注按钮 -->
    <view v-if="showFollowButton && !isAnonymous" class="follow-section">
      <button 
        class="follow-btn"
        :class="{ 'following': isFollowing }"
        @tap.stop="handleFollow"
      >
        {{ isFollowing ? '已关注' : '关注' }}
      </button>
    </view>
    
    <!-- 更多操作按钮 -->
    <view v-if="showMoreButton" class="more-section" @tap.stop="handleMore">
      <WdIcon name="more-horizontal" size="24rpx" color="#9ca3af" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { formatTime } from '@/utils/time'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
  // 作者信息
  author: {
    type: Object,
    required: true,
    default: () => ({})
  },
  // 是否匿名
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // 发布时间
  publishTime: {
    type: [String, Number],
    default: ''
  },
  // 位置信息
  location: {
    type: String,
    default: ''
  },
  // 头像尺寸
  avatarSize: {
    type: String,
    default: 'md'
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: true
  },
  // 是否显示关注按钮
  showFollowButton: {
    type: Boolean,
    default: false
  },
  // 是否显示更多按钮
  showMoreButton: {
    type: Boolean,
    default: false
  },
  // 是否显示扩展信息
  showExtendedInfo: {
    type: Boolean,
    default: false
  },
  // 是否已关注
  isFollowing: {
    type: Boolean,
    default: false
  },
  // 自定义样式
  customClass: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['click', 'avatar-click', 'follow', 'more'])

// 显示的昵称
const displayNickname = computed(() => {
  if (props.isAnonymous) {
    return props.author.nickname || '匿名用户'
  }
  return props.author.nickname || '未知用户'
})

// 格式化时间
const formattedTime = computed(() => {
  if (!props.publishTime) return ''
  return formatTime(props.publishTime)
})

// 处理点击事件
const handleClick = () => {
  if (props.clickable) {
    emit('click', {
      author: props.author,
      isAnonymous: props.isAnonymous
    })
  }
}

// 处理头像点击
const handleAvatarClick = (data) => {
  if (props.clickable) {
    emit('avatar-click', data)
  }
}

// 处理关注
const handleFollow = () => {
  if (!props.isAnonymous) {
    emit('follow', {
      userId: props.author.id,
      isFollowing: props.isFollowing
    })
  }
}

// 处理更多操作
const handleMore = () => {
  emit('more', {
    author: props.author,
    isAnonymous: props.isAnonymous
  })
}
</script>

<style scoped lang="scss">
.author-info {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  transition: all 0.3s ease;
  
  &.clickable {
    cursor: pointer;
    
    &:active {
      opacity: 0.8;
    }
  }
  
  &.anonymous {
    .nickname {
      color: #3b82f6;
    }
  }
}

.user-details {
  flex: 1;
  min-width: 0;
  
  .nickname-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 8rpx;
    
    .nickname {
      font-size: 28rpx;
      font-weight: 600;
      color: #333;
      
      &.anonymous-style {
        color: #3b82f6;
        font-weight: 500;
      }
    }
    
    .anonymous-tag {
      display: flex;
      align-items: center;
      gap: 4rpx;
      padding: 4rpx 8rpx;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 8rpx;
      
      .tag-text {
        font-size: 20rpx;
        color: #3b82f6;
        font-weight: 500;
      }
    }
    
    .verified-badge {
      display: flex;
      align-items: center;
    }
  }
  
  .meta-info {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 8rpx;
    
    .time {
      font-size: 24rpx;
      color: #9ca3af;
    }
    
    .location {
      display: flex;
      align-items: center;
      gap: 4rpx;
      font-size: 24rpx;
      color: #9ca3af;
    }
  }
  
  .extended-info {
    display: flex;
    align-items: center;
    gap: 12rpx;
    
    .grade, .college {
      font-size: 22rpx;
      color: #6b7280;
      padding: 2rpx 8rpx;
      background: #f3f4f6;
      border-radius: 6rpx;
    }
  }
}

.follow-section {
  .follow-btn {
    padding: 12rpx 24rpx;
    font-size: 24rpx;
    border-radius: 20rpx;
    border: 1rpx solid #3b82f6;
    background: transparent;
    color: #3b82f6;
    transition: all 0.3s ease;
    
    &.following {
      background: #3b82f6;
      color: #fff;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.more-section {
  padding: 12rpx;
  border-radius: 50%;
  transition: all 0.3s ease;
  
  &:active {
    background: #f3f4f6;
    transform: scale(0.9);
  }
}
</style>
