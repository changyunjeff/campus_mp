/**
 * 高德地图工具类
 * 
 * 功能特性：
 * 1. 统一的错误处理和重试机制
 * 2. 请求缓存以提升性能
 * 3. 完整的TypeScript类型定义
 * 4. 详细的日志记录
 * 5. 参数验证和安全检查
 */
import { AMapWX } from './amap-wx.130.js';
import { MAP_CONFIG } from '@/configs/amap.config.js';

/**
 * @typedef {Object} Location
 * @property {number} latitude - 纬度
 * @property {number} longitude - 经度
 */

/**
 * @typedef {Object} AddressComponent
 * @property {string} province - 省份
 * @property {string} city - 城市  
 * @property {string} district - 区县
 * @property {string} street - 街道
 * @property {string} streetNumber - 门牌号
 */

/**
 * @typedef {Object} PoiData
 * @property {string} id - POI ID
 * @property {string} name - 名称
 * @property {string} type - POI类型
 * @property {string} address - 地址
 * @property {Location} location - 经纬度
 * @property {number} distance - 距离(米)
 * @property {string} [tel] - 电话
 */

// 高德地图小程序SDK实例
let amapInstance = null;
let initPromise = null;

// 请求缓存
const requestCache = new Map();

// 日志工具
const logger = {
  debug: (...args) => {
    if (MAP_CONFIG.debug.enabled && MAP_CONFIG.debug.logLevel === 'debug') {
      console.log(...args);
    }
  },
  info: (...args) => {
    if (MAP_CONFIG.debug.enabled) {
      console.log(...args);
    }
  },
  error: (...args) => {
    console.error(...args);
  }
};

/**
 * 初始化高德地图SDK实例
 * @returns {Promise<AMapWX>}
 */
const initAmapInstance = async () => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = new Promise((resolve, reject) => {
    try {
      if (!MAP_CONFIG.key) {
        throw new Error('高德地图API密钥未配置');
      }

      amapInstance = new AMapWX({
        key: MAP_CONFIG.key
      });

      logger.info('🗺️ 高德地图SDK初始化成功:', {
        key: MAP_CONFIG.key.substring(0, 8) + '...',
        config: {
          searchRadius: MAP_CONFIG.search.radius,
          cacheEnabled: MAP_CONFIG.cache.enabled
        }
      });

      resolve(amapInstance);
    } catch (error) {
      logger.error('❌ 高德地图SDK初始化失败:', error);
      reject(error);
    }
  });

  return initPromise;
};

/**
 * 参数验证工具
 */
const validateParams = {
  location: (location) => {
    if (!location) {
      throw new Error('缺少位置参数');
    }
    if (typeof location === 'string') {
      const [lng, lat] = location.split(',').map(Number);
      if (isNaN(lng) || isNaN(lat)) {
        throw new Error('位置格式错误，应为"经度,纬度"');
      }
      if (Math.abs(lng) > 180 || Math.abs(lat) > 90) {
        throw new Error('位置坐标超出有效范围');
      }
    } else if (typeof location === 'object') {
      if (typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
        throw new Error('位置对象必须包含有效的latitude和longitude');
      }
    }
  },

  keywords: (keywords) => {
    if (!keywords || typeof keywords !== 'string') {
      throw new Error('关键词必须是非空字符串');
    }
    if (keywords.length > 100) {
      throw new Error('关键词长度不能超过100字符');
    }
  }
};

/**
 * 缓存管理
 */
const cache = {
  get: (key) => {
    if (!MAP_CONFIG.cache.enabled) return null;
    
    const item = requestCache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > MAP_CONFIG.cache.ttl) {
      requestCache.delete(key);
      return null;
    }
    
    return item.data;
  },

  set: (key, data) => {
    if (!MAP_CONFIG.cache.enabled) return;
    
    // 清理过期缓存
    if (requestCache.size >= MAP_CONFIG.cache.maxSize) {
      const now = Date.now();
      for (const [k, v] of requestCache.entries()) {
        if (now - v.timestamp > MAP_CONFIG.cache.ttl) {
          requestCache.delete(k);
        }
      }
    }
    
    requestCache.set(key, {
      data,
      timestamp: Date.now()
    });
  },

  clear: () => {
    requestCache.clear();
  }
};

