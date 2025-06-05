<template>
  <view class="map-container" :style="containerStyle">
    <!-- 搜索框 -->
    <view v-if="!previewMode && showSearch" class="search-box">
      <view class="search-input">
        <wd-icon name="search" size="32rpx" color="#999"/>
        <input
            v-model="searchKeyword"
            placeholder="搜索地点"
            @input="handleSearchInput"
        />
      </view>

      <!-- 搜索结果列表 -->
      <scroll-view
          v-if="searchResults.length"
          class="search-results"
          scroll-y
          @tap.stop
      >
        <view
            v-for="(item, index) in searchResults"
            :key="index"
            class="result-item"
            @tap="handleSelectSearchResult(item)"
        >
          <view class="location-info">
            <text class="name">{{ item.name }}</text>
            <text class="address">{{ item.address }}</text>
          </view>
          <text class="distance" v-if="item.distance">
            {{ formatDistance(item.distance) }}
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- 添加遮罩层，当有搜索结果时显示 -->
    <view
        v-if="searchResults.length"
        class="mask"
        @tap="clearSearchResults"
    />

    <map
        id="map"
        class="map-element"
        :latitude="latitude"
        :longitude="longitude"
        :markers="markers"
        :show-location="showLocation"
        :enable-zoom="showControls && !searchResults.length"
        :enable-scroll="showControls && !searchResults.length"
        :enable-rotate="showControls && !searchResults.length"
        :enable-satellite="false"
        :enable-traffic="false"
        :scale="mapScale"
        @tap.stop="handleMapTap"
        @regionchange="handleRegionChange"
    >
      <!-- 中心点标记 -->
      <view v-if="!previewMode && showCenterPin" class="center-pin" :class="{ moving: isMapMoving }">
        <wd-icon name="location" size="48rpx" color="#ff9090"/>
      </view>

      <!-- 地图控件 -->
      <cover-view class="controls" v-if="!previewMode && showControls">
        <cover-view class="control-btn" @tap="moveToLocation">
          <wd-icon name="location" size="40rpx" color="#2196F3"/>
        </cover-view>
      </cover-view>

      <!-- 经纬度信息面板 -->
      <view v-if="!previewMode" class="coordinates-panel">
        <view class="coordinate-item">
          <text class="coordinate-label">经度:</text>
          <text class="coordinate-value">{{ longitude.toFixed(6) }}</text>
        </view>
        <view class="coordinate-item">
          <text class="coordinate-label">纬度:</text>
          <text class="coordinate-value">{{ latitude.toFixed(6) }}</text>
        </view>
      </view>

      <!--确认选择按钮-->
      <view v-if="!previewMode" class="confirm-button-container">
        <wd-button
            plain hairline
            size="small"
            icon="edit-outline"
            custom-class="btn-shadow"
            :disabled="isConfirmDisabled"
            @tap.stop="confirmHandler"
        >确认选择</wd-button>
      </view>
    </map>

    <!-- POI列表 -->
    <view
        v-if="!previewMode && showPoiList && poiResults.length"
        class="poi-list-container"
    >
      <view class="poi-list-header">
        <text class="poi-list-title">附近地点</text>
        <view class="poi-close-btn" @tap="closePoiList">
          <wd-icon name="close" size="28rpx" color="#666"/>
        </view>
      </view>
      <scroll-view
          class="poi-list"
          scroll-y
          @tap.stop
      >
        <view
            v-for="(item, index) in poiResults"
            :key="index"
            class="poi-item"
            @tap="handleSelectPoi(item)"
        >
          <view class="poi-info">
            <text class="poi-name">{{ item.name }}</text>
            <text class="poi-address">{{ item.address }}</text>
          </view>
          <text class="poi-distance" v-if="item.distance">
            {{ formatDistance(item.distance) }}
          </text>
        </view>
      </scroll-view>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-overlay">
      <wd-loading vertical>加载中...</wd-loading>
    </view>
  </view>
</template>

