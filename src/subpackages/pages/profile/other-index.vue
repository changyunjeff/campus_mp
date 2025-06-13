<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { UserApi } from '@/api/user'
import { CommunityApi } from '@/api/community'
import { formatTime } from '@/utils/time'
import User from '/static/images/user.png'

const router = useRouter()
const toast = useToast()

// 路由参数
const userId = ref('')
const loading = ref(false)
const postsLoading = ref(false)

// 当前Tab
const currentTab = ref(0) // 0: 笔记, 1: 活动

// 用户信息
const userInfo = reactive({
  id: '',
  openid: '',
  avatar: User,
  nickname: '',
  realName: '',
  gender: 'unknown',
  signature: '',
  location: '',
  role: 'student',
  level: 1,
  isFollowed: false,
  isBlocked: false,
  isOnline: false,
  registerTime: 0
})

// 统计数据
const userStats = reactive({
  posts: 0,
  activities: 0,
  follows: 0,
  fans: 0,
  likes: 0
})

// 用户内容
const userPosts = ref([])
const userActivities = ref([])
const hasMorePosts = ref(true)
const hasMoreActivities = ref(true)
const postPage = ref(1)
const activityPage = ref(1)

// 操作状态
const isFollowing = ref(false)
const showMoreActions = ref(false)

// Tab配置
const tabs = [
  { id: 0, label: '笔记', icon: 'edit' },
  { id: 1, label: '活动', icon: 'calendar' }
]

// 模拟用户数据
const mockUserData = {
  id: 'other_user_456', // 确保这个ID与当前用户不同
  openid: 'wx_abcdef123456',
  avatar: '/static/images/user.png',
  nickname: '校园达人小王',
  realName: '王小明',
  gender: 'male',
  signature: '热爱生活，热爱学习，愿与大家分享美好时光 ✨',
  location: '江苏南京',
  role: 'student',
  level: 8,
  isFollowed: false,
  isBlocked: false,
  registerTime: Date.now() - 365 * 24 * 60 * 60 * 1000,
  stats: {
    posts: 42,
    activities: 12,
    follows: 156,
    fans: 238,
    likes: 1024
  }
}

// 模拟用户笔记
const mockPosts = [
  {
    id: '1',
    content: '今天的校园生活真是太充实了！参加了社团活动，结识了很多新朋友。',
    images: ['/static/images/user.png', '/static/images/user.png'],
    publishTime: Date.now() - 2 * 60 * 60 * 1000,
    stats: { likes: 24, comments: 8, shares: 3 },
    isLiked: false
  },
  {
    id: '2',
    content: '图书馆学习打卡 📚 准备期末考试中，大家一起加油！',
    images: ['/static/images/user.png'],
    publishTime: Date.now() - 24 * 60 * 60 * 1000,
    stats: { likes: 18, comments: 5, shares: 2 },
    isLiked: true
  }
]

// 模拟用户活动
const mockActivities = [
  {
    id: '1',
    title: '周末羽毛球友谊赛',
    description: '欢迎羽毛球爱好者参加',
    type: 'sports',
    status: 'published',
    startTime: Date.now() + 3 * 24 * 60 * 60 * 1000,
    participants: 8,
    maxParticipants: 16,
    location: { name: '体育馆羽毛球场' }
  },
  {
    id: '2',
    title: '读书分享交流会',
    description: '分享最近读过的好书',
    type: 'study',
    status: 'ended',
    startTime: Date.now() - 7 * 24 * 60 * 60 * 1000,
    participants: 12,
    maxParticipants: 15,
    location: { name: '图书馆讨论室' }
  }
]

// 获取性别图标
const getGenderIcon = (gender) => {
  return gender === 'male' ? 'gender-male' : gender === 'female' ? 'gender-female' : 'user'
}

// 获取性别颜色
const getGenderColor = (gender) => {
  return gender === 'male' ? '#3b82f6' : gender === 'female' ? '#ec4899' : '#6b7280'
}