/**
 * 重试机制
 * @param {Function} fn - 要重试的函数
 * @param {number} retries - 重试次数
 * @param {number} delay - 重试延迟
 */
const withRetry = async (fn, retries = MAP_CONFIG.request.retryCount, delay = MAP_CONFIG.request.retryDelay) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0 && !error.message?.includes('权限') && !error.message?.includes('授权')) {
      logger.debug(`🔄 重试请求，剩余次数: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay);
    }
    throw error;
  }
};

/**
 * 获取当前位置
 * @returns {Promise<Location>}
 */
export const getCurrentLocation = async () => {
  logger.debug('📍 开始获取当前位置');
  
  const instance = await initAmapInstance();
  
  return withRetry(async () => {
    const cacheKey = 'current_location';
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('📍 使用缓存位置:', cached);
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getWxLocation({
        type: 'gcj02',
        isHighAccuracy: MAP_CONFIG.location.enableHighAccuracy,
        success: (location) => {
          const result = {
            latitude: location.latitude,
            longitude: location.longitude
          };
          resolve(result);
        },
        fail: (error) => {
          logger.error('❌ 获取位置失败:', error);
          reject(error);
        }
      });
    });

    // 缓存结果
    cache.set(cacheKey, result);
    logger.info('✅ 获取位置成功:', result);
    return result;
  });
};

/**
 * 处理位置权限错误
 * @param {Error} error 
 */
const handleLocationError = (error) => {
  if (error.errMsg?.includes('authorize:fail') || error.errMsg?.includes('auth deny')) {
    logger.info('⚠️ 用户未授权位置权限');
    uni.showModal({
      title: '位置权限',
      content: '需要获取您的位置权限，是否前往设置？',
      success: (res) => {
        if (res.confirm) {
          logger.info('👉 用户确认前往设置权限');
          uni.openSetting();
        }
      }
    });
    
    // 返回默认位置
    return MAP_CONFIG.location.fallbackLocation;
  }
  
  // 其他错误也返回默认位置
  logger.error('❌ 位置获取失败，使用默认位置:', error);
  return MAP_CONFIG.location.fallbackLocation;
};

/**
 * 获取POI数据
 * @param {Object} params 配置选项
 * @param {string} [params.keywords] - 搜索关键词
 * @param {string} params.location - 中心点坐标 "longitude,latitude"
 * @param {string} [params.types] - POI类型
 * @param {number} [params.radius] - 搜索半径
 * @param {number} [params.offset] - 返回结果数量
 * @returns {Promise<PoiData[]>}
 */
export const getPoiAround = async (params) => {
  logger.debug('🔍 开始搜索周边POI:', params);
  
  const instance = await initAmapInstance();
  
  // 参数验证
  validateParams.location(params.location);
  
  return withRetry(async () => {
    const searchParams = {
      location: params.location,
      keywords: params.keywords || '',
      types: params.types || '',
      radius: params.radius || MAP_CONFIG.search.radius,
      offset: params.offset || MAP_CONFIG.search.limit,
      page: params.page || 1,
      extensions: params.extensions || 'base'
    };

    // 生成缓存键
    const cacheKey = `poi_around_${JSON.stringify(searchParams)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('🔍 使用缓存POI数据');
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getPoiAround({
        ...searchParams,
        success: (res) => {
          logger.debug('🔍 POI搜索原始返回:', res);
          
          if (res.pois && Array.isArray(res.pois)) {
            const poisData = res.pois.map(poi => ({
              id: poi.id,
              name: poi.name,
              type: poi.type,
              address: poi.address,
              location: {
                latitude: parseFloat(poi.location.split(',')[1]),
                longitude: parseFloat(poi.location.split(',')[0])
              },
              distance: poi.distance ? parseInt(poi.distance) : 0,
              tel: poi.tel
            }));
            resolve(poisData);
          } else {
            reject(new Error('未获取到有效的POI数据'));
          }
        },
        fail: (error) => {
          logger.error('❌ POI搜索失败:', error);
          reject(error);
        }
      });
    });

    // 缓存结果
    cache.set(cacheKey, result);
    logger.info('✅ POI搜索成功，返回', result.length, '条结果');
    return result;
  });
};

