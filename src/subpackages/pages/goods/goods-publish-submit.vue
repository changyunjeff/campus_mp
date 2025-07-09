<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'
import events from '@/utils/events'
import { useToast } from '@/composables/toast'
import { getFullFieldConfig, FIELD_TYPES } from '@/subpackages/configs/goods/specs.config'
import { getCategoryById, getSubcategoryById } from '@/subpackages/pages/goods/category.config.js'
// 引入地图组件
import Amap from '@/components/Amap.vue'

const router = useRouter()
const toast = useToast()

// 页面状态
const loading = ref(true)
const isSubmitting = ref(false)

// 分类信息
const categoryId = ref('')
const subcategoryId = ref('')
const categoryInfo = ref(null)
const subcategoryInfo = ref(null)

// 字段配置
const fieldConfig = ref({
  basic: [],
  specs: [],
  all: []
})

// 表单数据
const formData = reactive({})

// 表单验证错误
const formErrors = ref({})

// 图片上传相关
const imageList = ref([])
const isUploading = ref(false)
const uploadMaxCount = 9
const uploadMinCount = 1

// 编辑模式
const isEdit = ref(false)
const goodsId = ref('')

// 位置选择相关
const showLocationPicker = ref(false)
const locationDetail = ref({
  address: '',
  latitude: 0,
  longitude: 0
})

// 计算属性
const isFormValid = computed(() => {
  return Object.keys(formErrors.value).length === 0 && 
         imageList.value.length >= uploadMinCount
})

const canSubmit = computed(() => {
  return isFormValid.value && !isSubmitting.value && !isUploading.value
})

// 页面加载
onLoad(async (options) => {
  console.debug("传入的参数：", options)
  try {
    loading.value = true
    
    // 检查商家支付设置
    await checkMerchantPaymentSetup()
    
    // 获取传递的参数
    categoryId.value = options.categoryId || ''
    subcategoryId.value = options.subcategoryId || ''
    
    // 获取分类信息
    categoryInfo.value = getCategoryById(categoryId.value)
    if (subcategoryId.value) {
      subcategoryInfo.value = getSubcategoryById(categoryId.value, subcategoryId.value)
    }
    
    // 获取字段配置
    fieldConfig.value = getFullFieldConfig(categoryId.value, subcategoryId.value)
    
    // 初始化表单数据
    initFormData()
    
    // 编辑模式
    if (options.id && options.mode === 'edit') {
      isEdit.value = true
      goodsId.value = options.id
      await loadGoodsData()
    }
    
  } catch (error) {
    console.error('页面初始化失败:', error)
    toast.show('页面加载失败')
  } finally {
    loading.value = false
  }
})

// 检查商家支付设置
const checkMerchantPaymentSetup = async () => {
  try {
    const paymentInfo = await GoodsApi.getMerchantPaymentInfo()
    
    if (!paymentInfo || !paymentInfo.is_verified || !paymentInfo.is_enabled) {
      // 支付设置不完整，显示提醒
      setTimeout(() => {
        uni.showModal({
          title: '支付设置提醒',
          content: '检测到您尚未完成支付设置或未启用支付功能，完成设置后才能接收买家付款。是否立即前往设置？',
          confirmText: '立即设置',
          cancelText: '稍后设置',
          success: (res) => {
            if (res.confirm) {
              router.push({
                name: 'goods_merchant_payment_setup'
              })
            }
          }
        })
      }, 1000)
    }
  } catch (error) {
    // 如果是404错误，表示还没有设置过支付信息
    if (error.status === 404 || error.message?.includes('404')) {
      setTimeout(() => {
        uni.showModal({
          title: '首次发布提醒',
          content: '首次发布商品需要先设置支付信息，以便接收买家付款。是否立即前往设置？',
          confirmText: '立即设置',
          cancelText: '稍后设置',
          success: (res) => {
            if (res.confirm) {
              router.push({
                name: 'goods_merchant_payment_setup'
              })
            }
          }
        })
      }, 1000)
    } else {
      console.error('检查支付设置失败:', error)
    }
  }
}

// 初始化表单数据
const initFormData = () => {
  // 确保fieldConfig已加载
  if (!fieldConfig.value.all || fieldConfig.value.all.length === 0) {
    console.warn('字段配置未正确加载')
    return
  }
  
  // 初始化所有字段
  fieldConfig.value.all.forEach(field => {
    if (field && field.field) {
      formData[field.field] = field.defaultValue || ''
    }
  })
  
  // 设置默认标题
  if (subcategoryInfo.value && subcategoryInfo.value.name) {
    formData.title = subcategoryInfo.value.name
  }
  
  // 确保商品状况有默认值
  if (!formData.condition) {
    formData.condition = '全新'
  }
  
  console.log('初始化表单数据:', formData)
}

