<template>
  <common :step="2">
    <view class="flex flex-col h-full relative">
      <!-- 顶部说明文字 -->
      <view class="mb-48rpx animate animate-slide-down">
        <view
            class="text-40rpx font-semibold mb-16rpx bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent relative inline-block">
          上传身份信息
          <view
              class="absolute -bottom-4rpx left-0 right-0 h-3rpx bg-gradient-to-r from-blue-500/50 to-blue-300/30 rounded-full"></view>
        </view>
        <view class="text-28rpx text-gray-600 leading-normal">请填写基本信息并上传相关证件照片</view>
      </view>

      <!-- 基本信息填写 -->
      <view
          class="p-32rpx mb-48rpx bg-white/95 rounded-24rpx shadow-lg backdrop-blur-md animate animate-fade-in delay-1 relative">
        <!-- 装饰元素 -->
        <view
            class="absolute right-20rpx top-20rpx w-80rpx h-80rpx bg-gradient-to-br from-blue-100/30 to-transparent rounded-tr-3xl rounded-bl-3xl -rotate-15deg"></view>

        <view class="relative">
          <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
            <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-blue-300 to-blue-500"></view>
            基本信息
          </view>
          <view class="space-y-24rpx">
            <view class="group">
              <text class="block text-28rpx text-gray-800 mb-12rpx flex items-center">
                <view class="w-8rpx h-8rpx rounded-full bg-blue-400 mr-10rpx"></view>
                {{ isStudent ? '学号' : '工号' }}
              </text>
              <view class="relative">
                <input
                    type="text"
                    v-model="formData.idNumber"
                    :placeholder="`请输入${isStudent ? '学号' : '工号'}`"
                    class="w-full h-88rpx bg-blue-50/50 rounded-16rpx px-24rpx text-28rpx text-gray-800 transition-all duration-300 focus:bg-blue-100/20 focus:shadow-sm focus:shadow-blue-200/50 pr-60rpx"
                />
                <view
                    class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx rounded-full bg-blue-100/80 opacity-0 group-focus-within-opacity-100 transition-opacity duration-300"></view>
              </view>
            </view>
            <view class="group space-y-24rpx-child">
              <text class="block text-28rpx text-gray-800 mb-12rpx flex items-center">
                <view class="w-8rpx h-8rpx rounded-full bg-blue-400 mr-10rpx"></view>
                真实姓名
              </text>
              <view class="relative">
                <input
                    type="text"
                    v-model="formData.realName"
                    placeholder="请输入真实姓名"
                    class="w-full h-88rpx bg-blue-50/50 rounded-16rpx px-24rpx text-28rpx text-gray-800 transition-all duration-300 focus:bg-blue-100/20 focus:shadow-sm focus:shadow-blue-200/50 pr-60rpx"
                />
                <view
                    class="absolute right-20rpx top-1/2 transform -translate-y-1/2 w-30rpx h-30rpx rounded-full bg-blue-100/80 opacity-0 group-focus-within-opacity-100 transition-opacity duration-300"></view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 上传区域 -->
      <view class="mt-48rpx space-y-48rpx relative">
        <!-- 正面照片上传区域 -->
        <view class="relative">
          <view class="text-32rpx font-medium text-gray-700 mb-16rpx flex items-center">
            <view class="w-8rpx h-32rpx bg-blue-400 rounded-4rpx mr-16rpx"></view>
            正面照片
          </view>
          <view
              class="border-2 border-dashed border-blue-200 rounded-24rpx p-24rpx flex flex-col items-center justify-center transition-all duration-300"
              :class="[frontImage ? 'bg-blue-50/30' : 'bg-white hover-bg-blue-50/10 active-bg-blue-100-10']"
              @tap="handleUpload('front')"
              v-if="frontImage.url===''"
          >

            <!-- 装饰元素 -->
            <view class="absolute -top-16rpx -right-16rpx w-36rpx h-36rpx bg-blue-200/50 rounded-full"></view>
            <view class="absolute top-24rpx left-24rpx w-24rpx h-24rpx border-4rpx border-blue-300/40 rounded-full"></view>

            <view class="relative bg-blue-100/10 p-16rpx rounded-16rpx">
              <wd-icon name="camera-o" size="60rpx" color="#3b82f6"></wd-icon>
            </view>

            <!-- 身份证上传指引 -->
            <view class="mt-40rpx p-24rpx bg-blue-50/40 rounded-16rpx border border-blue-100/40 space-y-16rpx">
              <view class="text-28rpx font-medium text-blue-500">上传指引</view>
              <view class="text-24rpx text-gray-600 space-y-12rpx">
                <view class="flex items-start">
                  <view class="w-8rpx h-8rpx rounded-full bg-blue-400 mt-12rpx mr-12rpx"></view>
                  <view>请上传清晰、完整的身份证照片，确保信息可见</view>
                </view>
                <view class="flex items-start">
                  <view class="w-8rpx h-8rpx rounded-full bg-blue-400 mt-12rpx mr-12rpx"></view>
                  <view>照片应在光线充足的环境下拍摄，避免反光和模糊</view>
                </view>
                <view class="flex items-start">
                  <view class="w-8rpx h-8rpx rounded-full bg-blue-400 mt-12rpx mr-12rpx"></view>
                  <view>请确保身份证在有效期内，且信息与填写内容一致</view>
                </view>
              </view>
            </view>
          </view>

          <!-- 正面照片显示区域 -->
          <view
              class="h-320rpx rounded-24rpx overflow-hidden relative shadow-md transition-all duration-300 active-scale-98"
              v-else
              @tap.stop="handleUpload('front')"
          >
            <image :src="frontImage.url" mode="aspectFill" class="w-full h-full object-cover"></image>

            <!-- 删除按钮 -->
            <view
                class="absolute top-16rpx right-16rpx w-48rpx h-48rpx bg-black/50 rounded-full flex items-center justify-center z-2 transition-all duration-300 active-scale-90 active-bg-black-70 backdrop-blur-sm"
                @tap.stop="handleDelete('front')"
            >
              <wd-icon name="close" size="32rpx" color="#fff"></wd-icon>
            </view>

            <!-- 预览蒙版 -->
            <view
                class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 backdrop-blur-sm z-1 active-opacity-100">
              <view
                  class="w-80rpx h-80rpx rounded-full bg-white/20 flex items-center justify-center mb-16rpx animate-pulse">
                <wd-icon name="camera-fill" size="48rpx" color="#fff"></wd-icon>
              </view>
              <text class="text-white text-28rpx">重新上传</text>
            </view>
          </view>
        </view>

        <!-- 反面照片 -->
        <view class="animate animate-fade-in delay-3 space-y-32rpx-child">
          <view class="mb-24rpx text-32rpx font-semibold text-gray-800 flex items-center gap-8rpx">
            <view class="w-6rpx h-32rpx rounded-3rpx bg-gradient-to-b from-blue-300 to-blue-500"></view>
            证件反面照片
          </view>

          <view
              class="h-320rpx bg-gradient-to-br from-blue-50/80 to-white/95 border-2 border-dashed border-blue-200 rounded-24rpx flex flex-col items-center justify-center transition-all duration-300 active-bg-blue-100-10 active-scale-98 relative overflow-hidden"
              @tap.stop="handleUpload('back')"
              v-if="backImage.url===''"
          >
            <!-- 装饰气泡 -->
            <view
                class="absolute left-40rpx bottom-40rpx w-100rpx h-100rpx rounded-full bg-blue-100/50 opacity-30 animate-float-slow"></view>
            <view
                class="absolute right-50rpx top-40rpx w-70rpx h-70rpx rounded-full bg-blue-100/50 opacity-20 animate-float-slow animation-delay-2000"></view>

            <view class="mb-16rpx animate-pulse">
              <wd-icon name="fill-camera" size="80rpx" color="#ff9090"></wd-icon>
            </view>
            <text class="text-28rpx text-gray-600 mb-8rpx">点击上传</text>
            <text class="text-24rpx text-gray-400">支持jpg、png格式</text>
          </view>

          <view
              class="h-320rpx rounded-24rpx overflow-hidden relative shadow-md transition-all duration-300 active-scale-98"
              v-else
              @tap.stop="handleUpload('back')"
          >
            <image :src="backImage.url" mode="aspectFill" class="w-full h-full object-cover"></image>

            <!-- 删除按钮 -->
            <view
                class="absolute top-16rpx right-16rpx w-48rpx h-48rpx bg-black/50 rounded-full flex items-center justify-center z-2 transition-all duration-300 active-scale-90 active-bg-black-70 backdrop-blur-sm"
                @tap.stop="handleDelete('back')"
            >
              <wd-icon name="close" size="32rpx" color="#fff"></wd-icon>
            </view>

            <!-- 预览蒙版 -->
            <view
                class="absolute inset-0 bg-gradient-to-b from-black/40 to-black/70 flex flex-col items-center justify-center opacity-0 transition-opacity duration-300 backdrop-blur-sm z-1 active-opacity-100">
              <view
                  class="w-80rpx h-80rpx rounded-full bg-white/20 flex items-center justify-center mb-16rpx animate-pulse">
                <wd-icon name="camera-fill" size="48rpx" color="#fff"></wd-icon>
              </view>
              <text class="text-white text-28rpx">重新上传</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="mt-64rpx">
        <wd-button
            block
            type="primary"
            :loading="isSubmitting"
            :disabled="!canSubmit"
            @click="handleSubmit"
            custom-class="h-88rpx text-32rpx rounded-44rpx bg-gradient-to-r from-blue-400 to-blue-500 border-none transition-all duration-300 active-translate-y-2rpx disabled:opacity-60 disabled:bg-gray-100 shadow-lg shadow-blue-300/20"
        >下一步
        </wd-button>
      </view>

      <!-- 装饰元素 -->
      <view class="absolute top-160rpx right-20rpx w-40rpx h-40rpx bg-blue-100/40 rounded-full animate-float"></view>
      <view
          class="absolute bottom-100rpx left-40rpx w-30rpx h-30rpx border-6rpx border-blue-200/60 rounded-full animate-spin-slow"></view>
    </view>
  </common>