// 获取活动状态样式
const getActivityStatusStyle = (status) => {
  const styles = {
    published: { bg: 'bg-blue-100', text: 'text-blue-600', label: '已发布' },
    ongoing: { bg: 'bg-green-100', text: 'text-green-600', label: '进行中' },
    ended: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已结束' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: '已取消' }
  }
  return styles[status] || styles.published
}

// 获取活动类型图标
const getActivityTypeIcon = (type) => {
  const icons = {
    sports: 'football',
    study: 'book',
    entertainment: 'game',
    other: 'more'
  }
  return icons[type] || 'more'
}

const GENDER = {
  1: 'male',
  2: 'female',
  0: 'unknown'
}

const ROLE = {
  0: 'student',
  1: 'teacher',
  2: 'staff'
}

const RELATIONSHIP = {
  0: 'stranger',      // 陌生人
  1: 'following',     // 已关注
  2: 'follower',      // 粉丝
  3: 'mutual'         // 互相关注
}

// 格式化数字
const formatNumber = (num) => {
  if (num < 1000) return num.toString()
  if (num < 10000) return (num / 1000).toFixed(1) + 'K'
  return (num / 10000).toFixed(1) + 'W'
}

// 加载用户信息
const loadUserInfo = async () => {
  loading.value = true
  
  try {
    const res = await UserApi.getUserProfile(userId.value)
    console.debug('获取用户信息成功:', res)

    // 更新用户信息
    userInfo.id = res.open_id
    userInfo.openid = res.open_id
    userInfo.avatar = (res.avatar && res.avatar.length > 0) ? res.avatar[0].url : User
    userInfo.nickname = res.nickname || '未设置昵称'
    userInfo.gender = GENDER[res.gender] || 'unknown'
    userInfo.signature = res.introduction || '这个人很懒，什么都没留下...'
    userInfo.location = res.location || '未设置地区'
    userInfo.role = ROLE[res.role] || 'student'
    userInfo.registerTime = res.created_at
    
    // 根据关系状态设置关注状态
    userInfo.isFollowed = res.relationship === 1 || res.relationship === 3
    userInfo.isBlocked = res.banned_at > 0

    // 更新统计数据
    userStats.follows = res.statistics.following_count || 0
    userStats.fans = res.statistics.followers_count || 0
    userStats.posts = res.statistics.posts_count || 0
    userStats.activities = res.statistics.activities_count || 0
    userStats.likes = res.statistics.likes_count || 0

    // 获取用户的在线信息
    const onlineRes = await UserApi.getOnlineStatus(userId.value)
    console.debug('获取用户在线状态成功:', onlineRes)
    userInfo.isOnline = onlineRes.is_online
    
  } catch (error) {
    console.error('加载用户信息失败:', error)
    toast.show('加载用户信息失败')
  } finally {
    loading.value = false
  }
}

// 加载用户内容
const loadUserContent = async (tab = 0, loadMore = false) => {
  if (tab === 0) {
    // 加载笔记
    postsLoading.value = true
    try {
      const page = loadMore ? postPage.value + 1 : 1
      const res = await CommunityApi.getUserPosts(userId.value, {
        page: page,
        page_size: 10
      })

      console.debug('获取用户笔记成功:', res)
      
      if (loadMore) {
        userPosts.value.push(...res.posts)
        postPage.value = page
      } else {
        userPosts.value = res.posts
        postPage.value = 1
      }
      
      // 更新统计数据
      userStats.posts = res.total || userPosts.value.length
      
      // 检查是否还有更多数据
      hasMorePosts.value = res.posts.length >= 10 && userPosts.value.length < res.total
      
    } catch (error) {
      console.error('加载笔记失败:', error)
      toast.show('加载笔记失败')
      // 如果API调用失败，尝试显示模拟数据
      if (!loadMore) {
        userPosts.value = mockPosts
        hasMorePosts.value = false
        userStats.posts = mockPosts.length
      }
    } finally {
      postsLoading.value = false
    }
  } else {
    // 加载活动 - 暂时使用模拟数据
    postsLoading.value = true
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      if (loadMore) {
        userActivities.value.push(...mockActivities)
        activityPage.value++
      } else {
        userActivities.value = mockActivities
        activityPage.value = 1
      }
      
      userStats.activities = userActivities.value.length
      hasMoreActivities.value = activityPage.value < 3
    } catch (error) {
      console.error('加载活动失败:', error)
    } finally {
      postsLoading.value = false
    }
  }
}