// 获取输入框类型
const getInputType = (fieldType) => {
  switch (fieldType) {
    case FIELD_TYPES.NUMBER:
      return 'number'
    case FIELD_TYPES.DATE:
      return 'date'
    default:
      return 'text'
  }
}

// 表单验证 - 修复时机问题
const validateForm = () => {
  if (!fieldConfig.value.all || fieldConfig.value.all.length === 0) {
    return // 如果字段配置还未加载，暂不验证
  }
  
  formErrors.value = {}
  
  // 验证所有必填字段
  fieldConfig.value.all.forEach(field => {
    if (!field || !field.field) return // 防御性检查
    
    if (field.required && !formData[field.field]) {
      formErrors.value[field.field] = `${field.label}不能为空`
    }
    
    // 验证数字类型
    if (field.type === FIELD_TYPES.NUMBER && formData[field.field]) {
      const value = parseFloat(formData[field.field])
      if (isNaN(value)) {
        formErrors.value[field.field] = '请输入有效数字'
      } else {
        if (field.min && value < field.min) {
          formErrors.value[field.field] = `最小值为${field.min}`
        }
        if (field.max && value > field.max) {
          formErrors.value[field.field] = `最大值为${field.max}`
        }
      }
    }
    
    // 验证文本长度
    if (field.maxLength && formData[field.field] && formData[field.field].length > field.maxLength) {
      formErrors.value[field.field] = `最多输入${field.maxLength}个字符`
    }
  })
  
  // 验证图片
  if (imageList.value.length < uploadMinCount) {
    formErrors.value.images = `至少上传${uploadMinCount}张图片`
  }
}

// 输入事件直接调用 validateForm

// 选择图片
const chooseImage = () => {
  const maxCount = uploadMaxCount - imageList.value.length
  if (maxCount <= 0) {
    toast.show(`最多只能上传${uploadMaxCount}张图片`)
    return
  }

  if (isUploading.value) {
    toast.show('正在上传图片，请稍后')
    return
  }

  uni.chooseImage({
    count: maxCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      await uploadImages(res.tempFilePaths)
    }
  })
}

// 上传图片
const uploadImages = async (filePaths) => {
  try {
    isUploading.value = true
    events.emit('showUpload', 0)
    
    const uploadPromises = filePaths.map(async (filePath, index) => {
      const response = await GoodsApi.uploadGoodsImageToOSS(filePath, goodsId.value || 'temp')
      console.debug("上传图片:", response)
      
      // 更新进度
      const progress = ((index + 1) / filePaths.length) * 100
      events.emit('updateUpload', progress)
      
      return response
    })

    const results = await Promise.all(uploadPromises)
    
    // 添加到图片列表
    results.forEach(result => {
      imageList.value.push({
        url: result.url,
        object_key: result.object_key || result.objectKey,
        type: result.type || 'image'
      })
    })

    events.emit('hideUpload')
    toast.show('图片上传成功')
    
    // 重新验证表单
    validateForm()
    
  } catch (error) {
    console.error('上传图片失败:', error)
    events.emit('hideUpload')
    toast.show('图片上传失败')
  } finally {
    isUploading.value = false
  }
}

// 删除图片
const deleteImage = (index) => {
  uni.showModal({
    title: '删除图片',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        const deletedImage = imageList.value[index]
        imageList.value.splice(index, 1)
        
        // 删除OSS文件
        if (deletedImage.objectKey) {
          GoodsApi.deleteGoodsMediaFromOSS(deletedImage.objectKey)
            .catch(error => {
              console.error('删除OSS文件失败:', error)
            })
        }
        
        // 重新验证表单
        validateForm()
      }
    }
  })
}

// 预览图片
const previewImage = (index) => {
  const urls = imageList.value.map(img => img.url)
  uni.previewImage({
    urls: urls,
    current: index
  })
}

// 设置主图
const setMainImage = (index) => {
  if (index === 0) return
  
  const mainImage = imageList.value[index]
  imageList.value.splice(index, 1)
  imageList.value.unshift(mainImage)
}

// 打开地图选择器
const openLocationPicker = () => {
  showLocationPicker.value = true
}

