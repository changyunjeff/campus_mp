<script setup>
import Layout from '@/layout/index'
import {ref, reactive, onMounted, onBeforeUnmount} from 'vue'
import {useRouter} from 'uni-mini-router'
import events from '@/utils/events'
import {useDraftStore} from '@/subpackages/pinia/community/draft'
import {formatTime} from '@/utils/time'
import {CommunityApi} from '@/api/community'
import {MediaApi} from '@/api/media'
import {generateID} from '@/utils/id'
import {useToast} from "@/composables/toast";
// 引入地图组件 - 修复导入路径
import Amap from '@/components/Amap.vue'
// 导入地图API
import {getCurrentLocation, getRegeo} from '@/api/amap/amap'

const router = useRouter()
const draftStore = useDraftStore()
const toast = useToast()

// 图片列表 - 包含媒体信息
const images = ref([])
const maxImages = 9
const isUploading = ref(false)

// 内容
const content = ref('')
const textareaFocus = ref(false)
const cursorPosition = ref(0)

// 推荐话题
const topics = ref([])
const topicsLoading = ref(false)

// 热门话题
const hotTopics = ref([])
const hotTopicsLoading = ref(false)

// 话题搜索
const topicSearchKeyword = ref('')
const topicSearchResults = ref([])
const topicSearchLoading = ref(false)

// 位置相关 - 优化后的位置管理
const location = ref('')
const locationDetail = ref({
  address: '',
  latitude: 0,
  longitude: 0
}) // 存储完整的位置信息
const showLocationPicker = ref(false)
const isLoadingLocation = ref(false)

// 可见性
const visible = ref('public')
const visibilityOptions = [
  {value: 'public', label: '公开可见', icon: 'view', desc: '所有人都可以看到'},
  {value: 'friends', label: '仅好友可见', icon: 'usergroup', desc: '只有相互关注的好友可以看到'},
  {value: 'private', label: '仅自己可见', icon: 'lock-on', desc: '只有自己可以看到'}
]

// 显示可见性选择器
const showVisibilityPicker = ref(false)

// 草稿相关
const hasDraft = ref(false)
const showDraftTip = ref(false)
const lastSaveTime = ref(null)

// 加载推荐话题
const loadRecommendedTopics = async () => {
  topicsLoading.value = true
  try {
    const result = await CommunityApi.getRecommendedTopics()
    if (result && result.topics) {
      // 将话题对象转换为名称字符串数组（兼容现有的插入逻辑）
      topics.value = result.topics.map(topic => topic.name)
    } else {
      // 如果没有获取到话题，使用备用话题
      topics.value = ['校园生活', '学习心得', '美食分享', '考研日记', '实习经验', '社团活动']
    }
  } catch (error) {
    console.error('获取推荐话题失败:', error)
    // 失败时使用备用话题
    topics.value = ['校园生活', '学习心得', '美食分享', '考研日记', '实习经验', '社团活动']
    toast.show('获取推荐话题失败，使用默认话题')
  } finally {
    topicsLoading.value = false
  }
}

// 加载热门话题
const loadHotTopics = async () => {
  hotTopicsLoading.value = true
  try {
    const result = await CommunityApi.getHotTopics(10)
    if (result && result.topics) {
      // 转换为符合现有UI的格式
      hotTopics.value = result.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        count: topic.post_count || 0
      }))
    } else {
      // 使用备用数据
      hotTopics.value = [
        {id: 1, name: '校园生活', count: 1200},
        {id: 2, name: '美食分享', count: 980},
        {id: 3, name: '学习心得', count: 850},
        {id: 4, name: '考研日记', count: 720},
        {id: 5, name: '实习经验', count: 650},
        {id: 6, name: '社团活动', count: 520}
      ]
    }
  } catch (error) {
    console.error('获取热门话题失败:', error)
    // 使用备用数据
    hotTopics.value = [
      {id: 1, name: '校园生活', count: 1200},
      {id: 2, name: '美食分享', count: 980},
      {id: 3, name: '学习心得', count: 850},
      {id: 4, name: '考研日记', count: 720},
      {id: 5, name: '实习经验', count: 650},
      {id: 6, name: '社团活动', count: 520}
    ]
  } finally {
    hotTopicsLoading.value = false
  }
}

