<script setup>
import Layout from '@/layout/index'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { formatTime } from '@/utils/time'
import User from '/static/images/user.png'
import events from '@/utils/events'
import { throttle } from 'lodash'
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'

const router = useRouter()

// 当前选中的标签
const activeTab = ref('published')

// 个人中心的tab选项
const personalTabs = [
  {name: 'published', label: '我发布的'},
  {name: 'favorite', label: '我收藏的'},
  {name: 'liked', label: '我点赞的'}
]

// 页面加载状态
const loading = ref(false)
const refreshing = ref(false)
const hasMore = ref(true)

// 模拟个人发布的帖子数据
const publishedPosts = reactive([
  {
    id: 1,
    user: {
      id: 101,
      nickname: '我的用户名',
      avatar: User,
      gender: 'male'
    },
    publishTime: Date.now() - 2 * 60 * 60 * 1000,
    content: '今天参加了校园马拉松活动，感觉真是太累了，但是非常有成就感！大家都有什么课余活动呢？',
    images: [
      User,
      User,
    ],
    stats: {
      likes: 15,
      comments: 3,
      favorites: 2
    },
    isLiked: true,
    isFavorited: true
  },
  {
    id: 2,
    user: {
      id: 101,
      nickname: '我的用户名',
      avatar: User,
      gender: 'male'
    },
    publishTime: Date.now() - 2 * 24 * 60 * 60 * 1000,
    content: '这次期中考试有点难度啊，大家都觉得怎么样？有没有什么好的复习方法分享一下？',
    images: [],
    stats: {
      likes: 8,
      comments: 10,
      favorites: 1
    },
    isLiked: false,
    isFavorited: false
  }
])

// 模拟收藏的帖子数据
const favoritePosts = reactive([
  {
    id: 3,
    user: {
      id: 102,
      nickname: '校园摄影师',
      avatar: User,
      gender: 'female'
    },
    publishTime: Date.now() - 1 * 24 * 60 * 60 * 1000,
    content: '分享一组校园樱花季的照片，每年这个时候都是最美的！',
    images: [
      User,
      User,
      User,
    ],
    stats: {
      likes: 42,
      comments: 12,
      favorites: 8
    },
    isLiked: true,
    isFavorited: true
  },
  {
    id: null,
    isDeleted: true
  },
  {
    id: 4,
    user: {
      id: 103,
      nickname: '美食达人',
      avatar: User,
      gender: 'female'
    },
    publishTime: Date.now() - 5 * 24 * 60 * 60 * 1000,
    content: '校门口新开的奶茶店真的很不错，推荐大家去尝尝他们家的芝士茉莉茶！',
    images: [
      User,
    ],
    stats: {
      likes: 36,
      comments: 8,
      favorites: 5
    },
    isLiked: false,
    isFavorited: true
  }
])

// 模拟点赞的帖子数据
const likedPosts = reactive([
  {
    id: 5,
    user: {
      id: 104,
      nickname: '学习达人',
      avatar: User,
      gender: 'male'
    },
    publishTime: Date.now() - 12 * 60 * 60 * 1000,
    content: '整理了一份期末复习资料，需要的同学在评论区留言，我发给你们！',
    images: [],
    stats: {
      likes: 128,
      comments: 64,
      favorites: 42
    },
    isLiked: true,
    isFavorited: false
  },
  {
    id: null,
    isDeleted: true
  },
  {
    id: 6,
    user: {
      id: 105,
      nickname: '运动健将',
      avatar: User,
      gender: 'male'
    },
    publishTime: Date.now() - 3 * 24 * 60 * 60 * 1000,
    content: '今天在体育馆打篮球，遇到了校队的学长，被虐得体无完肤，但学到了很多！',
    images: [
      User,
    ],
    stats: {
      likes: 20,
      comments: 5,
      favorites: 1
    },
    isLiked: true,
    isFavorited: false
  }
])

// 获取当前标签的帖子数据
const currentPosts = computed(() => {
  switch(activeTab.value) {
    case 'published':
      return publishedPosts
    case 'favorite':
      return favoritePosts
    case 'liked':
      return likedPosts
    default:
      return []
  }
})

