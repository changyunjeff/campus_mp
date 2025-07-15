import { defineStore } from 'pinia'
import { useUserStore } from './user'

export const useCommunityStore = defineStore('community', () => {
  // 匿名发布偏好设置
  const anonymousPreferences = reactive({
    defaultAnonymous: false,           // 默认匿名模式
    rememberChoice: true,              // 记住用户选择
    lastAnonymousChoice: false,        // 上次的匿名选择
    showAnonymousTip: true             // 是否显示匿名提示
  })
  
  // 匿名预览信息
  const anonymousPreview = reactive({
    nickname: '',                      // 预计算的匿名昵称
    avatar: '/static/images/anonymous_avatar.png'
  })
  
  // 当前发布状态
  const publishState = reactive({
    isAnonymous: false,                // 当前是否匿名发布
    isPublishing: false,               // 是否正在发布中
    currentPostType: 'post'            // 当前发布类型: post/comment/reply
  })
  
  // 设置匿名模式偏好
  const setAnonymousPreference = (isAnonymous) => {
    anonymousPreferences.defaultAnonymous = isAnonymous
    if (anonymousPreferences.rememberChoice) {
      anonymousPreferences.lastAnonymousChoice = isAnonymous
      // 持久化到本地存储
      try {
        uni.setStorageSync('anonymous_preference', isAnonymous)
      } catch (error) {
        console.warn('保存匿名偏好失败:', error)
      }
    }
  }
  
  // 加载匿名偏好
  const loadAnonymousPreference = () => {
    try {
      const saved = uni.getStorageSync('anonymous_preference')
      if (saved !== '') {
        anonymousPreferences.lastAnonymousChoice = saved
        anonymousPreferences.defaultAnonymous = saved
      }
    } catch (error) {
      console.warn('读取匿名偏好失败:', error)
    }
  }
  
  // 生成匿名昵称预览
  const generateAnonymousPreview = (userInfo = null) => {
    const userStore = useUserStore()
    if (userInfo) {
      anonymousPreview.nickname = userStore.getAnonymousNickname(
        userInfo.grade, 
        userInfo.college, 
        userInfo.gender
      )
    } else {
      anonymousPreview.nickname = userStore.getAnonymousNickname()
    }
  }
  
  // 设置当前发布状态
  const setPublishState = (state) => {
    Object.assign(publishState, state)
  }
  
  // 重置发布状态
  const resetPublishState = () => {
    publishState.isAnonymous = anonymousPreferences.defaultAnonymous
    publishState.isPublishing = false
    publishState.currentPostType = 'post'
  }
  
  // 切换匿名状态
  const toggleAnonymous = () => {
    publishState.isAnonymous = !publishState.isAnonymous
    if (anonymousPreferences.rememberChoice) {
      setAnonymousPreference(publishState.isAnonymous)
    }
    return publishState.isAnonymous
  }
  
  // 关闭匿名提示
  const dismissAnonymousTip = () => {
    anonymousPreferences.showAnonymousTip = false
    try {
      uni.setStorageSync('show_anonymous_tip', false)
    } catch (error) {
      console.warn('保存提示偏好失败:', error)
    }
  }
  
  // 检查是否显示匿名提示
  const shouldShowAnonymousTip = () => {
    if (!anonymousPreferences.showAnonymousTip) return false
    try {
      const saved = uni.getStorageSync('show_anonymous_tip')
      return saved !== false
    } catch (error) {
      return true
    }
  }
  
  // 初始化社区模块
  const initCommunity = () => {
    loadAnonymousPreference()
    generateAnonymousPreview()
    resetPublishState()
    
    // 检查是否显示匿名提示
    anonymousPreferences.showAnonymousTip = shouldShowAnonymousTip()
  }
  
  return {
    // 状态
    anonymousPreferences: readonly(anonymousPreferences),
    anonymousPreview: readonly(anonymousPreview),
    publishState: readonly(publishState),
    
    // 方法
    setAnonymousPreference,
    loadAnonymousPreference,
    generateAnonymousPreview,
    setPublishState,
    resetPublishState,
    toggleAnonymous,
    dismissAnonymousTip,
    shouldShowAnonymousTip,
    initCommunity
  }
}, {
  persist: {
    key: 'community',
    paths: ['anonymousPreferences'],
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    }
  }
}) 