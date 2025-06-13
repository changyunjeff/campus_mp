<script setup>
import Layout from '@/layout/index'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { formatTime } from '@/utils/time'
import { CommunityApi } from '@/api/community'
import events from '@/utils/events'
import { throttle } from 'lodash'
import { onLoad, onReachBottom, onPullDownRefresh } from '@dcloudio/uni-app'
import {useUserStore} from "@/pinia/modules/user";
import {useToast} from "@/composables/toast"

const router = useRouter()
const userStore = useUserStore()
const toast = useToast()

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

// scroll-view 相关状态
const refresherTriggered = ref(false)
const scrollTop = ref(0)
const refresherEnabled = ref(true)

// 分页参数
const pagination = reactive({
  published: { page: 1, hasMore: true },
  favorite: { page: 1, hasMore: true },
  liked: { page: 1, hasMore: true }
})

// 数据存储
const postsData = reactive({
  published: [],
  favorite: [],
  liked: []
})

// 获取当前标签的帖子数据
const currentPosts = computed(() => {
  return postsData[activeTab.value] || []
})

// 加载帖子数据
const loadPosts = async (tab, page = 1, isRefresh = false) => {
  console.log("开始加载帖子", tab, page, isRefresh)
  try {
    loading.value = true
    let response = null
    
    switch (tab) {
      case 'published':
        const userId = userStore.openid
        if (userId) {
          response = await CommunityApi.getUserPosts(userId, { page, page_size: 10 })
        }
        break
      case 'favorite':
        response = await CommunityApi.getUserFavoritePosts({ page, page_size: 10 })
        break
      case 'liked':
        response = await CommunityApi.getUserLikedPosts({ page, page_size: 10 })
        break
    }

    if (response) {
      const { posts, page: currentPage, total } = response
      
      if (isRefresh || page === 1) {
        postsData[tab] = posts || []
      } else {
        postsData[tab].push(...(posts || []))
      }

      pagination[tab].page = currentPage || page
      pagination[tab].hasMore = (posts?.length || 0) >= 20 && postsData[tab].length < (total || 0)
      hasMore.value = pagination[tab].hasMore
    } else {
      // 如果没有返回数据，重置为空数组
      if (isRefresh || page === 1) {
        postsData[tab] = []
      }
      pagination[tab].hasMore = false
      hasMore.value = false
    }
  } catch (error) {
    console.error('加载帖子失败:', error)
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

// 处理tab切换
const handleTabChange = throttle(async (tabName) => {
  activeTab.value = tabName
  if (postsData[tabName].length === 0) {
    await loadPosts(tabName, 1, true)
  }
  hasMore.value = pagination[tabName].hasMore
}, 500)

// 处理点赞
const handleLike = throttle(async (post) => {
  try {
    await CommunityApi.likePost(post.id)
    post.isLiked = !post.isLiked
    if (post.isLiked) {
      post.stats.likes++
    } else {
      post.stats.likes--
    }
    toast.show(post.isLiked ? '已点赞' : '已取消点赞')
  } catch (error) {
    console.error('点赞操作失败:', error)
    toast.error('操作失败')
  }
}, 500)

// 处理收藏
const handleFavorite = throttle(async (post) => {
  try {
    await CommunityApi.favoritePost(post.id)
    post.isFavorited = !post.isFavorited
    if (post.isFavorited) {
      post.stats.favorites++
    } else {
      post.stats.favorites--
    }
    toast.show(post.isFavorited ? '已收藏' : '已取消收藏')
  } catch (error) {
    console.error('收藏操作失败:', error)
    toast.error('操作失败')
  }
}, 500)

// 处理评论
const handleComment = throttle((post) => {
  router.push({
    name: 'post_detail',
    params: {
      id: post.id,
      scrollToComments: true
    }
  })
}, 500)

// 查看用户信息
const viewUserProfile = throttle((userId) => {
  console.log('查看用户资料:', userId)
  router.push({
    name: 'other_index',
    params: {
      id: userId,
    }
  })
}, 500)

// 查看帖子详情
const viewPostDetail = throttle((postId) => {
  router.push({
    name: 'post_detail',
    params: {
      id: postId
    }
  })
}, 500)

// 处理举报
const handleReport = (post) => {
  const noteInfo = {
    id: post.id,
    title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
    author: post.author.nickname,
    cover: post.images && post.images.length > 0 ? post.images[0] : ''
  }
  
  router.push({
    name: 'report',
    params: {
      noteInfo: encodeURIComponent(JSON.stringify(noteInfo))
    }
  })
}

// 删除帖子
const deletePost = async (postId) => {
  try {
    await new Promise((resolve, reject) => {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条动态吗？删除后无法恢复。',
        success: function (res) {
          if (res.confirm) {
            resolve()
          } else {
            reject('用户取消')
          }
        }
      })
    })

    await CommunityApi.deletePost(postId)
    
    const index = postsData.published.findIndex(post => post.id === postId)
    if (index !== -1) {
      postsData.published.splice(index, 1)
    }

    toast.show('删除成功')
  } catch (error) {
    if (error !== '用户取消') {
      console.error('删除帖子失败:', error)
      toast.error('删除失败')
    }
  }
}

