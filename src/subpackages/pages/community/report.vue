<script setup>
import Layout from '@/layout/index.vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter } from "uni-mini-router"
import { useToast } from "@/composables/toast"
import {sleep} from '@/utils/time'
import { CommunityApi } from '@/api/community'
import { inject } from 'vue'

const router = useRouter()
const toast = useToast()
const noteId = ref('')
const reasons = ref([])
const loading = ref(false)
const submitting = ref(false)

const formData = reactive({
  reasonId: '',
  medias: [],
  note: '', // 举报的备注信息
})

const noteInfos = reactive({
  title: '',
  authorName: '',
  cover: '', // 笔记的封面（可选）
})

// 备注字数计算
const noteLength = computed(() => {
  return formData.note ? formData.note.length : 0
})

// 获取URL参数
onLoad((options) => {
  if (options && options.noteInfo) {
    const noteInfo = JSON.parse(decodeURIComponent(options.noteInfo))
    noteId.value = noteInfo.id
    noteInfos.title = noteInfo.title
    noteInfos.authorName = noteInfo.author
    noteInfos.cover = noteInfo.cover
  } else {
    toast.show('缺少笔记参数')
    setTimeout(() => {
      router.back()
    }, 2000)
  }
  
  fetchReportData()
})

// 获取举报相关数据
const fetchReportData = async () => {
  loading.value = true
  try {
    // 从服务器获取举报原因列表
    const res = await CommunityApi.getReportReasons()
    console.debug('获取举报原因列表成功,res:', res)
    reasons.value = res.reasons
  } catch (err) {
    console.error('获取举报数据失败', err)
    toast.show(`获取举报数据失败: ${err.message || '网络错误'}`)
  } finally {
    loading.value = false
  }
}

// 选择举报原因
const selectReason = (id) => {
  formData.reasonId = id
}

// 选择并上传图片
const chooseAndUploadImage = async () => {
  if (formData.medias.length >= 3) {
    toast.show('最多上传3张图片')
    return
  }
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })
    
    if (res.tempFilePaths && res.tempFilePaths.length > 0) {
      const filePath = res.tempFilePaths[0]
      
      try {
        // 使用媒体上传API
        const res = await CommunityApi.uploadReportMedia(filePath)
        
        if (res) {
          formData.medias.push({
            url: res.url,
            object_key: res.object_key,
            type: res.type
          })
          toast.show('图片上传成功')
        } else {
          throw new Error(res.message || '上传失败')
        }
      } catch (err) {
        console.error('上传图片失败', err)
        toast.show(`上传图片失败: ${err.message || '网络错误'}`)
      }
    }
  } catch (err) {
    console.error('选择图片失败', err)
    toast.show('选择图片失败')
  }
}

// 删除已上传的图片
const removeImage = (index) => {
  formData.medias.splice(index, 1)
}

// 提交举报
const submitReport = async () => {
  if (!formData.reasonId) {
    toast.show('请选择举报原因')
    return
  }
  
  submitting.value = true
  try {
    // 构建举报数据，包含媒体信息
    const reportData = {
      type: 'post', // 根据页面上下文，这里是举报帖子
      target_id: noteId.value,
      reason_id: formData.reasonId,
      note: formData.note,
      medias: formData.medias.map(media => ({
        url: media.url,
        object_key: media.object_key,
        type: media.type
      }))
    }
    
    // 一次性创建举报记录和媒体记录
    const reportRes = await CommunityApi.createReport(reportData)
    
    toast.show('举报提交成功')
    setTimeout(() => {
      router.back()
    }, 1500)
  } catch (err) {
    console.error('提交举报失败', err)
    toast.show(`提交举报失败: ${err.message || '网络错误'}`)
  } finally {
    submitting.value = false
  }
}

// 限制备注字数
const handleNoteInput = (e) => {
  const value = e.detail.value
  if (value.length > 500) {
    formData.note = value.slice(0, 500)
  }
}
</script>