// 搜索话题
let searchTimeout = null
const searchTopics = async (keyword) => {
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (!keyword || keyword.trim() === '') {
    topicSearchResults.value = []
    return
  }
  
  // 防抖处理，500ms后执行搜索
  searchTimeout = setTimeout(async () => {
    topicSearchLoading.value = true
    try {
      const result = await CommunityApi.searchTopics(keyword.trim(), 10)
      if (result && result.topics) {
        topicSearchResults.value = result.topics.map(topic => ({
          id: topic.id,
          name: topic.name,
          count: topic.post_count || 0,
          description: topic.description
        }))
      } else {
        topicSearchResults.value = []
      }
    } catch (error) {
      console.error('搜索话题失败:', error)
      topicSearchResults.value = []
      toast.show('搜索话题失败')
    } finally {
      topicSearchLoading.value = false
    }
  }, 500)
}

// 处理搜索输入
const handleTopicSearch = (e) => {
  const keyword = e.detail.value
  topicSearchKeyword.value = keyword
  searchTopics(keyword)
}

// 清空搜索
const clearTopicSearch = () => {
  topicSearchKeyword.value = ''
  topicSearchResults.value = []
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
}

// 初始化数据
onMounted(() => {
  // 初始化草稿
  draftStore.initDraft()

  // 检查是否有草稿
  if (draftStore.hasDraft()) {
    hasDraft.value = true
    showDraftTip.value = true
    lastSaveTime.value = draftStore.lastSaveTime
  }

  // 加载推荐话题
  loadRecommendedTopics()
})

// 加载草稿
const loadDraft = () => {
  content.value = draftStore.content
  location.value = draftStore.location
  visible.value = draftStore.visibility

  // 处理图片数据
  if (draftStore.images && draftStore.images.length > 0) {
    images.value = [...draftStore.images]
  }

  showDraftTip.value = false
}

// 忽略草稿
const ignoreDraft = () => {
  showDraftTip.value = false
}

// 事件处理
const goBack = () => {
  if (content.value || images.value.length > 0) {
    uni.showModal({
      title: '提示',
      content: '是否保存为草稿？',
      cancelText: '不保存',
      confirmText: '保存',
      success: async (res) => {
        if (res.confirm) {
          saveDraft()
        } else {
          // 用户选择不保存，清空草稿并清理OSS文件
          draftStore.clearDraft()
          
          // 清理未提交的OSS文件
          if (images.value.length > 0) {
            try {
              const objectKeys = images.value
                .filter(img => img.objectKey && !img.media_id)
                .map(img => img.objectKey)
              
              if (objectKeys.length > 0) {
                await MediaApi.batchDeleteOSSFiles(objectKeys)
                console.log('已清理未提交的OSS文件')
              }
            } catch (cleanupError) {
              console.error('清理OSS文件失败:', cleanupError)
            }
          }
        }
        router.back()
      }
    })
  } else {
    router.back()
  }
}

