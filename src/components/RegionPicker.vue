<template>
  <view v-if="show" class="region-picker-mask" @tap="close">
    <view class="region-picker-container" @tap.stop>
      <!-- 头部 -->
      <view class="region-picker-header">
        <text class="cancel-btn" @tap="close">取消</text>
        <text class="title">选择地区</text>
        <text class="confirm-btn" @tap="confirm">确定</text>
      </view>
      
      <!-- 当前选择显示 -->
      <view class="current-selection">
        <view class="selection-label">当前选择</view>
        <text class="selection-text" :class="{ 'placeholder': !currentSelectionText }">
          {{ currentSelectionText || '请选择省市区' }}
        </text>
      </view>
      
      <!-- 三级联动选择器 -->
      <view class="picker-container">
        <picker-view 
          :value="[provinceIndex, cityIndex, districtIndex]" 
          @change="onPickerChange"
          class="region-picker-view"
        >
          <!-- 省份列 -->
          <picker-view-column>
            <view 
              v-for="(province, index) in provinces" 
              :key="province.code || index"
              class="picker-item"
            >
              {{ province.name }}
            </view>
          </picker-view-column>
          
          <!-- 城市列 -->
          <picker-view-column>
            <view 
              v-for="(city, index) in currentCities" 
              :key="city.code || index"
              class="picker-item"
            >
              {{ city.name }}
            </view>
          </picker-view-column>
          
          <!-- 区县列 -->
          <picker-view-column>
            <view 
              v-for="(district, index) in currentDistricts" 
              :key="district.code || index"
              class="picker-item"
            >
              {{ district.name }}
            </view>
          </picker-view-column>
        </picker-view>
      </view>
      
      <!-- 快捷选择 -->
      <view class="quick-select">
        <text class="quick-title">快捷选择：</text>
        <view class="quick-buttons">
          <text 
            v-for="item in quickSelections" 
            :key="item.code"
            class="quick-btn"
            @tap="selectQuick(item)"
          >
            {{ item.name }}
          </text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { regionData } from '@/utils/regionData'

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  value: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:show', 'confirm', 'cancel'])

// 数据
const provinces = ref(regionData)
const provinceIndex = ref(0)
const cityIndex = ref(0) 
const districtIndex = ref(0)

// 当前选中的省份城市
const currentProvince = computed(() => {
  if (provinces.value.length === 0) return {}
  const index = Math.max(0, Math.min(provinceIndex.value, provinces.value.length - 1))
  return provinces.value[index] || {}
})

const currentCities = computed(() => {
  if (!currentProvince.value.children) return []
  return currentProvince.value.children || []
})

const currentCity = computed(() => {
  if (currentCities.value.length === 0) return {}
  const index = Math.max(0, Math.min(cityIndex.value, currentCities.value.length - 1))
  return currentCities.value[index] || {}
})

const currentDistricts = computed(() => {
  if (!currentCity.value.children) return []
  return currentCity.value.children || []
})

const currentDistrict = computed(() => {
  if (currentDistricts.value.length === 0) return {}
  const index = Math.max(0, Math.min(districtIndex.value, currentDistricts.value.length - 1))
  return currentDistricts.value[index] || {}
})

// 当前选择的文本
const currentSelectionText = computed(() => {
  if (!currentProvince.value.name) return ''
  
  let text = currentProvince.value.name
  if (currentCity.value.name) {
    text += ` ${currentCity.value.name}`
  }
  if (currentDistrict.value.name) {
    text += ` ${currentDistrict.value.name}`
  }
  
  return text
})

// 快捷选择项
const quickSelections = ref([
  { name: '江苏省 苏州市 姑苏区', code: '320508' },
  { name: '江苏省 南京市 玄武区', code: '320102' },
  { name: '上海市 黄浦区', code: '310101' },
  { name: '北京市 朝阳区', code: '110105' },
  { name: '广东省 深圳市 南山区', code: '440305' }
])