<script setup>
import { getCurrentLocation, getInputtips, getPoiAround, getRegeo } from '@/api/amap/amap'
import { formatDistance, ll2String, str2ll } from "@/utils/longtitude.js";
import { debounce, throttle } from "lodash";
import { useToast } from "@/composables/toast";
import { MAP_CONFIG } from '@/configs/amap.config.js';

// 组件启动时测试配置
console.log('🗺️ Amap组件配置测试:', {
  hasConfig: !!MAP_CONFIG,
  hasKey: !!MAP_CONFIG?.key,
  keyLength: MAP_CONFIG?.key?.length || 0
});

/**
 * @typedef {Object} LocationObject
 * @property {number} latitude - 纬度
 * @property {number} longitude - 经度
 */

/**
 * @typedef {Object} PoiItem
 * @property {string} id - POI ID
 * @property {string} name - 名称
 * @property {string} address - 地址
 * @property {string} location - 位置字符串 "经度,纬度"
 * @property {number} [distance] - 距离（米）
 */

const toast = useToast()

const props = defineProps({
  showSearch: { type: Boolean, default: true },
  showControls: { type: Boolean, default: true },
  showCenterPin: { type: Boolean, default: true },
  showLocation: { type: Boolean, default: true },
  // 新增预览模式相关属性
  previewMode: { type: Boolean, default: false },
  previewLocation: {
    type: String,
    default: () => `${MAP_CONFIG.map.defaultCenter.longitude},${MAP_CONFIG.map.defaultCenter.latitude}`,
  }
})

const emit = defineEmits(['select'])

// 计算容器样式 - 确保在不同使用场景下都能正确显示
const containerStyle = computed(() => {
  // 如果父组件传递了特定的样式类，我们优先使用百分比高度
  const style = {
    width: '100%',
    height: '100%'
  }
  
  // 在独立使用时，使用视口高度
  if (!props.previewMode) {
    style.minHeight = '100vh'
  }
  
  return style
})

// 响应式状态
const latitude = ref(MAP_CONFIG.map.defaultCenter.latitude)
const longitude = ref(MAP_CONFIG.map.defaultCenter.longitude)
const mapScale = ref(16) // 地图缩放级别，避免CSS框架冲突
const markers = ref([])
const selectedMarker = ref(null)
const searchKeyword = ref('')
const searchResults = ref([])
const poiResults = ref([])
const showPoiList = ref(false)
const isMapMoving = ref(false)
const loading = ref(false)

// 错误处理
const handleError = (error, operation = '操作') => {
  console.error(`❌ ${operation}失败:`, error)
  
  // 根据错误类型显示不同的提示
  let message = `${operation}失败`
  
  if (error.message?.includes('网络')) {
    message = '网络连接失败，请检查网络设置'
  } else if (error.message?.includes('权限')) {
    message = '权限不足，请检查权限设置'
  } else if (error.message?.includes('参数')) {
    message = '参数错误，请重试'
  } else if (error.message) {
    message = error.message
  }
  
  toast.show(message, 'error')
}

// 计算是否禁用确认按钮
const isConfirmDisabled = computed(() => {
  return isMapMoving.value || searchResults.value.length > 0 || loading.value
})

// 防抖的搜索输入处理 - 减少API调用频率
const handleSearchInput = debounce(async (e) => {
  const keyword = e.detail.value?.trim()
  
  if (!keyword) {
    searchResults.value = []
    return
  }

  // 当开始搜索时，隐藏POI列表
  showPoiList.value = false

  try {
    loading.value = true
    
    const tips = await getInputtips({
      keywords: keyword,
      location: `${longitude.value},${latitude.value}`
    })

    // 数据转换和验证
    searchResults.value = tips?.map(tip => ({
      name: tip.name || '',
      address: tip.address || tip.district || '',
      district: tip.district || '',
      location: tip.location || {}
    })) || []

  } catch (error) {
    handleError(error, '搜索')
    searchResults.value = []
  } finally {
    loading.value = false
  }
}, 500) // 500ms防抖

