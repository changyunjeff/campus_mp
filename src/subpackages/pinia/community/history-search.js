import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义search历史记录存储
export const useSearchHistoryStore = defineStore('searchHistory', () => {
  // 搜索历史记录
  const historyList = ref([])
  
  // 最大历史记录数量
  const MAX_HISTORY_COUNT = 10
  
  // 初始化历史记录（从本地存储加载）
  const initHistory = () => {
    try {
      const localHistory = uni.getStorageSync('COMMUNITY_SEARCH_HISTORY')
      if (localHistory) {
        historyList.value = JSON.parse(localHistory)
      }
    } catch (e) {
      console.error('加载搜索历史失败', e)
    }
  }
  
  // 保存历史记录到本地存储
  const saveHistory = () => {
    try {
      uni.setStorageSync('COMMUNITY_SEARCH_HISTORY', JSON.stringify(historyList.value))
    } catch (e) {
      console.error('保存搜索历史失败', e)
    }
  }
  
  // 添加搜索历史
  const addHistory = (keyword) => {
    if (!keyword || keyword.trim() === '') return
    
    // 去除空格
    const trimmedKeyword = keyword.trim()
    
    // 如果历史中已存在相同关键词，先删除
    const index = historyList.value.findIndex(item => item === trimmedKeyword)
    if (index !== -1) {
      historyList.value.splice(index, 1)
    }
    
    // 添加到历史列表开头
    historyList.value.unshift(trimmedKeyword)
    
    // 限制历史记录数量
    if (historyList.value.length > MAX_HISTORY_COUNT) {
      historyList.value = historyList.value.slice(0, MAX_HISTORY_COUNT)
    }
    
    // 保存到本地存储
    saveHistory()
  }
  
  // 删除单个历史记录
  const removeHistory = (keyword) => {
    const index = historyList.value.findIndex(item => item === keyword)
    if (index !== -1) {
      historyList.value.splice(index, 1)
      saveHistory()
    }
  }
  
  // 清空所有历史记录
  const clearHistory = () => {
    historyList.value = []
    saveHistory()
  }
  
  return {
    historyList,
    initHistory,
    addHistory,
    removeHistory,
    clearHistory
  }
})