// 处理地图选择位置
const handleLocationSelect = (selectedLocation) => {
  console.log('选择的位置:', selectedLocation)
  
  // 存储完整的位置信息
  const location = {
    address: selectedLocation.address || selectedLocation.name || '未知位置',
    latitude: selectedLocation.latitude,
    longitude: selectedLocation.longitude
  }

  locationDetail.value = location
  
  formData.location = location.address
  formData.latitude = location.latitude
  formData.longitude = location.longitude
  
  // 关闭位置选择器
  showLocationPicker.value = false
  validateForm()
  
  toast.show('位置选择成功')
}

// 处理选择器变化 - 修复函数绑定问题
const handlePickerChange = (field, e) => {
  if (!field || !field.options) {
    console.warn('字段或选项不存在:', field)
    return
  }
  
  const selectedIndex = e.detail.value
  if (field.options[selectedIndex]) {
    formData[field.field] = field.options[selectedIndex]
    validateForm()
  }
}

// 获取选择器当前值的索引
const getPickerValue = (field) => {
  if (!field || !field.options || !formData[field.field]) {
    return 0
  }
  const currentValue = formData[field.field]
  const index = field.options.indexOf(currentValue)
  return index >= 0 ? index : 0
}

// 注意：选择器直接在模板中使用内联函数处理事件

// 提交表单
const submitForm = async () => {
  validateForm()
  
  if (!isFormValid.value) {
    toast.show('请检查表单输入')
    return
  }
  
  try {
    isSubmitting.value = true
    
    // 准备提交数据
    const submitData = {
      title: formData.title.trim(),
      description: formData.description || '',
      price: parseFloat(formData.price) || 0,
      original_price: formData.originalPrice ? parseFloat(formData.originalPrice) : null,
      category_id: subcategoryId.value || categoryId.value,
      location: formData.location || '未知',
      longitude: formData.longitude || 0,
      latitude: formData.latitude || 0,
      condition: formData.condition || '全新',
      is_real: true,
      media_list: imageList.value || [],
    }
    
    // 添加规格参数
    fieldConfig.value.specs.forEach(field => {
      if (formData[field.field]) {
        submitData.specs[field.field] = formData[field.field]
      }
    })

    let response
    if (isEdit.value) {
      response = await GoodsApi.updateGoods(goodsId.value, submitData)
    } else {
      response = await GoodsApi.createGoods(submitData)
    }

    console.debug('提交成功:', response)

    toast.show(isEdit.value ? '更新成功' : '发布成功')

    // 清理本地缓存
    uni.removeStorageSync('goodsPublishDraft')

    setTimeout(() => {
      router.replace({
        name: 'goods_personal_center'
      })
    }, 1500)
  } catch (error) {
    console.error('提交失败:', error)
    toast.show(error.message || '操作失败')
  } finally {
    isSubmitting.value = false
  }
}

// 保存草稿
const saveDraft = () => {
  const draftData = {
    categoryId: categoryId.value,
    subcategoryId: subcategoryId.value,
    formData: formData,
    imageList: imageList.value,
    timestamp: Date.now()
  }
  
  uni.setStorageSync('goodsPublishDraft', JSON.stringify(draftData))
  toast.show('草稿已保存')
  router.back()
}

// 加载商品数据（编辑模式）
const loadGoodsData = async () => {
  try {
    const response = await GoodsApi.getGoodsDetail(goodsId.value)
    
    if (response.code === 200) {
      const goods = response.data
      
      // 填充基础数据
      Object.keys(formData).forEach(key => {
        if (goods[key] !== undefined) {
          formData[key] = goods[key]
        }
      })
      
      // 填充规格数据
      if (goods.specs) {
        Object.keys(goods.specs).forEach(key => {
          if (formData[key] !== undefined) {
            formData[key] = goods.specs[key]
          }
        })
      }
      
      // 填充图片数据
      if (goods.images) {
        imageList.value = goods.images.map(img => ({
          url: img.url,
          object_key: img.object_key,
          type: img.type || 'image'
        }))
      }
    }
  } catch (error) {
    console.error('加载商品数据失败:', error)
    toast.show('加载商品数据失败')
  }
}