// 直接选择搜索结果 - 节流处理
const handleSelectSearchResult = throttle(async (item) => {
  if (!item?.location) {
    toast.show('位置信息无效')
    return
  }

  try {
    console.log('🔍 搜索结果直接选择:', {
      name: item.name,
      location: item.location,
      locationType: typeof item.location
    })
    
    // 统一处理location数据
    const location = str2ll(item.location)
    if (!location) {
      throw new Error('位置解析失败')
    }
    
    const locationStr = ll2String(location)
    
    // 构造完整的位置信息对象
    const selectedLocationInfo = {
      location: locationStr,
      address: item.address || item.name,
      latitude: location.latitude,
      longitude: location.longitude,
      name: item.name,
      distance: item.distance || 0
    }
    
    console.log('📍 搜索结果选择信息:', selectedLocationInfo)
    
    // 显示选择成功的提示
    toast.success(`已选择：${item.name}`)
    
    // 延迟一点时间让用户看到提示，然后返回
    setTimeout(() => {
      emit("select", selectedLocationInfo)
    }, 300)
    
  } catch (error) {
    handleError(error, '选择搜索结果')
  }
}, 300) // 300ms节流

// 节流的位置选择处理 - 防止快速重复点击（用于地图预览）
const handleSelectLocation = throttle(async (item) => {
  if (!item?.location) {
    toast.show('位置信息无效')
    return
  }

  try {
    loading.value = true
    
    // 先清空搜索结果列表
    searchResults.value = []
    searchKeyword.value = ''

    // 统一处理location数据（现在str2ll支持多种格式）
    const location = str2ll(item.location)
    if (!location) {
      throw new Error('位置解析失败')
    }
    
    const locationStr = ll2String(location)
    
    await moveToLocation(location)

    // 更新标记
    const marker = {
      id: 1,
      latitude: location.latitude,
      longitude: location.longitude,
      location: locationStr, // 统一使用字符串格式
      title: item.name
    }

    updateMarkers([marker])
    selectedMarker.value = marker
    
  } catch (error) {
    handleError(error, '选择位置')
  } finally {
    loading.value = false
  }
}, 300) // 300ms节流

// 优化的地图移动处理
const moveToLocation = throttle(async (location) => {
  try {
    if (location?.latitude && location?.longitude) {
      // 验证坐标范围
      if (Math.abs(location.latitude) > 90 || Math.abs(location.longitude) > 180) {
        throw new Error('坐标超出有效范围')
      }
      
      latitude.value = location.latitude
      longitude.value = location.longitude

      // 使用 uni.createMapContext 移动地图
      const mapContext = uni.createMapContext('map')
      if (mapContext) {
        mapContext.includePoints({
          points: [location],
          padding: [80, 80, 80, 80],
          success: () => console.log('✅ 地图移动成功'),
          fail: (error) => console.error('❌ 地图移动失败:', error)
        })
      }
    } else {
      // 获取当前位置
      const currentLocation = await getCurrentLocation()
      latitude.value = currentLocation.latitude
      longitude.value = currentLocation.longitude
      
      const mapContext = uni.createMapContext('map')
      if (mapContext) {
        mapContext.moveToLocation({
          success: () => console.log('✅ 移动到当前位置成功'),
          fail: (error) => console.error('❌ 移动到当前位置失败:', error)
        })
      }
    }
  } catch (error) {
    handleError(error, '移动地图')
  }
}, 100) // 100ms节流，地图移动需要更快响应

// 更新标记点
const updateMarkers = (pois) => {
  if (!Array.isArray(pois)) {
    console.warn('⚠️ 标记点数据格式错误')
    return
  }
  
  markers.value = pois.map((poi, index) => ({
    id: index + 1,
    latitude: poi.latitude,
    longitude: poi.longitude,
    location: poi.location,
    title: poi.title || poi.name,
    width: 32,
    height: 32,
    callout: {
      content: poi.title || poi.name,
      color: '#333',
      fontSize: 13,
      borderRadius: 4,
      padding: 8,
      display: 'BYCLICK'
    }
  }))
}

