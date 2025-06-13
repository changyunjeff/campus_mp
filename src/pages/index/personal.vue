<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'uni-mini-router'
import { onLoad, onShow } from '@dcloudio/uni-app'
import User from '/static/images/user.png'
import { UserApi } from '@/api/user'
import { MediaApi } from '@/api/media'
import {useUserStore} from "@/pinia/modules/user";
import {useToast} from "@/composables/toast";
// import AvatarCropper from '@/components/avatar-cropper.vue'; // 已移除裁剪功能

const router = useRouter()
const { show } = useTabbar()
const userStore = useUserStore()
const toast = useToast()

// 用户信息 - 使用真实数据结构
const userInfo = reactive({
  open_id: '',
  nickname: '',
  gender: 0, // 0: 未知, 1: 男, 2: 女
  avatar: [],
  role: 0,
  introduction: '',
  phone: '',
  email: '',
  location: '',
  relationship: 0,
  chat_settings: {
    set_top: false,
    blocking: false
  },
  statistics: {
    following_count: 0,
    followers_count: 0
  },
  created_at: 0,
  banned_at: 0
})

// 性别显示逻辑
const genderInfo = computed(() => {
  switch(userInfo.gender) {
    case 1:
      return { text: '男', color: '#3b82f6', icon: 'gender-male' }
    case 2:
      return { text: '女', color: '#ec4899', icon: 'gender-female' }
    default:
      return { text: '未知', color: '#6b7280', icon: 'help-circle' }
  }
})

// 头像显示逻辑
const avatarUrl = computed(() => {
  if (userInfo.avatar && userInfo.avatar.length > 0) {
    return userInfo.avatar[0].url // 使用第一个头像
  }
  // 检查本地存储的头像
  const localAvatar = uni.getStorageSync('userAvatar')
  return localAvatar || User
})

// 显示昵称，如果为空则显示默认值
const displayNickname = computed(() => {
  return userInfo.nickname || '用户'
})

// 显示个人介绍
const displayIntroduction = computed(() => {
  return userInfo.introduction || '这个人很懒，什么都没有留下...'
})

// 显示位置信息
const displayLocation = computed(() => {
  return userInfo.location || '未设置'
})

// 显示用户ID
const displayUserId = computed(() => {
  if (userInfo.open_id) {
    return userInfo.open_id
  }
  return '未知'
})

// 获赞数（暂时使用模拟数据，实际需要后端提供）
const likeCount = ref(0)

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
]

// 检查并加载本地存储的头像
const checkLocalAvatar = () => {
  const localAvatar = uni.getStorageSync('userAvatar')
  if (localAvatar) {
    // 触发响应式更新
    userInfo.avatar = [localAvatar]
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

const goToSettings = () => {
  router.push({
    name: 'settings'
  })
}

const goToContact = (type) => {
  router.push({
    name: 'Contact',
    params: {
      type: type
    }
  })
}

// 处理头像点击
const handleAvatarClick = () => {
  uni.showActionSheet({
    itemList: ['预览', '更换头像'],
    success: (res) => {
      if (res.tapIndex === 0) {
        // 预览头像
        uni.previewImage({
          urls: [avatarUrl.value],
          current: avatarUrl.value
        })
      } else if (res.tapIndex === 1) {
        // 直接更换头像（无裁剪）
        chooseAndUploadAvatar()
      }
    }
  })
}

// 选择并上传头像（简化版，无裁剪）
const chooseAndUploadAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'], // 只使用压缩版本
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('选择的图片路径:', tempFilePath)
      
      try {
        // 显示上传进度
        uni.showLoading({
          title: '上传中...',
          mask: true
        })
        
        // 使用设置当前头像的API，确保头像被正确设置
        const uploadResult = await MediaApi.setCurrentUserAvatar({
          file: tempFilePath,
          onProgress: (progress) => {
            console.log('上传进度:', progress)
          }
        })
        
        console.log('头像上传成功:', uploadResult)
        
        if (uploadResult && uploadResult.url && uploadResult.media_id) {
          // 更新本地用户信息中的头像
          userInfo.avatar = [{
            id: uploadResult.media_id,
            url: uploadResult.url,
            object_key: uploadResult.object_key,
            type: uploadResult.type
          }]
          
          // 同时保存到本地存储
          uni.setStorageSync('userAvatar', uploadResult.url)
          
          toast.show('头像更新成功')
          
          // 重新获取用户信息，确保头像信息同步
          console.log('重新获取用户信息以同步头像...')
          await fetchPersonalProfile(false) // 不触发位置更新
        }
        
      } catch (error) {
        console.error('上传头像失败:', error)
        toast.show('头像上传失败，请重试')
      } finally {
        uni.hideLoading()
      }
    },
    fail: () => {
      toast.show('选择图片失败')
    }
  })
}

// 复制用户ID
const copyUserId = () => {
  uni.setClipboardData({
    data: userInfo.open_id,
    success: () => {
      toast.show('用户ID已复制')
    },
    fail: () => {
      toast.show('复制失败')
    }
  })
}