// 处理tab切换
const handleTabChange = throttle((tabName) => {
  console.log('切换到标签:', tabName)
  activeTab.value = tabName
  // 模拟切换标签时的数据加载
  refreshData()
}, 500)

// 处理点赞
const handleLike = throttle((post) => {
  if (post.isLiked) {
    post.stats.likes--
  } else {
    post.stats.likes++
  }
  post.isLiked = !post.isLiked
}, 500)

// 处理收藏
const handleFavorite = throttle((post) => {
  if (post.isFavorited) {
    post.stats.favorites--
  } else {
    post.stats.favorites++
  }
  post.isFavorited = !post.isFavorited
}, 500)

// 处理评论
const handleComment = throttle((post) => {
  console.log('评论帖子:', post.id)
  // 这里可以跳转到评论页面或展开评论框
}, 500)

// 查看用户信息
const viewUserProfile = throttle((userId) => {
  console.log('查看用户资料:', userId)
  // 这里可以跳转到用户资料页面
}, 500)

// 查看帖子详情
const viewPostDetail = throttle((postId) => {
  console.log('查看帖子详情:', postId)
  // 跳转到帖子详情页
  router.push({
    name: 'post_detail',
    query: {
      id: postId
    }
  })
}, 500)

// 处理举报
const handleReport = (post) => {
  // 构建帖子信息
  const noteInfo = {
    id: post.id,
    title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
    author: post.user.nickname,
    cover: post.images && post.images.length > 0 ? post.images[0] : ''
  }
  
  // 跳转到举报页面
  router.push({
    name: 'report',
    params: {
      noteInfo: encodeURIComponent(JSON.stringify(noteInfo))
    }
  })
}

// 操作表选项
const actions = [
  {
    name: "举报",
    callback: null
  }
]

// 删除操作选项（红色字体）
const deleteAction = {
  name: "删除",
  color: "#ef4444",
  icon: "delete",
  callback: null
}

// 操作表标题
const title = "操作帖子"

// 长按帖子处理
const handleLongPress = (post) => {
  console.log('长按帖子:', post.id)
  if (post.isDeleted) return // 已删除的帖子不处理长按事件
  
  // 根据当前标签页和帖子类型设置不同的操作选项
  if (activeTab.value === 'published') {
    // 对于自己发布的动态，显示删除选项
    events.emit('openActionSheet', [deleteAction], "操作我的帖子")
    deleteAction.callback = () => deletePost(post.id)
  } else {
    // 对于其他人的动态，显示举报选项
    actions[0].callback = () => handleReport(post)
    events.emit('openActionSheet', actions, title)
  }
}

// 删除帖子
const deletePost = (postId) => {
  console.log('删除帖子:', postId)
  // 从发布列表中移除帖子
  const index = publishedPosts.findIndex(post => post.id === postId)
  if (index !== -1) {
    uni.showModal({
      title: '确认删除',
      content: '确定要删除这条动态吗？删除后无法恢复。',
      success: function (res) {
        if (res.confirm) {
          // 用户点击确定，执行删除操作
          publishedPosts.splice(index, 1)
          uni.showToast({
            title: '删除成功',
            icon: 'success',
            duration: 2000
          })
        }
      }
    })
  }
}

// 从收藏或点赞列表中移除已删除的帖子
const removeDeletedPost = (post, type) => {
  const list = type === 'favorite' ? favoritePosts : likedPosts
  const index = list.findIndex(item => item === post)
  if (index !== -1) {
    list.splice(index, 1)
    uni.showToast({
      title: type === 'favorite' ? '已取消收藏' : '已取消点赞',
      icon: 'success',
      duration: 2000
    })
  }
}

// 查看图片大图
const viewImage = throttle((post, index) => {
  console.log('查看图片:', post.id, index)
  if (post.images && post.images.length > 0) {
    uni.previewImage({
      current: index,
      urls: post.images
    })
  }
}, 500)

// 刷新数据
const refreshData = async () => {
  refreshing.value = true
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  refreshing.value = false
  // 在这里可以重新加载数据
}

