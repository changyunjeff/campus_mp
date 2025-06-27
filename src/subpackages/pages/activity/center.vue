<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { ActivityApi } from '@/subpackages/api/activity'

const router = useRouter()
const toast = useToast()

// 搜索和筛选
const searchKeyword = ref('')
const roomNumber = ref('')
const showFilter = ref(false)
const filterOptions = reactive({
  status: 'all', // all, published, ongoing, ended, cancelled
  type: 'all', // all, sports, study, entertainment, other
  genderLimit: 'all', // all, male, female, mixed
  timeRange: 'all' // all, today, week, month
})

// 活动列表
const activities = ref([])
const loading = ref(false)
const refreshing = ref(false)
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true
})

// 活动类型配置
const activityTypes = [
  { value: 'all', label: '全部类型', icon: 'list' },
  { value: 'sports', label: '体育运动', icon: 'football' },
  { value: 'study', label: '学习交流', icon: 'book' },
  { value: 'entertainment', label: '娱乐游戏', icon: 'game' },
  { value: 'other', label: '其他活动', icon: 'more' }
]

// 活动状态配置
const activityStatus = [
  { value: 'all', label: '全部状态' },
  { value: 'published', label: '已发布' },
  { value: 'ongoing', label: '进行中' },
  { value: 'ended', label: '已结束' },
  { value: 'cancelled', label: '已取消' }
]

// 性别限制配置
const genderLimits = [
  { value: 'all', label: '全部' },
  { value: 'male', label: '仅限男生' },
  { value: 'female', label: '仅限女生' },
  { value: 'mixed', label: '男女混合' }
]

