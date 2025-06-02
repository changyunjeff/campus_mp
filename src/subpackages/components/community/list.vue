<script setup>
import { ref, onMounted } from 'vue';

const props = defineProps({
  // 列表数据
  list: {
    type: Array,
    default: () => []
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 是否已加载全部
  finished: {
    type: Boolean,
    default: false
  },
  // 列表类型：recommend(推荐)、follow(关注)、nearby(附近)、latest(最新)
  type: {
    type: String,
    default: 'recommend'
  }
});

const emit = defineEmits(['refresh', 'loadMore', 'like', 'comment', 'userClick']);

// 模拟数据，实际应用中应该从props.list获取
const noteList = ref([
  {
    id: 1,
    user: {
      id: 101,
      nickname: '程序员',
      avatar: '/static/logo.webp'
    },
    content: '我觉得吧，程序员可以做个ai识别野菜的app，我完全可以每个月30块钱付费，只要好用',
    images: [],
    video: '',
    likes: 6,
    comments: 12,
    type: 'text'
  },
  {
    id: 2,
    user: {
      id: 102,
      nickname: '牛生',
      avatar: '/static/logo.webp'
    },
    content: '这个世界太顽了！！！不敢问！真的不敢问！',
    images: [],
    video: '',
    likes: 126,
    comments: 45,
    type: 'chat'
  },
  {
    id: 3,
    user: {
      id: 103,
      nickname: '程序员小张',
      avatar: '/static/logo.webp'
    },
    content: '分享一下我的编程经验',
    images: ['/static/logo.webp'],
    video: '',
    likes: 18,
    comments: 5,
    type: 'image'
  },
  {
    id: 4,
    user: {
      id: 104,
      nickname: '小美',
      avatar: '/static/logo.webp'
    },
    content: '今天的校园生活',
    images: ['/static/logo.webp'],
    video: '',
    likes: 32,
    comments: 8,
    type: 'image'
  }
]);

// 下拉刷新
const onRefresh = () => {
  emit('refresh');
};

// 上拉加载更多
const onLoadMore = () => {
  if (!props.finished) {
    emit('loadMore');
  }
};

// 点赞
const handleLike = (item) => {
  emit('like', item.id);
};

// 评论
const handleComment = (item) => {
  emit('comment', item.id);
};

// 点击用户头像或昵称
const handleUserClick = (user) => {
  emit('userClick', user.id);
};

onMounted(() => {
  // 初始化加载数据
  console.log('社区笔记列表组件已加载');
});
</script>

<template>
  <view class="community-list-container">
    <!-- 下拉刷新组件 -->
    <scroll-view 
      class="scroll-container" 
      scroll-y 
      @scrolltolower="onLoadMore"
      refresher-enabled
      :refresher-triggered="loading"
      @refresherrefresh="onRefresh"
    >
      <!-- 笔记列表 -->
      <view class="note-grid">
        <view 
          v-for="item in noteList" 
          :key="item.id" 
          class="note-card"
        >
          <!-- 笔记内容 -->
          <view class="note-content">
            <!-- 文本内容 -->
            <text class="note-text">{{ item.content }}</text>
            
            <!-- 图片内容 -->
            <view v-if="item.images && item.images.length > 0" class="note-images">
              <image 
                v-for="(img, index) in item.images" 
                :key="index" 
                :src="img" 
                mode="aspectFill" 
                class="note-image"
              />
            </view>
            
            <!-- 视频内容 -->
            <view v-if="item.video" class="note-video-container">
              <video :src="item.video" class="note-video"></video>
            </view>
          </view>
          
          <!-- 用户信息 -->
          <view class="note-user" @tap="handleUserClick(item.user)">
            <image class="user-avatar" :src="item.user.avatar" mode="aspectFill" />
            <text class="user-nickname">{{ item.user.nickname }}</text>
          </view>
          
          <!-- 互动区域 -->
          <view class="note-actions">
            <view class="action-item" @tap="handleLike(item)">
              <text class="iconfont icon-like"></text>
              <text class="action-count">{{ item.likes }}</text>
            </view>
            <view class="action-item" @tap="handleComment(item)">
              <text class="iconfont icon-comment"></text>
              <text class="action-count">{{ item.comments }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 加载状态 -->
      <view v-if="loading" class="loading-status">
        <text>加载中...</text>
      </view>
      <view v-if="finished && !loading" class="loading-status">
        <text>没有更多内容了</text>
      </view>
    </scroll-view>
  </view>
</template>

<style lang="scss" scoped>
.community-list-container {
  width: 100%;
  height: 100%;
  background-color: #f8f8f8;
}

.scroll-container {
  height: 100%;
  width: 100%;
}

.note-grid {
  display: flex;
  flex-wrap: wrap;
  padding: 10rpx;
}

.note-card {
  width: calc(50% - 20rpx);
  margin: 10rpx;
  background-color: #fff;
  border-radius: 12rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.note-content {
  padding: 16rpx;
  flex: 1;
}

.note-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.note-images {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10rpx;
}

.note-image {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  object-fit: cover;
}

.note-video-container {
  width: 100%;
  margin-top: 10rpx;
}

.note-video {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
}

.note-user {
  display: flex;
  align-items: center;
  padding: 12rpx 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.user-avatar {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.user-nickname {
  font-size: 24rpx;
  color: #666;
  flex: 1;
}

.note-actions {
  display: flex;
  padding: 12rpx 16rpx;
  border-top: 1rpx solid #f5f5f5;
}

.action-item {
  display: flex;
  align-items: center;
  margin-right: 24rpx;
}

.action-count {
  font-size: 24rpx;
  color: #999;
  margin-left: 6rpx;
}

.loading-status {
  text-align: center;
  padding: 20rpx 0;
  color: #999;
  font-size: 24rpx;
}
</style>