// 清空搜索结果 - 节流处理
const clearSearchResults = throttle(() => {
  searchResults.value = []
  searchKeyword.value = ''
}, 200)

// 地图点击处理 - 防抖处理
const handleMapTap = debounce(async (e) => {
  if (props.previewMode || !props.showCenterPin) return

  // 如果有搜索结果，先清空
  if (searchResults.value.length) {
    clearSearchResults()
    return
  }

  const { latitude: lat, longitude: lng } = e.detail
  
  // 坐标验证
  if (!lat || !lng || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    toast.show('点击位置无效')
    return
  }

  try {
    // 更新地图中心点位置
    latitude.value = lat
    longitude.value = lng

    const location = { latitude: lat, longitude: lng }
    
    // 移动到点击位置
    await moveToLocation(location)

    // 搜索附近POI
    const locationStr = ll2String(location)
    await searchNearbyPoi(locationStr)
    
  } catch (error) {
    handleError(error, '地图点击')
  }
}, 300) // 300ms防抖

// 地图区域变化处理 - 节流处理
const handleRegionChange = throttle((e) => {
  if (props.previewMode) return

  if (e.type === 'begin') {
    isMapMoving.value = true
  } else if (e.type === 'end') {
    isMapMoving.value = false

    // 更新坐标
    if (e.detail?.centerLocation) {
      const { latitude: lat, longitude: lng } = e.detail.centerLocation
      
      // 坐标验证和更新
      if (lat && lng && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
        latitude.value = Number(lat)
        longitude.value = Number(lng)
      }
    }
  }
}, 100) // 100ms节流

// 搜索附近POI - 防抖处理
const searchNearbyPoi = debounce(async (location) => {
  // 如果用户当前有搜索结果显示，不触发POI搜索
  if (searchResults.value.length > 0) return

  try {
    const pois = await getPoiAround({
      location: location,
      radius: MAP_CONFIG.search.radius,
      types: '',
      page: 1,
      offset: Math.min(MAP_CONFIG.search.limit, 10)
    })

    if (Array.isArray(pois) && pois.length > 0) {
      poiResults.value = pois.map(poi => ({
        id: poi.id,
        name: poi.name,
        address: poi.address,
        distance: poi.distance,
        location: poi.location,
        type: poi.type
      }))
      
      showPoiList.value = true
    } else {
      poiResults.value = []
      showPoiList.value = false
    }
    
  } catch (error) {
    console.warn('⚠️ 搜索附近POI失败:', error)
    poiResults.value = []
    showPoiList.value = false
  }
}, 800) // 800ms防抖，POI搜索频率要低一些

// 关闭POI列表
const closePoiList = () => {
  poiResults.value = []
  showPoiList.value = false
}

// 选择POI - 节流处理
const handleSelectPoi = throttle(async (poi) => {
  if (!poi?.location) {
    toast.show('POI位置信息无效')
    return
  }
  
  try {
    console.log('🔍 POI选择 - 原始数据:', {
      name: poi.name,
      location: poi.location,
      locationType: typeof poi.location
    })
    
    // 统一处理POI位置数据（现在str2ll支持多种格式）
    const location = str2ll(poi.location)
    if (!location) {
      throw new Error('POI位置解析失败')
    }
    
    console.log('✅ POI位置解析成功:', location)
    
    // 为marker生成location字符串
    const locationStr = ll2String(location)
    
    // 构造完整的位置信息对象，准备传递给父组件
    const selectedLocationInfo = {
      location: locationStr, // 标准化的坐标字符串
      address: poi.address || poi.name, // 优先使用详细地址，否则使用名称
      latitude: location.latitude,
      longitude: location.longitude,
      name: poi.name, // POI名称
      distance: poi.distance || 0 // 距离信息
    }
    
    console.log('📍 准备返回位置信息:', selectedLocationInfo)
    
    // 显示选择成功的提示
    toast.success(`已选择：${poi.name}`)
    
    // 延迟一点时间让用户看到提示，然后返回
    setTimeout(() => {
      // 直接触发选择事件，返回到发布页面
      emit("select", selectedLocationInfo)
    }, 300)
    
    // 清理状态
    closePoiList()
    
  } catch (error) {
    handleError(error, '选择POI')
  }
}, 300) // 300ms节流

