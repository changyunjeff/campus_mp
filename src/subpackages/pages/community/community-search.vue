<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'uni-mini-router'
import { formatTime } from '@/utils/time'
import { useSearchHistoryStore } from '@/subpackages/pinia/community/history-search'
import User from '/static/images/user.png'
import events from '@/utils/events'
import { throttle } from 'lodash'
import {CommunityApi} from "@/api/community";
// 引入匿名相关组件
import AuthorInfo from '@/components/AuthorInfo.vue'

// 路由
const router = useRouter()

// 使用搜索历史store
const searchHistoryStore = useSearchHistoryStore()

// 搜索关键词
const searchKeyword = ref('')
// 搜索结果
const searchResults = ref([])
// 是否显示搜索结果
const showResults = ref(false)
// 是否正在搜索中
const isSearching = ref(false)
// 是否无搜索结果
const noResults = ref(false)

// 控制自动聚焦
const autoFocus = ref(true)

// scroll-view 相关状态
const refresherTriggered = ref(false)
const scrollTop = ref(0)
const refresherEnabled = ref(true)

// 分页相关
const hasMore = ref(false)
const currentPage = ref(1)
const totalResults = ref(0)

// 防抖和初始化控制
const isInitialized = ref(false)
const searchDebounceTimer = ref(null)

// 初始化历史记录
onMounted(() => {
  console.log('🚀 页面初始化')
  searchHistoryStore.initHistory()
  // 确保初始状态正确
  isInitialized.value = false
  hasMore.value = false
  searchResults.value = []
  currentPage.value = 1
})

const pageSize = ref(10)

// 搜索处理
const handleSearch = async (loadMore = false) => {
  // 处理参数类型：如果传入的是事件对象，则按新搜索处理
  const isLoadMore = typeof loadMore === 'boolean' ? loadMore : false
  
  console.log('🔍 handleSearch 被调用:', {
    originalLoadMore: loadMore,
    processedLoadMore: isLoadMore,
    searchKeyword: searchKeyword.value,
    currentPage: currentPage.value,
    hasMore: hasMore.value
  })
  
  if (!searchKeyword.value.trim()) {
    uni.showToast({
      title: '请输入搜索内容',
      icon: 'none'
    })
    return
  }
  
  // 添加到搜索历史
  if (!isLoadMore) {
    console.log('🆕 新搜索，重置状态')
    searchHistoryStore.addHistory(searchKeyword.value)
    // 重置分页状态
    hasMore.value = false
    currentPage.value = 1
    totalResults.value = 0
  } else {
    console.log('📄 加载更多页面')
  }
  
  // 显示搜索中状态
  isSearching.value = true
  showResults.value = true
  noResults.value = false
  
  // 设置页码
  const page = isLoadMore ? currentPage.value + 1 : 1
  console.log('📖 请求页码:', page)
  
  // 搜索请求
  try {
    const res = await CommunityApi.searchPosts(searchKeyword.value, page, pageSize.value)
    console.debug('搜索结果：', res)
    
    if (isLoadMore) {
      searchResults.value.push(...(res.list || []))
      currentPage.value = page
    } else {
      searchResults.value = res.list || []
      currentPage.value = 1
      // 首次搜索成功后标记为已初始化
      isInitialized.value = true
    }
    
    totalResults.value = res.total || 0
    hasMore.value = (res.list?.length || 0) >= pageSize.value && searchResults.value.length < totalResults.value
    
    console.log('✅ 搜索完成:', {
      page,
      isLoadMore,
      resultsCount: searchResults.value.length,
      hasMore: hasMore.value,
      isInitialized: isInitialized.value
    })
    
    // 检查是否无结果
    noResults.value = searchResults.value.length === 0
  } catch (e) {
    console.error(e)
    if (!isLoadMore) {
      searchResults.value = []
      noResults.value = true
    }
  } finally {
    isSearching.value = false
  }
}

// 清空搜索关键词
const clearSearchKeyword = () => {
  console.log('🧹 清空搜索关键词')
  searchKeyword.value = ''
  showResults.value = false
  // 重置所有搜索相关状态
  searchResults.value = []
  hasMore.value = false
  currentPage.value = 1
  totalResults.value = 0
  isSearching.value = false
  noResults.value = false
  isInitialized.value = false // 重置初始化状态
  
  // 清除防抖定时器
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
    searchDebounceTimer.value = null
  }
}

// 点击历史记录项
const onHistoryItemClick = (keyword) => {
  searchKeyword.value = keyword
  handleSearch(false)
}

