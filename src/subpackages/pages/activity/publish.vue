<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import { useRouter } from 'uni-mini-router'
import { useToast } from '@/composables/toast'
import { ActivityApi } from '@/subpackages/api/activity'
// 引入地图组件
import Amap from '@/components/Amap.vue'
// 引入时间选择器组件
import TimePicker from '@/components/TimePicker.vue'

const router = useRouter()
const toast = useToast()

// 路由参数
const activityId = ref('')
const editMode = ref(false)

// 页面状态
const loading = ref(false)
const publishing = ref(false)
const showLocationPicker = ref(false)
const showTypePicker = ref(false)
const showGenderSetting = ref(false)
const showStartTimePicker = ref(false)
const showEndTimePicker = ref(false)

// 活动表单数据
const activityForm = reactive({
  title: '',
  description: '',
  type: 'sports',
  startTime: 0,
  endTime: 0,
  location: {
    name: '',
    address: '',
    longitude: 0,
    latitude: 0
  },
  maxParticipants: 10,
  genderRequirement: {
    male: 0,
    female: 0
  },
  tags: []
})

// 表单验证错误
const formErrors = reactive({
  title: '',
  description: '',
  startTime: '',
  endTime: '',
  location: '',
  maxParticipants: '',
  genderRequirement: ''
})

// 活动类型选项
const activityTypes = [
  { value: 'sports', label: '体育运动', icon: 'football', desc: '足球、篮球、跑步等运动活动' },
  { value: 'study', label: '学习交流', icon: 'book', desc: '读书会、学习小组、考试交流' },
  { value: 'entertainment', label: '娱乐游戏', icon: 'game', desc: '桌游、聚会、娱乐活动' },
  { value: 'other', label: '其他活动', icon: 'more', desc: '社交、公益、文化等其他活动' }
]

// 常用标签
const commonTags = [
  '运动', '学习', '交友', '娱乐', '放松', '挑战',
  '团队', '竞技', '休闲', '文化', '艺术', '音乐'
]

// 当前选择的活动类型
const currentType = computed(() => {
  return activityTypes.find(type => type.value === activityForm.type) || activityTypes[0]
})

// 性别要求总数
const totalGenderRequirement = computed(() => {
  return activityForm.genderRequirement.male + activityForm.genderRequirement.female
})

// 是否设置了性别要求
const hasGenderRequirement = computed(() => {
  return totalGenderRequirement.value > 0
})

// 表单验证
const validateForm = () => {
  let isValid = true
  
  // 重置错误信息
  Object.keys(formErrors).forEach(key => {
    formErrors[key] = ''
  })
  
  // 验证标题
  if (!activityForm.title.trim()) {
    formErrors.title = '请输入活动标题'
    isValid = false
  } else if (activityForm.title.length > 50) {
    formErrors.title = '标题不能超过50个字符'
    isValid = false
  }
  
  // 验证描述
  if (!activityForm.description.trim()) {
    formErrors.description = '请输入活动描述'
    isValid = false
  } else if (activityForm.description.length > 500) {
    formErrors.description = '描述不能超过500个字符'
    isValid = false
  }
  
  // 验证开始时间
  if (!activityForm.startTime) {
    formErrors.startTime = '请选择开始时间'
    isValid = false
  } else {
    const startTime = activityForm.startTime
    const now = Date.now()
    if (startTime <= now) {
      formErrors.startTime = '开始时间必须晚于当前时间'
      isValid = false
    }
  }
  
  // 验证结束时间
  if (!activityForm.endTime) {
    formErrors.endTime = '请选择结束时间'
    isValid = false
  } else if (activityForm.startTime && activityForm.endTime) {
    const startTime = activityForm.startTime
    const endTime = activityForm.endTime
    if (endTime <= startTime) {
      formErrors.endTime = '结束时间必须晚于开始时间'
      isValid = false
    }
  }
  
  // 验证地点
  if (!activityForm.location.name) {
    formErrors.location = '请选择活动地点'
    isValid = false
  }
  
  // 验证人数
  if (activityForm.maxParticipants < 2) {
    formErrors.maxParticipants = '活动人数至少为2人'
    isValid = false
  } else if (activityForm.maxParticipants > 100) {
    formErrors.maxParticipants = '活动人数不能超过100人'
    isValid = false
  }
  
  // 验证性别要求
  if (hasGenderRequirement.value) {
    if (totalGenderRequirement.value > activityForm.maxParticipants) {
      formErrors.genderRequirement = '性别要求人数不能超过活动总人数'
      isValid = false
    }
  }
  
  return isValid
}

