<script setup>
import { ref, reactive, onMounted } from 'vue'
import { formatTime } from '@/utils/time'
import User from '/static/images/user.png'
import { onLoad, onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { throttle } from 'lodash'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { CommunityApi } from '@/api/community'

// 路由
const router = useRouter()

// 话题名称
const topicName = ref('')

// 话题详情数据
const topicDetail = reactive({
  id: '',
  name: '',
  description: '',
  category: '',
  is_official: false,
  stats: {
    post_count: 0,
    user_count: 0,
    today_posts: 0,
    weekly_posts: 0,
    hot_score: 0,
    trend_score: 0,
    last_updated: 0
  },
  created_at: 0,
  updated_at: 0
})

// 帖子列表数据
const posts = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const isLoading = ref(false)
const hasMore = ref(true)

// 加载话题详情
const loadTopicDetail = async () => {
  try {
    const res = await CommunityApi.getTopicDetail(topicName.value)
    
    // 更新话题数据
    Object.assign(topicDetail, res)
    
    // 设置页面标题
    uni.setNavigationBarTitle({
      title: `# ${topicDetail.name}`
    })
    
  } catch (error) {
    console.error('加载话题详情失败:', error)
    uni.showToast({
      title: '话题不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

// 加载话题帖子列表
const loadTopicPosts = async (refresh = false) => {
  if (isLoading.value && !refresh) return
  
  isLoading.value = true
  
  try {
    // 如果是刷新，重置页码
    if (refresh) {
      page.value = 1
      hasMore.value = true
    }
    
    const res = await CommunityApi.getTopicPosts(topicName.value, {
      page: page.value,
      page_size: pageSize.value
    })
    
    // 处理返回的数据
    const newPosts = res.posts.map(post => ({
      id: post.id,
      user: {
        id: post.author.id,
        nickname: post.author.nickname,
        avatar: post.author.avatar || User,
        gender: post.author.gender || 'unknown',
        isFollowed: post.is_followed
      },
      publishTime: post.publish_time,
      content: post.content,
      images: post.images || [],
      tags: post.tags || [],
      topics: post.topics || [],
      stats: {
        likes: post.stats.likes,
        comments: post.stats.comments,
        favorites: post.stats.favorites
      },
      isLiked: post.is_liked,
      isFavorited: post.is_favorited
    }))
    
    if (refresh) {
      posts.value = newPosts
    } else {
      posts.value.push(...newPosts)
    }
    
    total.value = res.total
    page.value = res.page
    
    // 判断是否还有更多数据
    hasMore.value = posts.value.length < total.value
    
  } catch (error) {
    console.error('加载话题帖子失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
  }
}

// 处理点赞
const handleLike = throttle(async (post) => {
  try {
    await CommunityApi.likePost(post.id)
    
    // 更新本地状态
    post.isLiked = !post.isLiked
    post.stats.likes += post.isLiked ? 1 : -1
  } catch (error) {
    console.error('点赞失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}, 1000)

// 处理收藏
const handleFavorite = throttle(async (post) => {
  try {
    await CommunityApi.favoritePost(post.id)
    
    // 更新本地状态
    post.isFavorited = !post.isFavorited
    post.stats.favorites += post.isFavorited ? 1 : -1
    
    uni.showToast({
      title: post.isFavorited ? '收藏成功' : '已取消收藏',
      icon: 'none'
    })
  } catch (error) {
    console.error('收藏失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}, 1000)

// 处理评论
const handleComment = throttle((post) => {
  console.log('评论帖子:', post.id)
  router.push({
    name: 'post_detail',
    query: {
      id: post.id,
      focus: 'comment'
    }
  })
}, 1000)

// 查看用户信息
const viewUserProfile = throttle((userId) => {
  console.log('查看用户资料:', userId)
  router.push({
    name: 'user-profile',
    params: { userId }
  })
}, 1000)

// 查看帖子详情
const viewPostDetail = throttle((postId) => {
  console.log('查看帖子详情:', postId)
  router.push({
    name: 'post_detail',
    query: {
      id: postId
    }
  })
}, 1000)

// 查看话题详情
const viewTopicDetail = throttle((topicName) => {
  console.log('查看话题详情:', topicName)
  router.push({
    name: 'topic_detail',
    query: {
      name: topicName
    }
  })
}, 1000)

// 查看图片大图
const viewImage = throttle((post, index) => {
  console.log('查看图片:', post.id, index)
  uni.previewImage({
    urls: post.images,
    current: index
  })
}, 1000)

// 下拉刷新
onPullDownRefresh(async () => {
  console.log('下拉刷新')
  await Promise.all([
    loadTopicDetail(),
    loadTopicPosts(true)
  ])
  uni.stopPullDownRefresh()
})

// 上拉加载更多
onReachBottom(async () => {
  console.log('上拉加载更多')
  if (!hasMore.value || isLoading.value) return
  
  page.value++
  await loadTopicPosts()
})

onLoad((options) => {
  // 获取话题名称
  topicName.value = decodeURIComponent(options.name || '')
  
  if (topicName.value) {
    // 加载话题详情和帖子列表
    loadTopicDetail()
    loadTopicPosts(true)
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<template>
  <Layout>
    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 话题详情卡片 -->
      <view class="bg-white p-30rpx mb-20rpx">
        <!-- 话题标题 -->
        <view class="flex items-center mb-20rpx">
          <view class="text-40rpx font-bold text-orange-500 mr-16rpx">
            # {{ topicDetail.name }}
          </view>
          <view v-if="topicDetail.is_official" class="bg-gradient-to-r from-orange-400 to-red-400 text-white text-20rpx px-12rpx py-4rpx rounded-full">
            官方话题
          </view>
        </view>
        
        <!-- 话题描述 -->
        <view v-if="topicDetail.description" class="text-28rpx text-gray-600 mb-20rpx">
          {{ topicDetail.description }}
        </view>
        
        <!-- 话题统计 -->
        <view class="flex justify-between bg-gray-50 rounded-12rpx p-20rpx">
          <view class="flex flex-col items-center">
            <text class="text-32rpx font-bold text-#333">{{ topicDetail.stats.post_count }}</text>
            <text class="text-24rpx text-gray-500">帖子</text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-32rpx font-bold text-#333">{{ topicDetail.stats.user_count }}</text>
            <text class="text-24rpx text-gray-500">参与者</text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-32rpx font-bold text-#333">{{ topicDetail.stats.today_posts }}</text>
            <text class="text-24rpx text-gray-500">今日</text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-32rpx font-bold text-orange-500">{{ Math.round(topicDetail.stats.hot_score) }}</text>
            <text class="text-24rpx text-gray-500">热度</text>
          </view>
        </view>
      </view>
      
      <!-- 帖子列表 -->
      <view class="p-20rpx">
        <!-- 列表标题 -->
        <view class="flex items-center justify-between mb-20rpx">
          <text class="text-30rpx font-bold text-#333">相关帖子</text>
          <text class="text-24rpx text-gray-500">共 {{ total }} 条</text>
        </view>
        
        <!-- 加载中提示 -->
        <view v-if="isLoading && posts.length === 0" class="flex justify-center items-center py-100rpx">
          <text class="text-28rpx text-gray-400">加载中...</text>
        </view>
        
        <!-- 空数据提示 -->
        <view v-else-if="!isLoading && posts.length === 0" class="flex flex-col items-center justify-center py-100rpx">
          <WdIcon name="inbox" size="80rpx" color="#ddd" />
          <text class="mt-20rpx text-28rpx text-gray-400">暂无相关帖子</text>
        </view>
        
        <!-- 帖子列表 -->
        <view 
          v-for="post in posts" 
          :key="post.id" 
          class="relative mb-20rpx p-30rpx bg-white rounded-16rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
          @tap="viewPostDetail(post.id)"
        >
          <!-- 帖子头部 - 用户信息和发布时间 -->
          <view class="flex justify-between items-center mb-20rpx">
            <view class="flex items-center" @tap.stop="viewUserProfile(post.user.id)">
              <image class="w-80rpx h-80rpx rounded-full mr-20rpx border-2rpx border-gray-100" :src="post.user.avatar" mode="aspectFill"></image>
              <view class="flex flex-col">
                <view class="flex items-center">
                  <text class="text-28rpx font-600 text-#333 mr-10rpx">{{ post.user.nickname }}</text>
                  <view v-if="post.user.gender !== 'unknown'" class="flex items-center justify-center w-36rpx h-36rpx" :class="post.user.gender === 'male' ? 'text-blue-500' : 'text-pink-500'">
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
          
          <!-- 话题 -->
          <view v-if="post.topics && post.topics.length > 0" class="flex flex-wrap mb-16rpx">
            <view 
              v-for="topic in post.topics.slice(0, 3)" 
              :key="topic.id" 
              class="mr-12rpx mb-8rpx px-12rpx py-4rpx bg-orange-50 text-orange-500 text-22rpx rounded-6rpx transition-all duration-200 active:bg-orange-100"
              @tap.stop="viewTopicDetail(topic.name)"
            >
              # {{ topic.name }}
              <text v-if="topic.is_official" class="ml-4rpx text-18rpx">🔥</text>
            </view>
            <view v-if="post.topics.length > 3" class="px-12rpx py-4rpx text-gray-400 text-22rpx">
              +{{ post.topics.length - 3 }}
            </view>
          </view>
          
          <!-- 标签 -->
          <view v-if="post.tags && post.tags.length > 0" class="flex flex-wrap mb-16rpx">
            <view 
              v-for="(tag, index) in post.tags.slice(0, 3)" 
              :key="index" 
              class="mr-12rpx mb-8rpx px-12rpx py-4rpx bg-blue-50 text-blue-500 text-22rpx rounded-6rpx"
            >
              # {{ tag }}
            </view>
            <view v-if="post.tags.length > 3" class="px-12rpx py-4rpx text-gray-400 text-22rpx">
              +{{ post.tags.length - 3 }}
            </view>
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
                v-for="(img, index) in post.images.slice(0, 9)" 
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
        
        <!-- 加载更多提示 -->
        <view v-if="isLoading && posts.length > 0" class="flex justify-center items-center py-30rpx">
          <text class="text-24rpx text-gray-400">加载中...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view v-if="!hasMore && posts.length > 0" class="flex justify-center items-center py-30rpx">
          <text class="text-24rpx text-gray-400">没有更多了</text>
        </view>
      </view>
    </view>
  </Layout>
</template>

<style>
/* 空样式表，所有样式已使用UnoCSS原子类 */
</style> 