// 获取活动状态样式
const getStatusStyle = (status) => {
  const styles = {
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
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const activityDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  
  if (activityDate.getTime() === today.getTime()) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } else if (activityDate.getTime() === today.getTime() + 24 * 60 * 60 * 1000) {
    return `明天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  } else {
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
}


// 在现有变量声明后添加以下变量
const refresherTriggered = ref(false) // 下拉刷新状态
const scrollTop = ref(0) // 滚动位置
const refresherEnabled = ref(true) // 是否启用下拉刷新

// 计算性别比例
const getGenderRatio = (activity) => {
  const { male, female } = activity.currentGender
  const { male: reqMale, female: reqFemale } = activity.genderRequirement
  return {
    malePercent: reqMale > 0 ? Math.round((male / reqMale) * 100) : 0,
    femalePercent: reqFemale > 0 ? Math.round((female / reqFemale) * 100) : 0,
    maleStatus: male >= reqMale ? 'full' : 'available',
    femaleStatus: female >= reqFemale ? 'full' : 'available'
  }
}

// 筛选后的活动列表
const filteredActivities = computed(() => {
  return activities.value // 筛选逻辑现在由后端处理
})

// 加载活动列表
const loadActivities = async (isRefresh = false) => {
  if (isRefresh) {
    refreshing.value = true
    pagination.page = 1
  } else {
    loading.value = true
  }
  
  try {
    // 构建查询参数
    const params = {
      page: pagination.page,
      page_size: pagination.pageSize,
      keyword: searchKeyword.value.trim() || undefined,
      status: filterOptions.status !== 'all' ? filterOptions.status : undefined,
      type: filterOptions.type !== 'all' ? filterOptions.type : undefined,
      gender_limit: filterOptions.genderLimit !== 'all' ? filterOptions.genderLimit : undefined,
      time_range: filterOptions.timeRange !== 'all' ? filterOptions.timeRange : undefined
    }

    // 移除undefined的参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key]
      }
    })

    console.log('调用活动列表API，参数:', params)
    const response = await ActivityApi.getActivityList(params)
    console.log('活动列表API响应:', response)

    const data = response
    if (isRefresh) {
      activities.value = data.list || []
    } else {
      activities.value = [...activities.value, ...(data.list || [])]
    }

    pagination.total = data.total || 0
    pagination.hasMore = data.hasMore || false

    toast.show(`加载了 ${data.list?.length || 0} 个活动`)
  } catch (error) {
    console.error('加载活动失败:', error)
    toast.show(error.message || '加载活动失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 通过房间号进入活动
const enterByRoomNumber = async () => {
  if (!roomNumber.value.trim()) {
    toast.show('请输入房间号')
    return
  }
  
  try {
    console.log('通过房间号获取活动:', roomNumber.value.trim())
    const response = await ActivityApi.getActivityByRoomNumber(roomNumber.value.trim())
    console.log('房间号API响应:', response)

    const activity = response
    router.push({
      name: 'activity_detail',
      params: { id: activity.id }
    })
    roomNumber.value = '' // 清空输入框
  } catch (error) {
    console.error('房间号查询失败:', error)
    toast.show(error.message || '房间号不存在')
  }
}

// 进入活动详情
const goToDetail = (activity) => {
  router.push({
    name: 'activity_detail',
    params: { id: activity.id }
  })
}

// 发布活动
const goToPublish = () => {
  router.push({
    name: 'activity_publish'
  })
}

// 我的活动
const goToMyActivities = () => {
  router.push({
    name: 'activity_my'
  })
}

// 重置筛选条件
const resetFilter = () => {
  filterOptions.status = 'all'
  filterOptions.type = 'all'
  filterOptions.genderLimit = 'all'
  filterOptions.timeRange = 'all'
}

// 搜索事件处理
const handleSearch = () => {
  pagination.page = 1
  activities.value = []
  loadActivities()
}

// 筛选类型改变
const handleTypeChange = (type) => {
  filterOptions.type = type
  pagination.page = 1
  activities.value = []
  loadActivities()
}

// 筛选确认
const handleFilterConfirm = () => {
  showFilter.value = false
  pagination.page = 1
  activities.value = []
  loadActivities()
}

// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新活动列表')
  refresherTriggered.value = true
  pagination.page = 1
  await loadActivities(true)
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('触底加载更多活动')
  if (activities.value.length >= pagination.total || !pagination.hasMore || loading.value) return
  
  pagination.page++
  await loadActivities()
}

// 滚动事件处理
const onScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
  // 当滚动位置大于50rpx时禁用下拉刷新，避免滚动冲突
  refresherEnabled.value = scrollTop.value <= 50
}

// 页面初始化
onMounted(() => {
  console.log('活动列表页面初始化')
  loadActivities()
})
</script>

<template>
  <Layout>
    <template #center>
      <text class="text-lg font-medium text-gray-800">活动大厅</text>
    </template>
    
    <view class="min-h-full bg-gray-50">
      <!-- 搜索和房间号区域 -->
      <view class="bg-white px-4 py-3 mb-3">
        <!-- 搜索框 -->
        <view class="mb-3">
          <wd-search
            v-model="searchKeyword"
            placeholder="搜索活动、组织者..."
            show-action
            @search="handleSearch"
            @clear="handleSearch"
          />
        </view>
        
        <!-- 房间号输入 -->
        <view class="flex items-center gap-3">
          <wd-input
            v-model="roomNumber"
            placeholder="输入房间号快速进入"
            custom-class="flex-1"
          />
          <wd-button
            type="primary"
            size="small"
            @click="enterByRoomNumber"
          >
            进入
          </wd-button>
        </view>
      </view>

      <!-- 筛选栏 -->
      <view class="bg-white px-4 py-3 mb-3">
        <view class="flex items-center justify-between">
          <view class="flex-1 mr-3">
            <scroll-view 
              scroll-x 
              class="whitespace-nowrap"
              :show-scrollbar="false"
              :enhanced="true"
              style="width: 518rpx;"
            >
              <view class="inline-flex gap-3 pr-4">
                <view
                  v-for="type in activityTypes"
                  :key="type.value"
                  class="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors flex items-center gap-1"
                  :class="filterOptions.type === type.value 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
                  @tap="handleTypeChange(type.value)"
                >
                  <WdIcon :name="type.icon" size="14" />
                  <text>{{ type.label }}</text>
                </view>
              </view>
            </scroll-view>
          </view>
          
          <view
            class="px-3 py-1.5 rounded-full bg-gray-100 flex items-center gap-1 active:bg-gray-200 transition-colors flex-shrink-0"
            @tap="showFilter = true"
          >
            <WdIcon name="filter" size="16" color="#666" />
            <text class="text-sm text-gray-600">筛选</text>
          </view>
        </view>
      </view>

      <!-- 活动列表 - 使用scroll-view包装 -->
      <scroll-view
        scroll-y
        class="px-4 bg-red-500"
        style="height: calc(68vh);"
        :refresher-enabled="refresherEnabled"
        :refresher-triggered="refresherTriggered"
        :scroll-top="scrollTop"
        refresher-background="#f5f5f5"
        lower-threshold="100"
        @refresherrefresh="onRefresherRefresh"
        @scrolltolower="onScrollToLower"
        @scroll="onScroll"
      >
        <!-- 加载状态 -->
        <view v-if="loading && activities.length === 0" class="space-y-4">
          <view v-for="i in 3" :key="i" class="bg-white rounded-lg p-4 animate-pulse">
            <view class="h-4 bg-gray-200 rounded mb-3"></view>
            <view class="h-3 bg-gray-200 rounded mb-2"></view>
            <view class="h-3 bg-gray-200 rounded w-2/3"></view>
          </view>
        </view>

        <!-- 活动卡片 -->
        <view v-else class="space-y-4">
          <view
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden active:shadow-md transition-all duration-200"
            @tap="goToDetail(activity)"
          >
            <!-- 活动头部 -->
            <view class="p-4 pb-3">
              <view class="flex items-start justify-between mb-3">
                <view class="flex-1">
                  <view class="flex items-center gap-2 mb-2">
                    <WdIcon :name="getTypeIcon(activity.type)" size="16" color="#666" />
                    <text class="text-lg font-medium text-gray-800">{{ activity.title }}</text>
                  </view>
                  <text class="text-sm text-gray-600 leading-relaxed">{{ activity.description }}</text>
                </view>
                
                <view class="ml-3 flex flex-col items-end gap-2">
                  <view 
                    class="px-2 py-1 rounded text-xs"
                    :class="[getStatusStyle(activity.status).bg, getStatusStyle(activity.status).text]"
                  >
                    {{ getStatusStyle(activity.status).label }}
                  </view>
                  <text class="text-xs text-gray-400">{{ activity.roomNumber }}</text>
                </view>
              </view>

              <!-- 时间和地点 -->
              <view class="space-y-2 mb-3">
                <view class="flex items-center gap-2">
                  <WdIcon name="time" size="14" color="#f59e0b" />
                  <text class="text-sm text-gray-600">{{ formatTime(activity.startTime) }}</text>
                </view>
                <view class="flex items-center gap-2">
                  <WdIcon name="location" size="14" color="#f59e0b" />
                  <text class="text-sm text-gray-600">{{ activity.location.name }}</text>
                </view>
              </view>

              <!-- 组织者信息 -->
              <view class="flex items-center gap-2 mb-3">
                <image
                  :src="activity.organizer.avatar"
                  class="w-6 h-6 rounded-full"
                  mode="aspectFill"
                />
                <text class="text-sm text-gray-600">{{ activity.organizer.nickname }}</text>
                <view class="px-1.5 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                  发起人
                </view>
              </view>
            </view>

            <!-- 参与信息 -->
            <view class="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <view class="flex items-center justify-between">
                <!-- 人数信息 -->
                <view class="flex items-center gap-4">
                  <view class="flex items-center gap-1">
                    <WdIcon name="usergroup" size="14" color="#666" />
                    <text class="text-sm text-gray-600">
                      {{ activity.participants }}/{{ activity.maxParticipants }}人
                    </text>
                  </view>
                  
                  <!-- 性别要求 -->
                  <view v-if="activity.genderRequirement.male > 0 || activity.genderRequirement.female > 0" 
                        class="flex items-center gap-2">
                    <view v-if="activity.genderRequirement.male > 0" class="flex items-center gap-1">
                      <view 
                        class="w-3 h-3 rounded-full"
                        :class="getGenderRatio(activity).maleStatus === 'full' ? 'bg-blue-500' : 'bg-blue-200'"
                      ></view>
                      <text class="text-xs text-gray-600">
                        {{ activity.currentGender.male }}/{{ activity.genderRequirement.male }}♂
                      </text>
                    </view>
                    
                    <view v-if="activity.genderRequirement.female > 0" class="flex items-center gap-1">
                      <view 
                        class="w-3 h-3 rounded-full"
                        :class="getGenderRatio(activity).femaleStatus === 'full' ? 'bg-pink-500' : 'bg-pink-200'"
                      ></view>
                      <text class="text-xs text-gray-600">
                        {{ activity.currentGender.female }}/{{ activity.genderRequirement.female }}♀
                      </text>
                    </view>
                  </view>
                </view>

                <!-- 参与状态 -->
                <view class="flex items-center">
                  <view 
                    class="px-3 py-1 rounded-full text-sm"
                    :class="activity.status === 'ongoing' 
                      ? 'bg-green-100 text-green-600' 
                      : activity.participants >= activity.maxParticipants
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-blue-100 text-blue-600'"
                  >
                    {{ activity.status === 'ongoing' ? '进行中' 
                       : activity.participants >= activity.maxParticipants ? '已满员' 
                       : '可参与' }}
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && filteredActivities.length === 0" class="text-center py-20">
          <WdIcon name="calendar" size="64" color="#ccc" />
          <text class="text-gray-400 block mt-4 mb-8">暂无相关活动</text>
          <wd-button type="primary" size="small" @click="goToPublish">
            发起活动
          </wd-button>
        </view>
        
        <!-- 加载更多提示 -->
        <view v-if="loading && activities.length > 0" class="py-4 text-center">
          <text class="text-sm text-gray-400">加载中...</text>
        </view>
        
        <!-- 没有更多数据提示 -->
        <view v-if="!loading && !pagination.hasMore && activities.length > 0" class="py-4 text-center">
          <text class="text-sm text-gray-400">没有更多活动了</text>
        </view>
      </scroll-view>

      <!-- 浮动操作按钮组 -->
      <view class="fixed bottom-20 right-4 z-10 flex flex-col gap-3">
        <!-- 我的活动按钮 -->
        <view 
          class="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg active:shadow-xl transition-all duration-200 border border-gray-100"
          @tap="goToMyActivities"
        >
          <WdIcon name="user" size="20" color="#666" />
        </view>
        
        <!-- 发布活动按钮 -->
        <view 
          class="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg active:shadow-xl active:scale-95 transition-all duration-200"
          @tap="goToPublish"
        >
          <WdIcon name="add" size="24" color="white" />
        </view>
      </view>
    </view>

    <!-- 筛选弹窗 -->
    <wd-popup v-model="showFilter" position="bottom" custom-style="border-radius: 20rpx 20rpx 0 0;">
      <view class="p-6 pb-8">
        <view class="flex items-center justify-between mb-6">
          <text class="text-lg font-medium text-gray-800">筛选活动</text>
          <view @tap="showFilter = false">
            <WdIcon name="close" size="20" color="#999" />
          </view>
        </view>

        <!-- 活动状态 -->
        <view class="mb-6">
          <text class="text-sm font-medium text-gray-700 mb-3 block">活动状态</text>
          <view class="grid grid-cols-3 gap-3">
            <view
              v-for="status in activityStatus"
              :key="status.value"
              class="px-3 py-2 rounded-lg text-center text-sm transition-colors"
              :class="filterOptions.status === status.value 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
              @tap="filterOptions.status = status.value"
            >
              {{ status.label }}
            </view>
          </view>
        </view>

        <!-- 性别限制 -->
        <view class="mb-6">
          <text class="text-sm font-medium text-gray-700 mb-3 block">性别要求</text>
          <view class="grid grid-cols-2 gap-3">
            <view
              v-for="limit in genderLimits"
              :key="limit.value"
              class="px-3 py-2 rounded-lg text-center text-sm transition-colors"
              :class="filterOptions.genderLimit === limit.value 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
              @tap="filterOptions.genderLimit = limit.value"
            >
              {{ limit.label }}
            </view>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="flex gap-3">
          <wd-button custom-class="flex-1" @click="resetFilter">重置</wd-button>
          <wd-button type="primary" custom-class="flex-1" @click="handleFilterConfirm">
            确定
          </wd-button>
        </view>
      </view>
    </wd-popup>
  </Layout>
</template>

<style scoped>
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
</style>