<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { ActivityApi } from '@/subpackages/api/activity'
// 引入地图组件
import Amap from '@/components/Amap.vue'

const router = useRouter()
const toast = useToast()

// 路由参数
const activityId = ref('')
const loading = ref(false)
const joining = ref(false)

// 活动详情
const activity = ref(null)
const participants = ref([])
const isParticipated = ref(false)
const currentUserId = ref('current_user') // 模拟当前用户ID

// 页面状态
const showLocationMap = ref(false)
const showParticipantsList = ref(false)
const showQRCode = ref(false)
const showMoreActions = ref(false)

// 参与者分页
const participantsPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true
})

// 获取活动状态样式
const getStatusStyle = (status) => {
  const styles = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: '草稿' },
    published: { bg: 'bg-blue-100', text: 'text-blue-600', label: '已发布' },
    ongoing: { bg: 'bg-green-100', text: 'text-green-600', label: '进行中' },
    ended: { bg: 'bg-gray-100', text: 'text-gray-600', label: '已结束' },
    cancelled: { bg: 'bg-red-100', text: 'text-red-600', label: '已取消' }
  }
  return styles[status] || styles.published
}

// 获取活动类型图标
const getTypeIcon = (type) => {
  const icons = {
    sports: 'football',
    study: 'book',
    entertainment: 'game',
    other: 'more'
  }
  return icons[type] || 'more'
}

// 格式化时间
const formatTime = (timeStr) => {
  const date = new Date(timeStr)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 格式化相对时间
const formatRelativeTime = (timeStr) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天加入'
  if (days === 1) return '昨天加入'
  if (days < 7) return `${days}天前加入`
  return `${Math.floor(days / 7)}周前加入`
}


// 在现有变量声明后添加以下变量
const refresherTriggered = ref(false) // 下拉刷新状态
const scrollTop = ref(0) // 滚动位置
const refresherEnabled = ref(true) // 是否启用下拉刷新

// 计算性别比例
const genderStats = computed(() => {
  if (!activity.value) return { malePercent: 0, femalePercent: 0 }
  
  const { male, female } = activity.value.currentGender
  const { male: reqMale, female: reqFemale } = activity.value.genderRequirement
  
  return {
    malePercent: reqMale > 0 ? Math.round((male / reqMale) * 100) : 0,
    femalePercent: reqFemale > 0 ? Math.round((female / reqFemale) * 100) : 0,
    maleRemaining: Math.max(0, reqMale - male),
    femaleRemaining: Math.max(0, reqFemale - female)
  }
})

// 是否为活动发起人
const isOrganizer = computed(() => {
  return activity.value?.isOrganizer || false
})

// 是否可以参与
const canJoin = computed(() => {
  if (!activity.value) return false
  if (activity.value.isParticipated) return false
  if (activity.value.status !== 'published') return false
  if (activity.value.participants >= activity.value.maxParticipants) return false
  
  // 检查性别限制
  const userGender = 'female' // 模拟当前用户性别
  const { male, female } = activity.value.currentGender
  const { male: reqMale, female: reqFemale } = activity.value.genderRequirement
  
  if (userGender === 'male' && male >= reqMale) return false
  if (userGender === 'female' && female >= reqFemale) return false
  
  return true
})

// 加载活动详情
const loadActivityDetail = async () => {
  if (!activityId.value) {
    toast.show('活动ID不能为空')
    return
  }
  
  loading.value = true
  try {
    console.log('加载活动详情，ID:', activityId.value)
    const response = await ActivityApi.getActivityDetail(activityId.value)
    console.log('活动详情API响应:', response)

    activity.value = response
    isParticipated.value = response.isParticipated || false

    // 同时加载参与者列表
    await loadParticipants()

    toast.show('活动详情加载成功')
  } catch (error) {
    console.error('加载活动详情失败:', error)
    toast.show(error.message || '加载活动详情失败')
    
    // 如果加载失败，返回上一页
    setTimeout(() => {
      router.back()
    }, 2000)
  } finally {
    loading.value = false
  }
}