// 加载更多数据
const loadMoreData = async () => {
  if (!hasMore.value || loading.value) return
  
  loading.value = true
  // 模拟网络请求延迟
  await new Promise(resolve => setTimeout(resolve, 1000))
  loading.value = false
  
  // 根据当前标签模拟加载更多数据
  // 在实际应用中，这里应该从服务器获取更多数据
  if (currentPosts.value.length >= 10) {
    hasMore.value = false
  }
}

// 下拉刷新
onPullDownRefresh(() => {
  refreshData().then(() => {
    uni.stopPullDownRefresh()
  })
})

// 上拉加载更多
onReachBottom(() => {
  loadMoreData()
})

onMounted(() => {
  // 初始加载数据
  refreshData()
})
</script>

<template>
  <layout>
    <template #center>
      <text class="text-32rpx font-bold">个人中心</text>
    </template>

    <view class="bg-#f8f8f8 min-h-screen">
      <!-- 标签切换 -->
      <view class="sticky top-0 z-10 bg-white shadow-sm">
        <tab-group
          :tabs="personalTabs"
          v-model:active-tab="activeTab"
          @change="handleTabChange"
        />
      </view>

      <!-- 内容区域 -->
      <view class="p-20rpx pb-30rpx">
        <!-- 下拉刷新指示器 -->
        <view v-if="refreshing" class="flex justify-center items-center py-20rpx">
          <WdIcon name="loading" size="40rpx" custom-style="color:#666" />
          <text class="ml-10rpx text-26rpx text-#666">正在刷新...</text>
        </view>

        <!-- 帖子列表 -->
        <template v-if="currentPosts.length > 0">
          <view 
            v-for="(post, index) in currentPosts" 
            :key="index" 
            class="mb-20rpx"
          >
            <!-- 已删除的帖子显示 -->
            <view 
              v-if="post.isDeleted" 
              class="p-30rpx bg-white rounded-16rpx shadow-sm"
            >
              <view class="flex flex-col items-center py-30rpx">
                <view class="flex items-center justify-center">
                  <WdIcon name="info-circle" size="40rpx" custom-style="color:#999" />
                  <text class="ml-10rpx text-28rpx text-#999">该内容已被作者删除</text>
                </view>
                
                <!-- 添加移除按钮 -->
                <button 
                  class="mt-20rpx py-10rpx px-30rpx text-26rpx text-white bg-#666 rounded-full"
                  @tap.stop="removeDeletedPost(post, activeTab.value)"
                >
                  {{ activeTab.value === 'favorite' ? '取消收藏' : '取消点赞' }}
                </button>
              </view>
            </view>

            <!-- 正常帖子显示 -->
            <view 
              v-else
              class="relative p-30rpx bg-white rounded-16rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="viewPostDetail(post.id)"
              @longpress="handleLongPress(post)"
            >
              <!-- 帖子头部 - 用户信息和发布时间 -->
              <view class="flex justify-between items-center mb-20rpx">
                <view class="flex items-center" @tap.stop="viewUserProfile(post.user.id)">
                  <image class="w-80rpx h-80rpx rounded-full mr-20rpx border-2rpx border-gray-100" :src="post.user.avatar" mode="aspectFill"></image>
                  <view class="flex flex-col">
                    <view class="flex items-center">
                      <text class="text-28rpx font-600 text-#333 mr-10rpx">{{ post.user.nickname }}</text>
                      <view class="flex items-center justify-center w-36rpx h-36rpx" :class="post.user.gender === 'male' ? 'text-blue-500' : 'text-pink-500'">
                        <WdIcon 
                          :name="post.user.gender === 'male' ? 'gender-male' : 'gender-female'" 
                          size="24" 
                          :custom-style="post.user.gender === 'male' ? 'color:#3b82f6' : 'color:#ec4899'"
                        />
                      </view>
                    </view>
                    <text class="text-24rpx text-gray-400 mt-4rpx">{{ formatTime(post.publishTime) }}</text>
                  </view>
                </view>
              </view>

              <!-- 帖子内容 -->
              <view class="mb-20rpx">
                <text class="text-28rpx text-#333 line-clamp-4 overflow-hidden">{{ post.content }}</text>
              </view>

              <!-- 帖子图片 -->
              <view v-if="post.images && post.images.length > 0" class="flex flex-wrap mb-20rpx gap-10rpx">
                <!-- 1张图片时 -->
                <template v-if="post.images.length === 1">
                  <image 
                    :src="post.images[0]" 
                    mode="aspectFill" 
                    class="w-full h-360rpx rounded-12rpx object-cover transition-all duration-300 active:scale-95 active:opacity-90"
                    @tap.stop="viewImage(post, 0)"
                  ></image>
                </template>
                
                <!-- 2张图片时 -->
                <template v-else-if="post.images.length === 2">
                  <image 
                    v-for="(img, index) in post.images" 
                    :key="index" 
                    :src="img" 
                    mode="aspectFill" 
                    class="w-[calc(50%-5rpx)] h-300rpx rounded-12rpx object-cover transition-all duration-300 active:scale-95 active:opacity-90"
                    @tap.stop="viewImage(post, index)"
                  ></image>
                </template>
                
                <!-- 3张或更多图片时 -->
                <template v-else>
                  <image 
                    v-for="(img, index) in post.images" 
                    :key="index" 
                    :src="img" 
                    mode="aspectFill" 
                    class="w-[calc(33.333%-7rpx)] h-200rpx rounded-12rpx object-cover transition-all duration-300 active:scale-95 active:opacity-90"
                    @tap.stop="viewImage(post, index)"
                  ></image>
                </template>
              </view>

              <!-- 帖子互动栏 -->
              <view class="flex justify-around border-t-2rpx border-gray-100 pt-20rpx">
                <view 
                  :class="['flex items-center px-20rpx py-10rpx rounded-30rpx transition-all duration-200 active:bg-gray-100', post.isLiked ? 'active' : '']" 
                  @tap.stop="handleLike(post)"
                >
                  <WdIcon 
                    custom-class="iconfont" class-prefix="icon"
                    :name="post.isLiked ? 'heart-fill' : 'heart'" 
                    size="20" 
                    :custom-style="post.isLiked ? 'color:#ef4444' : 'color:#666'"
                  />
                  <text class="ml-8rpx text-24rpx text-#666" :class="post.isLiked ? 'font-600' : ''">{{ post.stats.likes }}</text>
                </view>
                <view 
                  class="flex items-center px-20rpx py-10rpx rounded-30rpx transition-all duration-200 active:bg-gray-100" 
                  @tap.stop="handleComment(post)"
                >
                  <WdIcon 
                    custom-class="iconfont" class-prefix="icon"
                    name="comment" 
                    size="20" 
                    custom-style="color:#666"
                  />
                  <text class="ml-8rpx text-24rpx text-#666">{{ post.stats.comments }}</text>
                </view>
                <view 
                  :class="['flex items-center px-20rpx py-10rpx rounded-30rpx transition-all duration-200 active:bg-gray-100', post.isFavorited ? 'active' : '']" 
                  @tap.stop="handleFavorite(post)"
                >
                  <WdIcon 
                    custom-class="iconfont" class-prefix="icon"
                    :name="post.isFavorited ? 'star-fill' : 'star'" 
                    size="20" 
                    :custom-style="post.isFavorited ? 'color:#f59e0b' : 'color:#666'"
                  />
                  <text class="ml-8rpx text-24rpx text-#666" :class="post.isFavorited ? 'font-600' : ''">{{ post.stats.favorites }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 无内容显示 -->
        <view v-else-if="!refreshing" class="flex flex-col items-center justify-center py-100rpx">
          <WdIcon name="info-circle" size="80rpx" custom-style="color:#ccc" />
          <text class="mt-20rpx text-28rpx text-#999">暂无内容</text>
        </view>

        <!-- 加载更多指示器 -->
        <view v-if="loading" class="flex justify-center items-center py-20rpx">
          <WdIcon name="loading" size="40rpx" custom-style="color:#666" />
          <text class="ml-10rpx text-26rpx text-#666">加载更多...</text>
        </view>
        
        <!-- 无更多数据提示 -->
        <view v-if="!hasMore && currentPosts.length > 0" class="flex justify-center items-center py-20rpx">
          <text class="text-26rpx text-#999">— 没有更多内容了 —</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style lang="scss" scoped>
/* 使用UnoCSS原子类，此处不需要添加额外样式 */
</style>