// 格式化时间为显示格式
const formatDateTimeForDisplay = (timestamp) => {
  if (!timestamp) return '请选择时间'
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 格式化时间为ISO字符串
const formatDateTimeToISO = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toISOString()
}

// 处理开始时间选择
const handleStartTimeConfirm = (result) => {
  activityForm.startTime = result.value
  formErrors.startTime = ''
  showStartTimePicker.value = false
}

// 处理结束时间选择
const handleEndTimeConfirm = (result) => {
  activityForm.endTime = result.value
  formErrors.endTime = ''
  showEndTimePicker.value = false
}

// 获取最小可选时间（当前时间+30分钟）
const getMinDateTime = () => {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 30)
  return now.getTime()
}

// 获取开始时间的最小值（针对结束时间选择器）
const getMinEndDateTime = () => {
  if (!activityForm.startTime) return getMinDateTime()
  const startTime = new Date(activityForm.startTime)
  startTime.setMinutes(startTime.getMinutes() + 30) // 结束时间至少比开始时间晚30分钟
  return startTime.getTime()
}

// 处理地图选择位置
const handleLocationSelect = (selectedLocation) => {
  console.log('选择的位置:', selectedLocation)
  
  activityForm.location = {
    name: selectedLocation.name || selectedLocation.address,
    address: selectedLocation.address,
    longitude: selectedLocation.longitude,
    latitude: selectedLocation.latitude
  }
  
  showLocationPicker.value = false
  formErrors.location = ''
  toast.success('位置选择成功')
}

// 选择活动类型
const selectType = (type) => {
  activityForm.type = type.value
  showTypePicker.value = false
}

// 添加标签
const addTag = (tag) => {
  if (!activityForm.tags.includes(tag) && activityForm.tags.length < 5) {
    activityForm.tags.push(tag)
  }
}

// 移除标签
const removeTag = (index) => {
  activityForm.tags.splice(index, 1)
}

// 设置性别要求
const setGenderRequirement = (male, female) => {
  activityForm.genderRequirement.male = male
  activityForm.genderRequirement.female = female
  formErrors.genderRequirement = ''
}

// 清除性别要求
const clearGenderRequirement = () => {
  activityForm.genderRequirement.male = 0
  activityForm.genderRequirement.female = 0
}

// 保存草稿
const saveDraft = async () => {
  if (!activityForm.title.trim()) {
    toast.show('请至少输入活动标题')
    return
  }
  
  try {
    uni.showLoading({ title: '保存中...' })
    
    // 构造保存数据
    const saveData = {
      title: activityForm.title,
      description: activityForm.description,
      type: activityForm.type,
      startTime: formatDateTimeToISO(activityForm.startTime),
      endTime: formatDateTimeToISO(activityForm.endTime),
      location: activityForm.location,
      maxParticipants: activityForm.maxParticipants,
      genderRequirement: activityForm.genderRequirement,
      tags: activityForm.tags
    }
    
    console.log('保存活动草稿，数据:', saveData)
    let response
    if (editMode.value && activityId.value) {
      // 更新现有活动
      response = await ActivityApi.updateActivity(activityId.value, saveData)
    } else {
      // 创建新活动
      response = await ActivityApi.createActivity(saveData)
    }
    console.log('保存活动API响应:', response)
    
    if (response.code === 0) {
      uni.hideLoading()
      toast.success('草稿保存成功')
      
      // 返回我的活动页面
      setTimeout(() => {
        router.push({ name: 'activity_my' })
      }, 1500)
    } else {
      throw new Error(response.msg || '保存活动失败')
    }
  } catch (error) {
    uni.hideLoading()
    console.error('保存草稿失败:', error)
    toast.show(error.message || '保存失败，请重试')
  }
}