// 加载参与者列表
const loadParticipants = async (loadMore = false) => {
  if (!activityId.value) return
  
  try {
    const page = loadMore ? participantsPagination.page + 1 : 1
    console.log('加载参与者列表，页码:', page)
    
    const response = await ActivityApi.getParticipants(
      activityId.value,
      page,
      participantsPagination.pageSize
    )
    console.log('参与者列表API响应:', response)

    const data = response
    if (loadMore) {
      participants.value = [...participants.value, ...(data.list || [])]
    } else {
      participants.value = data.list || []
    }

    participantsPagination.page = page
    participantsPagination.total = data.total || 0
    participantsPagination.hasMore = data.hasMore || false
  } catch (error) {
    console.error('加载参与者列表失败:', error)
    toast.show(error.message || '加载参与者失败')
  }
}

// 参与活动
const joinActivity = async () => {
  if (!canJoin.value) {
    toast.show('无法参与此活动')
    return
  }
  
  joining.value = true
  try {
    console.log('参与活动，ID:', activityId.value)
    const response = await ActivityApi.joinActivity(activityId.value)
    console.log('参与活动API响应:', response)

    // 重新加载活动详情以获取最新状态
    await loadActivityDetail()
    toast.success('参与成功！')
  } catch (error) {
    console.error('参与活动失败:', error)
    toast.show(error.message || '参与失败，请重试')
  } finally {
    joining.value = false
  }
}

// 取消参与
const leaveActivity = async () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消参与这个活动吗？',
    success: async (res) => {
      if (res.confirm) {
        joining.value = true
        try {
          console.log('取消参与活动，ID:', activityId.value)
          const response = await ActivityApi.leaveActivity(activityId.value)
          console.log('取消参与API响应:', response)

          // 重新加载活动详情以获取最新状态
          await loadActivityDetail()
          toast.success('已取消参与')
        } catch (error) {
          console.error('取消参与失败:', error)
          toast.show(error.message || '取消失败，请重试')
        } finally {
          joining.value = false
        }
      }
    }
  })
}

// 分享活动
const shareActivity = async () => {
  try {
    console.log('分享活动，ID:', activityId.value)
    const response = await ActivityApi.shareActivity(activityId.value)
    console.log('分享活动API响应:', response)

    uni.showActionSheet({
      itemList: ['分享给好友', '生成海报', '复制链接', '保存二维码'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            toast.show('分享功能开发中')
            break
          case 1:
            toast.show('海报生成功能开发中')
            break
          case 2:
            uni.setClipboardData({
              data: `活动房间号：${activity.value?.roomNumber}`,
              success: () => toast.success('房间号已复制')
            })
            break
          case 3:
            showQRCode.value = true
            break
        }
      }
    })
  } catch (error) {
    console.error('分享活动失败:', error)
    toast.show(error.message || '分享失败')
  }
}

// 管理活动
const manageActivity = () => {
  uni.showActionSheet({
    itemList: ['编辑活动', '取消活动', '结束活动'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          router.push({
            name: 'activity_publish',
            params: { id: activityId.value, mode: 'edit' }
          })
          break
        case 1:
          cancelActivity()
          break
        case 2:
          endActivity()
          break
      }
    }
  })
}

// 取消活动
const cancelActivity = () => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消这个活动吗？取消后无法恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          console.log('取消活动，ID:', activityId.value)
          const response = await ActivityApi.cancelActivity(activityId.value)
          console.log('取消活动API响应:', response)

          // 重新加载活动详情以获取最新状态
          await loadActivityDetail()
          toast.success('活动已取消')
        } catch (error) {
          console.error('取消活动失败:', error)
          toast.show(error.message || '取消失败')
        }
      }
    }
  })
}

// 结束活动
const endActivity = () => {
  uni.showModal({
    title: '确认结束',
    content: '确定要结束这个活动吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          console.log('结束活动，ID:', activityId.value)
          const response = await ActivityApi.endActivity(activityId.value)
          console.log('结束活动API响应:', response)

          // 重新加载活动详情以获取最新状态
          await loadActivityDetail()
          toast.success('活动已结束')
        } catch (error) {
          console.error('结束活动失败:', error)
          toast.show(error.message || '结束失败')
        }
      }
    }
  })
}

