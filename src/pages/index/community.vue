<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { formatTime, sleep } from '@/utils/time'
import User from '/static/images/user.png'
import events from '@/utils/events'
import { debounce, throttle } from 'lodash'
import {onLoad, onPullDownRefresh, onReachBottom} from '@dcloudio/uni-app'
import { CommunityApi } from '@/api/community'
import { UserApi } from '@/api/user'

const {show} = useTabbar()

const activeTab = ref('recommend')
const router = useRouter()

// 社区页面的tab选项
const communityTabs = [
  {name: 'recommend', label: '推荐'},
  {name: 'follow', label: '关注'},
  {name: 'latest', label: '最新'}
]

// 帖子列表数据
const posts = ref([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const isLoading = ref(false)
const isRefreshing = ref(false)
const hasMore = ref(true)

// 加载帖子列表
const loadPosts = async (refresh = false) => {
  if (isLoading.value && !refresh) return
  
  isLoading.value = true
  
  try {
    // 如果是刷新，重置页码
    if (refresh) {
      page.value = 1
      hasMore.value = true
    }
    
    // 根据activeTab映射到后端的tab类型
    const tabMap = {
      'recommend': 'recommend',
      'follow': 'follow',
      'latest': 'latest'
    }
    
    const res = await CommunityApi.getPostList({
      tab: tabMap[activeTab.value] || 'recommend',
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
      publishTime: post.publish_time * 1000, // 转换为毫秒
      content: post.content,
      images: post.images || [],
      tags: post.tags || [],
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
    console.error('加载帖子失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

// 处理tab切换
const handleTabChange = throttle(async (tabName) => {
  console.log('切换到标签:', tabName)
  activeTab.value = tabName
  
  // 清空列表并重新加载
  posts.value = []
  await loadPosts(true)
}, 1000)

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
  // 跳转到帖子详情页，并定位到评论区
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

const gotoSearchPage = throttle(() => {
  console.log('跳转到搜索页面')
  router.push({
    name: 'community_search',
  })
}, 1000)

// 处理举报
const handleReport = (post) => {
  // 构建帖子信息
  const noteInfo = {
    id: post.id,
    title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
    author: post.user.nickname,
    cover: post.images.length > 0 ? post.images[0] : ''
  }
  
  // 跳转到举报页面
  router.push({
    name: 'report',
    params: {
      noteInfo: encodeURIComponent(JSON.stringify(noteInfo))
    }
  })
}

const actions = [
  {
    name: "举报",
    callback: null // 会在longPress中设置
  }
]

const title = "操作帖子"

const handleLongPress = (post) => {
  console.log('长按帖子:', post.id)
  // 设置举报回调
  actions[0].callback = () => handleReport(post)
  // 打开操作表
  events.emit('openActionSheet', actions, title)
}

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
  isRefreshing.value = true
  await loadPosts(true)
  uni.stopPullDownRefresh()
})

// 上拉加载更多
onReachBottom(async () => {
  console.log('上拉加载更多')
  if (!hasMore.value || isLoading.value) return
  
  page.value++
  await loadPosts()
})

onMounted(async () => {
  show()
  // 初始加载数据
  await loadPosts(true)
})
</script>

<template>
  <layout>
    <template #left>
      <view @tap="gotoSearchPage">
        <WdIcon name="search" size="32rpx" color="#666"/>
      </view>
    </template>
    <template #center>
      <tab-group
          :tabs="communityTabs"
          v-model:active-tab="activeTab"
          @change="handleTabChange"
      />
    </template>

    <view class="bg-#f8f8f8">
      <!-- 内容区域 -->
      <view class="pb-30rpx">
        <!-- 社区动态列表 -->
        <view class="p-20rpx">
          <!-- 加载中提示 -->
          <view v-if="isLoading && posts.length === 0" class="flex justify-center items-center py-100rpx">
            <text class="text-28rpx text-gray-400">加载中...</text>
          </view>
          
          <!-- 空数据提示 -->
          <view v-else-if="!isLoading && posts.length === 0" class="flex flex-col items-center justify-center py-100rpx">
            <WdIcon name="inbox" size="80rpx" color="#ddd" />
            <text class="mt-20rpx text-28rpx text-gray-400">暂无内容</text>
          </view>
          
          <!-- 帖子列表 -->
          <view 
            v-for="post in posts" 
            :key="post.id" 
            class="relative mb-20rpx p-30rpx bg-white rounded-16rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
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
    </view>

    <custom-tab-bar/>
  </layout>
</template>

<style>
/* 空样式表，所有样式已使用UnoCSS原子类 */
</style>