// 优化的确认处理函数
const confirmHandler = debounce(async () => {
  if (isConfirmDisabled.value) return

  try {
    loading.value = true
    
    let result = null
    
    // 1. 优先使用选中的标记
    if (selectedMarker.value) {
      result = {
        location: selectedMarker.value.location,
        address: selectedMarker.value.title,
        latitude: selectedMarker.value.latitude,
        longitude: selectedMarker.value.longitude
      }
    } else {
      // 2. 使用当前地图中心点位置
      const locationStr = ll2String({
        longitude: longitude.value, 
        latitude: latitude.value
      })
      
      try {
        // 获取地址信息
        const locationInfo = await getRegeo(locationStr)
        
        result = {
          location: locationStr,
          address: locationInfo?.address || '精确坐标地点',
          latitude: latitude.value,
          longitude: longitude.value,
        }
      } catch (error) {
        console.warn('⚠️ 获取地址信息失败，使用坐标信息:', error)
        
        result = {
          location: locationStr,
          address: '获取地址失败',
          latitude: latitude.value,
          longitude: longitude.value
        }
      }
    }
    
    // 显示确认成功提示
    toast.success('位置确认成功')
    
    // 延迟一点时间让用户看到提示，然后返回
    setTimeout(() => {
      emit("select", result)
    }, 300)
    
    closePoiList()
    
  } catch (error) {
    handleError(error, '确认选择')
  } finally {
    loading.value = false
  }
}, 200) // 200ms防抖

// 初始化预览位置
const initPreviewLocation = async (location) => {
  try {
    const locationObj = str2ll(location)
    if (!locationObj) {
      throw new Error('预览位置格式错误')
    }

    // 坐标验证
    if (Math.abs(locationObj.latitude) > 90 || Math.abs(locationObj.longitude) > 180) {
      throw new Error('预览位置坐标超出有效范围')
    }

    latitude.value = locationObj.latitude
    longitude.value = locationObj.longitude

    const marker = {
      id: 1,
      latitude: locationObj.latitude,
      longitude: locationObj.longitude,
      position: location,
      width: 32,
      height: 32
    }

    updateMarkers([marker])
    
  } catch (error) {
    handleError(error, '初始化预览位置')
    // 使用默认位置
    latitude.value = MAP_CONFIG.map.defaultCenter.latitude
    longitude.value = MAP_CONFIG.map.defaultCenter.longitude
  }
}

// 组件挂载时的初始化
onMounted(async () => {
  try {
    if (props.previewMode) {
      await initPreviewLocation(props.previewLocation)
      return
    }
    
    // 获取当前位置
    const location = await getCurrentLocation()
    latitude.value = location.latitude
    longitude.value = location.longitude
    
  } catch (error) {
    handleError(error, '获取当前位置')
    // 使用默认位置
    latitude.value = MAP_CONFIG.map.defaultCenter.latitude
    longitude.value = MAP_CONFIG.map.defaultCenter.longitude
  }
})

// 组件卸载时的清理
onUnmounted(() => {
  // 清理防抖和节流的计时器
  handleSearchInput.cancel?.()
  handleSelectSearchResult.cancel?.()
  handleSelectLocation.cancel?.()
  handleMapTap.cancel?.()
  handleRegionChange.cancel?.()
  searchNearbyPoi.cancel?.()
  handleSelectPoi.cancel?.()
  confirmHandler.cancel?.()
  clearSearchResults.cancel?.()
  moveToLocation.cancel?.()
})
</script>

