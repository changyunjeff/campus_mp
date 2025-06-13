<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { ActivityApi } from '@/subpackages/api/activity'

const router = useRouter()
const toast = useToast()

// 页面状态
const currentTab = ref(0) // 0: 我发起的, 1: 我参与的
const loading = ref(false)
const refreshing = ref(false)

// 筛选状态
const showFilter = ref(false)
const filterStatus = ref('all') // all, published, ongoing, ended, cancelled

// 活动列表
const myOrganizedActivities = ref([])
const myJoinedActivities = ref([])

// 统计数据
const stats = ref({
  organized: {
    total: 0,
    published: 0,
    ongoing: 0,
    ended: 0,
    upcoming: 0
  },
  joined: {
    total: 0,
    ongoing: 0,
    upcoming: 0
  }
})

// 分页数据
const organizedPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true
})

const joinedPagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0,
  hasMore: true
})

// Tab配置
const tabs = [
  { id: 0, label: '我发起的', icon: 'crown' },
  { id: 1, label: '我参与的', icon: 'usergroup' }
]

// 状态筛选选项
const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'ongoing', label: '进行中' },
  { value: 'ended', label: '已结束' },
  { value: 'cancelled', label: '已取消' }
]

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

// 格式化相对时间
const formatRelativeTime = (timeStr) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return '今天'
  if (days === 1) return '昨天'
  if (days < 7) return `${days}天前`
  return `${Math.floor(days / 7)}周前`
}

// 在现有变量声明后添加以下变量
const refresherTriggered = ref(false) // 下拉刷新状态
const scrollTop = ref(0) // 滚动位置
const refresherEnabled = ref(true) // 是否启用下拉刷新

// 当前显示的活动列表
const currentActivities = computed(() => {
  const activities = currentTab.value === 0 ? myOrganizedActivities.value : myJoinedActivities.value
  
  if (filterStatus.value === 'all') {
    return activities
  }
  
  return activities.filter(activity => activity.status === filterStatus.value)
})

// 加载活动列表
const loadActivities = async (isRefresh = false) => {
  if (isRefresh) {
    refreshing.value = true
    if (currentTab.value === 0) {
      organizedPagination.page = 1
    } else {
      joinedPagination.page = 1
    }
  } else {
    loading.value = true
  }
  
  try {
    const params = {
      type: currentTab.value === 0 ? 'organized' : 'joined',
      status: filterStatus.value !== 'all' ? filterStatus.value : undefined,
      page: currentTab.value === 0 ? organizedPagination.page : joinedPagination.page,
      page_size: currentTab.value === 0 ? organizedPagination.pageSize : joinedPagination.pageSize
    }

    // 移除undefined的参数
    Object.keys(params).forEach(key => {
      if (params[key] === undefined) {
        delete params[key]
      }
    })

    console.log('加载我的活动列表，参数:', params)
    const response = await ActivityApi.getMyActivities(params)
    console.log('我的活动列表API响应:', response)

    const data = response
    if (currentTab.value === 0) {
      if (isRefresh) {
        myOrganizedActivities.value = data.list || []
      } else {
        myOrganizedActivities.value = [...myOrganizedActivities.value, ...(data.list || [])]
      }
      organizedPagination.total = data.total || 0
      organizedPagination.hasMore = data.hasMore || false
    } else {
      if (isRefresh) {
        myJoinedActivities.value = data.list || []
      } else {
        myJoinedActivities.value = [...myJoinedActivities.value, ...(data.list || [])]
      }
      joinedPagination.total = data.total || 0
      joinedPagination.hasMore = data.hasMore || false
    }

    toast.show(`加载了 ${data.list?.length || 0} 个活动`)
  } catch (error) {
    console.error('加载活动列表失败:', error)
    toast.show(error.message || '加载活动列表失败')
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    console.log('加载活动统计')
    const response = await ActivityApi.getActivityStats()
    console.log('活动统计API响应:', response)

    stats.value = response
  } catch (error) {
    console.error('加载统计数据失败:', error)
    // 统计数据加载失败不影响主要功能，只记录日志
  }
}