// 切换Tab
const switchTab = (index) => {
  currentTab.value = index
  loadUserContent(index)
}

// 关注/取消关注
const toggleFollow = async () => {
  if (isFollowing.value) return
  
  isFollowing.value = true
  
  try {
    if (userInfo.isFollowed) {
      // 取消关注
      await UserApi.unfollowUser(userId.value)
      userInfo.isFollowed = false
      userStats.fans = Math.max(0, userStats.fans - 1)
      toast.success('已取消关注')
    } else {
      // 关注用户
      await UserApi.followUser(userId.value)
      userInfo.isFollowed = true
      userStats.fans += 1
      toast.success('已关注')
    }
    
  } catch (error) {
    console.error('关注操作失败:', error)
    toast.show('操作失败，请重试')
  } finally {
    isFollowing.value = false
  }
}

// 发起私聊
const startChat = () => {
  router.push({
    name: 'private_chat',
    params: { id: userId.value }
  })
}

// 举报用户
const reportUser = () => {
  uni.showModal({
    title: '举报用户',
    content: `确定要举报用户"${userInfo.nickname}"吗？`,
    success: (res) => {
      if (res.confirm) {
        // 跳转到举报页面
        router.push({
          name: 'report',
          params: {
            type: 'user',
            targetId: userInfo.id,
            targetInfo: JSON.stringify({
              nickname: userInfo.nickname,
              avatar: userInfo.avatar
            })
          }
        })
      }
    }
  })
}

