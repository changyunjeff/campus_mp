import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义草稿存储
export const useDraftStore = defineStore('communityDraft', () => {
  // 草稿内容
  const content = ref('')
  // 草稿图片
  const images = ref([])
  // 草稿位置
  const location = ref('')
  // 草稿可见性
  const visibility = ref('public')
  // 草稿最后保存时间
  const lastSaveTime = ref(null)
  
  // 初始化草稿（从本地存储加载）
  const initDraft = () => {
    try {
      const draftData = uni.getStorageSync('COMMUNITY_DRAFT')
      if (draftData) {
        const parsedData = JSON.parse(draftData)
        content.value = parsedData.content || ''
        images.value = parsedData.images || []
        location.value = parsedData.location || ''
        visibility.value = parsedData.visibility || 'public'
        lastSaveTime.value = parsedData.lastSaveTime || null
      }
    } catch (e) {
      console.error('加载草稿失败', e)
    }
  }
  
  // 保存草稿到本地存储
  const saveDraft = (draftData) => {
    try {
      content.value = draftData.content || ''
      images.value = draftData.images || []
      location.value = draftData.location || ''
      visibility.value = draftData.visibility || 'public'
      lastSaveTime.value = Date.now()
      
      // 保存到本地存储
      uni.setStorageSync('COMMUNITY_DRAFT', JSON.stringify({
        content: content.value,
        images: images.value,
        location: location.value,
        visibility: visibility.value,
        lastSaveTime: lastSaveTime.value
      }))
      
      return true
    } catch (e) {
      console.error('保存草稿失败', e)
      return false
    }
  }
  
  // 清空草稿
  const clearDraft = () => {
    content.value = ''
    images.value = []
    location.value = ''
    visibility.value = 'public'
    lastSaveTime.value = null
    
    try {
      uni.removeStorageSync('COMMUNITY_DRAFT')
    } catch (e) {
      console.error('清空草稿失败', e)
    }
  }
  
  // 检查是否有草稿
  const hasDraft = () => {
    return content.value.trim() !== '' || images.value.length > 0
  }
  
  return {
    content,
    images,
    location,
    visibility,
    lastSaveTime,
    initDraft,
    saveDraft,
    clearDraft,
    hasDraft
  }
})
