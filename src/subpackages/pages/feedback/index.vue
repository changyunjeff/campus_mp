<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { throttle } from 'lodash'
import Layout from '@/layout/index.vue'
import { useToast } from "@/composables/toast"
import { upload, batch_upload } from '@/utils/request'
import { useRouter } from 'uni-mini-router'
import {FeedbackApi} from "@/subpackages/api/feedback";

const toast = useToast()
const router = useRouter()

// 表单数据
const form = reactive({
  type: 'suggestion', // suggestion: 意见建议, bug: Bug报告
  title: '',
  description: '',
  contact: '', // 联系方式（可选）
  media: [] // 媒体文件列表 { url, object_key, type, name }
})

// 页面状态
const isSubmitting = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// 反馈类型选项
const feedbackTypes = [
  {
    value: 'suggestion',
    label: '意见建议',
    icon: 'lightbulb',
    desc: '功能建议、用户体验改进等',
    color: '#3b82f6'
  },
  {
    value: 'bug',
    label: 'Bug报告',
    icon: 'bug',
    desc: '功能异常、闪退、卡顿等问题',
    color: '#ef4444'
  }
]

// 媒体文件上传相关
const maxMediaCount = 9
const maxFileSize = 10 * 1024 * 1024 // 10MB

// 草稿相关
const draftKey = 'feedback_draft'
const dontLoadDraft = ref(false)

// 计算属性
const currentTypeInfo = computed(() => {
  return feedbackTypes.find(type => type.value === form.type)
})

const canSubmit = computed(() => {
  return form.title.trim() && form.description.trim() && !isSubmitting.value
})

const remainingMediaSlots = computed(() => {
  return maxMediaCount - form.media.length
})

// 页面加载时恢复草稿
onMounted(() => {
  loadDraft()
})

// 页面卸载时保存草稿
onUnmounted(() => {
  if (!dontLoadDraft.value) {
    saveDraft()
  }
})

// 保存草稿
const saveDraft = () => {
  if (form.title.trim() || form.description.trim() || form.media.length > 0) {
    uni.setStorageSync(draftKey, JSON.stringify(form))
  }
}

// 加载草稿
const loadDraft = () => {
  try {
    const draft = uni.getStorageSync(draftKey)
    if (draft) {
      const draftData = JSON.parse(draft)
      Object.assign(form, draftData)
      toast.show('已恢复草稿内容')
    }
  } catch (err) {
    console.error('加载草稿失败:', err)
  }
}



// 清除草稿
const clearDraft = () => {
  uni.removeStorageSync(draftKey)
  dontLoadDraft.value = true
}

// 选择反馈类型
const selectFeedbackType = (type) => {
  form.type = type
  saveDraft()
}

// 选择媒体文件
const selectMedia = throttle(() => {
  if (form.media.length >= maxMediaCount) {
    toast.show(`最多只能上传${maxMediaCount}个文件`)
    return
  }

  uni.showActionSheet({
    itemList: ['拍照', '从相册选择', '录制视频', '选择视频'],
    success: (res) => {
      switch (res.tapIndex) {
        case 0:
          chooseImage('camera')
          break
        case 1:
          chooseImage('album')
          break
        case 2:
          chooseVideo('camera')
          break
        case 3:
          chooseVideo('album')
          break
      }
    }
  })
}, 1000)

// 选择图片
const chooseImage = (sourceType) => {
  uni.chooseImage({
    count: remainingMediaSlots.value,
    sourceType: [sourceType],
    success: async (res) => {
      await uploadFiles(res.tempFilePaths, 'image')
    },
    fail: (err) => {
      console.error('选择图片失败:', err)
      toast.show('选择图片失败')
    }
  })
}

// 选择视频
const chooseVideo = (sourceType) => {
  uni.chooseVideo({
    sourceType: [sourceType],
    maxDuration: 60, // 最大60秒
    success: async (res) => {
      await uploadFiles([res.tempFilePath], 'video')
    },
    fail: (err) => {
      console.error('选择视频失败:', err)
      toast.show('选择视频失败')
    }
  })
}

