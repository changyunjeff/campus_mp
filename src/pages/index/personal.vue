<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { onShow } from '@dcloudio/uni-app'
import User from '/static/images/user.png'

const router = useRouter()
const { show } = useTabbar()

// 用户信息
const userInfo = reactive({
  avatar: User,
  nickname: 'みぞきたろう',
  userId: '427492207',
  location: '江苏',
  gender: 'male', // 'male' 或 'female'
  signature: '咔咔咔咔',
  isFollowed: false
})

// 统计数据
const stats = reactive({
  follows: 72,
  fans: 30,
  likes: 5
})

// 入口项
const entrances = [
  {
    id: 1,
    title: '我的社区动态',
    icon: 'message-square',
    color: '#3b82f6',
    route: 'community_personal_center'
  },
  {
    id: 2,
    title: '我的闲置商品',
    icon: 'shopping-bag',
    color: '#10b981',
    route: 'goods_personal_center'
  },
  {
    id: 3,
    title: '我的活动',
    icon: 'calendar',
    color: '#f59e0b',
    route: 'my_activities'
  }
]

// 检查并加载本地存储的头像
const checkLocalAvatar = () => {
  const localAvatar = uni.getStorageSync('userAvatar')
  if (localAvatar) {
    userInfo.avatar = localAvatar
  }
}

// 跳转到编辑资料页面
const goToEditProfile = () => {
  router.push({
    name: 'edit_profile'
  })
}

// 跳转到入口页面
const goToEntrance = (route) => {
  router.push({
    name: route
  })
}

// 处理头像点击
const handleAvatarClick = () => {
  uni.showActionSheet({
    itemList: ['预览', '编辑'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 预览头像
        uni.previewImage({
          urls: [userInfo.avatar],
          current: userInfo.avatar
        })
      } else if (res.tapIndex === 1) {
        // 编辑头像
        chooseImage()
      }
    }
  })
}

// 选择图片
const chooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('选择的图片路径:', tempFilePath)
      
      // 保存到本地临时变量，避免URL传递问题
      uni.setStorageSync('tempAvatarPath', tempFilePath)
      
      // 跳转到裁剪页面
      router.push({
        name: 'choose_avatar'
      })
    }
  })
}

const popupLeftDialog = () => {
    
}

onMounted(() => {
  show()
  // 初始加载检查本地头像
  checkLocalAvatar()
})

// 每次页面显示时检查头像更新
onShow(() => {
  checkLocalAvatar()
})
</script>