// 拉黑用户
const blockUser = () => {
  uni.showModal({
    title: '拉黑用户',
    content: `确定要拉黑用户"${userInfo.nickname}"吗？拉黑后将不会收到该用户的任何消息。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await UserApi.blockUser(userId.value)
          userInfo.isBlocked = true
          // 如果已关注，取消关注状态
          if (userInfo.isFollowed) {
            userInfo.isFollowed = false
            userStats.fans = Math.max(0, userStats.fans - 1)
          }
          toast.success('已拉黑该用户')
        } catch (error) {
          console.error('拉黑用户失败:', error)
          toast.show('操作失败')
        }
      }
    }
  })
}

// 查看大图
const previewImage = (images, current = 0) => {
  uni.previewImage({
    urls: images,
    current: current
  })
}

// 查看笔记详情
const viewPostDetail = (post) => {
  router.push({
    name: 'post_detail',
    params: { id: post.id }
  })
}

// 查看活动详情
const viewActivityDetail = (activity) => {
  router.push({
    name: 'activity_detail',
    params: { id: activity.id }
  })
}

// 查看关注/粉丝列表
const viewContactList = (type) => {
  const typeMap = {
    follow: '关注',
    fans: '粉丝'
  }
  toast.show(`不能查看用户的${typeMap[type]}列表`)
}

// 更多操作
const handleMoreActions = () => {
  uni.showActionSheet({
    itemList: ['举报用户', '拉黑用户'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          reportUser()
          break
        case 1:
          blockUser()
          break
      }
    }
  })
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    userId.value = options.id
    loadUserInfo()
    loadUserContent(0)
  } else {
    toast.show('参数错误')
    setTimeout(() => {
      router.back()
    }, 1500)
  }
})
</script>

<template>
  <Layout>
    <template #left>
      <view @tap="router.back()" class="p-16rpx active:opacity-60 transition-opacity">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>

    <template #center>
      <view class="text-32rpx font-medium text-#333">{{ userInfo.nickname || "个人主页" }}</view>
    </template>
    
    <template #right>
      <view @tap="handleMoreActions" class="p-16rpx active:opacity-60 transition-opacity">
        <WdIcon name="more" size="40rpx" color="#666"/>
      </view>
    </template>

    <view v-if="loading" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <wd-loading>加载中...</wd-loading>
    </view>

    <view v-else class="min-h-screen bg-gray-50">
      <!-- 用户信息卡片 -->
      <view class="relative">
        <!-- 顶部背景 -->
        <view class="w-full h-300rpx bg-gradient-to-b from-blue-500 to-blue-400 relative">
          <!-- 模糊效果 -->
          <view class="absolute inset-0 bg-white/10 backdrop-blur-sm"></view>
        </view>
        
        <!-- 用户信息卡片 -->
        <view class="px-30rpx" style="margin-top: -120rpx;">
          <view class="bg-white rounded-20rpx shadow-md p-30rpx">
            <!-- 用户基本信息 -->
            <view class="flex items-start mb-30rpx">
              <!-- 头像 -->
              <view class="relative mr-24rpx">
                <image 
                  :src="userInfo.avatar" 
                  class="w-140rpx h-140rpx rounded-full border-4rpx border-white shadow-md"
                  mode="aspectFill"
                />
                <view 
                  class="absolute bottom-0 right-0 w-36rpx h-36rpx bg-white rounded-full flex items-center justify-center shadow-sm"
                  :style="`color: ${getGenderColor(userInfo.gender)}`"
                >
                  <WdIcon 
                    :name="getGenderIcon(userInfo.gender)" 
                    size="24" 
                    :custom-style="`color:${getGenderColor(userInfo.gender)}`"
                  />
                </view>
              </view>
              
              <!-- 用户信息 -->
              <view class="flex-1">
                <view class="flex items-center mb-8rpx">
                  <text class="text-34rpx font-bold text-gray-800 mr-16rpx">{{ userInfo.nickname }}</text>
                  <view class="bg-gradient-to-r from-blue-400 to-blue-500 text-white text-20rpx px-12rpx py-4rpx rounded-full">
                    Lv{{ userInfo.level }}
                  </view>
                </view>
                
                <view class="flex items-center mb-8rpx">
                  <text class="text-24rpx text-gray-500">{{ userInfo.location || '未设置地区' }}</text>
                  <view class="mx-16rpx w-8rpx h-8rpx bg-gray-300 rounded-full"></view>
                  <text class="text-24rpx text-gray-500">{{ userInfo.role === 'student' ? '学生' : userInfo.role === 'teacher' ? '教师' : '校工' }}</text>
                  <view class="mx-16rpx w-8rpx h-8rpx bg-gray-300 rounded-full"></view>
                  <view class="flex items-center gap-6rpx">
                    <view 
                      class="w-12rpx h-12rpx rounded-full"
                      :class="userInfo.isOnline ? 'bg-green-500' : 'bg-gray-400'"
                    ></view>
                    <text class="text-24rpx text-gray-500">{{ userInfo.isOnline ? '在线' : '离线' }}</text>
                  </view>
                </view>
                
                <view class="flex items-center mb-8rpx">
                  <text class="text-22rpx text-gray-400">注册时间：{{ formatTime(userInfo.registerTime) }}</text>
                </view>
                
                <!-- 个性签名 -->
                <view class="mb-20rpx">
                  <text class="text-28rpx text-gray-700 leading-1.5">{{ userInfo.signature || '这个人很懒，什么都没留下...' }}</text>
                </view>
              </view>
            </view>
            
            <!-- 数据统计 -->
            <view class="flex border-t border-gray-100 pt-30rpx mb-30rpx">
              <view class="flex-1 flex flex-col items-center" @tap="viewContactList('follow')">
                <text class="text-32rpx font-bold text-gray-800">{{ formatNumber(userStats.follows) }}</text>
                <text class="text-24rpx text-gray-500 mt-6rpx">关注</text>
              </view>
              <view class="flex-1 flex flex-col items-center" @tap="viewContactList('fans')">
                <text class="text-32rpx font-bold text-gray-800">{{ formatNumber(userStats.fans) }}</text>
                <text class="text-24rpx text-gray-500 mt-6rpx">粉丝</text>
              </view>
              <view class="flex-1 flex flex-col items-center">
                <text class="text-32rpx font-bold text-gray-800">{{ formatNumber(userStats.likes) }}</text>
                <text class="text-24rpx text-gray-500 mt-6rpx">获赞</text>
              </view>
            </view>
            
            <!-- 操作按钮 -->
            <view class="flex gap-20rpx">
              <wd-button 
                v-if="!userInfo.isBlocked"
                type="primary" 
                size="medium" 
                :loading="isFollowing"
                custom-class="flex-1"
                @click="toggleFollow"
              >
                {{ userInfo.isFollowed ? '已关注' : '+ 关注' }}
              </wd-button>
              
              <wd-button 
                v-if="!userInfo.isBlocked"
                size="medium" 
                custom-class="flex-1"
                @click="startChat"
              >
                发消息
              </wd-button>
              
              <view v-if="userInfo.isBlocked" class="flex-1 text-center py-12rpx">
                <text class="text-gray-500">已拉黑该用户</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- Tab导航 -->
      <view class="mx-30rpx mt-40rpx mb-20rpx bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view class="flex">
          <view
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="flex-1 py-24rpx text-center transition-colors relative"
            :class="currentTab === index 
              ? 'text-blue-600' 
              : 'text-gray-600 active:bg-gray-50'"
            @tap="switchTab(index)"
          >
            <view class="flex items-center justify-center gap-8rpx">
              <WdIcon :name="tab.icon" size="20" />
              <text class="text-28rpx font-medium">{{ tab.label }}</text>
              <text class="text-24rpx text-gray-400">
                ({{ index === 0 ? userStats.posts : userStats.activities }})
              </text>
            </view>
            
            <!-- 活跃指示器 -->
            <view 
              v-if="currentTab === index"
              class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-60rpx h-4rpx bg-blue-600 rounded-full"
            ></view>
          </view>
        </view>
      </view>

      <!-- 内容区域 -->
      <view class="px-30rpx pb-60rpx">
        <!-- 笔记列表 -->
        <view v-if="currentTab === 0" class="space-y-20rpx">
          <view v-if="postsLoading && userPosts.length === 0" class="space-y-20rpx">
            <view v-for="i in 3" :key="i" class="bg-white rounded-20rpx p-30rpx animate-pulse">
              <view class="h-32rpx bg-gray-200 rounded mb-20rpx"></view>
              <view class="h-24rpx bg-gray-200 rounded mb-16rpx"></view>
              <view class="h-24rpx bg-gray-200 rounded w-2/3"></view>
            </view>
          </view>

          <view v-else>
            <view
              v-for="post in userPosts"
              :key="post.id"
              class="bg-white rounded-20rpx shadow-sm p-30rpx active:shadow-md transition-all duration-200"
              @tap="viewPostDetail(post)"
            >
              <!-- 内容 -->
              <view class="mb-20rpx">
                <text class="text-30rpx text-gray-800 leading-relaxed">{{ post.content }}</text>
              </view>
              
              <!-- 图片 -->
              <view v-if="post.images && post.images.length > 0" class="mb-20rpx">
                <view class="grid gap-10rpx" :class="{
                  'grid-cols-1': post.images.length === 1,
                  'grid-cols-2': post.images.length === 2,
                  'grid-cols-3': post.images.length >= 3
                }">
                  <image
                    v-for="(img, index) in post.images"
                    :key="index"
                    :src="img"
                    class="w-full rounded-12rpx"
                    :class="post.images.length === 1 ? 'h-400rpx' : 'h-200rpx'"
                    mode="aspectFill"
                    @tap.stop="previewImage(post.images, index)"
                  />
                </view>
              </view>
              
              <!-- 统计和时间 -->
              <view class="flex items-center justify-between text-gray-500 text-24rpx">
                <text>{{ formatTime(post.publishTime) }}</text>
                <view class="flex items-center gap-30rpx">
                  <view class="flex items-center gap-8rpx">
                    <WdIcon name="heart" size="24rpx" />
                    <text>{{ post.stats.likes }}</text>
                  </view>
                  <view class="flex items-center gap-8rpx">
                    <WdIcon name="chat1" size="24rpx" />
                    <text>{{ post.stats.comments }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="!postsLoading && userPosts.length === 0" class="text-center py-60rpx">
            <WdIcon name="edit" size="80rpx" color="#ddd" />
            <text class="text-gray-400 block mt-20rpx">还没有发布过笔记</text>
          </view>
        </view>

        <!-- 活动列表 -->
        <view v-if="currentTab === 1" class="space-y-20rpx">
          <view v-if="postsLoading && userActivities.length === 0" class="space-y-20rpx">
            <view v-for="i in 3" :key="i" class="bg-white rounded-20rpx p-30rpx animate-pulse">
              <view class="h-32rpx bg-gray-200 rounded mb-20rpx"></view>
              <view class="h-24rpx bg-gray-200 rounded mb-16rpx"></view>
              <view class="h-24rpx bg-gray-200 rounded w-2/3"></view>
            </view>
          </view>

          <view v-else>
            <view
              v-for="activity in userActivities"
              :key="activity.id"
              class="bg-white rounded-20rpx shadow-sm p-30rpx active:shadow-md transition-all duration-200"
              @tap="viewActivityDetail(activity)"
            >
              <!-- 活动头部 -->
              <view class="flex items-start justify-between mb-20rpx">
                <view class="flex-1">
                  <view class="flex items-center gap-12rpx mb-10rpx">
                    <WdIcon :name="getActivityTypeIcon(activity.type)" size="20" color="#666" />
                    <text class="text-32rpx font-medium text-gray-800">{{ activity.title }}</text>
                  </view>
                  <text class="text-26rpx text-gray-600 leading-relaxed">{{ activity.description }}</text>
                </view>
                
                <view 
                  class="px-12rpx py-6rpx rounded text-22rpx ml-20rpx"
                  :class="[getActivityStatusStyle(activity.status).bg, getActivityStatusStyle(activity.status).text]"
                >
                  {{ getActivityStatusStyle(activity.status).label }}
                </view>
              </view>
              
              <!-- 活动信息 -->
              <view class="space-y-12rpx mb-20rpx">
                <view class="flex items-center gap-12rpx">
                  <WdIcon name="time" size="20" color="#f59e0b" />
                  <text class="text-26rpx text-gray-600">{{ formatTime(activity.startTime) }}</text>
                </view>
                <view class="flex items-center gap-12rpx">
                  <WdIcon name="location" size="20" color="#f59e0b" />
                  <text class="text-26rpx text-gray-600">{{ activity.location.name }}</text>
                </view>
                <view class="flex items-center gap-12rpx">
                  <WdIcon name="usergroup" size="20" color="#666" />
                  <text class="text-26rpx text-gray-600">{{ activity.participants }}/{{ activity.maxParticipants }}人</text>
                </view>
              </view>
            </view>
          </view>
          
          <!-- 空状态 -->
          <view v-if="!postsLoading && userActivities.length === 0" class="text-center py-60rpx">
            <WdIcon name="calendar" size="80rpx" color="#ddd" />
            <text class="text-gray-400 block mt-20rpx">还没有发布过活动</text>
          </view>
        </view>
      </view>
    </view>
  </Layout>
</template>

<style scoped lang="scss">
/* 动画效果 */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: .5;
  }
}

/* 渐变背景 */
.bg-gradient-to-b {
  background: linear-gradient(to bottom, var(--tw-gradient-stops));
}

.from-blue-500 {
  --tw-gradient-from: #3b82f6;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0));
}

.to-blue-400 {
  --tw-gradient-to: #60a5fa;
}

.bg-gradient-to-r {
  background: linear-gradient(to right, var(--tw-gradient-stops));
}

.from-blue-400 {
  --tw-gradient-from: #60a5fa;
  --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(96, 165, 250, 0));
}

.to-blue-500 {
  --tw-gradient-to: #3b82f6;
}
</style>