// 长按帖子处理
const handleLongPress = (post) => {
  console.log('长按帖子:', post.id)
  if (post.isDeleted) return
  
  if (activeTab.value === 'published') {
    const deleteAction = {
      name: "删除",
      color: "#ef4444",
      icon: "delete",
      callback: () => deletePost(post.id)
    }
    events.emit('openActionSheet', [deleteAction], "操作我的帖子")
  } else {
    const actions = [{
      name: "举报",
      callback: () => handleReport(post)
    }]
    events.emit('openActionSheet', actions, "操作帖子")
  }
}

// 查看图片大图
const viewImage = throttle((post, index) => {
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
  try {
    await loadPosts(activeTab.value, 1, true)
  } finally {
    refreshing.value = false
  }
}

// 加载更多数据
const loadMoreData = async () => {
  if (!hasMore.value || loading.value) return
  
  const currentTab = activeTab.value
  const nextPage = pagination[currentTab].page + 1
  await loadPosts(currentTab, nextPage, false)
}

// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新个人中心')
  refresherTriggered.value = true
  await refreshData()
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('触底加载更多帖子')
  await loadMoreData()
}

// 滚动事件处理
const onScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
  // 当滚动位置大于50rpx时禁用下拉刷新，避免滚动冲突
  refresherEnabled.value = scrollTop.value <= 50
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

onLoad(() => {
  console.log('个人中心页面加载完成')
  loadPosts(activeTab.value, 1, true)
})
</script>

