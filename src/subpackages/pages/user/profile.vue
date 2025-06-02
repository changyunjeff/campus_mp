<script setup>
import Layout from '@/layout/index'
import { ref, reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { UserApi } from '@/api/user'
import { CommunityApi } from '@/api/community'
import User from '@/static/images/user.png'
import { formatTime } from '@/utils/time'
import { throttle } from 'lodash'

const router = useRouter()

// 用户ID
const userId = ref('')
const isMyProfile = ref(false)

// 用户信息
const userInfo = reactive({
  id: '',
  nickname: '',
  avatar: '',
  introduction: '',
  gender: 'unknown',
  level: 1,
  followingCount: 0,
  followerCount: 0,
  postCount: 0,
  isFollowed: false
})

// 用户帖子
const posts = ref([])
const postPage = ref(1)
const postPageSize = ref(20)
const postTotal = ref(0)
const isLoadingPosts = ref(false)
const hasMorePosts = ref(true)

// 当前选中的标签
const activeTab = ref('posts')

// 加载用户信息
const loadUserInfo = async () => {
  try {
    const res = await UserApi.getUserProfile(userId.value)
    
    Object.assign(userInfo, {
      id: res.data.id || res.data.open_id,
      nickname: res.data.nickname || '用户' + (res.data.id || res.data.open_id).slice(-6),
      avatar: res.data.avatar || User,
      introduction: res.data.introduction || '这个人很懒，什么都没有留下',
      gender: res.data.gender || 'unknown',
      level: res.data.level || 1,
      followingCount: res.data.following_count || 0,
      followerCount: res.data.follower_count || 0,
      postCount: res.data.post_count || 0,
      isFollowed: res.data.is_followed || false
    })
    
    // 判断是否是自己的资料
    const myId = uni.getStorageSync('user_id')
    isMyProfile.value = myId === userId.value
  } catch (error) {
    console.error('加载用户信息失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  }
}

// 加载用户帖子
const loadUserPosts = async (loadMore = false) => {
  if (isLoadingPosts.value) return
  
  isLoadingPosts.value = true
  
  try {
    // TODO: 后端需要添加获取用户帖子的接口
    // 暂时使用模拟数据
    const mockPosts = [
      {
        id: '1',
        content: '今天天气真好，适合出去走走',
        images: [User],
        publishTime: Date.now() - 3600000,
        stats: {
          likes: 12,
          comments: 3,
          favorites: 2
        }
      }
    ]
    
    if (loadMore) {
      posts.value.push(...mockPosts)
      postPage.value++
    } else {
      posts.value = mockPosts
      postPage.value = 1
    }
    
    postTotal.value = 1
    hasMorePosts.value = posts.value.length < postTotal.value
  } catch (error) {
    console.error('加载用户帖子失败:', error)
  } finally {
    isLoadingPosts.value = false
  }
}

// 关注/取消关注
const toggleFollow = throttle(async () => {
  try {
    if (userInfo.isFollowed) {
      await UserApi.unfollowUser(userId.value)
      userInfo.followerCount--
    } else {
      await UserApi.followUser(userId.value)
      userInfo.followerCount++
    }
    
    userInfo.isFollowed = !userInfo.isFollowed
    
    uni.showToast({
      title: userInfo.isFollowed ? '已关注' : '已取消关注',
      icon: 'none'
    })
  } catch (error) {
    console.error('关注操作失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}, 1000)

// 发送私信
const sendMessage = () => {
  router.push({
    name: 'private_chat',
    query: {
      userId: userId.value,
      nickname: userInfo.nickname
    }
  })
}

// 编辑资料
const editProfile = () => {
  router.push({
    name: 'edit-profile'
  })
}

// 查看关注列表
const viewFollowingList = () => {
  router.push({
    name: 'following-list',
    query: {
      userId: userId.value
    }
  })
}

// 查看粉丝列表
const viewFollowerList = () => {
  router.push({
    name: 'follower-list',
    query: {
      userId: userId.value
    }
  })
}

// 查看帖子详情
const viewPostDetail = (postId) => {
  router.push({
    name: 'post_detail',
    query: {
      id: postId
    }
  })
}

// 返回
const goBack = () => {
  uni.navigateBack()
}

onLoad((options) => {
  userId.value = options.userId || ''
  
  if (userId.value) {
    loadUserInfo()
    loadUserPosts()
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
  <layout>
    <template #left>
      <view @tap="goBack" class="p-16rpx">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>
    
    <template #center>
      <text class="text-32rpx font-medium text-#333">{{ userInfo.nickname }}</text>
    </template>
    
    <template #right>
      <view v-if="!isMyProfile" class="p-16rpx">
        <WdIcon name="more-horizontal" size="40rpx" color="#333"/>
      </view>
    </template>
    
    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 用户信息卡片 -->
      <view class="bg-white p-30rpx">
        <!-- 头像和基本信息 -->
        <view class="flex items-center mb-30rpx">
          <image 
            :src="userInfo.avatar" 
            class="w-120rpx h-120rpx rounded-full mr-30rpx border-4rpx border-gray-100"
            mode="aspectFill"
          />
          
          <view class="flex-1">
            <view class="flex items-center mb-10rpx">
              <text class="text-36rpx font-bold text-#333 mr-16rpx">{{ userInfo.nickname }}</text>
              <view v-if="userInfo.gender !== 'unknown'" 
                    class="flex items-center justify-center w-40rpx h-40rpx" 
                    :class="userInfo.gender === 'male' ? 'text-blue-500' : 'text-pink-500'">
                <WdIcon 
                  :name="userInfo.gender === 'male' ? 'gender-male' : 'gender-female'" 
                  size="28" 
                  :custom-style="userInfo.gender === 'male' ? 'color:#3b82f6' : 'color:#ec4899'"
                />
              </view>
              <view class="ml-16rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-24rpx px-16rpx py-4rpx rounded-full">
                Lv{{ userInfo.level }}
              </view>
            </view>
            
            <text class="text-28rpx text-gray-500 line-clamp-2">{{ userInfo.introduction }}</text>
          </view>
        </view>
        
        <!-- 统计信息 -->
        <view class="flex justify-around mb-30rpx">
          <view class="flex flex-col items-center" @tap="viewFollowingList">
            <text class="text-36rpx font-bold text-#333">{{ userInfo.followingCount }}</text>
            <text class="text-24rpx text-gray-500 mt-4rpx">关注</text>
          </view>
          <view class="flex flex-col items-center" @tap="viewFollowerList">
            <text class="text-36rpx font-bold text-#333">{{ userInfo.followerCount }}</text>
            <text class="text-24rpx text-gray-500 mt-4rpx">粉丝</text>
          </view>
          <view class="flex flex-col items-center">
            <text class="text-36rpx font-bold text-#333">{{ userInfo.postCount }}</text>
            <text class="text-24rpx text-gray-500 mt-4rpx">帖子</text>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="flex gap-20rpx">
          <button 
            v-if="isMyProfile"
            class="flex-1 h-80rpx rounded-full bg-gray-100 text-30rpx text-#333 flex items-center justify-center"
            @tap="editProfile"
          >
            编辑资料
          </button>
          
          <template v-else>
            <button 
              class="flex-1 h-80rpx rounded-full text-30rpx flex items-center justify-center transition-all"
              :class="userInfo.isFollowed ? 'bg-gray-100 text-gray-500' : 'bg-blue-500 text-white'"
              @tap="toggleFollow"
            >
              {{ userInfo.isFollowed ? '已关注' : '+ 关注' }}
            </button>
            
            <button 
              class="flex-1 h-80rpx rounded-full bg-gray-100 text-30rpx text-#333 flex items-center justify-center"
              @tap="sendMessage"
            >
              私信
            </button>
          </template>
        </view>
      </view>
      
      <!-- 标签栏 -->
      <view class="bg-white mt-20rpx">
        <view class="flex border-b border-gray-100">
          <view 
            class="flex-1 py-30rpx flex items-center justify-center relative"
            :class="activeTab === 'posts' ? 'text-blue-500' : 'text-gray-500'"
            @tap="activeTab = 'posts'"
          >
            <text class="text-30rpx font-medium">帖子</text>
            <view v-if="activeTab === 'posts'" 
                  class="absolute bottom-0 left-50% transform -translate-x-50% w-60rpx h-6rpx bg-blue-500 rounded-full"/>
          </view>
          
          <view 
            class="flex-1 py-30rpx flex items-center justify-center relative"
            :class="activeTab === 'likes' ? 'text-blue-500' : 'text-gray-500'"
            @tap="activeTab = 'likes'"
          >
            <text class="text-30rpx font-medium">喜欢</text>
            <view v-if="activeTab === 'likes'" 
                  class="absolute bottom-0 left-50% transform -translate-x-50% w-60rpx h-6rpx bg-blue-500 rounded-full"/>
          </view>
          
          <view 
            class="flex-1 py-30rpx flex items-center justify-center relative"
            :class="activeTab === 'favorites' ? 'text-blue-500' : 'text-gray-500'"
            @tap="activeTab = 'favorites'"
          >
            <text class="text-30rpx font-medium">收藏</text>
            <view v-if="activeTab === 'favorites'" 
                  class="absolute bottom-0 left-50% transform -translate-x-50% w-60rpx h-6rpx bg-blue-500 rounded-full"/>
          </view>
        </view>
      </view>
      
      <!-- 内容区域 -->
      <view class="p-20rpx">
        <!-- 帖子列表 -->
        <view v-if="activeTab === 'posts'">
          <view v-if="posts.length === 0 && !isLoadingPosts" 
                class="flex flex-col items-center justify-center py-100rpx">
            <WdIcon name="inbox" size="80rpx" color="#ddd" />
            <text class="mt-20rpx text-28rpx text-gray-400">暂无帖子</text>
          </view>
          
          <view v-else class="grid grid-cols-3 gap-10rpx">
            <view 
              v-for="post in posts" 
              :key="post.id"
              class="relative aspect-square bg-gray-100 rounded-12rpx overflow-hidden"
              @tap="viewPostDetail(post.id)"
            >
              <image 
                v-if="post.images && post.images.length > 0"
                :src="post.images[0]" 
                mode="aspectFill"
                class="w-full h-full"
              />
              <view v-else class="w-full h-full flex items-center justify-center p-10rpx">
                <text class="text-24rpx text-gray-500 text-center line-clamp-3">{{ post.content }}</text>
              </view>
              
              <!-- 多图标识 -->
              <view v-if="post.images && post.images.length > 1" 
                    class="absolute top-10rpx right-10rpx bg-black/60 rounded-8rpx px-10rpx py-4rpx">
                <text class="text-20rpx text-white">{{ post.images.length }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 喜欢列表 -->
        <view v-else-if="activeTab === 'likes'" 
              class="flex flex-col items-center justify-center py-100rpx">
          <WdIcon name="heart" size="80rpx" color="#ddd" />
          <text class="mt-20rpx text-28rpx text-gray-400">暂无喜欢的内容</text>
        </view>
        
        <!-- 收藏列表 -->
        <view v-else-if="activeTab === 'favorites'" 
              class="flex flex-col items-center justify-center py-100rpx">
          <WdIcon name="star" size="80rpx" color="#ddd" />
          <text class="mt-20rpx text-28rpx text-gray-400">暂无收藏的内容</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style scoped>
/* 使用UnoCSS原子类 */
</style> 