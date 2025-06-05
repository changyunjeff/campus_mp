/**
 * 高德地图配置
 * 
 * 安全提示：
 * 1. API密钥应该从环境变量获取，不要硬编码在代码中
 * 2. 生产环境应该配置域名白名单和服务限制
 * 3. 定期轮换API密钥以确保安全性
 */

import { getEnv, isDevelopment } from "@/utils/env"

// 从环境变量或配置中获取API密钥
const getApiKey = () => {
  // 优先从环境变量获取
  const envKey = getEnv('VITE_APP_AMAP_KEY') || getEnv('VUE_APP_AMAP_KEY')
  if (envKey) {
    return envKey
  }
  
  // 开发环境临时密钥（应该在配置文件中设置）
  if (isDevelopment()) {
    console.warn('⚠️ 警告: 正在使用开发环境默认API密钥，生产环境请配置环境变量 VITE_APP_AMAP_KEY')
    return 'cc1eef7952ab2a829e8c3849b3835e77'
  }
  
  // 生产环境必须配置环境变量
  console.error('❌ 生产环境必须配置环境变量 VITE_APP_AMAP_KEY')
  // 在小程序环境中不抛出异常，而是返回空字符串
  return ''
}

export const MAP_CONFIG = {
  // API密钥配置
  key: getApiKey(),
  
  // 搜索相关配置
  search: {
    radius: 1000,           // 搜索半径（米）
    limit: 20,              // 搜索结果数量限制
    timeout: 10000,         // 请求超时时间（毫秒）
    retryCount: 3,          // 重试次数
    cityLimit: true,        // 是否限制在当前城市
  },
  
  // 地图显示配置
  map: {
    defaultCenter: {        // 默认中心点（北京天安门）
      longitude: 116.397470,
      latitude: 39.908823
    },
    defaultZoom: 16,        // 默认缩放级别
    minZoom: 3,            // 最小缩放级别
    maxZoom: 18            // 最大缩放级别
  },
  
  // 位置服务配置
  location: {
    enableHighAccuracy: true,  // 开启高精度定位
    timeout: 15000,           // 定位超时时间
    maximumAge: 300000,       // 位置缓存时间（5分钟）
    fallbackLocation: {       // 定位失败时的默认位置
      longitude: 116.397470,
      latitude: 39.908823
    }
  },
  
  // 请求配置
  request: {
    baseURL: 'https://restapi.amap.com',
    timeout: 10000,
    retryCount: 3,
    retryDelay: 1000,      // 重试延迟（毫秒）
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000,           // 缓存时间（5分钟）
    maxSize: 100           // 最大缓存条目数
  },
  
  // 调试配置
  debug: {
    enabled: isDevelopment(),
    logLevel: isDevelopment() ? 'debug' : 'error'
  }
}

// 向后兼容的导出
export const {
  searchRadius = MAP_CONFIG.search.radius,
  searchLimit = MAP_CONFIG.search.limit,
  cityLimit = MAP_CONFIG.search.cityLimit
} = MAP_CONFIG

// 配置验证
if (!MAP_CONFIG.key) {
  console.error('❌ 高德地图API密钥未配置')
}

// 开发环境配置提示
if (isDevelopment()) {
  console.log('🗺️ 高德地图配置加载完成:', {
    hasApiKey: !!MAP_CONFIG.key,
    searchRadius: MAP_CONFIG.search.radius,
    debugEnabled: MAP_CONFIG.debug.enabled,
    environment: '微信小程序开发环境'
  })
}

// 导出一个测试函数来验证配置
export const testConfig = () => {
  console.log('🧪 测试高德地图配置:', {
    keyLength: MAP_CONFIG.key ? MAP_CONFIG.key.length : 0,
    hasKey: !!MAP_CONFIG.key,
    isDev: isDevelopment(),
    config: MAP_CONFIG
  })
  return MAP_CONFIG
}