<template>
  <layout>
    <template #center>
      <text class="text-32rpx font-bold">个人中心</text>
    </template>

    <view class="bg-#f8f8f8">
      <!-- 标签切换 -->
      <view class="sticky top-0 z-10 bg-white shadow-sm">
        <tab-group
          :tabs="personalTabs"
          v-model:active-tab="activeTab"
          @change="handleTabChange"
        />
      </view>

      <!-- 内容区域 - 使用scroll-view -->
      <scroll-view 
        scroll-y 
        class="h-full"
        :refresher-enabled="refresherEnabled"
        :refresher-triggered="refresherTriggered"
        @refresherrefresh="onRefresherRefresh"
        @scrolltolower="onScrollToLower"
        @scroll="onScroll"
        lower-threshold="100"
        style="height: calc(100vh - 258rpx);"
      >
        <view class="p-20rpx pb-30rpx">
        <!-- 帖子列表 -->
        <template v-if="currentPosts.length > 0">
          <view 
            v-for="(post, index) in currentPosts" 
            :key="post.id || index" 
            class="mb-20rpx"
          >
            <!-- 正常帖子显示 -->
            <view 
              class="relative p-30rpx bg-white rounded-16rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="viewPostDetail(post.id)"
              @longpress="handleLongPress(post)"
            >
              <!-- 帖子头部 - 用户信息和发布时间 -->
              <view class="flex justify-between items-center mb-20rpx">
                <view class="flex items-center" @tap.stop="viewUserProfile(post.author.id)">
                  <image 
                    class="w-80rpx h-80rpx rounded-full mr-20rpx border-2rpx border-gray-100" 
                    :src="post.author.avatar || '/static/images/user.png'" 
                    mode="aspectFill"
                  />
                  <view class="flex flex-col">
                    <text class="text-30rpx font-bold text-#333">{{ post.author.nickname }}</text>
                    <text class="text-24rpx text-#999">{{ formatTime(post.publishTime) }}</text>
                  </view>
                </view>
              </view>

              <!-- 帖子内容 -->
              <view class="mb-20rpx">
                <text class="text-30rpx text-#333 leading-relaxed">{{ post.content }}</text>
              </view>

              <!-- 图片网格 -->
              <view v-if="post.images && post.images.length > 0" class="mb-20rpx">
                <view class="grid grid-cols-3 gap-10rpx">
                  <image
                    v-for="(image, imgIndex) in post.images"
                    :key="imgIndex"
                    :src="image"
                    class="w-full aspect-square rounded-12rpx"
                    mode="aspectFill"
                    @tap.stop="viewImage(post, imgIndex)"
                  />
                </view>
              </view>

              <!-- 位置信息 -->
              <view v-if="post.location.address" class="flex items-center mb-20rpx">
                <text class="iconfont icon-location text-24rpx text-#999 mr-8rpx">📍</text>
                <text class="text-26rpx text-#999">{{ post.location.address }}</text>
              </view>

              <!-- 互动统计和操作按钮 -->
              <view class="flex justify-between items-center pt-20rpx border-t-1rpx border-gray-100">
                <!-- 统计信息 -->
                <view class="flex items-center space-x-30rpx">
                  <text class="text-26rpx text-#999">{{ post.stats.views || 0 }} 浏览</text>
                  <text class="text-26rpx text-#999">{{ post.stats.likes || 0 }} 点赞</text>
                  <text class="text-26rpx text-#999">{{ post.stats.comments || 0 }} 评论</text>
                </view>

                <!-- 操作按钮 -->
                <view class="flex items-center space-x-40rpx">
                  <!-- 点赞按钮 -->
                  <view 
                    class="flex items-center"
                    @tap.stop="handleLike(post)"
                  >
                    <text :style="`color:${post.isLiked ? '#ff6b35' : '#999'}`">👍</text>
                  </view>

                  <!-- 评论按钮 -->
                  <view 
                    class="flex items-center"
                    @tap.stop="handleComment(post)"
                  >
                    <text style="color:#999">💬</text>
                  </view>

                  <!-- 收藏按钮 -->
                  <view 
                    class="flex items-center"
                    @tap.stop="handleFavorite(post)"
                  >
                    <text :style="`color:${post.isFavorited ? '#fbbf24' : '#999'}`">⭐</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 空状态 -->
        <view v-else-if="!loading" class="flex flex-col items-center justify-center py-100rpx">
          <text class="mt-20rpx text-30rpx text-#999">
            {{ activeTab === 'published' ? '还没有发布任何动态' : 
               activeTab === 'favorite' ? '还没有收藏任何动态' : '还没有点赞任何动态' }}
          </text>
          <button 
            v-if="activeTab === 'published'"
            class="mt-30rpx px-40rpx py-20rpx text-28rpx text-white bg-blue-500 rounded-full"
            @tap="router.push({name: 'publish'})"
          >
            去发布动态
          </button>
        </view>

        <!-- 加载更多指示器 -->
        <view v-if="loading && currentPosts.length > 0" class="flex justify-center items-center py-30rpx">
          <text class="ml-10rpx text-26rpx text-#666">正在加载...</text>
        </view>

          <!-- 没有更多数据提示 -->
          <view v-if="!hasMore && currentPosts.length > 0" class="flex justify-center py-30rpx">
            <text class="text-26rpx text-#999">没有更多数据了</text>
          </view>
        </view>
      </scroll-view>
    </view>
  </layout>
</template>

<style scoped>
.grid {
  display: grid;
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.gap-10rpx {
  gap: 10rpx;
}

.aspect-square {
  aspect-ratio: 1;
}

.space-x-30rpx view:not(:first-child) {
  margin-left: 30rpx;
}

.space-x-40rpx view:not(:first-child) {
  margin-left: 40rpx;
}

.leading-relaxed {
  line-height: 1.625;
}
</style>