// 这些裁剪相关的函数已经不需要了，已被简化的上传功能替代

const popupLeftDialog = () => {
    
}

// 裁剪功能已移除，现在直接上传原图

const isLoading = ref(false)

// fetchPersonalProfile 获取个人信息
const fetchPersonalProfile = async (autoUpdateLocation = true) => {
  try {
    isLoading.value = true
    uni.showLoading({title:'加载中...'})
    const res = await UserApi.getUserProfile(userStore.openid)
    console.log('个人信息:', res)

    // 使用Object.assign更新reactive对象
    Object.assign(userInfo, {
      open_id: res.open_id || '',
      nickname: res.nickname || '',
      gender: res.gender || 0,
      avatar: res.avatar || [],
      role: res.role || 0,
      introduction: res.introduction || '',
      phone: res.phone || '',
      email: res.email || '',
      location: res.location || '',
      relationship: res.relationship || 0,
      chat_settings: res.chat_settings || {
        set_top: false,
        blocking: false
      },
      statistics: res.statistics || {
        following_count: 0,
        followers_count: 0
      },
      created_at: res.created_at || 0,
      banned_at: res.banned_at || 0
    })

    console.log('更新后的用户信息:', userInfo)
    
    // 如果用户资料中没有头像，尝试从媒体API获取
    if (!userInfo.avatar || userInfo.avatar.length === 0) {
      try {
        const currentAvatar = await MediaApi.getCurrentUserAvatar()
        if (currentAvatar && currentAvatar.url) {
          userInfo.avatar = [currentAvatar]
          console.log('从媒体API获取到头像:', currentAvatar)
          
          // 更新本地存储
          uni.setStorageSync('userAvatar', currentAvatar.url)
        }
      } catch (avatarError) {
        console.log('媒体API中也没有头像，使用默认头像')
      }
    } else {
      // 如果有头像，同步更新本地存储
      if (userInfo.avatar.length > 0 && userInfo.avatar[0].url) {
        uni.setStorageSync('userAvatar', userInfo.avatar[0].url)
        console.log('同步头像到本地存储:', userInfo.avatar[0].url)
      }
    }
    
    // 只在自动模式且没有设置位置信息时，尝试获取IP属地
    if (autoUpdateLocation && (!userInfo.location || userInfo.location === '未设置')) {
      console.log('🔄 自动获取IP属地（首次加载）')
      await updateLocationFromIP()
    }
  } catch(e) {
    console.error('获取个人信息失败:', e)
    toast.show('获取个人信息失败')
  } finally {
    isLoading.value = false
    uni.hideLoading()
  }
}

// 从IP获取属地信息并更新
const updateLocationFromIP = async () => {
  try {
    console.log('尝试获取IP属地信息...')
    
    // 方案1: 优先使用后端IP属地解析（推荐）
    try {
      await updateLocationFromBackend()
    } catch (backendError) {
      console.warn('后端IP属地获取失败，尝试前端方案:', backendError)
      
      // 方案2: 前端获取GPS位置并逆地理编码
      await updateLocationFromGPS()
    }
    
  } catch (error) {
    console.warn('获取IP属地失败:', error)
  }
}

// 从后端API获取IP属地
const updateLocationFromBackend = async () => {
  try {
    // 调用后端API获取当前用户的IP属地
    // 这个API应该已经在用户访问时自动解析了IP属地
    console.log('从后端获取IP属地...')
    
    // 重新获取用户信息，但不触发自动位置更新（避免循环调用）
    await fetchPersonalProfile(false)
    
  } catch (error) {
    throw new Error(`后端IP属地获取失败: ${error.message}`)
  }
}

// 从GPS位置获取属地（备用方案）
const updateLocationFromGPS = async () => {
  try {
    // 使用优化后的位置工具函数
    const { getCurrentProvince } = await import('@/utils/location.js')
    
    console.log('🔍 使用GPS获取位置信息...')
    const province = await getCurrentProvince()
    
    // 更新用户位置信息
    if (province && province !== userInfo.location) {
      await updateUserLocationToServer(province)
    }
    
    return { province }
    
  } catch (error) {
    console.error('GPS获取位置失败:', error)
    throw error
  }
}

// 更新用户位置信息到服务器
const updateUserLocationToServer = async (location) => {
  try {
    console.log('更新用户位置到服务器:', location)
    
    // 调用用户更新接口
    const updateData = {
      location: location
    }
    
    // 调用用户信息更新API
    await UserApi.updateProfile(updateData)
    
    // 更新本地用户信息
    userInfo.location = location
    
    toast.show(`位置已更新为: ${location}`)
    
  } catch (error) {
    console.error('更新位置到服务器失败:', error)
    throw error
  }
}

