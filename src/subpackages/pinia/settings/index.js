import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 当前选择的学校
    currentSchool: '',
    // 屏蔽用户列表
    blockedUsers: [],
    // 通知设置
    notifications: {
      message: true,
      comment: true,
      like: true,
      follow: true,
      system: true
    },
    // 隐私设置
    privacy: {
      showPhone: false,
      showEmail: false,
      allowSearch: true,
      allowRecommend: true
    },
    // 缓存设置
    cache: {
      autoClean: false,
      cleanInterval: 7, // 天数
      imageCache: true,
      videoCache: false
    },
    // 应用设置
    app: {
      darkMode: false,
      language: 'zh-CN',
      autoUpdate: true
    }
  }),

  getters: {
    // 获取屏蔽用户数量
    blockedUsersCount: (state) => state.blockedUsers.length,
    
    // 获取当前学校显示名称
    currentSchoolDisplay: (state) => state.currentSchool || '未选择学校',
    
    // 检查用户是否被屏蔽
    isUserBlocked: (state) => (userId) => {
      return state.blockedUsers.some(user => user.id === userId)
    }
  },

  actions: {
    // 设置当前学校
    setCurrentSchool(school) {
      this.currentSchool = school
      this.saveToStorage()
    },

    // 添加屏蔽用户
    addBlockedUser(user) {
      const exists = this.blockedUsers.find(u => u.id === user.id)
      if (!exists) {
        this.blockedUsers.push({
          id: user.id,
          nickname: user.nickname,
          avatar: user.avatar,
          blockedAt: Date.now()
        })
        this.saveToStorage()
      }
    },

    // 移除屏蔽用户
    removeBlockedUser(userId) {
      const index = this.blockedUsers.findIndex(user => user.id === userId)
      if (index > -1) {
        this.blockedUsers.splice(index, 1)
        this.saveToStorage()
      }
    },

    // 更新通知设置
    updateNotificationSettings(settings) {
      this.notifications = { ...this.notifications, ...settings }
      this.saveToStorage()
    },

    // 更新隐私设置
    updatePrivacySettings(settings) {
      this.privacy = { ...this.privacy, ...settings }
      this.saveToStorage()
    },

    // 更新缓存设置
    updateCacheSettings(settings) {
      this.cache = { ...this.cache, ...settings }
      this.saveToStorage()
    },

    // 更新应用设置
    updateAppSettings(settings) {
      this.app = { ...this.app, ...settings }
      this.saveToStorage()
    },

    // 清空所有屏蔽用户
    clearBlockedUsers() {
      this.blockedUsers = []
      this.saveToStorage()
    },

    // 重置所有设置
    resetAllSettings() {
      this.$reset()
      uni.removeStorageSync('settings')
    },

    // 保存到本地存储
    saveToStorage() {
      try {
        const settings = {
          currentSchool: this.currentSchool,
          blockedUsers: this.blockedUsers,
          notifications: this.notifications,
          privacy: this.privacy,
          cache: this.cache,
          app: this.app
        }
        uni.setStorageSync('settings', JSON.stringify(settings))
      } catch (error) {
        console.error('保存设置失败:', error)
      }
    },

    // 从本地存储加载
    loadFromStorage() {
      try {
        const stored = uni.getStorageSync('settings')
        if (stored) {
          const settings = JSON.parse(stored)
          
          // 合并设置，保持默认值的完整性
          if (settings.currentSchool) {
            this.currentSchool = settings.currentSchool
          }
          
          if (settings.blockedUsers && Array.isArray(settings.blockedUsers)) {
            this.blockedUsers = settings.blockedUsers
          }
          
          if (settings.notifications) {
            this.notifications = { ...this.notifications, ...settings.notifications }
          }
          
          if (settings.privacy) {
            this.privacy = { ...this.privacy, ...settings.privacy }
          }
          
          if (settings.cache) {
            this.cache = { ...this.cache, ...settings.cache }
          }
          
          if (settings.app) {
            this.app = { ...this.app, ...settings.app }
          }
        }
      } catch (error) {
        console.error('加载设置失败:', error)
      }
    },

    // 获取存储大小
    async getStorageSize() {
      return new Promise((resolve) => {
        uni.getStorageInfo({
          success: (res) => {
            resolve({
              keys: res.keys,
              currentSize: res.currentSize,
              limitSize: res.limitSize
            })
          },
          fail: () => {
            resolve({
              keys: [],
              currentSize: 0,
              limitSize: 0
            })
          }
        })
      })
    }
  }
})