</template>

<script setup>
import common from "./common.vue"
import {useRegisterStore} from "./pinia/register";
import {RegisterApi} from "./api/register";
import {useToast} from "@/composables/toast";
import {useRouter} from "uni-mini-router";
import events from "@/utils/events";

const validationStore = useRegisterStore()
const toast = useToast()
const router = useRouter()

// 页面加载时设置当前步骤
onMounted(() => {
  validationStore.setStage(1)
})

// 表单数据
const formData = reactive({
  idNumber: '', // 学号/工号
  realName: '', // 真实姓名
})

// 图片数据
const frontImage = ref({
  url: '',
  object_key: '',
})
const backImage = ref({
  url: '',
  object_key: '',
})
const isUploading = ref(false)
const isSubmitting = ref(false)
const uploadProgress = ref(0)

// 是否为学生（从store中获取）
const isStudent = computed(() => {
  return validationStore.selectedRole?.type === 'student'
})

// 是否可以提交
const canSubmit = computed(() => {
  return formData.idNumber && 
         formData.realName && 
         frontImage.value.url &&
         backImage.value.url
})

// 上传图片
const handleUpload = async (type) => {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    
    const filePath = res.tempFilePaths[0]
    isUploading.value = true
    
    // 显示全局上传进度
    events.emit('showUpload', 0)
    
    // 上传文件
    const uploadRes = await RegisterApi.uploadFile(validationStore.processId, filePath, (res) => {
      const progress = Math.round((res.loaded * 100) / res.total)
      uploadProgress.value = progress
      
      // 更新全局上传进度
      events.emit('updateUpload', progress)
    })
    
    // 保存上传后的图片URL
    if (type === 'front') {
      frontImage.value.url = uploadRes.media_url
      frontImage.value.object_key = uploadRes.object_key
    } else {
      backImage.value.url = uploadRes.media_url
      backImage.value.object_key = uploadRes.object_key
    }
    
    // 隐藏全局上传进度
    events.emit('hideUpload')
    toast.success('上传成功')
  } catch (err) {
    console.error(err.message)
    toast.error(err.message || '上传失败')
    
    // 出错时也隐藏全局上传进度
    events.emit('hideUpload')
  } finally {
    isUploading.value = false
    uploadProgress.value = 0
  }
}