// 上传文件
const uploadFiles = async (filePaths, type) => {
  if (isUploading.value) return

  isUploading.value = true
  uploadProgress.value = 0

  try {
    const uploadPromises = filePaths.map(async (filePath) => {
      // 检查文件大小
      const fileInfo = await new Promise((resolve, reject) => {
        uni.getFileInfo({
          filePath,
          success: resolve,
          fail: reject
        })
      })

      if (fileInfo.size > maxFileSize) {
        throw new Error('文件大小不能超过10MB')
      }

      // 使用FeedbackApi上传到OSS
      const uploadResult = await FeedbackApi.uploadMedia(filePath, (progress) => {
        uploadProgress.value = Math.round(progress * 100)
      })

      return {
        url: uploadResult.url,
        object_key: uploadResult.object_key,
        type: type,
        name: filePath.split('/').pop(),
        size: fileInfo.size
      }
    })

    const uploadResults = await Promise.all(uploadPromises)
    form.media.push(...uploadResults)
    
    toast.show('文件上传成功')
    saveDraft() // 保存草稿
  } catch (err) {
    console.error('文件上传失败:', err)
    toast.show(err.message || '文件上传失败')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

// 预览媒体文件
const previewMedia = throttle((media, index) => {
  if (media.type === 'image') {
    const imageUrls = form.media
      .filter(item => item.type === 'image')
      .map(item => item.url)
    const currentIndex = imageUrls.indexOf(media.url)
    
    uni.previewImage({
      urls: imageUrls,
      current: currentIndex
    })
  } else if (media.type === 'video') {
    // 视频预览
    uni.previewMedia({
      sources: [{
        url: media.url,
        type: 'video'
      }]
    })
  }
}, 1000)

// 删除媒体文件
const removeMedia = throttle(async (index) => {
  uni.showModal({
    title: '确认删除',
    content: '删除后无法恢复，确定要删除这个文件吗？',
    success: async (res) => {
      if (res.confirm) {
        const mediaToDelete = form.media[index]
        
        try {
          // 删除OSS文件
          await FeedbackApi.deleteMedia(mediaToDelete.object_key)
          
          // 从本地数组中删除
          form.media.splice(index, 1)
          saveDraft() // 保存草稿
          toast.show('文件已删除')
        } catch (err) {
          console.error('删除文件失败:', err)
          toast.show('删除文件失败')
        }
      }
    }
  })
}, 1000)

// 提交反馈
const submitFeedback = throttle(async () => {
  if (!canSubmit.value) return

  isSubmitting.value = true

  try {
    const requestData = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      contact: form.contact.trim(),
      media: form.media.map(item => ({
        url: item.url,
        object_key: item.object_key,
        type: item.type
      }))
    }

    // 调用反馈提交API
    await FeedbackApi.submitFeedback(requestData)
    
    toast.show('提交成功，感谢您的反馈！')
    
    // 清除草稿
    clearDraft()
    
    // 延迟返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
    
  } catch (err) {
    console.error('提交反馈失败:', err)
    toast.show(err.message || '提交失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}, 2000)

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 返回上一页
const goBack = () => {
  if (form.title.trim() || form.description.trim() || form.media.length > 0) {
    uni.showModal({
      title: '提示',
      content: '当前有未保存的内容，是否保存为草稿？',
      showCancel: true,
      cancelText: '直接退出',
      confirmText: '保存草稿',
      success: (res) => {
        if (res.confirm) {
          saveDraft()
        } else {
          clearDraft()
        }
        router.back()
      }
    })
  } else {
    router.back()
  }
}
</script>

<template>
  <Layout>
    <template #left>
      <view class="flex items-center h-full">
        <WdIcon
            name="arrow-left"
            size="40rpx"
            color="#333"
            @tap="goBack"
        />
      </view>
    </template>

    <scroll-view scroll-y class="bg-#f8f8f8 h-full">
      <!-- 反馈类型选择 -->
      <view class="bg-white mt-20rpx p-30rpx">
        <text class="text-28rpx font-bold text-#333 mb-20rpx block">反馈类型</text>
        <view class="flex gap-20rpx">
          <view
            v-for="type in feedbackTypes"
            :key="type.value"
            :class="[
              'flex-1 p-30rpx rounded-16rpx border-2rpx transition-all duration-300',
              form.type === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white'
            ]"
            @tap="selectFeedbackType(type.value)"
          >
            <view class="flex items-center mb-16rpx">
              <WdIcon 
                :name="type.icon" 
                size="40rpx" 
                :color="form.type === type.value ? type.color : '#999'" 
              />
              <text 
                :class="[
                  'ml-16rpx text-28rpx font-semibold',
                  form.type === type.value ? 'text-blue-600' : 'text-#333'
                ]"
              >
                {{ type.label }}
              </text>
            </view>
            <text class="text-24rpx text-gray-500 leading-1.4">{{ type.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 标题输入 -->
      <view class="bg-white mt-20rpx p-30rpx">
        <text class="text-28rpx font-bold text-#333 mb-20rpx block">
          标题 <span class="text-red-500">*</span>
        </text>
        <input
          v-model="form.title"
          class="w-full px-20rpx py-24rpx border border-gray-200 rounded-12rpx text-28rpx"
          maxlength="50"
          @input="saveDraft"
        />
        <view class="flex justify-end mt-10rpx">
          <text class="text-24rpx text-gray-400">{{ form.title.length }}/50</text>
        </view>
      </view>

      <!-- 详细描述 -->
      <view class="bg-white mt-20rpx p-30rpx">
        <text class="text-28rpx font-bold text-#333 mb-20rpx block">
          详细描述 <span class="text-red-500">*</span>
        </text>
        <textarea
          v-model="form.description"
          class="w-full px-20rpx py-24rpx border border-gray-200 rounded-12rpx text-28rpx"
          :placeholder="currentTypeInfo.value === 'suggestion' ? '请详细描述您的建议或期望的功能...' : '请详细描述问题的现象、复现步骤等...'"
          auto-height
          maxlength="500"
          @input="saveDraft"
        />
        <view class="flex justify-end mt-10rpx">
          <text class="text-24rpx text-gray-400">{{ form.description.length }}/500</text>
        </view>
      </view>

      <!-- 媒体文件上传 -->
      <view class="bg-white mt-20rpx p-30rpx">
        <view class="flex items-center justify-between mb-20rpx">
          <text class="text-28rpx font-bold text-#333">相关截图/视频</text>
          <text class="text-24rpx text-gray-400">{{ form.media.length }}/{{ maxMediaCount }}</text>
        </view>
        
        <!-- 媒体文件网格 -->
        <view class="grid grid-cols-3 gap-20rpx">
          <!-- 已上传的媒体文件 -->
          <view
            v-for="(media, index) in form.media"
            :key="index"
            class="relative aspect-square rounded-12rpx overflow-hidden bg-gray-100"
          >
            <!-- 图片预览 -->
            <image
              v-if="media.type === 'image'"
              :src="media.url"
              mode="aspectFill"
              class="w-full h-full transition-all duration-300 media-item"
              @tap="previewMedia(media, index)"
            />
            
            <!-- 视频预览 -->
            <view
              v-else-if="media.type === 'video'"
              class="w-full h-full bg-black flex items-center justify-center relative"
              @tap="previewMedia(media, index)"
            >
              <WdIcon name="play-circle" size="60rpx" color="white" />
              <text class="absolute bottom-10rpx left-10rpx text-white text-20rpx bg-black bg-opacity-50 px-8rpx py-4rpx rounded-6rpx">
                视频
              </text>
            </view>

            <!-- 删除按钮 -->
            <view
              class="absolute top-10rpx right-10rpx w-40rpx h-40rpx bg-red-500 rounded-full flex items-center justify-center transition-all duration-300 remove-btn"
              @tap.stop="removeMedia(index)"
            >
              <WdIcon name="x" size="24rpx" color="white" />
            </view>

            <!-- 文件信息 -->
            <view class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-20rpx px-10rpx py-6rpx">
              <text class="block truncate">{{ media.name }}</text>
              <text class="text-18rpx opacity-80">{{ formatFileSize(media.size) }}</text>
            </view>
          </view>

          <!-- 上传按钮 -->
          <view
            v-if="form.media.length < maxMediaCount"
            class="aspect-square border-2rpx border-dashed border-gray-300 rounded-12rpx flex flex-col items-center justify-center transition-all duration-300 upload-btn"
            :class="{ 'pointer-events-none opacity-50': isUploading }"
            @tap="selectMedia"
          >
            <WdIcon 
              :name="isUploading ? 'loader' : 'plus'" 
              size="48rpx" 
              color="#999"
              :class="{ 'animate-spin': isUploading }"
            />
            <text class="text-24rpx text-gray-500 mt-10rpx">
              {{ isUploading ? '上传中...' : '添加文件' }}
            </text>
            <text v-if="isUploading" class="text-20rpx text-gray-400 mt-6rpx">
              {{ uploadProgress }}%
            </text>
          </view>
        </view>

        <view class="mt-20rpx p-20rpx bg-blue-50 rounded-12rpx">
          <text class="text-24rpx text-blue-600 block">📝 温馨提示</text>
          <text class="text-24rpx text-blue-600 mt-6rpx block">
            • 支持图片和视频格式，单个文件不超过10MB
          </text>
          <text class="text-24rpx text-blue-600 mt-6rpx block">
            • 提供截图或录屏有助于我们更快定位和解决问题
          </text>
        </view>
      </view>

      <!-- 联系方式（可选） -->
      <view class="bg-white mt-20rpx p-30rpx">
        <text class="text-28rpx font-bold text-#333 mb-20rpx block">联系方式（可选）</text>
        <input
          v-model="form.contact"
          class="w-full px-20rpx py-24rpx border border-gray-200 rounded-12rpx text-28rpx"
          maxlength="50"
          @input="saveDraft"
        />
        <text class="text-24rpx text-gray-500 mt-10rpx block">
          填写联系方式有助于我们更好地为您解决问题
        </text>
      </view>

      <!-- 底部占位 -->
      <view class="h-200rpx"></view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-30rpx safe-area-inset-bottom">
      <button
        :class="[
          'w-full py-28rpx rounded-16rpx text-32rpx font-bold transition-all duration-300',
          canSubmit
            ? 'bg-blue-500 text-white submit-btn-active'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        ]"
        :disabled="!canSubmit"
        @tap="submitFeedback"
      >
        <view v-if="isSubmitting" class="flex items-center justify-center">
          <WdIcon name="loader" size="32rpx" color="currentColor" class="animate-spin mr-16rpx" />
          <text>提交中...</text>
        </view>
        <text v-else>提交反馈</text>
      </button>
    </view>
  </Layout>
</template>

<style scoped lang="scss">
/* 输入框聚焦样式 */
input:focus,
textarea:focus {
  border-color: #3b82f6;
  outline: none;
}

/* 安全区域底部适配 */
.safe-area-inset-bottom {
  padding-bottom: calc(30rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

/* 动画效果 */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 点击状态样式 */
.media-item:active {
  opacity: 0.8;
}

.remove-btn:active {
  transform: scale(0.9);
}

.upload-btn:active {
  background-color: #f9fafb;
}

.submit-btn-active:active {
  background-color: #2563eb;
}
</style>