/**
 * 逆地理编码
 * @param {string|Location} location 经纬度
 * @returns {Promise<{address: string, addressComponent: AddressComponent, pois?: any[]}>}
 */
export const getRegeo = async (location) => {
  logger.debug('🌍 开始逆地理编码:', location);
  
  const instance = await initAmapInstance();
  
  // 参数验证
  validateParams.location(location);
  
  return withRetry(async () => {
    const cacheKey = `regeo_${typeof location === 'string' ? location : `${location.longitude},${location.latitude}`}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('🌍 使用缓存地址信息');
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getRegeo({
        location: location,
        extensions: 'all',
        success: (data) => {
          logger.debug('✅ 逆地理编码成功:', data);
          
          if (data && data.info === "OK" && data.regeocode) {
            const code = data.regeocode;
            const result = {
              address: code.formatted_address,
              addressComponent: {
                province: code.addressComponent.province,
                city: code.addressComponent.city,
                district: code.addressComponent.district,
                street: code.addressComponent.street,
                streetNumber: code.addressComponent.streetNumber
              },
              pois: code.pois
            };
            resolve(result);
          } else {
            reject(new Error('未获取到地址信息'));
          }
        },
        fail: (error) => {
          logger.error('❌ 逆地理编码失败:', error);
          reject(error);
        }
      });
    });

    // 缓存结果
    cache.set(cacheKey, result);
    return result;
  });
};

/**
 * 获取输入提示
 * @param {Object} options 配置选项
 * @param {string} options.keywords - 关键词
 * @param {string} [options.location] - 中心点坐标 "longitude,latitude"
 * @param {boolean} [options.citylimit] - 是否限制在当前城市
 * @returns {Promise<Array>}
 */
export const getInputtips = async (options) => {
  logger.debug('🔍 开始获取输入提示:', options);
  
  const instance = await initAmapInstance();
  
  // 参数验证
  validateParams.keywords(options.keywords);
  
  return withRetry(async () => {
    const searchParams = {
      keywords: options.keywords,
      location: options.location,
      citylimit: options.citylimit ?? MAP_CONFIG.search.cityLimit
    };

    const cacheKey = `inputtips_${JSON.stringify(searchParams)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('🔍 使用缓存输入提示');
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getInputTips({
        ...searchParams,
        success: (data) => {
          logger.debug('✅ 获取输入提示成功:', data);
          
          if (data.tips && Array.isArray(data.tips)) {
            // 过滤掉无效的提示项
            const validTips = data.tips.filter(item => 
              item && typeof item.id === 'string' && item.name
            );
            resolve(validTips);
          } else {
            resolve([]);
          }
        },
        fail: (error) => {
          logger.error('❌ 获取输入提示失败:', error);
          reject(error);
        }
      });
    });

    // 短时间缓存（输入提示变化较快）
    if (MAP_CONFIG.cache.enabled) {
      requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: 60000 // 1分钟缓存
      });
    }

    return result;
  });
};

/**
 * 地理编码
 * @param {string} address - 地址
 * @param {string} [city] - 指定城市
 * @returns {Promise<Object>}
 */