// 手动更新位置
const updateLocationManually = async () => {
  try {
    uni.showLoading({
      title: '获取位置中...',
      mask: true
    })
    
    console.log('🔄 手动更新位置开始')
    
    // 先尝试使用缓存和智能位置获取
    const { getLocationWithCache } = await import('@/utils/location.js')
    
    try {
      const locationInfo = await getLocationWithCache({
        useCache: false, // 手动更新时不使用缓存
        requestPermission: true,
        showError: false
      })
      
      if (locationInfo && locationInfo.province) {
        console.log('✅ GPS获取位置成功:', locationInfo.province)
        // 优先使用GPS获取的位置
        await updateUserLocationToServer(locationInfo.province)
        return
      }
    } catch (gpsError) {
      console.warn('GPS位置获取失败，回退到后端IP属地方案:', gpsError)
    }
    
    // 回退方案：直接调用后端重新获取用户信息（后端会自动更新IP属地）
    console.log('🔄 使用后端IP属地方案')
    await fetchPersonalProfile(false) // 不自动触发位置更新，避免循环
    
    // 检查是否获取到了新的位置信息
    if (userInfo.location && userInfo.location !== '未设置') {
      toast.show(`位置已更新为: ${userInfo.location}`)
    } else {
      toast.show('暂时无法获取位置信息')
    }
    
  } catch (error) {
    console.error('手动更新位置失败:', error)
    toast.show('位置更新失败，请重试')
  } finally {
    uni.hideLoading()
    console.log('🏁 手动更新位置结束')
  }
}

// 显示位置信息说明
const showLocationInfo = () => {
  uni.showModal({
    title: 'IP属地说明',
    content: 'IP属地信息基于您的网络位置自动获取，显示您当前所在的省份或地区。\n\n如果显示不准确，可以点击"更新"按钮手动刷新位置信息。',
    showCancel: false,
    confirmText: '我知道了'
  })
}

// 每次页面显示时检查头像更新
onShow(async () => {
  // 初始加载检查本地头像
  checkLocalAvatar()
  await fetchPersonalProfile()
})

onMounted(() => {
  show()
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
                :src="avatarUrl" 
                class="w-140rpx h-140rpx rounded-full border-4rpx border-white shadow-md active:opacity-80"
                mode="aspectFill"
                @tap="handleAvatarClick"
              />
              <view 
                class="absolute bottom-0 right-0 w-36rpx h-36rpx bg-white rounded-full flex items-center justify-center shadow-sm"
                :style="`color: ${genderInfo.color}`"
              >
                <WdIcon 
                  :name="genderInfo.icon" 
                  size="24" 
                  :custom-style="`color:${genderInfo.color}`"
                />
              </view>
            </view>
            
            <!-- 用户信息 -->
            <view class="flex-1">
              <view class="flex justify-between items-start">
                <view>
                  <view class="flex items-center">
                    <text class="text-34rpx font-bold text-gray-800 mr-16rpx">{{ displayNickname }}</text>
                    <view 
                      class="text-20rpx px-12rpx py-4rpx rounded-full"
                      :style="`background-color: ${genderInfo.color}20; color: ${genderInfo.color}`"
                    >
                      <text>{{ genderInfo.text }}</text>
                    </view>
                  </view>
                  <view class="flex items-center mt-8rpx">
                    <text class="text-24rpx text-gray-500">用户ID：{{ displayUserId }}</text>
                    <WdIcon name="copy" size="24rpx" color="#999" class="ml-8rpx" @tap="copyUserId" />
                  </view>
                  <view class="flex items-center mt-8rpx">
                    <text class="text-24rpx text-gray-500">IP属地：{{ displayLocation }}</text>
                    <WdIcon name="info-circle" size="24rpx" color="#999" class="ml-8rpx" @tap="showLocationInfo" />
                    <view 
                      class="ml-16rpx px-12rpx py-4rpx text-20rpx bg-blue-50 text-blue-600 rounded-full"
                      @tap="updateLocationManually"
                      hover-class="bg-blue-100"
                    >
                      更新
                    </view>
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
                <text class="text-28rpx text-gray-700 leading-1.5">{{ displayIntroduction }}</text>
              </view>
            </view>
          </view>
          
          <!-- 数据统计 -->
          <view class="flex mt-40rpx border-t border-gray-100 pt-30rpx">
            <view class="flex-1 flex flex-col items-center" @tap.stop="goToContact('follow')">
              <text class="text-32rpx font-bold text-gray-800">{{ userInfo.statistics.following_count }}</text>
              <text class="text-24rpx text-gray-500 mt-6rpx">关注</text>
            </view>
            <view class="flex-1 flex flex-col items-center border-l border-r border-gray-100" @tap.stop="goToContact('fans')">
              <text class="text-32rpx font-bold text-gray-800">{{ userInfo.statistics.followers_count }}</text>
              <text class="text-24rpx text-gray-500 mt-6rpx">粉丝</text>
            </view>
            <view class="flex-1 flex flex-col items-center">
              <text class="text-32rpx font-bold text-gray-800">{{ likeCount }}</text>
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
          hover-class="bg-gray-50" @tap.stop="goToSettings()"
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
    
    <!-- 头像裁剪组件已移除，现在直接上传原图 -->
    
    <custom-tab-bar/>
  </layout>
</template>