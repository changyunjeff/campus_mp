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

// 初始化历史记录
onMounted(() => {
  searchHistoryStore.initHistory()
})

const page = ref(1)
const pageSize = ref(10)

// 搜索处理
const handleSearch = async () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({
      title: '请输入搜索内容',
      icon: 'none'
    })
    return
  }
  
  // 添加到搜索历史
  searchHistoryStore.addHistory(searchKeyword.value)
  
  // 显示搜索中状态
  isSearching.value = true
  showResults.value = true
  noResults.value = false
  
  // 搜索请求
  try {
    const res = await CommunityApi.searchPosts(searchKeyword.value, page.value, pageSize.value)
    console.debug('搜索结果：', res)
    searchResults.value = res.list
  } catch (e) {
    console.error(e)
    searchResults.value = []
    noResults.value = true
  } finally {
    isSearching.value = false
  }
}

// 清空搜索关键词
const clearSearchKeyword = () => {
  searchKeyword.value = ''
  showResults.value = false
}

// 点击历史记录项
const onHistoryItemClick = (keyword) => {
  searchKeyword.value = keyword
  handleSearch()
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
            @confirm="handleSearch"
          />
          <view v-if="searchKeyword" class="p-4rpx" @tap="clearSearchKeyword">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>
        <view class="ml-20rpx" @tap="handleSearch">
          <text class="text-28rpx text-#3b82f6 font-medium">搜索</text>
        </view>
      </view>
    </template>

    <view class="flex-1 bg-#f8f8f8 min-h-100vh">
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
      <view v-if="showResults" class="p-20rpx">
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
              <view class="flex items-center" @tap.stop="viewUserProfile(post.author.id)">
                <image class="w-80rpx h-80rpx rounded-full mr-20rpx border-2rpx border-gray-100" :src="post.author.avatar || User" mode="aspectFill"></image>
                <view class="flex flex-col">
                  <view class="flex items-center">
                    <text class="text-28rpx font-600 text-#333 mr-10rpx">{{ post.author.nickname }}</text>
                  </view>
                  <text class="text-24rpx text-gray-400 mt-4rpx">{{ formatTime(post.publish_time) }}</text>
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
        </view>
      </view>
    </view>
  </layout>
</template>

<style scoped>
/* 使用UnoCSS原子类，无需额外CSS */
</style>