<style lang="scss" scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;
}

.map-element {
  width: 100% !important;
  height: 100% !important;
  flex: 1;
  position: relative;
  /* 强制重置CSS框架的scale变换 */
  transform: none !important;
  --un-scale-x: 1 !important;
  --un-scale-y: 1 !important;
  scale: none !important;
}

/* 全局重置任何可能影响地图的scale样式 */
#map,
.map-element,
map {
  transform: none !important;
  scale: none !important;
}

/* 针对UnoCSS/Tailwind的scale属性进行特殊处理 */
[scale] {
  --un-scale-x: 1 !important;
  --un-scale-y: 1 !important;
}

.search-box {
  position: absolute;
  top: 24rpx;
  left: 24rpx;
  right: 24rpx;
  z-index: 100;

  .search-input {
    display: flex;
    align-items: center;
    background: #fff;
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 28rpx;
    }
  }

  .search-results {
    margin-top: 16rpx;
    max-height: 600rpx;
    background: #fff;
    border-radius: 12rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);

    .result-item {
      padding: 24rpx;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;

      &:hover, &:active {
        background-color: rgba(0, 0, 0, 0.02);
      }

      &:last-child {
        border-bottom: none;
      }

      .location-info {
        flex: 1;
        margin-right: 24rpx;

        .name {
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
        }

        .address {
          font-size: 24rpx;
          color: #999;
        }
      }

      .distance {
        font-size: 24rpx;
        color: #ff9090;
      }
    }
  }
}

.center-pin {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100%);
  z-index: 100;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  transition: transform 0.2s ease;

  &.moving {
    transform: translate(-50%, -105%);
  }
}

.controls {
  position: absolute;
  right: 24rpx;
  bottom: 240rpx;
  z-index: 100;

  .control-btn {
    width: 80rpx;
    height: 80rpx;
    background: #fff;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
    margin-bottom: 24rpx;
    transition: all 0.2s ease;

    &:active {
      transform: scale(0.95);
    }
  }
}

.mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: 99;
}

.coordinates-panel {
  position: absolute;
  right: 24rpx;
  bottom: 160rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
  z-index: 90;
  font-size: 24rpx;
  color: #333;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.5);

  .coordinate-item {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  .coordinate-label {
    color: #666;
    font-weight: 500;
  }

  .coordinate-value {
    color: #ff6b6b;
    font-family: 'Courier New', monospace;
    font-weight: 500;
  }
}

.poi-list-container {
  position: absolute;
  left: 24rpx;
  right: 24rpx;
  bottom: 120rpx;
  z-index: 95;
  background: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  max-height: 400rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .poi-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 24rpx;
    border-bottom: 1px solid #f0f0f0;
    background: rgba(255, 255, 255, 0.95);

    .poi-list-title {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
    }

    .poi-close-btn {
      width: 48rpx;
      height: 48rpx;
      border-radius: 24rpx;
      background: rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;

      &:active {
        background: rgba(0, 0, 0, 0.1);
      }
    }
  }

  .poi-list {
    max-height: 320rpx;
  }

  .poi-item {
    padding: 20rpx 24rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #f0f0f0;
    transition: background-color 0.2s ease;

    &:active {
      background-color: rgba(0, 0, 0, 0.02);
    }

    &:last-child {
      border-bottom: none;
    }

    .poi-info {
      flex: 1;
      margin-right: 24rpx;

      .poi-name {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 8rpx;
      }

      .poi-address {
        font-size: 24rpx;
        color: #999;
      }
    }

    .poi-distance {
      font-size: 24rpx;
      color: #2196F3;
    }
  }
}

.confirm-button-container {
  position: absolute;
  left: 50%;
  bottom: 40rpx;
  transform: translateX(-50%);
  z-index: 95;

  .btn-shadow {
    background: #fff !important;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15) !important;
    transition: all 0.2s ease !important;

    &:disabled {
      opacity: 0.6 !important;
    }
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
</style>