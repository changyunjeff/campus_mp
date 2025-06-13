/**
 * 位置工具函数
 * 整合高德地图API和后端IP属地功能
 */

import { getRegeo, getCurrentLocation } from '@/api/amap/amap.js'

/**
 * 获取当前位置的省份信息
 * @returns {Promise<string>} 省份名称
 */
export const getCurrentProvince = async () => {
  try {
    console.log('📍 开始获取当前位置省份信息')
    
    // 获取当前GPS位置
    const location = await getCurrentLocation()
    console.log('📍 GPS位置:', location)
    
    // 逆地理编码获取地址
    const addressInfo = await getRegeo(location)
    console.log('🌍 地址信息:', addressInfo)
    
    if (addressInfo && addressInfo.addressComponent && addressInfo.addressComponent.province) {
      const province = addressInfo.addressComponent.province
      console.log('✅ 获取到省份:', province)
      return province
    }
    
    throw new Error('无法获取省份信息')
    
  } catch (error) {
    console.error('❌ 获取省份失败:', error)
    throw error
  }
}

/**
 * 获取详细的位置信息
 * @returns {Promise<Object>} 详细位置信息
 */
export const getDetailedLocation = async () => {
  try {
    console.log('📍 开始获取详细位置信息')
    
    // 获取当前GPS位置
    const location = await getCurrentLocation()
    
    // 逆地理编码获取地址
    const addressInfo = await getRegeo(location)
    
    if (addressInfo && addressInfo.addressComponent) {
      const result = {
        location: location,
        province: addressInfo.addressComponent.province || '未知',
        city: addressInfo.addressComponent.city || '未知',
        district: addressInfo.addressComponent.district || '未知',
        street: addressInfo.addressComponent.street || '未知',
        fullAddress: addressInfo.address || '未知',
        // 格式化的位置字符串
        locationString: formatLocationString(addressInfo.addressComponent)
      }
      
      console.log('✅ 详细位置信息:', result)
      return result
    }
    
    throw new Error('无法获取位置详情')
    
  } catch (error) {
    console.error('❌ 获取详细位置失败:', error)
    throw error
  }
}

/**
 * 格式化位置字符串
 * @param {Object} addressComponent 地址组件
 * @returns {string} 格式化的位置字符串
 */
const formatLocationString = (addressComponent) => {
  const { province, city, district } = addressComponent
  
  // 如果省份和城市相同（如北京、上海、天津、重庆），只显示省份
  if (province === city) {
    return province
  }
  
  // 如果有区县信息，显示省份+城市+区县
  if (district && district !== city) {
    return `${province} ${city} ${district}`
  }
  
  // 否则显示省份+城市
  if (city && city !== '未知') {
    return `${province} ${city}`
  }
  
  // 最后只显示省份
  return province || '未知'
}

/**
 * 检查位置权限
 * @returns {Promise<boolean>} 是否有位置权限
 */
export const checkLocationPermission = () => {
  return new Promise((resolve) => {
    uni.getSetting({
      success: (res) => {
        const locationEnabled = res.authSetting['scope.userLocation']
        console.log('📍 位置权限状态:', locationEnabled)
        resolve(locationEnabled !== false)
      },
      fail: () => {
        console.warn('📍 无法获取权限状态')
        resolve(false)
      }
    })
  })
}

/**
 * 请求位置权限
 * @returns {Promise<boolean>} 是否授权成功
 */
export const requestLocationPermission = () => {
  return new Promise((resolve) => {
    uni.authorize({
      scope: 'scope.userLocation',
      success: () => {
        console.log('✅ 位置权限授权成功')
        resolve(true)
      },
      fail: () => {
        console.warn('❌ 位置权限授权失败')
        // 引导用户到设置页面
        uni.showModal({
          title: '位置权限',
          content: '需要获取您的位置权限来显示准确的地理信息，请在设置中开启位置权限',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              uni.openSetting({
                success: (settingRes) => {
                  const locationEnabled = settingRes.authSetting['scope.userLocation']
                  resolve(locationEnabled === true)
                }
              })
            } else {
              resolve(false)
            }
          }
        })
      }
    })
  })
}

