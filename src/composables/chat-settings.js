import { ref, reactive } from 'vue'
import { UserApi } from '@/api/user'

// 聊天设置缓存配置
const CHAT_SETTINGS_CACHE_KEY = 'chat_settings_cache_v2'
const CACHE_EXPIRE_TIME = 30 * 60 * 1000 // 30分钟过期
const MAX_CACHE_SIZE = 500 // 最大缓存数量

// 全局缓存实例
let cacheInstance = null

// 本地存储管理器
class ChatSettingsStorage {
  constructor() {
    this.cacheKey = CHAT_SETTINGS_CACHE_KEY
    this.expireTime = CACHE_EXPIRE_TIME
    this.maxSize = MAX_CACHE_SIZE
  }

  // 获取所有缓存数据
  getAllCache() {
    try {
      const data = uni.getStorageSync(this.cacheKey)
      return data && typeof data === 'object' ? data : {}
    } catch (error) {
      console.warn('获取聊天设置缓存失败:', error)
      return {}
    }
  }

  // 保存单个用户设置
  saveSettings(userId, settings) {
    try {
      const allCache = this.getAllCache()
      allCache[userId] = {
        ...settings,
        timestamp: Date.now()
      }

      // 检查缓存大小，清理最旧的数据
      this.limitCacheSize(allCache)
      
      uni.setStorageSync(this.cacheKey, allCache)
      return true
    } catch (error) {
      console.warn('保存聊天设置缓存失败:', error)
      return false
    }
  }

  // 获取单个用户设置
  getSettings(userId) {
    try {
      const allCache = this.getAllCache()
      const cached = allCache[userId]
      
      if (!cached) return null
      
      // 检查是否过期
      if (Date.now() - cached.timestamp > this.expireTime) {
        delete allCache[userId]
        uni.setStorageSync(this.cacheKey, allCache)
        return null
      }
      
      return {
        isPinned: cached.isPinned || false,
        isMuted: cached.isMuted || false,
        isBlocked: cached.isBlocked || false
      }
    } catch (error) {
      console.warn('获取聊天设置缓存失败:', error)
      return null
    }
  }

  // 批量保存设置
  batchSaveSettings(settingsMap) {
    try {
      const allCache = this.getAllCache()
      const timestamp = Date.now()
      
      settingsMap.forEach((settings, userId) => {
        allCache[userId] = {
          ...settings,
          timestamp
        }
      })

      this.limitCacheSize(allCache)
      uni.setStorageSync(this.cacheKey, allCache)
      return true
    } catch (error) {
      console.warn('批量保存聊天设置缓存失败:', error)
      return false
    }
  }

  // 清理过期缓存
  cleanExpiredCache() {
    try {
      const allCache = this.getAllCache()
      const now = Date.now()
      let hasExpired = false
      
      Object.keys(allCache).forEach(userId => {
        if (now - allCache[userId].timestamp > this.expireTime) {
          delete allCache[userId]
          hasExpired = true
        }
      })
      
      if (hasExpired) {
        uni.setStorageSync(this.cacheKey, allCache)
      }
      
      return hasExpired
    } catch (error) {
      console.warn('清理过期缓存失败:', error)
      return false
    }
  }

  // 限制缓存大小
  limitCacheSize(allCache) {
    const entries = Object.entries(allCache)
    if (entries.length <= this.maxSize) return

    // 按时间戳排序，删除最旧的数据
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, entries.length - this.maxSize)
    
    toDelete.forEach(([userId]) => {
      delete allCache[userId]
    })
  }

  // 清空所有缓存
  clearAllCache() {
    try {
      uni.removeStorageSync(this.cacheKey)
      return true
    } catch (error) {
      console.warn('清空聊天设置缓存失败:', error)
      return false
    }
  }

  // 获取缓存统计信息
  getCacheStats() {
    try {
      const allCache = this.getAllCache()
      const now = Date.now()
      let validCount = 0
      let expiredCount = 0
      
      Object.values(allCache).forEach(item => {
        if (now - item.timestamp > this.expireTime) {
          expiredCount++
        } else {
          validCount++
        }
      })
      
      return {
        total: Object.keys(allCache).length,
        valid: validCount,
        expired: expiredCount,
        maxSize: this.maxSize
      }
    } catch (error) {
      return { total: 0, valid: 0, expired: 0, maxSize: this.maxSize }
    }
  }
}

// 聊天设置缓存管理器
class ChatSettingsCache {
  constructor() {
    this.storage = new ChatSettingsStorage()
    this.memoryCache = new Map() // 内存缓存
    this.pendingRequests = new Map() // 防止重复请求
    
    // 初始化时清理过期缓存
    this.storage.cleanExpiredCache()
  }

  // 同步获取缓存设置（仅从内存和本地存储获取，不发起网络请求）
  getCachedSettings(userId) {
    if (!userId) {
      return this.getDefaultSettings()
    }

    // 1. 优先从内存缓存获取
    if (this.memoryCache.has(userId)) {
      return this.memoryCache.get(userId)
    }

    // 2. 从本地存储获取
    const storedSettings = this.storage.getSettings(userId)
    if (storedSettings) {
      // 同步到内存缓存
      this.memoryCache.set(userId, storedSettings)
      return storedSettings
    }

    // 3. 返回默认设置
    return this.getDefaultSettings()
  }