// 刷新数据
const refreshData = async () => {
  if (searchKeyword.value.trim()) {
    await handleSearch(false)
  }
}

// 加载更多数据
const loadMoreData = async () => {
  // 严格判断：必须已初始化、有搜索关键词、不在搜索中、有更多数据、且已有搜索结果
  if (!isInitialized.value || !searchKeyword.value.trim() || isSearching.value || !hasMore.value || searchResults.value.length === 0) {
    console.log('🚫 loadMoreData: 条件不满足，跳过加载', {
      isInitialized: isInitialized.value,
      hasSearchKeyword: !!searchKeyword.value.trim(),
      isSearching: isSearching.value,
      hasMore: hasMore.value,
      hasResults: searchResults.value.length > 0
    })
    return
  }
  
  // 防抖：清除之前的定时器
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }
  
  // 添加短暂延迟防止快速连续调用
  searchDebounceTimer.value = setTimeout(async () => {
    console.log('📖 loadMoreData: 开始加载更多数据')
    await handleSearch(true)
  }, 100)
}

// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新搜索结果')
  refresherTriggered.value = true
  await refreshData()
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('🔽 触底加载触发 - 当前状态:', {
    hasMore: hasMore.value,
    isSearching: isSearching.value,
    searchResultsLength: searchResults.value.length,
    searchKeyword: searchKeyword.value,
    isInitialized: isInitialized.value
  })
  
  // 添加短暂延迟确保不是初始渲染触发的
  setTimeout(() => {
    loadMoreData()
  }, 50)
}

// 滚动事件处理
const onScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
  // 当滚动位置大于50rpx时禁用下拉刷新，避免滚动冲突
  refresherEnabled.value = scrollTop.value <= 50
}

// 删除单个历史记录
const deleteHistoryItem = (e, keyword) => {
  e.stopPropagation()
  searchHistoryStore.removeHistory(keyword)
}

// 清空所有历史记录
const clearAllHistory = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清空所有搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchHistoryStore.clearHistory()
      }
    }
  })
}

// 返回上一页
const goBack = () => {
  router.back()
}

// 处理点赞
const handleLike = throttle((post) => {
  if (post.isLiked) {
    post.stats.likes--
  } else {
    post.stats.likes++
  }
  CommunityApi.likePost(post.id)
  post.isLiked = !post.isLiked
}, 1000)

// 处理收藏
const handleFavorite = throttle((post) => {
  if (post.isFavorited) {
    post.stats.favorites--
  } else {
    post.stats.favorites++
  }
  CommunityApi.favoritePost(post.id)
  post.isFavorited = !post.isFavorited
}, 1000)

// 处理评论
const handleComment = throttle((post) => {
  console.log('评论帖子:', post)
  router.push({
    name: 'post_detail',
    params: {
      id: post.id,
      focus: 'comment'
    }
  })
}, 1000)

// 查看用户信息
const viewUserProfile = throttle((userId) => {
  console.log('查看用户资料:', userId)
  router.push({
    name: 'other_index',
    params: {
      id: userId
    }
  })
}, 1000)

// 查看帖子详情
const viewPostDetail = throttle((postId) => {
  console.log('查看帖子详情:', postId)
  // 跳转到帖子详情页
  router.push({
    name: 'post_detail',
    params: {
      id: postId
    }
  })
}, 1000)

// 查看图片大图
const viewImage = throttle((post, index) => {
  console.log('查看图片:', post.id, index)
}, 1000)