// 图片选择与上传
const chooseImage = () => {
  if (images.value.length >= maxImages) {
    toast.show(`最多只能上传${maxImages}张图片`)
    return
  }

  // 如果正在上传，则不处理
  if (isUploading.value) {
    toast.show('正在上传图片，请稍后')
    return
  }

  uni.chooseImage({
    count: maxImages - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      // 显示上传进度
      isUploading.value = true
      events.emit('showUpload', 0)
      console.debug('选择图片:', res.tempFilePaths)

      try {
        // 生成笔记ID（用于临时标识）
        const noteID = await generateID()
        
        // 批量上传图片到OSS（两步法第一步）
        const uploadResults = await MediaApi.batchUploadNotesMediaToOSS(res.tempFilePaths, noteID,
          ({progress}) => {
            events.emit('updateUpload', progress)
          }
        )

        console.debug('批量上传结果:', uploadResults)

        // 处理上传结果 - 微信小程序循环上传版本
        if (Array.isArray(uploadResults)) {
          // 所有文件上传成功的情况
          uploadResults.forEach(result => {
            images.value.push({
              url: result.url,
              objectKey: result.object_key,
              type: result.type || 'image',
              uploaded: true,
              media_id: '' // 两步法第一步没有media_id
            })
          })
          
          events.emit('hideUpload')
          isUploading.value = false
          toast.success(`成功上传${uploadResults.length}张图片`)
        } else if (uploadResults && uploadResults.success && uploadResults.failed) {
          // 部分文件上传成功的情况（有成功有失败）
          uploadResults.success.forEach(result => {
            images.value.push({
              url: result.url,
              objectKey: result.object_key,
              type: result.type || 'image',
              uploaded: true,
              media_id: ''
            })
          })
          
          // 显示失败信息
          if (uploadResults.failed.length > 0) {
            console.error('部分文件上传失败:', uploadResults.failed)
            toast.show(`${uploadResults.failed.length}个文件上传失败，${uploadResults.success.length}个文件上传成功`)
          }
          
          events.emit('hideUpload')
          isUploading.value = false
          
          if (uploadResults.success.length > 0) {
            toast.success(`成功上传${uploadResults.success.length}张图片`)
          }
        } else {
          throw new Error('上传结果格式异常')
        }
      } catch (error) {
        console.error('批量上传失败:', error)
        toast.error(error.message || '图片上传失败')
        events.emit('hideUpload')
        isUploading.value = false
      }
    }
  })
}

// 移除图片
const removeImage = async (idx) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这张图片吗？',
    success: async (res) => {
      if (res.confirm) {
        const image = images.value[idx]

        // 如果图片已上传到OSS，则删除OSS文件
        if (image.uploaded && image.objectKey) {
          try {
            if (image.media_id) {
              // 如果有media_id，说明已存储到数据库，使用完整删除
              await MediaApi.deleteNotesMedia(image.media_id, image.objectKey, true)
            } else {
              // 如果只有object_key，说明只是上传到OSS，使用OSS删除
              await MediaApi.deleteOSSFile(image.objectKey)
            }
          } catch (error) {
            console.error('删除媒体失败:', error)
            // 即使删除失败也继续移除本地引用
          }
        }

        images.value.splice(idx, 1)
        toast.success('删除成功')
      }
    }
  })
}

// 预览图片
const previewImage = (idx) => {
  const urls = images.value.map(img => img.url)
  uni.previewImage({
    urls: urls,
    current: urls[idx]
  })
}

// 话题相关
const insertTopic = (topic) => {
  // 获取当前光标位置
  const position = cursorPosition.value
  const before = content.value.substring(0, position)
  const after = content.value.substring(position)

  // 在光标位置插入话题
  content.value = `${before} #${topic}# ${after}`

  // 更新光标位置到话题后面
  setTimeout(() => {
    cursorPosition.value = position + topic.length + 3 // +3 for '#' '#' and space
    textareaFocus.value = true
  }, 100)
}

// 打开话题选择器
const showTopicPicker = ref(false)
const openTopicPicker = () => {
  showTopicPicker.value = true
  // 加载热门话题
  if (hotTopics.value.length === 0) {
    loadHotTopics()
  }
}

// 位置选择相关 - 新的优化实现
/**
 * 处理地图选择位置
 * @param {Object} selectedLocation - 地图组件返回的位置信息
 * @param {string} selectedLocation.location - 坐标字符串 "经度,纬度"
 * @param {string} selectedLocation.address - 地址描述
 * @param {number} selectedLocation.latitude - 纬度
 * @param {number} selectedLocation.longitude - 经度
 * @param {string} [selectedLocation.name] - POI名称（如果是POI选择）
 * @param {number} [selectedLocation.distance] - 距离信息（如果是POI选择）
 */