// 发布活动
const publishActivity = async () => {
  if (!validateForm()) {
    toast.show('请检查表单输入')
    return
  }
  
  publishing.value = true
  
  try {
    uni.showLoading({ title: '发布中...' })
    
    // 构造发布数据
    const publishData = {
      title: activityForm.title,
      description: activityForm.description,
      type: activityForm.type,
      startTime: formatDateTimeToISO(activityForm.startTime),
      endTime: formatDateTimeToISO(activityForm.endTime),
      location: activityForm.location,
      maxParticipants: activityForm.maxParticipants,
      genderRequirement: activityForm.genderRequirement,
      tags: activityForm.tags
    }
    
    console.log('发布活动，数据:', publishData)
    let activityResponse
    
    if (editMode.value && activityId.value) {
      // 先更新活动信息
      activityResponse = await ActivityApi.updateActivity(activityId.value, publishData)
      activityResponse = await ActivityApi.publishActivity(activityId.value)
    } else {
      // 先创建活动
      activityResponse = await ActivityApi.createActivity(publishData)
      const newActivityId = activityResponse.id
      activityResponse = await ActivityApi.publishActivity(newActivityId)
    }
    
    console.log('发布活动API响应:', activityResponse)

    toast.success('发布成功！')

    // 显示成功信息
    uni.showModal({
      title: '发布成功',
      content: `活动已发布，房间号：${activityResponse.roomNumber}`,
      showCancel: false,
      success: () => {
        // 返回活动大厅
        router.push({ name: 'activity_center' })
      }
    })
  } catch (error) {

    console.error('发布活动失败:', error)
    toast.show(error.message || '发布失败，请重试')
  } finally {
    publishing.value = false
    uni.hideLoading()
  }
}

// 返回上一页
const goBack = () => {
  if (activityForm.title || activityForm.description) {
    uni.showModal({
      title: '提示',
      content: '是否保存为草稿？',
      cancelText: '不保存',
      confirmText: '保存草稿',
      success: (res) => {
        if (res.confirm) {
          saveDraft()
        } else {
          router.back()
        }
      }
    })
  } else {
    router.back()
  }
}

// 页面加载
onLoad((options) => {
  if (options.id) {
    activityId.value = options.id
    editMode.value = options.mode === 'edit'
    // 如果是编辑模式，加载活动数据
    if (editMode.value) {
      // 这里可以加载现有活动数据
      loadActivityData()
    }
  }
})