// 查看参与者详情
const viewParticipant = (participant) => {
  if (participant.id === currentUserId.value) return
  
  router.push({
    name: 'user_profile',
    params: { id: participant.id }
  })
}

// 页面加载
onLoad((options) => {
  console.log('活动详情页面加载，参数:', options)
  if (options.id) {
    activityId.value = options.id
    loadActivityDetail()
  } else {
    toast.show('缺少活动ID参数')
    setTimeout(() => {
      router.back()
    }, 2000)
  }
})


// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新活动详情')
  refresherTriggered.value = true
  await Promise.all([
    loadActivityDetail(),
    loadParticipants()
  ])
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('触底加载更多参与者')
  if (!participantsPagination.hasMore || loading.value) return
  
  await loadParticipants(true)
}

// 滚动事件处理
const onScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
  // 当滚动位置大于50rpx时禁用下拉刷新，避免滚动冲突
  refresherEnabled.value = scrollTop.value <= 50
}
</script>

<template>
  <Layout>
    <template #left>
      <view @tap="router.back()" class="p-2 active:opacity-60 transition-opacity">
        <WdIcon name="arrow-left" size="20" color="#333"/>
      </view>
    </template>

    <template #center>
      <text class="text-lg font-medium text-gray-800">活动详情</text>
    </template>
    
    <template #right>
      <view class="flex items-center gap-3">
        <view @tap="shareActivity" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="share" size="18" color="#666" />
        </view>
        <view v-if="isOrganizer" @tap="manageActivity" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="more" size="18" color="#666" />
        </view>
      </view>
    </template>

    <view v-if="loading" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <wd-loading>加载中...</wd-loading>
    </view>

    <scroll-view
      scroll-y
      v-else-if="activity"
      class="min-h-screen bg-gray-50"
      style="height: 100vh;"
      :refresher-enabled="refresherEnabled"
      :refresher-triggered="refresherTriggered"
      :scroll-top="scrollTop"
      refresher-background="#f5f5f5"
      lower-threshold="100"
      @refresherrefresh="onRefresherRefresh"
      @scrolltolower="onScrollToLower"
      @scroll="onScroll"
    >
      <!-- 活动头部信息 -->
      <view class="bg-white px-4 py-5 mb-3">
        <!-- 标题和状态 -->
        <view class="flex items-start justify-between mb-4">
          <view class="flex-1">
            <view class="flex items-center gap-2 mb-2">
              <WdIcon :name="getTypeIcon(activity.type)" size="20" color="#666" />
              <text class="text-xl font-bold text-gray-800">{{ activity.title }}</text>
            </view>
            <view class="flex items-center gap-3">
              <view 
                class="px-2 py-1 rounded text-xs"
                :class="[getStatusStyle(activity.status).bg, getStatusStyle(activity.status).text]"
              >
                {{ getStatusStyle(activity.status).label }}
              </view>
              <text class="text-sm text-gray-500">房间号：{{ activity.roomNumber }}</text>
            </view>
          </view>
        </view>

        <!-- 时间和地点 -->
        <view class="space-y-3 mb-4">
          <view class="flex items-center gap-3">
            <WdIcon name="time" size="16" color="#f59e0b" />
            <view>
              <text class="text-sm text-gray-800 block">{{ formatTime(activity.startTime) }} - {{ formatTime(activity.endTime) }}</text>
              <text class="text-xs text-gray-500">活动时长约2小时</text>
            </view>
          </view>
          
          <view class="flex items-center gap-3">
            <WdIcon name="location" size="16" color="#f59e0b" />
            <view class="flex-1">
              <text class="text-sm text-gray-800 block">{{ activity.location.name }}</text>
              <text class="text-xs text-gray-500">{{ activity.location.address }}</text>
            </view>
            <view 
              class="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full active:bg-blue-100 transition-colors"
              @tap="showLocationMap = true"
            >
              查看地图
            </view>
          </view>
        </view>

        <!-- 组织者信息 -->
        <view class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <image
            :src="activity.organizer.avatar"
            class="w-10 h-10 rounded-full"
            mode="aspectFill"
          />
          <view class="flex-1">
            <view class="flex items-center gap-2">
              <text class="text-sm font-medium text-gray-800">{{ activity.organizer.nickname }}</text>
              <view class="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                发起人
              </view>
            </view>
            <text class="text-xs text-gray-500">{{ formatRelativeTime(activity.createdAt) }}</text>
          </view>
        </view>
      </view>

      <!-- 参与情况 -->
      <view class="bg-white px-4 py-5 mb-3">
        <view class="flex items-center justify-between mb-4">
          <text class="text-lg font-medium text-gray-800">参与情况</text>
          <view 
            class="flex items-center gap-1 text-blue-600 active:text-blue-700 transition-colors"
            @tap="showParticipantsList = true"
          >
            <text class="text-sm">查看全部</text>
            <WdIcon name="arrow-right" size="14" />
          </view>
        </view>

        <!-- 人数统计 -->
        <view class="flex items-center justify-between mb-4">
          <view class="flex items-center gap-1">
            <WdIcon name="usergroup" size="16" color="#666" />
            <text class="text-sm text-gray-600">
              已报名 {{ activity.participants }}/{{ activity.maxParticipants }} 人
            </text>
          </view>
          <text class="text-xs text-gray-400">还缺 {{ activity.maxParticipants - activity.participants }} 人</text>
        </view>

        <!-- 性别要求进度 -->
        <view v-if="activity.genderRequirement.male > 0 || activity.genderRequirement.female > 0" class="space-y-3">
          <view v-if="activity.genderRequirement.male > 0" class="flex items-center gap-3">
            <view class="flex items-center gap-2 w-20">
              <view class="w-3 h-3 bg-blue-500 rounded-full"></view>
              <text class="text-sm text-gray-600">男生</text>
            </view>
            <view class="flex-1 bg-gray-200 rounded-full h-2">
              <view 
                class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                :style="`width: ${genderStats.malePercent}%`"
              ></view>
            </view>
            <text class="text-xs text-gray-500 w-16 text-right">
              {{ activity.currentGender.male }}/{{ activity.genderRequirement.male }}
            </text>
          </view>
          
          <view v-if="activity.genderRequirement.female > 0" class="flex items-center gap-3">
            <view class="flex items-center gap-2 w-20">
              <view class="w-3 h-3 bg-pink-500 rounded-full"></view>
              <text class="text-sm text-gray-600">女生</text>
            </view>
            <view class="flex-1 bg-gray-200 rounded-full h-2">
              <view 
                class="bg-pink-500 h-2 rounded-full transition-all duration-300"
                :style="`width: ${genderStats.femalePercent}%`"
              ></view>
            </view>
            <text class="text-xs text-gray-500 w-16 text-right">
              {{ activity.currentGender.female }}/{{ activity.genderRequirement.female }}
            </text>
          </view>
        </view>

        <!-- 参与者头像列表 -->
        <view class="flex items-center gap-2 mt-4">
          <view
            v-for="(participant, index) in participants.slice(0, 8)"
            :key="participant.id"
            class="relative"
            @tap="viewParticipant(participant)"
          >
            <image
              :src="participant.avatar"
              class="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              mode="aspectFill"
            />
            <view 
              v-if="participant.isOrganizer"
              class="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"
            >
              <WdIcon name="crown" size="8" color="white" />
            </view>
          </view>
          
          <view v-if="participants.length > 8" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <text class="text-xs text-gray-500">+{{ participants.length - 8 }}</text>
          </view>
        </view>
      </view>

      <!-- 活动详情 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">活动详情</text>
        <text class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{{ activity.description }}</text>
        
        <!-- 标签 -->
        <view v-if="activity.tags && activity.tags.length" class="flex items-center gap-2 mt-4">
          <view
            v-for="tag in activity.tags"
            :key="tag"
            class="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
          >
            # {{ tag }}
          </view>
        </view>
      </view>

    </scroll-view>
    
    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
      <view v-if="!isOrganizer" class="flex gap-3">
        <wd-button
          v-if="!isParticipated"
          type="primary"
          size="large"
          block
          :disabled="!canJoin || joining"
          :loading="joining"
          @click="joinActivity"
        >
          {{ !canJoin ? '无法参与' : '参与活动' }}
        </wd-button>
        
        <wd-button
          v-else
          size="large"
          block
          :loading="joining"
          @click="leaveActivity"
        >
          取消参与
        </wd-button>
      </view>
      
      <view v-else class="flex gap-3">
        <wd-button size="large" custom-class="flex-1" @click="manageActivity">
          管理活动
        </wd-button>
        <wd-button type="primary" size="large" custom-class="flex-1" @click="shareActivity">
          分享活动
        </wd-button>
      </view>
    </view>

    <!-- 地图弹窗 -->
    <view v-if="showLocationMap" class="location-map-modal">
      <!-- 地图头部 -->
      <view class="location-map-header">
        <view @tap="showLocationMap = false" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="18" color="#333"/>
        </view>
        <text class="text-lg font-medium text-gray-800">活动位置</text>
        <view class="w-10"></view>
      </view>
      
      <!-- 地图区域 -->
      <view class="location-map-content">
        <Amap
          :preview-mode="true"
          :preview-location="`${activity.location.longitude},${activity.location.latitude}`"
          :show-search="false"
          :show-controls="true"
          :show-center-pin="false"
        />
      </view>
      
      <!-- 位置信息 -->
      <view class="location-map-footer">
        <text class="text-lg font-medium text-gray-800 block mb-1">{{ activity.location.name }}</text>
        <text class="text-sm text-gray-600">{{ activity.location.address }}</text>
      </view>
    </view>

    <!-- 参与者列表弹窗 -->
    <wd-popup v-model="showParticipantsList" position="bottom" custom-style="height: 70vh; border-radius: 20rpx 20rpx 0 0;">
      <view class="p-4">
        <view class="flex items-center justify-between mb-4">
          <text class="text-lg font-medium text-gray-800">参与者列表 ({{ participants.length }})</text>
          <view @tap="showParticipantsList = false">
            <WdIcon name="close" size="20" color="#999" />
          </view>
        </view>

        <scroll-view scroll-y class="h-96">
          <view class="space-y-3">
            <view
              v-for="participant in participants"
              :key="participant.id"
              class="flex items-center gap-3 p-3 rounded-lg active:bg-gray-50 transition-colors"
              @tap="viewParticipant(participant)"
            >
              <view class="relative">
                <image
                  :src="participant.avatar"
                  class="w-12 h-12 rounded-full"
                  mode="aspectFill"
                />
                <view 
                  v-if="participant.isOrganizer"
                  class="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                >
                  <WdIcon name="crown" size="10" color="white" />
                </view>
              </view>
              
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <text class="text-base font-medium text-gray-800">{{ participant.nickname }}</text>
                  <view 
                    class="w-4 h-4 rounded-full"
                    :class="participant.gender === 'male' ? 'bg-blue-500' : 'bg-pink-500'"
                  ></view>
                  <view v-if="participant.isOrganizer" class="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                    发起人
                  </view>
                </view>
                <text class="text-sm text-gray-500">{{ formatRelativeTime(participant.joinedAt) }}</text>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </wd-popup>

    <!-- 二维码弹窗 -->
    <wd-popup v-model="showQRCode" custom-style="border-radius: 20rpx;">
      <view class="p-6 text-center">
        <text class="text-lg font-medium text-gray-800 block mb-4">活动二维码</text>
        <image
          :src="activity?.qrCode"
          class="w-48 h-48 mx-auto mb-4"
          mode="aspectFit"
        />
        <text class="text-sm text-gray-600 block mb-4">扫描二维码参与活动</text>
        <text class="text-xs text-gray-400">房间号：{{ activity?.roomNumber }}</text>
      </view>
    </wd-popup>
  </Layout>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

/* 地图弹窗样式 */
.location-map-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.location-map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding-top: calc(16px + constant(safe-area-inset-top));
  padding-top: calc(16px + env(safe-area-inset-top));
}

.location-map-content {
  flex: 1;
  height: 0;
  position: relative;
}

.location-map-footer {
  padding: 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20px + constant(safe-area-inset-bottom));
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}
</style>