// 页面卸载时保存草稿
onUnload(() => {
  if (!isEdit.value && (formData.title || imageList.value.length > 0)) {
    saveDraft()
  }
})
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="saveDraft">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">
        {{ isEdit ? '编辑商品' : '发布商品' }}
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh pb-150rpx">
      <!-- 加载状态 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
        <text class="ml-20rpx text-28rpx text-gray-500">加载中...</text>
      </view>
      
      <template v-else>
        <!-- 分类信息 -->
        <view class="bg-white px-30rpx py-20rpx flex items-center border-b border-gray-100">
          <WdIcon name="apps" size="40rpx" custom-style="color:#f43f5e" class="mr-15rpx"/>
          <text class="text-28rpx text-#333">
            {{ categoryInfo?.name }}
            <text v-if="subcategoryInfo"> > {{ subcategoryInfo.name }}</text>
          </text>
        </view>
        
        <!-- 商品图片上传 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-20rpx flex items-center justify-between">
            <view class="flex items-center">
              <text class="text-30rpx font-medium text-#333">商品图片</text>
              <text class="text-red-500 ml-5rpx">*</text>
              <text class="text-24rpx text-gray-500 ml-15rpx">
                至少上传{{ uploadMinCount }}张，第一张为主图
              </text>
            </view>
            <text class="text-24rpx text-gray-500">{{ imageList.length }}/{{ uploadMaxCount }}</text>
          </view>
          
          <view class="grid grid-cols-3 gap-20rpx">
            <!-- 已上传图片 -->
            <view
              v-for="(image, index) in imageList"
              :key="index"
              class="aspect-square bg-gray-100 rounded-12rpx overflow-hidden border border-gray-200"
            >
              <image 
                :src="image.url" 
                class="w-full h-full object-cover" 
                mode="aspectFill"
                @tap="previewImage(index)"
              />
              
              <!-- 主图标识 -->
              <view v-if="index === 0" class="absolute top-10rpx left-10rpx bg-#f43f5e bg-opacity-90 rounded-4rpx px-8rpx py-4rpx z-1">
                <text class="text-20rpx text-white">主图</text>
              </view>
              
              <!-- 操作按钮 -->
              <view class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 flex justify-between p-10rpx z-1">
                <view class="flex items-center" @tap.stop="setMainImage(index)">
                  <WdIcon name="star" size="24rpx" color="#fff" class="mr-4rpx"/>
                  <text class="text-20rpx text-white">主图</text>
                </view>
                <view class="flex items-center" @tap.stop="deleteImage(index)">
                  <WdIcon name="delete" size="24rpx" color="#fff" class="mr-4rpx"/>
                  <text class="text-20rpx text-white">删除</text>
                </view>
              </view>
            </view>
            
            <!-- 添加图片按钮 -->
            <view 
              v-if="imageList.length < uploadMaxCount"
              class="aspect-square bg-gray-100 rounded-12rpx flex flex-col items-center justify-center border-2rpx border-dashed border-gray-300"
              :class="{ 'opacity-50': isUploading }"
              @tap="chooseImage"
            >
              <WdIcon 
                :name="isUploading ? 'loading' : 'plus'" 
                size="40rpx" 
                custom-style="color:#999"
                :class="{ 'animate-spin': isUploading }"
              />
              <text class="text-24rpx text-gray-500 mt-10rpx">
                {{ isUploading ? '上传中...' : '添加图片' }}
              </text>
            </view>
          </view>
          
          <!-- 错误提示 -->
          <view v-if="formErrors.images" class="mt-20rpx text-24rpx text-red-500">
            {{ formErrors.images }}
          </view>
          
          <!-- 上传提示 -->
          <view class="mt-20rpx p-20rpx bg-blue-50 rounded-12rpx">
            <text class="text-24rpx text-blue-600 block">📝 上传提示</text>
            <text class="text-24rpx text-blue-600 mt-6rpx block">
              • 图片清晰度越高，成交率越高
            </text>
            <text class="text-24rpx text-blue-600 mt-6rpx block">
              • 上传真实图片，请勿上传侵权或违规图片
            </text>
          </view>
        </view>
        
        <!-- 基础信息表单 -->
        <view class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx border-l-6rpx border-#f43f5e pl-15rpx">
            <text class="text-30rpx font-medium text-#333">基础信息</text>
          </view>
          
          <view class="space-y-25rpx">
            <view v-for="field in fieldConfig.basic" :key="field.field" class="form-item">
              <view class="form-label">
                <text class="text-28rpx text-#333">{{ field.label }}</text>
                <text v-if="field.required" class="text-red-500 ml-5rpx">*</text>
              </view>
              
              <!-- 文本输入框 -->
              <input 
                v-if="field.type === FIELD_TYPES.TEXT || field.type === FIELD_TYPES.NUMBER"
                :type="getInputType(field.type)" 
                v-model="formData[field.field]" 
                :placeholder="field.placeholder" 
                class="form-input"
                @blur="validateForm"
              />
              
              <!-- 文本域 -->
              <textarea 
                v-else-if="field.type === FIELD_TYPES.TEXTAREA"
                v-model="formData[field.field]" 
                :placeholder="field.placeholder" 
                class="form-textarea"
                :maxlength="field.maxLength || 500"
                @blur="validateForm"
              />
              
              <!-- 选择器 -->
              <picker 
                v-else-if="field.type === FIELD_TYPES.SELECT"
                mode="selector" 
                :range="field.options || []"
                :value="getPickerValue(field)"
                @change="(e) => handlePickerChange(field, e)"
              >
                <view class="picker-view">
                  <text v-if="formData[field.field]" class="text-28rpx text-#333">
                    {{ formData[field.field] }}
                  </text>
                  <text v-else class="text-28rpx text-gray-400">
                    {{ field.placeholder || `请选择${field.label}` }}
                  </text>
                  <WdIcon name="chevron-down" size="24rpx" custom-style="color:#999" class="ml-10rpx"/>
                </view>
              </picker>
              
              <!-- 位置选择特殊处理 -->
              <view 
                v-if="field.field === 'location'" 
                class="picker-view location-picker" 
                @tap="openLocationPicker"
              >
                <view class="flex items-center flex-1">
                  <WdIcon name="location" size="24rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
                  <text v-if="formData.location" class="text-28rpx text-#333">
                    {{ formData.location }}
                  </text>
                  <text v-else class="text-28rpx text-gray-400">点击选择交易地点</text>
                </view>
                <view class="flex items-center gap-10rpx">
                  <WdIcon name="chevron-down" size="24rpx" custom-style="color:#999"/>
                </view>
              </view>
              
              <!-- 字符计数 -->
              <view v-if="field.type === FIELD_TYPES.TEXTAREA && field.maxLength" class="text-right text-24rpx text-gray-400 mt-10rpx">
                {{ (formData[field.field] || '').length }}/{{ field.maxLength }}
              </view>
              
              <!-- 错误提示 -->
              <view v-if="formErrors[field.field]" class="form-error">
                {{ formErrors[field.field] }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 规格参数表单 -->
        <view v-if="fieldConfig.specs.length > 0" class="bg-white p-30rpx mb-20rpx">
          <view class="mb-30rpx border-l-6rpx border-#f43f5e pl-15rpx">
            <text class="text-30rpx font-medium text-#333">规格参数</text>
          </view>
          
          <view class="space-y-25rpx">
            <view v-for="field in fieldConfig.specs" :key="field.field" class="form-item">
              <view class="form-label">
                <text class="text-28rpx text-#333">{{ field.label }}</text>
                <text v-if="field.required" class="text-red-500 ml-5rpx">*</text>
              </view>
              
              <!-- 文本输入框 -->
              <input 
                v-if="field.type === FIELD_TYPES.TEXT || field.type === FIELD_TYPES.NUMBER"
                :type="getInputType(field.type)" 
                v-model="formData[field.field]" 
                :placeholder="field.placeholder" 
                class="form-input"
              />
              
              <!-- 选择器 -->
              <picker 
                v-else-if="field.type === FIELD_TYPES.SELECT"
                mode="selector" 
                :range="field.options || []"
                :value="getPickerValue(field)"
                @change="(e) => handlePickerChange(field, e)"
              >
                <view class="picker-view">
                  <text v-if="formData[field.field]" class="text-28rpx text-#333">
                    {{ formData[field.field] }}
                  </text>
                  <text v-else class="text-28rpx text-gray-400">
                    {{ field.placeholder || `请选择${field.label}` }}
                  </text>
                  <WdIcon name="chevron-down" size="24rpx" custom-style="color:#999" class="ml-10rpx"/>
                </view>
              </picker>
              
              <!-- 错误提示 -->
              <view v-if="formErrors[field.field]" class="form-error">
                {{ formErrors[field.field] }}
              </view>
            </view>
          </view>
        </view>
        
        <!-- 发布须知 -->
        <view class="bg-white p-30rpx mb-30rpx">
          <view class="flex items-center mb-20rpx">
            <WdIcon name="info-o" size="32rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
            <text class="text-30rpx font-medium text-#333">发布须知</text>
          </view>
          <view class="text-26rpx text-gray-600 leading-40rpx space-y-8rpx">
            <view>• 上传商品真实图片，保证商品信息的真实性和准确性</view>
            <view>• 禁止发布侵权、违禁、违法商品</view>
            <view>• 商品发布后，平台将对商品信息进行审核</view>
            <view>• 商品成功售出后，平台将收取一定比例的服务费</view>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 px-30rpx py-20rpx flex justify-between">
      <view class="flex-1 mr-20rpx">
        <button 
          class="h-90rpx flex items-center justify-center border border-gray-300 rounded-full bg-white text-#333"
          @tap="saveDraft"
        >
          <text class="text-30rpx">保存草稿</text>
        </button>
      </view>
      <view class="flex-1">
        <button 
          class="h-90rpx flex items-center justify-center rounded-full transition-all duration-300"
          :class="canSubmit ? 'bg-gradient-to-r from-#f43f5e to-#ff7676 text-white shadow-md shadow-pink-200' : 'bg-gray-200 text-gray-500'"
          @tap="canSubmit && submitForm()"
        >
          <WdIcon 
            v-if="isSubmitting" 
            name="loading" 
            size="28rpx" 
            color="#fff" 
            class="animate-spin mr-10rpx"
          />
          <text class="text-30rpx" :class="canSubmit ? 'font-medium' : ''">
            {{ isSubmitting ? '发布中...' : (isEdit ? '保存修改' : '立即发布') }}
          </text>
        </button>
      </view>
    </view>
    
    <!-- 位置选择弹窗 - 集成地图组件 -->
    <view v-if="showLocationPicker" class="location-picker-modal">
      <!-- 顶部导航栏 -->
      <view class="location-picker-header">
        <view @tap="showLocationPicker = false" class="p-10rpx active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="36rpx" color="#333"/>
        </view>
        <text class="text-32rpx font-medium text-#333">选择交易地点</text>
        <view class="w-56rpx"></view> <!-- 占位元素保持居中 -->
      </view>
      
      <!-- 地图组件区域 -->
      <view class="location-picker-map">
        <Amap
          :show-search="true"
          :show-controls="true"
          :show-center-pin="true"
          :show-location="true"
          @select="handleLocationSelect"
        />
      </view>
      
      <!-- 底部提示 -->
      <view class="location-picker-footer">
        <text class="text-26rpx text-gray-500 text-center block">
          点击地图任意位置或搜索地点来选择交易地点
        </text>
      </view>
    </view>
  </layout>
</template>

<style scoped>
.aspect-square {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;
}

.aspect-square image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 添加图片按钮的特殊样式 */
.aspect-square.flex {
  display: flex;
  align-items: center;
  justify-content: center;
}

.aspect-square.flex::before {
  content: '';
  padding-bottom: 100%;
}

.form-item {
  margin-bottom: 25rpx;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 0 20rpx;
  font-size: 28rpx;
  border: 2rpx solid #f8f8f8;
  transition: border-color 0.3s;
}

.form-input:focus {
  border-color: #f43f5e;
  background-color: #fff;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 20rpx;
  font-size: 28rpx;
  border: 2rpx solid #f8f8f8;
  transition: border-color 0.3s;
}

.form-textarea:focus {
  border-color: #f43f5e;
  background-color: #fff;
}

.picker-view {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 80rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 0 20rpx;
  border: 2rpx solid #f8f8f8;
  transition: all 0.3s;
}

.picker-view:active {
  border-color: #f43f5e;
  background-color: #fff;
}

.location-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.location-picker .flex {
  display: flex;
}

.form-error {
  font-size: 24rpx;
  color: #f43f5e;
  margin-top: 10rpx;
}

.space-y-25rpx .form-item + .form-item {
  margin-top: 25rpx;
}

.space-y-8rpx view + view {
  margin-top: 8rpx;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 位置选择器样式 */
.location-picker-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: white;
  z-index: 999;
  display: flex;
  flex-direction: column;
}

.location-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding-top: calc(20rpx + constant(safe-area-inset-top));
  padding-top: calc(20rpx + env(safe-area-inset-top));
}

.location-picker-map {
  flex: 1;
  height: 0; /* 强制flex子元素使用flex高度 */
  position: relative;
}

.location-picker-footer {
  padding: 20rpx 30rpx;
  background: white;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}
</style>