// 加载活动数据（编辑模式）
const loadActivityData = async () => {
  if (!activityId.value) {
    toast.show('缺少活动ID')
    return
  }
  
  loading.value = true
  try {
    console.log('加载活动数据进行编辑，ID:', activityId.value)
    const response = await ActivityApi.getActivityDetail(activityId.value)
    console.log('活动详情API响应:', response)

    const activity = response

    // 填充表单数据
    Object.assign(activityForm, {
      title: activity.title,
      description: activity.description,
      type: activity.type,
      startTime: new Date(activity.startTime).getTime(),
      endTime: new Date(activity.endTime).getTime(),
      location: activity.location,
      maxParticipants: activity.maxParticipants,
      genderRequirement: activity.genderRequirement,
      tags: activity.tags || []
    })

    toast.show('活动数据加载成功')
  } catch (error) {
    console.error('加载数据失败:', error)
    toast.show(error.message || '加载数据失败')
    
    // 如果加载失败，返回上一页
    setTimeout(() => {
      router.back()
    }, 2000)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Layout>
    <template #left>
      <view @tap="goBack" class="p-2 active:opacity-60 transition-opacity">
        <WdIcon name="arrow-left" size="20" color="#333"/>
      </view>
    </template>

    <template #center>
      <text class="text-lg font-medium text-gray-800">
        {{ editMode ? '编辑活动' : '发布活动' }}
      </text>
    </template>

    <view v-if="loading" class="min-h-screen bg-gray-50 flex items-center justify-center">
      <wd-loading>加载中...</wd-loading>
    </view>

    <view v-else class="min-h-screen bg-gray-50 pb-24">
      <!-- 基本信息 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">基本信息</text>
        
        <!-- 活动标题 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">活动标题 *</text>
          <wd-input
            v-model="activityForm.title"
            placeholder="请输入活动标题"
            maxlength="50"
            show-word-limit
            :error="!!formErrors.title"
            @blur="formErrors.title = ''"
          />
          <text v-if="formErrors.title" class="text-red-500 text-xs mt-1 block">{{ formErrors.title }}</text>
        </view>

        <!-- 活动类型 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">活动类型</text>
          <view 
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-50 transition-colors"
            @tap="showTypePicker = true"
          >
            <view class="flex items-center gap-3">
              <view 
                class="w-10 h-10 rounded-lg flex items-center justify-center"
                :style="`background-color: ${currentType.value === 'sports' ? '#3b82f6' : currentType.value === 'study' ? '#10b981' : currentType.value === 'entertainment' ? '#f59e0b' : '#6b7280'}20;`"
              >
                <WdIcon 
                  :name="currentType.icon" 
                  size="20" 
                  :color="currentType.value === 'sports' ? '#3b82f6' : currentType.value === 'study' ? '#10b981' : currentType.value === 'entertainment' ? '#f59e0b' : '#6b7280'"
                />
              </view>
              <view>
                <text class="text-sm font-medium text-gray-800 block">{{ currentType.label }}</text>
                <text class="text-xs text-gray-500">{{ currentType.desc }}</text>
              </view>
            </view>
            <WdIcon name="arrow-right" size="16" color="#999" />
          </view>
        </view>

        <!-- 活动描述 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">活动描述 *</text>
          <wd-textarea
            v-model="activityForm.description"
            placeholder="详细介绍活动内容、要求、注意事项等..."
            :maxlength="500"
            show-word-limit
            :auto-height="true"
            :error="!!formErrors.description"
            @blur="formErrors.description = ''"
            custom-style="min-height: 120px;"
          />
          <text v-if="formErrors.description" class="text-red-500 text-xs mt-1 block">{{ formErrors.description }}</text>
        </view>
      </view>

      <!-- 时间设置 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">时间安排</text>
        
        <!-- 开始时间 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">开始时间 *</text>
          <view
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-50 transition-colors"
            :class="formErrors.startTime ? 'border-red-500' : ''"
            @tap="showStartTimePicker = true"
          >
            <view class="flex items-center gap-3">
              <WdIcon name="time" size="20" color="#10b981" />
              <text 
                class="text-sm"
                :class="activityForm.startTime ? 'text-gray-800' : 'text-gray-400'"
              >
                {{ formatDateTimeForDisplay(activityForm.startTime) }}
              </text>
            </view>
            <WdIcon name="arrow-right" size="16" color="#999" />
          </view>
          <text v-if="formErrors.startTime" class="text-red-500 text-xs mt-1 block">{{ formErrors.startTime }}</text>
        </view>

        <!-- 结束时间 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">结束时间 *</text>
          <view
            class="flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-50 transition-colors"
            :class="formErrors.endTime ? 'border-red-500' : ''"
            @tap="showEndTimePicker = true"
          >
            <view class="flex items-center gap-3">
              <WdIcon name="time" size="20" color="#f59e0b" />
              <text 
                class="text-sm"
                :class="activityForm.endTime ? 'text-gray-800' : 'text-gray-400'"
              >
                {{ formatDateTimeForDisplay(activityForm.endTime) }}
              </text>
            </view>
            <WdIcon name="arrow-right" size="16" color="#999" />
          </view>
          <text v-if="formErrors.endTime" class="text-red-500 text-xs mt-1 block">{{ formErrors.endTime }}</text>
        </view>
      </view>

      <!-- 地点设置 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">活动地点</text>
        
        <view
          class="flex items-center justify-between p-3 border border-gray-200 rounded-lg active:bg-gray-50 transition-colors"
          :class="formErrors.location ? 'border-red-500' : ''"
          @tap="showLocationPicker = true"
        >
          <view class="flex items-center gap-3 flex-1">
            <WdIcon name="location" size="20" color="#f59e0b" />
            <view class="flex-1">
              <text v-if="activityForm.location.name" class="text-sm font-medium text-gray-800 block">
                {{ activityForm.location.name }}
              </text>
              <text v-else class="text-sm text-gray-400">选择活动地点</text>
              <text v-if="activityForm.location.address" class="text-xs text-gray-500">
                {{ activityForm.location.address }}
              </text>
            </view>
          </view>
          <WdIcon name="arrow-right" size="16" color="#999" />
        </view>
        <text v-if="formErrors.location" class="text-red-500 text-xs mt-1 block">{{ formErrors.location }}</text>
      </view>

      <!-- 参与设置 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">参与设置</text>
        
        <!-- 人数限制 -->
        <view class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">活动人数 *</text>
          <wd-input
            v-model.number="activityForm.maxParticipants"
            type="number"
            placeholder="请输入活动人数"
            :error="!!formErrors.maxParticipants"
            @blur="formErrors.maxParticipants = ''"
          />
          <text v-if="formErrors.maxParticipants" class="text-red-500 text-xs mt-1 block">{{ formErrors.maxParticipants }}</text>
        </view>

        <!-- 性别要求 -->
        <view class="mb-4">
          <view class="flex items-center justify-between mb-2">
            <text class="text-sm font-medium text-gray-700">性别要求</text>
            <view 
              class="text-blue-600 text-sm active:text-blue-700 transition-colors"
              @tap="showGenderSetting = true"
            >
              {{ hasGenderRequirement ? '已设置' : '设置' }}
            </view>
          </view>
          
          <view v-if="hasGenderRequirement" class="p-3 bg-blue-50 rounded-lg">
            <view class="flex items-center justify-between">
              <view class="flex items-center gap-4">
                <view v-if="activityForm.genderRequirement.male > 0" class="flex items-center gap-1">
                  <view class="w-3 h-3 bg-blue-500 rounded-full"></view>
                  <text class="text-sm text-gray-600">男生 {{ activityForm.genderRequirement.male }}人</text>
                </view>
                <view v-if="activityForm.genderRequirement.female > 0" class="flex items-center gap-1">
                  <view class="w-3 h-3 bg-pink-500 rounded-full"></view>
                  <text class="text-sm text-gray-600">女生 {{ activityForm.genderRequirement.female }}人</text>
                </view>
              </view>
              <view 
                class="text-red-500 text-sm active:text-red-600 transition-colors"
                @tap="clearGenderRequirement"
              >
                清除
              </view>
            </view>
          </view>
          
          <view v-else class="p-3 bg-gray-50 rounded-lg">
            <text class="text-sm text-gray-500">未设置性别要求，所有人都可参与</text>
          </view>
          
          <text v-if="formErrors.genderRequirement" class="text-red-500 text-xs mt-1 block">{{ formErrors.genderRequirement }}</text>
        </view>
      </view>

      <!-- 标签设置 -->
      <view class="bg-white px-4 py-5 mb-3">
        <text class="text-lg font-medium text-gray-800 block mb-4">活动标签</text>
        
        <!-- 已选标签 -->
        <view v-if="activityForm.tags.length" class="mb-4">
          <text class="text-sm font-medium text-gray-700 block mb-2">已选标签</text>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="(tag, index) in activityForm.tags"
              :key="index"
              class="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded"
            >
              <text>{{ tag }}</text>
              <view @tap="removeTag(index)" class="w-4 h-4 flex items-center justify-center">
                <WdIcon name="close" size="10" />
              </view>
            </view>
          </view>
        </view>
        
        <!-- 常用标签 -->
        <view>
          <text class="text-sm font-medium text-gray-700 block mb-2">常用标签（最多5个）</text>
          <view class="flex flex-wrap gap-2">
            <view
              v-for="tag in commonTags"
              :key="tag"
              class="px-3 py-1 rounded-full text-sm transition-colors"
              :class="activityForm.tags.includes(tag) 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'"
              @tap="addTag(tag)"
            >
              {{ tag }}
            </view>
          </view>
        </view>
      </view>

      <!-- 底部操作栏 -->
      <view class="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-4 py-3 safe-area-bottom">
        <view class="flex gap-3">
          <wd-button 
            size="large" 
            custom-class="flex-1"
            @click="saveDraft"
          >
            保存草稿
          </wd-button>
          <wd-button 
            type="primary" 
            size="large" 
            custom-class="flex-1"
            :loading="publishing"
            @click="publishActivity"
          >
            {{ editMode ? '更新活动' : '发布活动' }}
          </wd-button>
        </view>
      </view>
    </view>

    <!-- 地图选择弹窗 -->
    <view v-if="showLocationPicker" class="location-picker-modal">
      <view class="location-picker-header">
        <view @tap="showLocationPicker = false" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="18" color="#333"/>
        </view>
        <text class="text-lg font-medium text-gray-800">选择活动地点</text>
        <view class="w-10"></view>
      </view>
      
      <view class="location-picker-content">
        <Amap
          :show-search="true"
          :show-controls="true"
          :show-center-pin="true"
          :show-location="true"
          @select="handleLocationSelect"
        />
      </view>
    </view>

    <!-- 活动类型选择弹窗 -->
    <wd-popup v-model="showTypePicker" position="bottom" custom-style="border-radius: 20rpx 20rpx 0 0;">
      <view class="p-6 pb-8">
        <view class="flex items-center justify-between mb-6">
          <text class="text-lg font-medium text-gray-800">选择活动类型</text>
          <view @tap="showTypePicker = false">
            <WdIcon name="close" size="20" color="#999" />
          </view>
        </view>

        <view class="space-y-3">
          <view
            v-for="type in activityTypes"
            :key="type.value"
            class="flex items-center p-4 rounded-lg transition-colors"
            :class="activityForm.type === type.value ? 'bg-blue-50 border-2 border-blue-200' : 'bg-gray-50 active:bg-gray-100'"
            @tap="selectType(type)"
          >
            <view 
              class="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
              :style="`background-color: ${type.value === 'sports' ? '#3b82f6' : type.value === 'study' ? '#10b981' : type.value === 'entertainment' ? '#f59e0b' : '#6b7280'}20;`"
            >
              <WdIcon 
                :name="type.icon" 
                size="24" 
                :color="type.value === 'sports' ? '#3b82f6' : type.value === 'study' ? '#10b981' : type.value === 'entertainment' ? '#f59e0b' : '#6b7280'"
              />
            </view>
            <view class="flex-1">
              <text 
                class="text-base font-medium block mb-1"
                :class="activityForm.type === type.value ? 'text-blue-600' : 'text-gray-800'"
              >
                {{ type.label }}
              </text>
              <text class="text-sm text-gray-500">{{ type.desc }}</text>
            </view>
            <view v-if="activityForm.type === type.value">
              <WdIcon name="check" size="20" color="#3b82f6" />
            </view>
          </view>
        </view>
      </view>
    </wd-popup>

    <!-- 性别要求设置弹窗 -->
    <wd-popup v-model="showGenderSetting" position="bottom" custom-style="border-radius: 20rpx 20rpx 0 0;">
      <view class="p-6 pb-8">
        <view class="flex items-center justify-between mb-6">
          <text class="text-lg font-medium text-gray-800">设置性别要求</text>
          <view @tap="showGenderSetting = false">
            <WdIcon name="close" size="20" color="#999" />
          </view>
        </view>

        <!-- 快速设置 -->
        <view class="mb-6">
          <text class="text-sm font-medium text-gray-700 block mb-3">快速设置</text>
          <view class="grid grid-cols-2 gap-3">
            <view 
              class="p-3 border border-gray-200 rounded-lg text-center active:bg-gray-50 transition-colors"
              @tap="setGenderRequirement(0, 0); showGenderSetting = false"
            >
              <text class="text-sm text-gray-600">不限制</text>
            </view>
            <view 
              class="p-3 border border-gray-200 rounded-lg text-center active:bg-gray-50 transition-colors"
              @tap="setGenderRequirement(Math.floor(activityForm.maxParticipants/2), Math.ceil(activityForm.maxParticipants/2)); showGenderSetting = false"
            >
              <text class="text-sm text-gray-600">男女各半</text>
            </view>
          </view>
        </view>

        <!-- 自定义设置 -->
        <view class="mb-6">
          <text class="text-sm font-medium text-gray-700 block mb-3">自定义设置</text>
          
          <!-- 男生人数 -->
          <view class="mb-4">
            <text class="text-sm text-gray-600 block mb-2">男生人数</text>
            <wd-input
              v-model.number="activityForm.genderRequirement.male"
              type="number"
              placeholder="0"
              :min="0"
              :max="activityForm.maxParticipants"
            />
          </view>
          
          <!-- 女生人数 -->
          <view class="mb-4">
            <text class="text-sm text-gray-600 block mb-2">女生人数</text>
            <wd-input
              v-model.number="activityForm.genderRequirement.female"
              type="number"
              placeholder="0"
              :min="0"
              :max="activityForm.maxParticipants"
            />
          </view>
          
          <!-- 预览 -->
          <view class="p-3 bg-gray-50 rounded-lg">
            <text class="text-sm text-gray-600">
              总计：{{ totalGenderRequirement }}/{{ activityForm.maxParticipants }}人
              {{ totalGenderRequirement > activityForm.maxParticipants ? '（超出活动人数限制）' : '' }}
            </text>
          </view>
        </view>

        <!-- 确认按钮 -->
        <wd-button 
          type="primary" 
          size="large" 
          block
          @click="showGenderSetting = false"
        >
          确认设置
        </wd-button>
      </view>
    </wd-popup>

    <!-- 开始时间选择器 -->
    <TimePicker
      v-if="showStartTimePicker"
      :show="showStartTimePicker"
      :value="activityForm.startTime || getMinDateTime()"
      :min-date="getMinDateTime()"
      default-tab="date"
      @confirm="handleStartTimeConfirm"
      @cancel="showStartTimePicker = false"
      @update:show="showStartTimePicker = $event"
    />

    <!-- 结束时间选择器 -->
    <TimePicker
      v-if="showEndTimePicker"
      :show="showEndTimePicker"
      :value="activityForm.endTime || getMinEndDateTime()"
      :min-date="getMinEndDateTime()"
      default-tab="date"
      @confirm="handleEndTimeConfirm"
      @cancel="showEndTimePicker = false"
      @update:show="showEndTimePicker = $event"
    />
  </Layout>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: calc(12px + constant(safe-area-inset-bottom));
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

/* 地图弹窗样式 */
.location-picker-modal {
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

.location-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding-top: calc(16px + constant(safe-area-inset-top));
  padding-top: calc(16px + env(safe-area-inset-top));
}

.location-picker-content {
  flex: 1;
  height: 0;
  position: relative;
}


</style>