// 长按操作
const handleLongPress = (post) => {
  console.log('长按帖子:', post.id)
  const actions = [{ name: "举报" }]
  events.emit('openActionSheet', actions, "操作帖子")
}
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="goBack">
        <WdIcon name="arrow-left" size="40rpx" color="#333" />
      </view>
    </template>
    
    <template #center>
      <!-- 搜索框 -->
      <view class="w-full flex items-center px-20rpx">
        <view class="relative flex items-center bg-white rounded-full p-10rpx px-24rpx border border-gray-200 flex-1">
          <WdIcon name="search" size="36rpx" color="#999"/>
          <input
            id="search-input"
            type="text"
            v-model="searchKeyword"
            class="flex-1 mx-16rpx text-28rpx text-#333 placeholder-gray-400"
            placeholder="搜索社区内容"
            confirm-type="search"
            :focus="autoFocus"
            @confirm="() => handleSearch(false)"
          />
          <view v-if="searchKeyword" class="p-4rpx" @tap="clearSearchKeyword">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>
        <view class="ml-20rpx" @tap="() => handleSearch(false)">
          <text class="text-28rpx text-#3b82f6 font-medium">搜索</text>
        </view>
      </view>
    </template>

    <view class="flex-1 bg-#f8f8f8">
      <!-- 历史搜索区域 -->
      <view v-if="!showResults && searchHistoryStore.historyList.length > 0" class="p-30rpx">
        <view class="flex justify-between items-center mb-20rpx">
          <text class="text-28rpx text-#333 font-medium">搜索历史</text>
          <view class="p-10rpx" @tap="clearAllHistory">
            <WdIcon name="delete" size="36rpx" color="#999"/>
          </view>
        </view>
        
        <view class="flex flex-wrap gap-16rpx">
          <view 
            v-for="(item, index) in searchHistoryStore.historyList" 
            :key="index" 
            class="flex items-center bg-white rounded-full px-24rpx py-12rpx transition-all duration-300 active:bg-gray-100"
            @tap="onHistoryItemClick(item)"
          >
            <text class="text-26rpx text-#666 mr-10rpx">{{ item }}</text>
            <view class="p-4rpx" @tap.stop="deleteHistoryItem($event, item)">
              <WdIcon name="close" size="24rpx" color="#999"/>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 搜索结果区域 -->
      <scroll-view 
        v-if="showResults"
        scroll-y 
        :refresher-enabled="refresherEnabled"
        :refresher-triggered="refresherTriggered"
        @refresherrefresh="onRefresherRefresh"
        @scrolltolower="onScrollToLower"
        @scroll="onScroll"
        lower-threshold="100"
        style="height: calc(100vh - 160rpx);"
      >
        <view class="p-20rpx">
        <!-- 加载中状态 -->
        <view v-if="isSearching" class="flex flex-col items-center justify-center py-60rpx">
          <WdLoading color="#3b82f6" size="60rpx" />
          <text class="text-28rpx text-gray-400 mt-20rpx">正在搜索中...</text>
        </view>
        
        <!-- 无结果提示 -->
        <view v-else-if="noResults" class="flex flex-col items-center justify-center py-120rpx">
          <WdIcon name="info-o" size="80rpx" color="#d1d5db" />
          <text class="text-28rpx text-gray-400 mt-20rpx">没有找到相关内容</text>
          <text class="text-24rpx text-gray-400 mt-10rpx">换个关键词试试吧</text>
        </view>
        
        <!-- 搜索结果列表 -->
        <view v-else>
          <view class="mb-20rpx">
            <text class="text-26rpx text-gray-500">找到 {{ searchResults.length }} 条相关内容</text>
          </view>
          
          <!-- 社区动态列表 -->
          <view 
            v-for="post in searchResults" 
            :key="post.id" 
            class="relative mb-20rpx p-30rpx bg-white rounded-16rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
            @tap="viewPostDetail(post.id)"
            @longpress="handleLongPress(post)"
          >
            <!-- 帖子头部 - 用户信息和发布时间 -->
            <view class="flex justify-between items-center mb-20rpx">
              <AuthorInfo
                :author="post.author"
                :is-anonymous="post.is_anonymous"
                :publish-time="post.publish_time"
                @click-user="viewUserProfile"
              />
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
                  :name="post.is_liked ? 'heart-fill' : 'heart'"
                  size="20" 
                  :custom-style="post.is_liked ? 'color:#ef4444' : 'color:#666'"
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
                :class="['flex items-center px-20rpx py-10rpx rounded-30rpx transition-all duration-200 active:bg-gray-100', post.is_favorited ? 'active' : '']"
                @tap.stop="handleFavorite(post)"
              >
                <WdIcon 
                  custom-class="iconfont" class-prefix="icon"
                  :name="post.is_favorited ? 'star-fill' : 'star'"
                  size="20" 
                  :custom-style="post.is_favorited ? 'color:#f59e0b' : 'color:#666'"
                />
                <text class="ml-8rpx text-24rpx text-#666" :class="post.is_favorited ? 'font-600' : ''">{{ post.stats.favorites }}</text>
              </view>
            </view>
          </view>
          
          <!-- 加载更多指示器 -->
          <view v-if="isSearching && searchResults.length > 0" class="text-center py-30rpx">
            <text class="text-26rpx text-gray-500">正在加载...</text>
          </view>
          
          <!-- 没有更多数据提示 -->
          <view v-if="!isSearching && !hasMore && searchResults.length > 0" class="text-center py-30rpx">
            <text class="text-26rpx text-gray-400">没有更多数据了</text>
          </view>
        </view>
        </view>
      </scroll-view>
    </view>
  </layout>
</template>

<style scoped>
/* 使用UnoCSS原子类，无需额外CSS */
</style>