const handleLocationSelect = (selectedLocation) => {
  console.log('🗺️ 选择位置:', selectedLocation)
  
  // 存储完整的位置信息
  locationDetail.value = {
    address: `${selectedLocation.address}-${selectedLocation.name}`,
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude
  }
  
  // 显示信息优先级：POI名称 > 地址描述
  let displayText = selectedLocation.address || '未知位置'
  
  // 如果是POI选择，优先显示POI名称
  if (selectedLocation.name && selectedLocation.name !== selectedLocation.address) {
    displayText = selectedLocation.name
  }
  
  // 显示地址（如果太长，截取前30个字符）
  location.value = displayText.length > 30 
    ? displayText.substring(0, 30) + '...'
    : displayText
  
  // 关闭位置选择器
  showLocationPicker.value = false
  
  // 根据选择类型显示不同的成功提示
  if (selectedLocation.name && selectedLocation.distance !== undefined) {
    // POI选择
    toast.success(`已选择：${selectedLocation.name}`)
  } else {
    // 地图点击选择
    toast.success('位置选择成功')
  }
}

/**
 * 获取当前位置
 */
const getCurrentLocationQuick = async () => {
  isLoadingLocation.value = true
  
  try {
    // 获取当前坐标
    const currentPos = await getCurrentLocation()
    
    // 获取地址信息
    const locationStr = `${currentPos.longitude},${currentPos.latitude}`
    const addressInfo = await getRegeo(locationStr)
    
    // 构造位置信息
    const currentLocationInfo = {
      location: locationStr,
      address: addressInfo.address || '当前位置',
      latitude: currentPos.latitude,
      longitude: currentPos.longitude
    }
    
    // 设置位置
    handleLocationSelect(currentLocationInfo)
    
  } catch (error) {
    console.error('❌ 获取当前位置失败:', error)
    toast.show('获取当前位置失败，请手动选择')
    
    // 失败时仍然打开地图选择器
    showLocationPicker.value = true
  } finally {
    isLoadingLocation.value = false
  }
}

/**
 * 打开位置选择器
 */
const openLocationPicker = () => {
  showLocationPicker.value = true
}

/**
 * 清除位置
 */
const clearLocation = () => {
  location.value = ''
  locationDetail.value = null
  toast.success('已清除位置')
}