// 切换Tab
const switchTab = (index) => {
  currentTab.value = index
}

// 进入活动详情
const goToDetail = (activity) => {
  router.push({
    name: 'activity_detail',
    params: { id: activity.id }
  })
}

// 继续编辑草稿
const editDraft = (activity) => {
  router.push({
    name: 'activity_publish',
    params: { id: activity.id, mode: 'edit' }
  })
}

// 发布草稿
const publishDraft = async (activity) => {
  uni.showModal({
    title: '确认发布',
    content: '确定要发布这个活动吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '发布中...' })
          console.log('发布活动，ID:', activity.id)
          const response = await ActivityApi.publishActivity(activity.id)
          console.log('发布活动API响应:', response)

          // 更新状态
          const index = myOrganizedActivities.value.findIndex(a => a.id === activity.id)
          if (index !== -1) {
            myOrganizedActivities.value[index].status = 'published'
            myOrganizedActivities.value[index].roomNumber = response.roomNumber
          }

          uni.hideLoading()
          toast.success('发布成功')
        } catch (error) {
          uni.hideLoading()
          console.error('发布活动失败:', error)
          toast.show(error.message || '发布失败')
        }
      }
    }
  })
}

// 取消参与活动
const leaveActivity = async (activity) => {
  uni.showModal({
    title: '确认取消',
    content: '确定要取消参与这个活动吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })
          console.log('取消参与活动，ID:', activity.id)
          const response = await ActivityApi.leaveActivity(activity.id)
          console.log('取消参与API响应:', response)

          // 从列表中移除
          myJoinedActivities.value = myJoinedActivities.value.filter(a => a.id !== activity.id)

          uni.hideLoading()
          toast.success('已取消参与')
        } catch (error) {
          uni.hideLoading()
          console.error('取消参与失败:', error)
          toast.show(error.message || '取消失败')
        }
      }
    }
  })
}

// 删除草稿
const deleteDraft = async (activity) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这个草稿吗？删除后无法恢复。',
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '删除中...' })
          console.log('删除活动草稿，ID:', activity.id)
          const response = await ActivityApi.deleteActivity(activity.id)
          console.log('删除活动API响应:', response)

          // 从列表中移除
          myOrganizedActivities.value = myOrganizedActivities.value.filter(a => a.id !== activity.id)

          uni.hideLoading()
          toast.success('删除成功')
        } catch (error) {
          uni.hideLoading()
          console.error('删除活动失败:', error)
          toast.show(error.message || '删除失败')
        }
      }
    }
  })
}

// 发布新活动
const goToPublish = () => {
  router.push({
    name: 'activity_publish'
  })
}

// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新我的活动')
  refresherTriggered.value = true
  await Promise.all([
    loadStats(),
    loadActivities(true)
  ])
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('触底加载更多活动')
  const currentPagination = currentTab.value === 0 ? organizedPagination : joinedPagination
  if (!currentPagination.hasMore || loading.value) return
  
  if (currentTab.value === 0) {
    organizedPagination.page++
  } else {
    joinedPagination.page++
  }
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
  console.log('我的活动页面初始化')
  loadStats()
  loadActivities()
})
</script>