export const getGeo = async (address, city) => {
  logger.debug('🔍 开始地理编码:', { address, city });
  
  const instance = await initAmapInstance();
  
  if (!address || typeof address !== 'string') {
    throw new Error('地址参数必须是非空字符串');
  }
  
  return withRetry(async () => {
    const cacheKey = `geo_${address}_${city || ''}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('🔍 使用缓存地理编码');
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getGeo({
        address,
        city,
        success: (data) => {
          logger.debug('✅ 地理编码成功:', data);
          
          if (data && data.geocodes && data.geocodes[0]) {
            resolve(data.geocodes[0]);
          } else {
            reject(new Error('未获取到地理编码结果'));
          }
        },
        fail: (error) => {
          logger.error('❌ 地理编码失败:', error);
          reject(error);
        }
      });
    });

    // 缓存结果
    cache.set(cacheKey, result);
    return result;
  });
};

/**
 * 获取天气信息
 * @param {Object} options
 * @param {string} options.city - 城市编码
 * @param {string} [options.type='base'] - 天气类型，base:实时天气，forecast:天气预报
 * @returns {Promise<Object>}
 */
export const getWeather = async (options) => {
  logger.debug('🌤️ 开始获取天气信息:', options);
  
  const instance = await initAmapInstance();
  
  return withRetry(async () => {
    const cacheKey = `weather_${options.city}_${options.type || 'base'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      logger.debug('🌤️ 使用缓存天气信息');
      return cached;
    }

    const result = await new Promise((resolve, reject) => {
      instance.getWeather({
        ...options,
        success: (data) => {
          logger.debug('✅ 获取天气信息成功:', data);
          resolve(data);
        },
        fail: (error) => {
          logger.error('❌ 获取天气信息失败:', error);
          reject(error);
        }
      });
    });

    // 天气信息缓存时间较短
    if (MAP_CONFIG.cache.enabled) {
      requestCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        ttl: 600000 // 10分钟缓存
      });
    }

    return result;
  });
};

/**
 * 路径规划基础方法
 * @private
 */
const getRoute = async (type, options) => {
  const methodMap = {
    walking: 'getWalkingRoute',
    driving: 'getDrivingRoute', 
    transit: 'getTransitRoute',
    riding: 'getRidingRoute'
  };
  
  const method = methodMap[type];
  if (!method) {
    throw new Error(`不支持的路径规划类型: ${type}`);
  }

  logger.debug(`🗺️ 开始${type}路径规划:`, options);
  
  const instance = await initAmapInstance();
  
  // 参数验证
  if (!options.origin || !options.destination) {
    throw new Error('起点和终点不能为空');
  }
  
  return withRetry(async () => {
    const result = await new Promise((resolve, reject) => {
      instance[method]({
        ...options,
        success: (data) => {
          logger.debug(`✅ ${type}路径规划成功:`, data);
          resolve(data);
        },
        fail: (error) => {
          logger.error(`❌ ${type}路径规划失败:`, error);
          reject(error);
        }
      });
    });

    return result;
  });
};

/**
 * 步行路径规划
 */
export const getWalkingRoute = (options) => getRoute('walking', options);

/**
 * 驾车路径规划
 */
export const getDrivingRoute = (options) => getRoute('driving', options);

/**
 * 公交路径规划
 */
export const getTransitRoute = (options) => getRoute('transit', options);

/**
 * 骑行路径规划
 */
export const getRidingRoute = (options) => getRoute('riding', options);

/**
 * 获取静态地图
 */
export const getStaticmap = async (options) => {
  logger.debug('🗺️ 开始获取静态地图:', options);
  
  const instance = await initAmapInstance();
  
  return withRetry(async () => {
    const result = await new Promise((resolve, reject) => {
      instance.getStaticmap({
        ...options,
        success: (data) => {
          logger.debug('✅ 获取静态地图成功:', data);
          resolve(data);
        },
        fail: (error) => {
          logger.error('❌ 获取静态地图失败:', error);
          reject(error);
        }
      });
    });

    return result;
  });
};

/**
 * 清除缓存
 * @public
 */
export const clearCache = () => {
  cache.clear();
  logger.info('🧹 已清空地图API缓存');
};

/**
 * 获取缓存统计信息
 * @public
 */
export const getCacheStats = () => {
  return {
    size: requestCache.size,
    maxSize: MAP_CONFIG.cache.maxSize,
    enabled: MAP_CONFIG.cache.enabled
  };
};

// 自动清理过期缓存
if (MAP_CONFIG.cache.enabled) {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, value] of requestCache.entries()) {
      if (now - value.timestamp > MAP_CONFIG.cache.ttl) {
        requestCache.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      logger.debug(`🧹 自动清理了 ${cleanedCount} 个过期缓存项`);
    }
  }, MAP_CONFIG.cache.ttl);
}