<template>
  <layout>
    <template #header>
      <text class="text-32rpx font-bold">举报笔记</text>
    </template>
    <view class="p-30rpx">
      <view v-if="loading" class="flex justify-center items-center h-300rpx">
        <wd-loading type="outline" />
      </view>
      <template v-else>
        <!-- 笔记信息预览 -->
        <view class="bg-white rounded-16rpx p-24rpx mb-30rpx shadow-sm">
          <view class="flex items-center">
            <image 
              v-if="noteInfos.cover" 
              :src="noteInfos.cover" 
              mode="aspectFill"
              class="w-160rpx h-160rpx rounded-12rpx bg-gray-100 flex-shrink-0"
            />
            <view v-else class="w-160rpx h-160rpx rounded-12rpx bg-gray-100 flex-shrink-0 flex justify-center items-center">
              <wd-icon name="picture" size="32" color="#ddd"></wd-icon>
            </view>
            <view class="ml-20rpx flex-1 overflow-hidden">
              <text class="text-26rpx text-#333 mb-16rpx line-clamp-2 overflow-hidden text-ellipsis">
                {{ noteInfos.title || '无标题' }}
              </text>
              <view class="text-20rpx text-#666">
                <text>作者：{{ noteInfos.authorName || '未知' }}</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 举报原因选择 -->
        <view class="mb-40rpx">
          <view class="text-30rpx font-600 mb-20rpx text-#333 flex items-center">
            选择举报原因 <text class="text-red-500 ml-4rpx">*</text>
          </view>
          <view class="bg-white rounded-16rpx overflow-hidden shadow-sm">
            <view 
              v-for="reason in reasons" 
              :key="reason.id" 
              class="p-32rpx border-b border-#f0f0f0 last:border-b-0 flex justify-between items-center transition-colors duration-200"
              :class="formData.reasonId === reason.id ? 'bg-blue-50' : ''"
              hover-class="bg-gray-50"
              @tap="selectReason(reason.id)"
            >
              <text>{{ reason.description }}</text>
              <view v-if="formData.reasonId === reason.id" class="flex items-center justify-center">
                <wd-icon name="check" size="18" color="#0086f6"></wd-icon>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 添加备注说明 -->
        <view class="mb-40rpx">
          <view class="text-30rpx font-600 mb-20rpx text-#333">备注说明（选填）</view>
          <view class="bg-white rounded-16rpx p-24rpx relative shadow-sm">
            <textarea
              v-model="formData.note"
              class="w-full h-240rpx text-28rpx leading-1.6 text-#333 pb-40rpx"
              placeholder="请描述详细情况，以便我们更好地处理..."
              maxlength="500"
              @input="handleNoteInput"
            ></textarea>
            <view class="absolute right-24rpx bottom-20rpx text-24rpx text-#999">
              {{ noteLength }}/500
            </view>
          </view>
        </view>
        
        <!-- 上传图片证据 -->
        <view class="mb-40rpx">
          <view class="text-30rpx font-600 mb-20rpx text-#333">添加图片证据（选填，最多3张）</view>
          <view class="flex flex-wrap gap-24rpx">
            <view 
              v-for="(media, index) in formData.medias" 
              :key="index" 
              class="w-210rpx h-210rpx relative rounded-12rpx overflow-hidden shadow-sm"
            >
              <image :src="media.url" mode="aspectFill" class="w-full h-full rounded-12rpx" />
              <view 
                class="absolute top-10rpx right-10rpx w-40rpx h-40rpx bg-black bg-opacity-60 rounded-full flex justify-center items-center"
                @tap="removeImage(index)"
              >
                <wd-icon name="close" size="14" color="#fff"></wd-icon>
              </view>
            </view>
            
            <view 
              v-if="formData.medias.length < 3" 
              class="w-210rpx h-210rpx border-2rpx border-dashed border-#ddd rounded-12rpx flex flex-col justify-center items-center bg-#fafafa transition-all duration-300"
              :class="{'opacity-60': uploadLoading}"
              hover-class="bg-#f0f0f0 border-#ccc"
              @tap="chooseAndUploadImage"
            >
              <wd-icon name="camera" size="32" color="#999"></wd-icon>
              <text class="text-24rpx text-#999 mt-16rpx">上传图片</text>
            </view>
          </view>
        </view>
        
        <!-- 提交按钮 -->
        <view class="mt-60rpx mb-30rpx px-30rpx">
          <button 
            class="bg-gradient-to-r from-blue-400 to-blue-500 text-white rounded-45rpx text-32rpx h-90rpx leading-90rpx shadow-md shadow-blue-500/30 transition-all duration-300 font-500 tracking-wider border-none"
            :class="[submitting || !formData.reasonId ? 'bg-gray-400 shadow-none' : '']"
            :disabled="submitting || !formData.reasonId" 
            :loading="submitting"
            hover-class="transform translate-y-2rpx shadow-blue-500/20"
            @tap="submitReport"
          >
            提交举报
          </button>
        </view>
        
        <!-- 温馨提示 -->
        <view class="bg-#f6f6f6 rounded-12rpx p-20rpx px-24rpx mb-40rpx">
          <view class="flex items-center mb-10rpx text-26rpx text-#666 font-500">
            <wd-icon name="info" size="16" color="#999"></wd-icon>
            <text class="ml-8rpx">温馨提示</text>
          </view>
          <text class="text-24rpx text-#999 leading-1.6">
            我们将认真审核您的举报，并在 3 个工作日内进行处理。感谢您为营造健康的网络环境做出的贡献。
          </text>
        </view>
      </template>
    </view>
  </layout>
</template>

<style scoped lang="scss">

</style>