<template>
  <Layout>
    <template #center>
      <text class="text-lg font-medium text-gray-800">我的活动</text>
    </template>
    
    <template #right>
      <view @tap="goToPublish" class="p-2 active:opacity-60 transition-opacity">
        <WdIcon name="add" size="18" color="#666" />
      </view>
    </template>

    <view class="min-h-screen bg-gray-50">
      <!-- 统计卡片 -->
      <view class="bg-white mx-4 mt-3 mb-3 rounded-lg p-4">
        <view class="grid grid-cols-2 gap-4">
          <!-- 我发起的统计 -->
          <view class="text-center">
            <text class="text-2xl font-bold text-blue-600 block">{{ stats.organized.total }}</text>
            <text class="text-sm text-gray-600">我发起的</text>
            <view class="flex justify-center gap-2 mt-2 text-xs text-gray-500">
              <text>进行中 {{ stats.organized.ongoing }}</text>
              <text>已结束 {{ stats.organized.ended }}</text>
            </view>
          </view>
          
          <!-- 我参与的统计 -->
          <view class="text-center border-l border-gray-100">
            <text class="text-2xl font-bold text-green-600 block">{{ stats.joined.total }}</text>
            <text class="text-sm text-gray-600">我参与的</text>
            <view class="flex justify-center gap-2 mt-2 text-xs text-gray-500">
              <text>进行中 {{ stats.joined.ongoing }}</text>
              <text>即将开始 {{ stats.joined.upcoming }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- Tab导航 -->
      <view class="bg-white mx-4 mb-3 rounded-lg overflow-hidden">
        <view class="flex">
          <view
            v-for="(tab, index) in tabs"
            :key="tab.id"
            class="flex-1 py-3 text-center transition-colors"
            :class="currentTab === index 
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-600 active:bg-gray-50'"
            @tap="switchTab(index)"
          >
            <view class="flex items-center justify-center gap-2">
              <WdIcon :name="tab.icon" size="16" />
              <text class="text-sm font-medium">{{ tab.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 筛选栏 -->
      <view class="bg-white mx-4 mb-3 rounded-lg px-4 py-3">
        <view class="flex items-center justify-between">
          <text class="text-sm font-medium text-gray-700">筛选状态</text>
          <view 
            class="flex items-center gap-1 text-blue-600 active:text-blue-700 transition-colors"
            @tap="showFilter = true"
          >
            <text class="text-sm">{{ statusOptions.find(s => s.value === filterStatus)?.label || '全部状态' }}</text>
            <WdIcon name="arrow-down" size="14" />
          </view>
        </view>
      </view>

      <!-- 活动列表 -->
      <scroll-view
        scroll-y
        class="px-4 pb-20"
        style="height: calc(100vh - 340rpx);"
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
        <view v-if="loading && currentActivities.length === 0" class="space-y-3">
          <view v-for="i in 3" :key="i" class="bg-white rounded-lg p-4 animate-pulse">
            <view class="h-4 bg-gray-200 rounded mb-2"></view>
            <view class="h-3 bg-gray-200 rounded mb-2"></view>
            <view class="h-3 bg-gray-200 rounded w-2/3"></view>
          </view>
        </view>

        <!-- 活动卡片 -->
        <view v-else class="space-y-3">
          <view
            v-for="activity in currentActivities"
            :key="activity.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <!-- 卡片主体 -->
            <view 
              class="p-4 active:bg-gray-50 transition-colors"
              @tap="goToDetail(activity)"
            >
              <!-- 头部信息 -->
              <view class="flex items-start justify-between mb-3">
                <view class="flex-1">
                  <view class="flex items-center gap-2 mb-2">
                    <WdIcon :name="getTypeIcon(activity.type)" size="16" color="#666" />
                    <text class="text-base font-medium text-gray-800">{{ activity.title }}</text>
                  </view>
                  <text class="text-sm text-gray-600 leading-relaxed">{{ activity.description }}</text>
                </view>
                
                <view class="ml-3 flex flex-col items-end gap-1">
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

              <!-- 参与信息 -->
              <view class="flex items-center justify-between">
                <view class="flex items-center gap-4">
                  <view class="flex items-center gap-1">
                    <WdIcon name="usergroup" size="14" color="#666" />
                    <text class="text-sm text-gray-600">
                      {{ activity.participants }}/{{ activity.maxParticipants }}人
                    </text>
                  </view>
                  
                  <!-- 组织者信息（我参与的活动） -->
                  <view v-if="currentTab === 1 && activity.organizer" class="flex items-center gap-1">
                    <image
                      :src="activity.organizer.avatar"
                      class="w-4 h-4 rounded-full"
                      mode="aspectFill"
                    />
                    <text class="text-sm text-gray-500">{{ activity.organizer.nickname }}</text>
                  </view>
                  
                  <!-- 创建/参与时间 -->
                  <text class="text-xs text-gray-400">
                    {{ currentTab === 0 ? formatRelativeTime(activity.createdAt) : formatRelativeTime(activity.joinedAt) }}
                  </text>
                </view>
              </view>
            </view>

            <!-- 操作按钮 -->
            <view class="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <!-- 我发起的活动操作 -->
              <view v-if="currentTab === 0" class="flex gap-3">
                <wd-button 
                  v-if="activity.status === 'draft'"
                  size="small" 
                  type="primary"
                  custom-class="flex-1"
                  @click.stop="publishDraft(activity)"
                >
                  发布活动
                </wd-button>
                
                <wd-button 
                  v-if="activity.status === 'draft'"
                  size="small"
                  custom-class="flex-1"
                  @click.stop="editDraft(activity)"
                >
                  编辑草稿
                </wd-button>
                
                <wd-button 
                  v-if="activity.status === 'draft'"
                  size="small"
                  type="error"
                  custom-class="flex-1"
                  @click.stop="deleteDraft(activity)"
                >
                  删除草稿
                </wd-button>
                
                <wd-button 
                  v-if="activity.status !== 'draft'"
                  size="small"
                  custom-class="flex-1"
                  @click.stop="goToDetail(activity)"
                >
                  查看详情
                </wd-button>
              </view>
              
              <!-- 我参与的活动操作 -->
              <view v-else class="flex gap-3">
                <wd-button 
                  size="small"
                  custom-class="flex-1"
                  @click.stop="goToDetail(activity)"
                >
                  查看详情
                </wd-button>
                
                <wd-button 
                  v-if="activity.status === 'published'"
                  size="small"
                  type="error"
                  custom-class="flex-1"
                  @click.stop="leaveActivity(activity)"
                >
                  取消参与
                </wd-button>
              </view>
            </view>
          </view>
        </view>

        <!-- 空状态 -->
        <view v-if="!loading && currentActivities.length === 0" class="text-center py-20">
          <WdIcon name="calendar" size="64" color="#ccc" />
          <text class="text-gray-400 block mt-4 mb-8">
            {{ currentTab === 0 ? '还没有发起过活动' : '还没有参与过活动' }}
          </text>
          <wd-button 
            v-if="currentTab === 0"
            type="primary" 
            size="small" 
            @click="goToPublish"
          >
            发起第一个活动
          </wd-button>
          <wd-button 
            v-else
            type="primary" 
            size="small" 
            @click="router.push({ name: 'activity_center' })"
          >
            去活动大厅看看
          </wd-button>
        </view>
      </scroll-view>
    </view>

    <!-- 状态筛选弹窗 -->
    <wd-popup v-model="showFilter" position="bottom" custom-style="border-radius: 20rpx 20rpx 0 0;">
      <view class="p-6 pb-8">
        <view class="flex items-center justify-between mb-6">
          <text class="text-lg font-medium text-gray-800">筛选状态</text>
          <view @tap="showFilter = false">
            <WdIcon name="close" size="20" color="#999" />
          </view>
        </view>

        <view class="space-y-3">
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="flex items-center justify-between p-3 rounded-lg transition-colors"
            :class="filterStatus === option.value ? 'bg-blue-50' : 'active:bg-gray-50'"
            @tap="filterStatus = option.value; showFilter = false"
          >
            <text 
              class="text-base"
              :class="filterStatus === option.value ? 'text-blue-600 font-medium' : 'text-gray-800'"
            >
              {{ option.label }}
            </text>
            <view v-if="filterStatus === option.value">
              <WdIcon name="check" size="18" color="#3b82f6" />
            </view>
          </view>
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