  // 获取聊天设置（优先级：内存缓存 > 本地存储 > 网络请求）
  async getSettings(userId) {
    if (!userId) {
      return this.getDefaultSettings()
    }

    // 1. 优先从内存缓存获取
    if (this.memoryCache.has(userId)) {
      const cached = this.memoryCache.get(userId)
      console.debug(`聊天设置内存缓存命中: ${userId}`)
      return cached
    }

    // 2. 从本地存储获取
    const storedSettings = this.storage.getSettings(userId)
    if (storedSettings) {
      // 同步到内存缓存
      this.memoryCache.set(userId, storedSettings)
      console.debug(`聊天设置本地缓存命中: ${userId}`)
      return storedSettings
    }

    // 3. 从网络获取
    return await this.fetchFromNetwork(userId)
  }

  // 从网络获取设置
  async fetchFromNetwork(userId) {
    // 防止重复请求
    if (this.pendingRequests.has(userId)) {
      return await this.pendingRequests.get(userId)
    }

    const requestPromise = this.doFetchFromNetwork(userId)
    this.pendingRequests.set(userId, requestPromise)

    try {
      const result = await requestPromise
      return result
    } finally {
      this.pendingRequests.delete(userId)
    }
  }

  // 实际的网络请求
  async doFetchFromNetwork(userId) {
    try {
      console.debug(`从网络获取聊天设置: ${userId}`)
      const response = await UserApi.getChatSettings(userId)
      
      const settings = {
        isPinned: response.set_top || false,
        isMuted: response.do_not_disturb || false,
        isBlocked: response.blocking || false
      }

      // 同时更新内存缓存和本地存储
      this.updateSettings(userId, settings)
      
      return settings
    } catch (error) {
      console.warn(`获取聊天设置失败: ${userId}`, error)
      const defaultSettings = this.getDefaultSettings()
      
      // 缓存默认设置，避免重复请求
      this.memoryCache.set(userId, defaultSettings)
      
      return defaultSettings
    }
  }

  // 更新设置
  updateSettings(userId, settings) {
    if (!userId) return false

    // 更新内存缓存
    this.memoryCache.set(userId, settings)
    
    // 更新本地存储
    return this.storage.saveSettings(userId, settings)
  }

  // 批量预加载设置
  async batchPreloadSettings(userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return new Map()
    }

    const results = new Map()
    const needFetchUsers = []

    // 先从缓存中获取
    for (const userId of userIds) {
      const cached = this.memoryCache.get(userId) || this.storage.getSettings(userId)
      if (cached) {
        results.set(userId, cached)
        if (!this.memoryCache.has(userId)) {
          this.memoryCache.set(userId, cached)
        }
      } else {
        needFetchUsers.push(userId)
      }
    }

    console.debug(`批量预加载聊天设置 - 缓存命中: ${results.size}, 需要请求: ${needFetchUsers.length}`)

    // 批量请求未缓存的用户
    if (needFetchUsers.length > 0) {
      const fetchPromises = needFetchUsers.map(async (userId) => {
        try {
          const settings = await this.fetchFromNetwork(userId)
          results.set(userId, settings)
          return { userId, settings, success: true }
        } catch (error) {
          const defaultSettings = this.getDefaultSettings()
          results.set(userId, defaultSettings)
          return { userId, settings: defaultSettings, success: false, error }
        }
      })

      await Promise.allSettled(fetchPromises)
    }

    return results
  }

  // 获取默认设置
  getDefaultSettings() {
    return {
      isPinned: false,
      isMuted: false,
      isBlocked: false
    }
  }

  // 清理缓存
  clearCache(userId = null) {
    if (userId) {
      // 清理指定用户的缓存
      this.memoryCache.delete(userId)
      const allCache = this.storage.getAllCache()
      delete allCache[userId]
      uni.setStorageSync(this.storage.cacheKey, allCache)
    } else {
      // 清理所有缓存
      this.memoryCache.clear()
      this.storage.clearAllCache()
    }
  }

  // 获取缓存统计
  getStats() {
    const storageStats = this.storage.getCacheStats()
    return {
      ...storageStats,
      memoryCache: this.memoryCache.size,
      pendingRequests: this.pendingRequests.size
    }
  }
}

// 创建聊天设置缓存composable
export function useChatSettings() {
  if (!cacheInstance) {
    cacheInstance = new ChatSettingsCache()
  }

  return {
    // 获取聊天设置（异步）
    getSettings: (userId) => cacheInstance.getSettings(userId),
    
    // 同步获取缓存设置（仅从缓存获取，不发起网络请求）
    getCachedSettings: (userId) => cacheInstance.getCachedSettings(userId),
    
    // 更新聊天设置
    updateSettings: (userId, settings) => cacheInstance.updateSettings(userId, settings),
    
    // 批量预加载设置
    batchPreloadSettings: (userIds) => cacheInstance.batchPreloadSettings(userIds),
    
    // 获取默认设置
    getDefaultSettings: () => cacheInstance.getDefaultSettings(),
    
    // 清理缓存
    clearCache: (userId) => cacheInstance.clearCache(userId),
    
    // 获取缓存统计
    getStats: () => cacheInstance.getStats(),
    
    // 清理过期缓存
    cleanExpiredCache: () => cacheInstance.storage.cleanExpiredCache()
  }
}

// 导出缓存实例（用于调试）
export { cacheInstance as chatSettingsCache }