/**
 * 处理删除图片
 * @function handleDelete
 * @param {'front'|'back'} type - 要删除的图片类型
 */
const handleDelete = (type) => {
  // 显示确认弹窗
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张照片吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 根据类型删除对应的图片
          switch (type) {
            case 'front':
              await RegisterApi.deleteFile(frontImage.value.object_key)
              frontImage.value.url = ''
              frontImage.value.object_key = ''
              break
            case 'back':
              await RegisterApi.deleteFile(backImage.value.object_key)
              backImage.value.url = ''
              backImage.value.object_key = ''
              break
            default:
              console.warn('未知的图片类型:', type)
              break
          }

          toast.success('删除成功')
        } catch (err) {
          toast.error(err.message || '删除失败')
          console.error(err.message)
        }
      }
    }, fail: () => {
      // 用户取消，不做任何操作
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!canSubmit.value) return
  
  try {
    // 显示提交进度
    isSubmitting.value = true
    events.emit('showUpload', 0)
    events.emit('updateUpload', 30) // 初始显示30%
    
    // 更新用户信息
    validationStore.updateUserInfo({
      idNumber: formData.idNumber,
      realName: formData.realName
    })
    
    // 模拟API提交
    await RegisterApi.process({
      validationFormData: {
        identification: formData.idNumber,
        real_name: formData.realName,
        medias: [
          {
            description: "证件照正面",
            media_type: "image/jpeg",
            media_url: frontImage.value.url,
            object_key: frontImage.value.object_key
          },
          {
            description: "证件照反面",
            media_type: "image/jpeg", 
            media_url: backImage.value.url,
            object_key: backImage.value.object_key
          }
        ]
      }
    })
    
    // 设置注册流程进度
    validationStore.setStage(1) // 完成第二步
    
    // 更新至100%
    events.emit('updateUpload', 100)
    setTimeout(() => {
      // 隐藏上传进度
      events.emit('hideUpload')
      
      // 跳转到下一步
      router.push({
        name: 'validation-step3'
      })
    }, 500)
    
  } catch (err) {
    console.error(err.message)
    toast.error(err.message || '提交失败')
    events.emit('hideUpload')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style>
/* 特殊样式类 */
.scale-98 {
  transform: scale(0.98);
}

/* 聚焦状态 */
.group-focus-within-opacity-100:focus-within {
  opacity: 1 !important;
}

/* 激活状态 */
.active-scale-98:active {
  transform: scale(0.98);
}

.active-scale-90:active {
  transform: scale(0.9);
}

.active-opacity-100:active {
  opacity: 1;
}

.active-bg-blue-100-10:active {
  background-color: rgba(252, 231, 243, 0.1);
}

.active-bg-black-70:active {
  background-color: rgba(0, 0, 0, 0.7);
}

.active-translate-y-2rpx:active {
  transform: translateY(2rpx);
}

/* 动画 */
.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* 浮动动画 - 慢速 */
@keyframes float-slow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8rpx); }
}

.animate-float-slow {
  animation: float-slow 6s ease-in-out infinite;
}

/* 旋转动画 - 慢速 */
@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-rotate-slow {
  animation: rotate-slow 15s linear infinite;
}

/* 动画延迟 */
.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

/* 旋转角度 */
.-rotate-15deg {
  transform: rotate(-15deg);
}

/* 间隔 */
.space-y-24rpx-child {
  margin-top: 24rpx;
}

.space-y-32rpx-child {
  margin-top: 32rpx;
}

.space-y-12rpx-child {
  margin-top: 12rpx;
}

/* 圆角 */
.rounded-tl-2xl {
  border-top-left-radius: 1rem;
}

.rounded-br-2xl {
  border-bottom-right-radius: 1rem;
}

.rounded-tr-3xl {
  border-top-right-radius: 1.5rem;
}

.rounded-bl-3xl {
  border-bottom-left-radius: 1.5rem;
}

/* 阻止按钮被禁用时的背景变灰 */
:deep(.wd-button--disabled) {
  background: #f5f5f5 !important;
}
</style>