// 发布笔记
const publish = async () => {
  if (!content.value.trim() && images.value.length === 0) {
    toast.show('请输入内容或上传图片')
    return
  }

  if (isUploading.value) {
    toast.show('图片正在上传，请稍候')
    return
  }

  // 提取标签
  const tagRegex = /#([^#\s]+)#/g
  const tags = []
  let match
  while ((match = tagRegex.exec(content.value)) !== null) {
    tags.push(match[1])
  }

  // 准备媒体列表（两步法：只包含OSS信息）
  const mediaList = images.value.map(img => ({
    url: img.url,
    object_key: img.objectKey,
    type: img.type || 'image'
  }))

  // 准备发布数据
  const postData = {
    content: content.value,
    media_list: mediaList, // 使用两步法的媒体列表
    location: locationDetail.value ? {
      address: locationDetail.value.address,
      longitude: locationDetail.value.longitude,
      latitude: locationDetail.value.latitude
    } : null, // 使用完整位置信息
    visibility: visible.value,
    tags: tags
  }

  uni.showLoading({
    title: '发布中...'
  })

  try {
    // 发布帖子（后端会处理媒体记录的创建）
    await CommunityApi.createPost(postData)

    uni.hideLoading()
    toast.success('发布成功')

    // 发布成功后清空草稿
    draftStore.clearDraft()

    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (error) {
    uni.hideLoading()
    toast.error(error.message || '发布失败')
    
    // 发布失败时，清理已上传的OSS文件
    if (images.value.length > 0) {
      try {
        const objectKeys = images.value
          .filter(img => img.objectKey && !img.media_id)
          .map(img => img.objectKey)
        
        if (objectKeys.length > 0) {
          await MediaApi.batchDeleteOSSFiles(objectKeys)
          console.log('已清理失败发布的OSS文件')
        }
      } catch (cleanupError) {
        console.error('清理OSS文件失败:', cleanupError)
      }
    }
  }
}

// 保存草稿
const saveDraft = () => {
  if (!content.value.trim() && images.value.length === 0) {
    toast.show('没有可保存的内容')
    return
  }

  // 保存到Pinia
  const success = draftStore.saveDraft({
    content: content.value,
    images: images.value,
    location: location.value,
    visibility: visible.value
  })

  if (success) {
    toast.success('已保存到草稿箱')
  } else {
    toast.error('保存失败')
  }
}

// 预览
const preview = () => {
  if (!content.value.trim() && images.value.length === 0) {
    toast.show('没有可预览的内容')
    return
  }
  toast.show('预览功能开发中')
}

// 记录光标位置
const onTextareaInput = (e) => {
  cursorPosition.value = e.target.cursor || 0
}
</script>

<template>
  <layout>
    <template #left>
      <view @tap="goBack" class="p-16rpx active:opacity-60 transition-opacity">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>

    <template #center>
      <view class="text-32rpx font-medium text-#333">发布笔记</view>
    </template>

    <!-- 草稿提示 -->
    <view v-if="showDraftTip"
          class="mx-30rpx mt-20rpx bg-blue-50 rounded-16rpx p-24rpx flex items-center justify-between">
      <view>
        <text class="text-28rpx text-blue-600 font-medium">发现未发布的草稿</text>
        <text class="text-24rpx text-blue-500 block mt-6rpx">{{ formatTime(lastSaveTime) }}</text>
      </view>
      <view class="flex gap-20rpx">
        <button class="px-20rpx py-10rpx rounded-full bg-white text-26rpx text-blue-500 border border-blue-200"
                @tap="ignoreDraft">忽略
        </button>
        <button class="px-20rpx py-10rpx rounded-full bg-blue-500 text-26rpx text-white" @tap="loadDraft">恢复</button>
      </view>
    </view>

    <!-- 主要内容区 -->
    <view class="flex-1 px-30rpx pt-20rpx pb-180rpx">
      <!-- 内容输入区 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm p-30rpx">
        <textarea
            v-model="content"
            class="w-full min-h-200rpx text-30rpx text-#333 placeholder-gray-400 leading-relaxed"
            placeholder="分享你的校园生活、学习心得或有趣经历..."
            :focus="textareaFocus"
            :cursor="cursorPosition"
            maxlength="2000"
            @input="onTextareaInput"
            @blur="textareaFocus = false"
        />

        <!-- 字数统计 -->
        <view class="flex justify-end mt-10rpx">
          <text class="text-24rpx text-gray-400">{{ content.length }}/2000</text>
        </view>
      </view>

      <!-- 图片上传区 -->
      <view v-if="images.length > 0 || !isUploading" class="mb-20rpx bg-white rounded-20rpx shadow-sm p-30rpx">
        <view class="flex flex-wrap gap-20rpx">
          <view
              v-for="(img, idx) in images"
              :key="idx"
              class="relative w-210rpx h-210rpx rounded-16rpx overflow-hidden shadow-sm transition-transform duration-300 active:scale-98"
              @tap="previewImage(idx)"
          >
            <image :src="img.url" mode="aspectFill" class="w-full h-full object-cover"/>
            <view
                class="absolute top-10rpx right-10rpx w-44rpx h-44rpx rounded-full bg-black/60 flex items-center justify-center active:bg-black/80 transition-colors"
                @tap.stop="removeImage(idx)"
            >
              <WdIcon name="close" size="28rpx" color="#fff"/>
            </view>
          </view>

          <!-- 添加图片按钮 -->
          <view
              v-if="images.length < maxImages && !isUploading"
              class="w-210rpx h-210rpx rounded-16rpx border-2 border-dashed border-gray-300 flex flex-col items-center justify-center bg-gray-50 transition-all duration-300 active:bg-gray-100 active:scale-98"
              @tap="chooseImage"
          >
            <WdIcon name="camera" size="56rpx" color="#bbb"/>
            <text class="text-26rpx text-gray-400 mt-16rpx">添加图片</text>
            <text class="text-22rpx text-gray-300 mt-4rpx">{{ images.length }}/{{ maxImages }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐话题 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm p-30rpx">
        <view class="flex items-center justify-between mb-20rpx">
          <text class="text-28rpx font-medium text-#333">推荐话题</text>
          <view
              class="flex items-center text-26rpx text-blue-500 active:text-blue-600 transition-colors"
              @tap="openTopicPicker"
          >
            <text>更多</text>
            <WdIcon name="arrow-right" size="24rpx" color="#3b82f6"/>
          </view>
        </view>

        <scroll-view scroll-x class="whitespace-nowrap -mx-30rpx px-30rpx pb-10rpx">
          <view class="inline-flex gap-20rpx">
            <!-- 加载状态 -->
            <view v-if="topicsLoading" class="inline-flex gap-20rpx">
              <view v-for="i in 6" :key="i" class="bg-gray-100 rounded-full px-24rpx py-12rpx text-26rpx animate-pulse whitespace-nowrap">
                <text class="text-transparent">加载中</text>
              </view>
            </view>
            <!-- 话题列表 -->
            <view v-else class="inline-flex gap-20rpx">
              <view
                  v-for="topic in topics"
                  :key="topic"
                  class="bg-blue-50 rounded-full px-24rpx py-12rpx text-26rpx text-blue-500 active:bg-blue-100 transition-all whitespace-nowrap"
                  @tap="insertTopic(topic)"
              >
                # {{ topic }}
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 位置选择 - 优化后的版本 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view
            class="flex items-center justify-between px-30rpx py-26rpx active:bg-gray-50 transition-colors"
            @tap="openLocationPicker"
        >
          <view class="flex items-center gap-16rpx flex-1">
            <WdIcon name="location" size="36rpx" color="#f59e0b"/>
            <text class="text-28rpx text-#333 flex-1">{{ location || '添加位置' }}</text>
          </view>
          <view class="flex items-center gap-20rpx">
            <!-- 当前位置按钮 -->
            <view
                v-if="!location"
                class="px-20rpx py-8rpx rounded-full bg-blue-50 flex items-center gap-8rpx active:bg-blue-100 transition-colors"
                @tap.stop="getCurrentLocationQuick"
            >
              <WdIcon 
                name="loading" 
                v-if="isLoadingLocation" 
                size="24rpx" 
                color="#3b82f6" 
                class="animate-spin"
              />
              <WdIcon v-else name="location" size="24rpx" color="#3b82f6"/>
              <text class="text-24rpx text-blue-600">{{ isLoadingLocation ? '定位中' : '当前位置' }}</text>
            </view>
            
            <!-- 清除位置按钮 -->
            <view
                v-if="location"
                class="px-20rpx py-8rpx rounded-full bg-gray-50 active:bg-gray-100 transition-colors"
                @tap.stop="clearLocation"
            >
              <WdIcon name="close" size="24rpx" color="#999"/>
            </view>
            
            <WdIcon name="arrow-right" size="32rpx" color="#bbb"/>
          </view>
        </view>
      </view>

      <!-- 可见性设置 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view 
          class="flex items-center justify-between px-30rpx py-26rpx active:bg-gray-50 transition-colors"
          @tap="showVisibilityPicker = true"
        >
          <view class="flex items-center gap-16rpx flex-1">
            <WdIcon
                :name="visibilityOptions.find(v => v.value === visible)?.icon || 'view'"
                size="36rpx"
                color="#3b82f6"
            />
            <view class="flex-1">
              <text class="text-28rpx text-#333 block">{{
                  visibilityOptions.find(v => v.value === visible)?.label || '公开可见'
                }}
              </text>
              <text class="text-24rpx text-gray-500">{{
                  visibilityOptions.find(v => v.value === visible)?.desc || ''
                }}
              </text>
            </view>
          </view>
          <WdIcon name="arrow-right" size="32rpx" color="#bbb"/>
        </view>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view
        class="fixed bottom-0 left-0 w-full flex items-center justify-between px-30rpx py-20rpx bg-white border-t border-gray-100 z-10 safe-area-bottom">
      <view class="flex gap-40rpx">
        <view class="flex flex-col items-center" @tap="saveDraft">
          <view
              class="w-60rpx h-60rpx rounded-full bg-gray-100 flex items-center justify-center mb-6rpx active:bg-gray-200 transition-colors">
            <WdIcon name="save" size="32rpx" color="#666"/>
          </view>
          <text class="text-22rpx text-gray-500">存草稿</text>
        </view>
      </view>
      <view class="flex-1 flex justify-end">
        <button
            class="w-240rpx h-80rpx rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-30rpx font-medium flex items-center justify-center shadow-lg active:opacity-90 transition-opacity"
            :disabled="isUploading"
            @tap="publish"
        >
          <text v-if="!isUploading">发布笔记</text>
          <text v-else>上传中...</text>
        </button>
      </view>
    </view>

    <!-- 话题选择弹窗 -->
    <view v-if="showTopicPicker" class="fixed inset-0 bg-black/60 z-50 flex flex-col" @tap="showTopicPicker = false; clearTopicSearch()">
      <view class="mt-auto bg-white rounded-t-24rpx p-30rpx safe-area-bottom" @tap.stop>
        <view class="flex items-center justify-between mb-30rpx">
          <text class="text-32rpx font-medium text-#333">选择话题</text>
          <view class="p-10rpx" @tap="showTopicPicker = false; clearTopicSearch()">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>

        <view class="mb-20rpx">
          <view class="bg-gray-100 rounded-full flex items-center px-24rpx py-16rpx">
            <WdIcon name="search" size="32rpx" color="#999"/>
            <input 
              class="flex-1 ml-16rpx text-28rpx" 
              placeholder="搜索话题"
              :value="topicSearchKeyword"
              @input="handleTopicSearch"
            />
            <view v-if="topicSearchLoading" class="ml-16rpx">
              <WdIcon name="loading" size="28rpx" color="#999" class="animate-spin"/>
            </view>
          </view>
        </view>

        <!-- 搜索结果 -->
        <view v-if="topicSearchKeyword && topicSearchResults.length > 0" class="mb-30rpx">
          <text class="text-28rpx font-medium text-#333 mb-20rpx block">搜索结果</text>
          <view class="space-y-16rpx">
            <view
                v-for="topic in topicSearchResults"
                :key="topic.id"
                class="bg-gray-50 rounded-16rpx p-20rpx active:bg-gray-100 transition-colors"
                @tap="insertTopic(topic.name); showTopicPicker = false"
            >
              <text class="text-28rpx text-#333 font-medium block mb-8rpx"># {{ topic.name }}</text>
              <text class="text-24rpx text-gray-500 block mb-4rpx">{{ topic.count }}人参与</text>
              <text v-if="topic.description" class="text-22rpx text-gray-400">{{ topic.description }}</text>
            </view>
          </view>
        </view>

        <!-- 没有搜索结果时的提示 -->
        <view v-else-if="topicSearchKeyword && !topicSearchLoading && topicSearchResults.length === 0" class="mb-30rpx">
          <view class="text-center py-40rpx">
            <WdIcon name="search" size="64rpx" color="#ccc"/>
            <text class="text-26rpx text-gray-400 block mt-16rpx">没有找到相关话题</text>
            <text class="text-24rpx text-gray-300 block mt-8rpx">试试其他关键词</text>
          </view>
        </view>

        <!-- 热门话题 -->
        <view v-if="!topicSearchKeyword" class="mb-30rpx">
          <text class="text-28rpx font-medium text-#333 mb-20rpx block">热门话题</text>
          
          <!-- 热门话题加载状态 -->
          <view v-if="hotTopicsLoading" class="grid grid-cols-2 gap-20rpx">
            <view v-for="i in 6" :key="i" class="bg-gray-100 rounded-16rpx p-20rpx animate-pulse">
              <view class="h-32rpx bg-gray-200 rounded mb-8rpx"></view>
              <view class="h-24rpx bg-gray-200 rounded w-2/3"></view>
            </view>
          </view>
          
          <!-- 热门话题列表 -->
          <view v-else class="grid grid-cols-2 gap-20rpx">
            <view
                v-for="topic in hotTopics"
                :key="topic.id"
                class="bg-gray-50 rounded-16rpx p-20rpx active:bg-gray-100 transition-colors"
                @tap="insertTopic(topic.name); showTopicPicker = false"
            >
              <text class="text-28rpx text-#333 font-medium block mb-8rpx"># {{ topic.name }}</text>
              <text class="text-24rpx text-gray-500">{{ topic.count }}人参与</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 位置选择弹窗 - 集成地图组件 -->
    <view v-if="showLocationPicker" class="location-picker-modal">
      <!-- 顶部导航栏 -->
      <view class="location-picker-header">
        <view @tap="showLocationPicker = false" class="p-10rpx active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="36rpx" color="#333"/>
        </view>
        <text class="text-32rpx font-medium text-#333">选择位置</text>
        <view class="w-56rpx"></view> <!-- 占位元素保持居中 -->
      </view>
      
      <!-- 地图组件区域 -->
      <view class="location-picker-map">
        <Amap
            :show-search="true"
            :show-controls="true"
            :show-center-pin="true"
            :show-location="true"
            @select="handleLocationSelect"
        />
      </view>
      
      <!-- 底部提示 -->
      <view class="location-picker-footer">
        <text class="text-26rpx text-gray-500 text-center block">
          点击地图任意位置或搜索地点来选择位置
        </text>
      </view>
    </view>

    <!-- 可见性选择弹窗 -->
    <view v-if="showVisibilityPicker" class="fixed inset-0 bg-black/60 z-50 flex flex-col" @tap="showVisibilityPicker = false">
      <view class="mt-auto bg-white rounded-t-24rpx p-30rpx safe-area-bottom" @tap.stop>
        <view class="flex items-center justify-between mb-30rpx">
          <text class="text-32rpx font-medium text-#333">选择可见性</text>
          <view class="p-10rpx" @tap="showVisibilityPicker = false">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>

        <view class="space-y-4rpx">
          <view
              v-for="option in visibilityOptions"
              :key="option.value"
              class="flex items-center p-24rpx rounded-16rpx transition-colors"
              :class="visible === option.value ? 'bg-blue-50' : 'bg-gray-50 active:bg-gray-100'"
              @tap="visible = option.value; showVisibilityPicker = false"
          >
            <view class="w-64rpx h-64rpx rounded-full flex items-center justify-center mr-24rpx"
                  :class="visible === option.value ? 'bg-blue-100' : 'bg-white'">
              <WdIcon 
                :name="option.icon" 
                size="32rpx" 
                :color="visible === option.value ? '#3b82f6' : '#666'"
              />
            </view>
            <view class="flex-1">
              <text class="text-28rpx font-medium block mb-8rpx"
                    :class="visible === option.value ? 'text-blue-600' : 'text-#333'">
                {{ option.label }}
              </text>
              <text class="text-24rpx text-gray-500">{{ option.desc }}</text>
            </view>
            <view v-if="visible === option.value" class="ml-16rpx">
              <WdIcon name="check" size="28rpx" color="#3b82f6"/>
            </view>
          </view>
        </view>

        <view class="mt-30rpx pt-20rpx border-t border-gray-100">
          <text class="text-24rpx text-gray-400 leading-relaxed">
            💡 提示：好友是指相互关注的用户。选择"仅好友可见"后，只有与你相互关注的用户才能看到这条笔记。
          </text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style scoped>
.safe-area-bottom {
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.safe-area-top {
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

/* 旋转动画 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 位置选择器样式 */
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
  padding: 20rpx 30rpx;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

.location-picker-map {
  flex: 1;
  height: 0; /* 强制flex子元素使用flex高度 */
  position: relative;
}

.location-picker-footer {
  padding: 20rpx 30rpx;
  background: white;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
</style>