/**
 * 智能获取位置信息
 * 1. 先检查权限
 * 2. 如果没有权限，请求权限
 * 3. 获取位置信息
 * @param {Object} options 选项
 * @param {boolean} options.requestPermission 是否主动请求权限
 * @param {boolean} options.showError 是否显示错误提示
 * @returns {Promise<Object>} 位置信息
 */
export const getSmartLocation = async (options = {}) => {
  const { requestPermission = true, showError = true } = options
  
  try {
    // 检查权限
    const hasPermission = await checkLocationPermission()
    
    if (!hasPermission && requestPermission) {
      // 请求权限
      const granted = await requestLocationPermission()
      if (!granted) {
        throw new Error('位置权限未授权')
      }
    }
    
    // 获取位置信息
    const locationInfo = await getDetailedLocation()
    return locationInfo
    
  } catch (error) {
    console.error('❌ 智能获取位置失败:', error)
    
    if (showError) {
      // 根据错误类型显示不同的提示
      let message = '获取位置信息失败'
      
      if (error.message?.includes('权限')) {
        message = '需要位置权限来获取地理信息'
      } else if (error.message?.includes('网络')) {
        message = '网络连接异常，请检查网络设置'
      } else if (error.message?.includes('GPS')) {
        message = 'GPS信号弱，请到空旷地带重试'
      }
      
      uni.showToast({
        title: message,
        icon: 'none',
        duration: 2000
      })
    }
    
    throw error
  }
}

/**
 * 缓存位置信息
 * @param {Object} locationInfo 位置信息
 */
export const cacheLocationInfo = (locationInfo) => {
  try {
    const cacheData = {
      ...locationInfo,
      timestamp: Date.now()
    }
    
    uni.setStorageSync('cachedLocationInfo', cacheData)
    console.log('📍 位置信息已缓存')
    
  } catch (error) {
    console.warn('📍 位置信息缓存失败:', error)
  }
}

/**
 * 获取缓存的位置信息
 * @param {number} maxAge 最大缓存时间（毫秒），默认1小时
 * @returns {Object|null} 缓存的位置信息或null
 */
export const getCachedLocationInfo = (maxAge = 60 * 60 * 1000) => {
  try {
    const cached = uni.getStorageSync('cachedLocationInfo')
    
    if (cached && cached.timestamp) {
      const age = Date.now() - cached.timestamp
      
      if (age < maxAge) {
        console.log('📍 使用缓存的位置信息')
        return cached
      } else {
        console.log('📍 缓存已过期，清除缓存')
        uni.removeStorageSync('cachedLocationInfo')
      }
    }
    
    return null
    
  } catch (error) {
    console.warn('📍 获取缓存位置信息失败:', error)
    return null
  }
}

/**
 * 带缓存的智能位置获取
 * @param {Object} options 选项
 * @param {boolean} options.useCache 是否使用缓存
 * @param {number} options.cacheMaxAge 缓存最大时间
 * @param {boolean} options.requestPermission 是否主动请求权限
 * @param {boolean} options.showError 是否显示错误提示
 * @returns {Promise<Object>} 位置信息
 */
export const getLocationWithCache = async (options = {}) => {
  const { 
    useCache = true, 
    cacheMaxAge = 60 * 60 * 1000, // 1小时
    ...otherOptions 
  } = options
  
  // 尝试从缓存获取
  if (useCache) {
    const cached = getCachedLocationInfo(cacheMaxAge)
    if (cached) {
      return cached
    }
  }
  
  // 获取新的位置信息
  const locationInfo = await getSmartLocation(otherOptions)
  
  // 缓存位置信息
  if (useCache && locationInfo) {
    cacheLocationInfo(locationInfo)
  }
  
  return locationInfo
} 