// 监听显示状态，初始化数据
watch(() => props.show, (newVal) => {
  if (newVal) {
    // 重置为默认值
    provinceIndex.value = 0
    cityIndex.value = 0
    districtIndex.value = 0
    
    // 如果有传入值，则根据值初始化
    if (props.value) {
      initFromValue(props.value)
    }
  }
})

// 从已有值初始化选择器
const initFromValue = (value) => {
  const parts = value.split(' ')
  if (parts.length < 2) return
  
  // 查找省份
  const foundProvinceIndex = provinces.value.findIndex(p => p.name === parts[0])
  if (foundProvinceIndex >= 0) {
    provinceIndex.value = foundProvinceIndex
    
    // 查找城市
    const cities = provinces.value[foundProvinceIndex].children || []
    const cityIdx = cities.findIndex(c => c.name === parts[1])
    if (cityIdx >= 0) {
      cityIndex.value = cityIdx
      
      // 查找区县
      if (parts[2]) {
        const districts = cities[cityIdx].children || []
        const districtIdx = districts.findIndex(d => d.name === parts[2])
        if (districtIdx >= 0) {
          districtIndex.value = districtIdx
        }
      }
    }
  }
}

// 处理选择器变化
const onPickerChange = (e) => {
  const [newProvinceIndex, newCityIndex, newDistrictIndex] = e.detail.value
  
  // 省份变化时，重置城市和区县
  if (newProvinceIndex !== provinceIndex.value) {
    provinceIndex.value = newProvinceIndex
    cityIndex.value = 0
    districtIndex.value = 0
  }
  // 城市变化时，重置区县
  else if (newCityIndex !== cityIndex.value) {
    cityIndex.value = newCityIndex
    districtIndex.value = 0
  }
  // 区县变化
  else {
    districtIndex.value = newDistrictIndex
  }
}

// 快捷选择
const selectQuick = (item) => {
  const parts = item.name.split(' ')
  if (parts.length >= 2) {
    initFromValue(item.name)
    
    // 延迟一点时间让用户看到选择效果，然后自动确认
    setTimeout(() => {
      confirm()
    }, 300)
  }
}

// 确认选择
const confirm = () => {
  const result = {
    text: currentSelectionText.value,
    province: currentProvince.value,
    city: currentCity.value,
    district: currentDistrict.value
  }
  
  emit('confirm', result)
  emit('update:show', false)
}

// 取消选择
const close = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>

<style scoped>
.region-picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-end;
  z-index: 10000;
}

.region-picker-container {
  width: 100%;
  background: white;
  border-radius: 20rpx 20rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.region-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.cancel-btn, .confirm-btn {
  font-size: 30rpx;
  color: #666;
}

.confirm-btn {
  color: #007aff;
}

.title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.current-selection {
  padding: 20rpx 30rpx;
  background: #f8f8f8;
  border-bottom: 1px solid #eee;
}

.selection-label {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;
}

.selection-text {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.selection-text.placeholder {
  color: #999;
  font-weight: normal;
}

.picker-container {
  height: 500rpx;
  background: white;
  border-radius: 8rpx;
  margin: 0 20rpx;
}

.region-picker-view {
  height: 400rpx;
  width: 100%;
  background: white;
}

.picker-item {
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #333;
  line-height: 80rpx;
  text-align: center;
}

.quick-select {
  padding: 20rpx 30rpx;
  border-top: 1px solid #f0f0f0;
  max-height: 200rpx;
  overflow-y: auto;
}

.quick-title {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.quick-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 15rpx;
}

.quick-btn {
  padding: 12rpx 24rpx;
  background: #f5f5f5;
  border-radius: 24rpx;
  font-size: 24rpx;
  color: #666;
  white-space: nowrap;
  transition: all 0.2s ease;
  border: 1px solid #e8e8e8;
}

.quick-btn:active {
  background: #007aff;
  color: white;
  border-color: #007aff;
  transform: scale(0.95);
}
</style> 