<template>
  <layout>
    <template #left>
        <WdIcon name="view-list" size="32rpx" color="#999" @tap="popupLeftDialog"></WdIcon>
    </template>
    <!-- 顶部背景和个人信息 -->
    <view class="relative">
      <!-- 顶部背景 -->
      <view class="w-full h-400rpx bg-gradient-to-b from-blue-500 to-blue-400 relative">
        <!-- 模糊效果 -->
        <view class="absolute inset-0 bg-white/10 backdrop-blur-sm"></view>
      </view>
      
      <!-- 个人信息卡片 -->
      <view class="absolute w-full px-30rpx" style="top: 180rpx;">
        <view class="bg-white rounded-20rpx shadow-md p-30rpx">
          <!-- 用户基本信息 -->
          <view class="flex items-start">
            <!-- 头像 -->
            <view class="relative mr-24rpx">
              <image 
                :src="userInfo.avatar" 
                class="w-140rpx h-140rpx rounded-full border-4rpx border-white shadow-md active:opacity-80"
                mode="aspectFill"
                @tap="handleAvatarClick"
              />
              <view 
                class="absolute bottom-0 right-0 w-36rpx h-36rpx bg-white rounded-full flex items-center justify-center shadow-sm"
                :class="userInfo.gender === 'male' ? 'text-blue-500' : 'text-pink-500'"
              >
                <WdIcon 
                  :name="userInfo.gender === 'male' ? 'gender-male' : 'gender-female'" 
                  size="24" 
                  :custom-style="userInfo.gender === 'male' ? 'color:#3b82f6' : 'color:#ec4899'"
                />
              </view>
            </view>
            
            <!-- 用户信息 -->
            <view class="flex-1">
              <view class="flex justify-between items-start">
                <view>
                  <view class="flex items-center">
                    <text class="text-34rpx font-bold text-gray-800 mr-16rpx">{{ userInfo.nickname }}</text>
                    <view class="bg-blue-100 text-blue-500 text-20rpx px-12rpx py-4rpx rounded-full">
                      <text>男</text>
                    </view>
                  </view>
                  <view class="flex items-center mt-8rpx">
                    <text class="text-24rpx text-gray-500">小红书号：{{ userInfo.userId }}</text>
                    <WdIcon name="copy" size="24rpx" color="#999" class="ml-8rpx" />
                  </view>
                  <view class="flex items-center mt-8rpx">
                    <text class="text-24rpx text-gray-500">IP属地：{{ userInfo.location }}</text>
                    <WdIcon name="info-circle" size="24rpx" color="#999" class="ml-8rpx" />
                  </view>
                </view>
                
                <!-- 编辑资料按钮 -->
                <view 
                  class="px-24rpx py-12rpx border border-gray-300 rounded-full text-26rpx text-gray-700"
                  hover-class="bg-gray-100"
                  @tap="goToEditProfile"
                >
                  编辑资料
                </view>
              </view>
              
              <!-- 个性签名 -->
              <view class="mt-20rpx">
                <text class="text-28rpx text-gray-700 leading-1.5">{{ userInfo.signature }}</text>
              </view>
            </view>
          </view>
          
          <!-- 数据统计 -->
          <view class="flex mt-40rpx border-t border-gray-100 pt-30rpx">
            <view class="flex-1 flex flex-col items-center">
              <text class="text-32rpx font-bold text-gray-800">{{ stats.follows }}</text>
              <text class="text-24rpx text-gray-500 mt-6rpx">关注</text>
            </view>
            <view class="flex-1 flex flex-col items-center border-l border-r border-gray-100">
              <text class="text-32rpx font-bold text-gray-800">{{ stats.fans }}</text>
              <text class="text-24rpx text-gray-500 mt-6rpx">粉丝</text>
            </view>
            <view class="flex-1 flex flex-col items-center">
              <text class="text-32rpx font-bold text-gray-800">{{ stats.likes }}</text>
              <text class="text-24rpx text-gray-500 mt-6rpx">获赞与收藏</text>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 功能入口区域 -->
    <view class="mt-200rpx px-30rpx">
      <view class="bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view 
          v-for="entrance in entrances" 
          :key="entrance.id" 
          class="flex items-center p-30rpx border-b border-gray-100 last:border-b-0"
          hover-class="bg-gray-50"
          @tap="goToEntrance(entrance.route)"
        >
          <view 
            class="w-80rpx h-80rpx rounded-16rpx flex items-center justify-center mr-24rpx"
            :style="`background-color: ${entrance.color}20;`"
          >
            <WdIcon :name="entrance.icon" size="40rpx" :color="entrance.color" />
          </view>
          <text class="flex-1 text-30rpx text-gray-700">{{ entrance.title }}</text>
          <WdIcon name="chevron-right" size="36rpx" color="#ccc" />
        </view>
      </view>
      
      <!-- 其他功能入口 -->
      <view class="bg-white rounded-20rpx shadow-sm overflow-hidden mt-30rpx">
        <view 
          class="flex items-center p-30rpx border-b border-gray-100"
          hover-class="bg-gray-50"
        >
          <view class="w-80rpx h-80rpx rounded-16rpx flex items-center justify-center mr-24rpx bg-purple-100">
            <WdIcon name="settings" size="40rpx" color="#8b5cf6" />
          </view>
          <text class="flex-1 text-30rpx text-gray-700">设置</text>
          <WdIcon name="chevron-right" size="36rpx" color="#ccc" />
        </view>
        
        <view 
          class="flex items-center p-30rpx"
          hover-class="bg-gray-50"
        >
          <view class="w-80rpx h-80rpx rounded-16rpx flex items-center justify-center mr-24rpx bg-red-100">
            <WdIcon name="help-circle" size="40rpx" color="#ef4444" />
          </view>
          <text class="flex-1 text-30rpx text-gray-700">帮助与反馈</text>
          <WdIcon name="chevron-right" size="36rpx" color="#ccc" />
        </view>
      </view>
      
      <!-- 版本信息 -->
      <view class="text-center text-24rpx text-gray-400 mt-60rpx mb-30rpx">
        <text>Campus v1.0.0</text>
      </view>
    </view>
    
    <custom-tab-bar/>
  </layout>
</template>