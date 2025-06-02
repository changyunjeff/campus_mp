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
const topics = [
  '连麦', '来立个小目标', '哼噻', '通知', '我的确定性', '自我介绍'
]

// 热门话题
const hotTopics = [
  {id: 1, name: '校园生活', count: 1200},
  {id: 2, name: '美食分享', count: 980},
  {id: 3, name: '学习心得', count: 850},
  {id: 4, name: '考研日记', count: 720},
  {id: 5, name: '实习经验', count: 650},
  {id: 6, name: '社团活动', count: 520}
]

// 位置
const location = ref('')
const showLocationPicker = ref(false)
const locationList = [
  '泗阳县佛鹰气体有', '江苏仙之宝食品有', '江苏省香之派食品', '江苏好吃食品'
]

// 可见性
const visible = ref('public')
const visibilityOptions = [
  {value: 'public', label: '公开可见', icon: 'view'},
  {value: 'friends', label: '仅好友可见', icon: 'usergroup'},
  {value: 'private', label: '仅自己可见', icon: 'lock-on'}
]

// 草稿相关
const hasDraft = ref(false)
const showDraftTip = ref(false)
const lastSaveTime = ref(null)

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
    uni.showToast({
      title: `最多只能上传${maxImages}张图片`,
      icon: 'none'
    })
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
        const uploadResults = await MediaApi.batchUploadNotesMediaToOSS({
          files: res.tempFilePaths,
          notes_id: noteID,
          onProgress: ({progress}) => {
            events.emit('updateUpload', progress)
          }
        })

        // 处理上传结果
        if (Array.isArray(uploadResults)) {
          // 所有文件都上传成功
          uploadResults.forEach(result => {
            images.value.push({
              url: result.url,
              objectKey: result.object_key,
              type: result.type || 'image',
              uploaded: true,
              media_id: '' // 两步法第一步没有media_id
            })
          })
        } else if (uploadResults.success) {
          // 部分文件上传成功
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
          if (uploadResults.failed && uploadResults.failed.length > 0) {
            console.error('部分文件上传失败:', uploadResults.failed)
            toast.show(`${uploadResults.failed.length}个文件上传失败`, 'warning')
          }
        }

        // 上传完成
        events.emit('hideUpload')
        isUploading.value = false
        toast.success(`成功上传${uploadResults.length || uploadResults.success?.length || 0}张图片`)
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
}

// 选择位置
const selectLocation = (loc) => {
  location.value = loc
  showLocationPicker.value = false
}

// 打开位置选择器
const openLocationPicker = () => {
  showLocationPicker.value = true
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
    location: location.value,
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
            <view
                v-for="topic in topics"
                :key="topic"
                class="bg-blue-50 rounded-full px-24rpx py-12rpx text-26rpx text-blue-500 active:bg-blue-100 transition-all whitespace-nowrap"
                @tap="insertTopic(topic)"
            >
              # {{ topic }}
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 位置选择 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view
            class="flex items-center justify-between px-30rpx py-26rpx active:bg-gray-50 transition-colors"
            @tap="openLocationPicker"
        >
          <view class="flex items-center gap-16rpx">
            <WdIcon name="location" size="36rpx" color="#f59e0b"/>
            <text class="text-28rpx text-#333">{{ location || '添加位置' }}</text>
          </view>
          <WdIcon name="arrow-right" size="32rpx" color="#bbb"/>
        </view>
      </view>

      <!-- 可见性设置 -->
      <view class="mb-20rpx bg-white rounded-20rpx shadow-sm overflow-hidden">
        <view class="flex items-center justify-between px-30rpx py-26rpx active:bg-gray-50 transition-colors">
          <view class="flex items-center gap-16rpx">
            <WdIcon
                :name="visibilityOptions.find(v => v.value === visible)?.icon || 'view'"
                size="36rpx"
                color="#3b82f6"
            />
            <text class="text-28rpx text-#333">{{
                visibilityOptions.find(v => v.value === visible)?.label || '公开可见'
              }}
            </text>
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
    <view v-if="showTopicPicker" class="fixed inset-0 bg-black/60 z-50 flex flex-col" @tap="showTopicPicker = false">
      <view class="mt-auto bg-white rounded-t-24rpx p-30rpx safe-area-bottom" @tap.stop>
        <view class="flex items-center justify-between mb-30rpx">
          <text class="text-32rpx font-medium text-#333">选择话题</text>
          <view class="p-10rpx" @tap="showTopicPicker = false">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>

        <view class="mb-20rpx">
          <view class="bg-gray-100 rounded-full flex items-center px-24rpx py-16rpx">
            <WdIcon name="search" size="32rpx" color="#999"/>
            <input class="flex-1 ml-16rpx text-28rpx" placeholder="搜索话题"/>
          </view>
        </view>

        <view class="mb-30rpx">
          <text class="text-28rpx font-medium text-#333 mb-20rpx block">热门话题</text>
          <view class="grid grid-cols-2 gap-20rpx">
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

    <!-- 位置选择弹窗 -->
    <view v-if="showLocationPicker" class="fixed inset-0 bg-black/60 z-50 flex flex-col"
          @tap="showLocationPicker = false">
      <view class="mt-auto bg-white rounded-t-24rpx p-30rpx safe-area-bottom" @tap.stop>
        <view class="flex items-center justify-between mb-30rpx">
          <text class="text-32rpx font-medium text-#333">选择位置</text>
          <view class="p-10rpx" @tap="showLocationPicker = false">
            <WdIcon name="close" size="36rpx" color="#999"/>
          </view>
        </view>

        <view class="mb-20rpx">
          <view class="bg-gray-100 rounded-full flex items-center px-24rpx py-16rpx">
            <WdIcon name="search" size="32rpx" color="#999"/>
            <input class="flex-1 ml-16rpx text-28rpx" placeholder="搜索位置"/>
          </view>
        </view>

        <view class="mb-30rpx">
          <text class="text-28rpx font-medium text-#333 mb-20rpx block">附近位置</text>
          <view class="divide-y divide-gray-100">
            <view
                v-for="loc in locationList"
                :key="loc"
                class="py-24rpx flex items-center active:bg-gray-50 transition-colors"
                @tap="selectLocation(loc)"
            >
              <WdIcon name="location" size="32rpx" color="#f59e0b" class="mr-16rpx"/>
              <text class="text-28rpx text-#333">{{ loc }}</text>
            </view>
          </view>
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
</style>
