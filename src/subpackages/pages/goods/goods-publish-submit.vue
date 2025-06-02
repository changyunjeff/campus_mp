<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import UploadProgress from '@/components/upload-progress.vue'
import { getSpecConfigByType, goodsSpecs } from '../../components/goods/goods-param.configs'
import { getCategoryById, getSubcategoryById } from './category.config'

const router = useRouter()

// 加载状态
const loading = ref(true)

// 分类信息
const categoryId = ref('')
const subcategoryId = ref('')
const categoryInfo = ref(null)
const subcategoryInfo = ref(null)
const goodsType = ref('other')
const specConfig = ref({})

// 当前激活的步骤标签 (params: 参数信息, images: 图片上传)
const activeTab = ref('params')

// 商品参数和价格
const goodsParams = reactive({
  title: '',
  price: '',
  originPrice: '',
  desc: '',
})

// 表单验证状态
const formErrors = ref({})
const isFormValid = ref(false)

// 图片上传相关
const imageList = ref([])
const showUploadProgress = ref(false)
const uploadPercentage = ref(0)
const uploadMaxCount = 9  // 最大上传数量
const uploadMinCount = 3  // 最小上传数量

// 成色选项
const conditionOptions = [
  { value: '全新', label: '全新', desc: '全新未拆封或未使用过的物品' },
  { value: '几乎全新', label: '几乎全新', desc: '使用时间极短，外观和功能几乎全新' },
  { value: '9成新', label: '9成新', desc: '轻微使用痕迹，功能完好，外观近乎全新' },
  { value: '8成新', label: '8成新', desc: '有使用痕迹，但功能完好，整体状况良好' },
  { value: '7成新', label: '7成新', desc: '明显使用痕迹，但功能正常，无明显缺陷' },
  { value: '6成新', label: '6成新', desc: '有磨损或缺陷，但不影响基本功能的使用' },
  { value: '5成新及以下', label: '5成新及以下', desc: '明显磨损或有一定功能问题' }
]

// 商品图片至少需要上传的数量判断
const hasEnoughImages = computed(() => {
  return imageList.value.length >= uploadMinCount
})

// 是否可提交
const canSubmit = computed(() => {
  return hasEnoughImages.value && isFormValid.value
})

// 加载页面数据
onLoad((options) => {
  // 获取分类和子分类ID
  categoryId.value = options.categoryId || ''
  subcategoryId.value = options.subcategoryId || ''
  
  // 获取分类信息
  if (categoryId.value) {
    categoryInfo.value = getCategoryById(categoryId.value)
  }
  
  // 获取子分类信息
  if (categoryId.value && subcategoryId.value) {
    subcategoryInfo.value = getSubcategoryById(categoryId.value, subcategoryId.value)
  }
  
  // 根据分类确定商品类型
  determineGoodsType()
  
  // 初始化商品参数
  initGoodsParams()
  
  // 尝试从缓存读取保存的数据
  tryLoadFromCache()
  
  setTimeout(() => {
    loading.value = false
  }, 500)
})

// 根据分类确定商品类型
const determineGoodsType = () => {
  // 这里根据分类ID映射到商品类型
  const typeMap = {
    'digital': { 
      'laptop': 'digital',
      'keyboard': 'digital',
      'mini_pc': 'digital',
      'hard_drive': 'digital',
      'touch_keyboard': 'digital'
    },
    'mobile': { 
      'iphone': 'phone',
      'android': 'phone',
      'ipad': 'digital',
      'accessories': 'digital'
    },
    'appliances': { 
      'earphones': 'digital',
      'smart_watch': 'digital',
      'vr': 'digital',
      'smart_glasses': 'digital',
      'weather': 'digital',
      'band': 'digital'
    },
    'fun': {
      'camera': 'digital',
      'sports': 'sports',
      'games': 'game',
      'audio': 'digital'
    },
    'music': {
      'instruments': 'instrument',
      'guitar': 'instrument',
      'effects': 'instrument',
      'audio': 'instrument'
    },
    'books': {
      'paper_book': 'book',
      'reading_pen': 'digital',
      'study_machine': 'digital',
      'translator': 'digital',
      'tape': 'digital'
    },
    'sports': {
      'fitness': 'sports',
      'bicycles': 'transportation',
      'balls': 'sports',
      'outdoor': 'sports'
    },
    'clothes': {
      'clothing': 'clothing',
      'shoes': 'clothing',
      'bags': 'clothing',
      'watches': 'digital',
      'jewelry': 'other'
    },
    'beauty': {
      'makeup': 'beauty',
      'skincare': 'beauty',
      'perfume': 'beauty',
      'tools': 'beauty'
    },
    'furniture': {
      'furniture': 'appliance',
      'kitchenware': 'appliance',
      'textiles': 'other',
      'cleaning': 'other'
    }
  }
  
  // 尝试从映射中获取类型
  if (categoryId.value && subcategoryId.value && typeMap[categoryId.value]) {
    goodsType.value = typeMap[categoryId.value][subcategoryId.value] || 'other'
  }
  
  // 获取参数配置
  specConfig.value = getSpecConfigByType(goodsType.value)
}

// 初始化商品参数
const initGoodsParams = () => {
  // 合并规格字段和详情字段
  const allFields = [
    ...(specConfig.value.specs || []),
    ...(specConfig.value.details || [])
  ]
  
  // 初始化表单字段
  allFields.forEach(field => {
    goodsParams[field.field] = ''
  })
  
  // 如果有分类名称，自动填充到标题中
  if (subcategoryInfo.value) {
    goodsParams.title = subcategoryInfo.value.name
  }
}

// 尝试从缓存中加载数据
const tryLoadFromCache = () => {
  try {
    const paramsStr = uni.getStorageSync('goodsPublishParams')
    if (paramsStr) {
      const cachedParams = JSON.parse(paramsStr)
      // 合并缓存数据到当前表单
      Object.keys(cachedParams).forEach(key => {
        if (key in goodsParams) {
          goodsParams[key] = cachedParams[key]
        }
      })
      
      // 如果有缓存的图片数据，也加载
      const imagesStr = uni.getStorageSync('goodsPublishImages')
      if (imagesStr) {
        try {
          imageList.value = JSON.parse(imagesStr)
        } catch (e) {
          console.error('解析图片缓存失败', e)
        }
      }
    }
  } catch (e) {
    console.error('获取缓存数据失败', e)
  }
}

// 切换标签页
const switchTab = (tab) => {
  activeTab.value = tab
}

// 设置表单字段值
const setFieldValue = (field, value) => {
  goodsParams[field] = value
  validateForm()
}

// 验证表单
const validateForm = () => {
  // 重置错误信息
  formErrors.value = {}
  
  // 验证必填字段
  const requiredFields = ['title', 'price', 'desc']
  if (specConfig.value.specs) {
    // 添加规格中的必填字段
    specConfig.value.specs.forEach(spec => {
      if (spec.required) {
        requiredFields.push(spec.field)
      }
    })
  }
  
  // 检查必填字段
  requiredFields.forEach(field => {
    if (!goodsParams[field]) {
      formErrors.value[field] = '此项为必填项'
    }
  })
  
  // 验证价格
  if (goodsParams.price && isNaN(parseFloat(goodsParams.price))) {
    formErrors.value.price = '请输入有效价格'
  }
  
  if (goodsParams.originPrice && isNaN(parseFloat(goodsParams.originPrice))) {
    formErrors.value.originPrice = '请输入有效原价'
  }
  
  // 表单是否有效
  isFormValid.value = Object.keys(formErrors.value).length === 0
}

// 选择图片
const chooseImages = () => {
  const remainCount = uploadMaxCount - imageList.value.length
  if (remainCount <= 0) {
    uni.showToast({
      title: `最多上传${uploadMaxCount}张图片`,
      icon: 'none'
    })
    return
  }
  
  uni.chooseImage({
    count: remainCount,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      uploadImages(res.tempFilePaths)
    },
    fail: (err) => {
      console.error('选择图片失败', err)
    }
  })
}

// 上传图片
const uploadImages = (tempFilePaths) => {
  if (!tempFilePaths || tempFilePaths.length === 0) return
  
  showUploadProgress.value = true
  uploadPercentage.value = 0
  
  // 模拟上传过程
  let progress = 0
  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 1
    if (progress >= 100) {
      progress = 100
      clearInterval(timer)
      
      // 上传完成后添加图片到列表
      setTimeout(() => {
        tempFilePaths.forEach(path => {
          imageList.value.push({
            path: path,
            id: Date.now() + Math.floor(Math.random() * 1000)
          })
        })
        
        // 缓存图片列表
        try {
          uni.setStorageSync('goodsPublishImages', JSON.stringify(imageList.value))
        } catch (e) {
          console.error('保存图片缓存失败', e)
        }
        
        showUploadProgress.value = false
      }, 500)
    }
    uploadPercentage.value = progress
  }, 200)
}

// 预览图片
const previewImage = (index) => {
  const urls = imageList.value.map(img => img.path)
  uni.previewImage({
    urls,
    current: index
  })
}

// 删除图片
const deleteImage = (index) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除这张图片吗？',
    success: (res) => {
      if (res.confirm) {
        imageList.value.splice(index, 1)
        
        // 更新缓存
        try {
          uni.setStorageSync('goodsPublishImages', JSON.stringify(imageList.value))
        } catch (e) {
          console.error('保存图片缓存失败', e)
        }
      }
    }
  })
}

// 设置主图
const setMainImage = (index) => {
  if (index === 0) return
  
  const temp = imageList.value[0]
  imageList.value[0] = imageList.value[index]
  imageList.value[index] = temp
  
  // 更新缓存
  try {
    uni.setStorageSync('goodsPublishImages', JSON.stringify(imageList.value))
  } catch (e) {
    console.error('保存图片缓存失败', e)
  }
  
  uni.showToast({
    title: '已设为主图',
    icon: 'success'
  })
}

// 根据字段名获取适当的输入类型
const getInputType = (fieldName) => {
  // 价格相关字段使用数字输入
  if (fieldName.includes('price') || fieldName.includes('Price')) {
    return 'digit'
  }
  // 日期相关字段使用日期选择
  if (fieldName.includes('time') || fieldName.includes('Time') || fieldName.includes('date') || fieldName.includes('Date')) {
    return 'date'
  }
  return 'text'
}

// 分组显示的表单项
const basicFields = computed(() => {
  return [
    { field: 'title', label: '标题', placeholder: '请输入宝贝标题', required: true },
    { field: 'price', label: '售价', placeholder: '请输入售价', required: true, type: 'digit' },
    { field: 'originPrice', label: '原价', placeholder: '请输入原价，不填则与售价相同', type: 'digit' }
  ]
})

const specFields = computed(() => {
  return specConfig.value.specs || []
})

const detailFields = computed(() => {
  return specConfig.value.details || []
})

// 选择成色
const selectCondition = (condition) => {
  setFieldValue('condition', condition.value)
}

// 提交商品
const submitGoods = () => {
  // 先验证表单
  validateForm()
  
  // 验证图片数量
  if (!hasEnoughImages.value) {
    uni.showToast({
      title: `请至少上传${uploadMinCount}张图片`,
      icon: 'none'
    })
    activeTab.value = 'images' // 切换到图片上传标签
    return
  }
  
  // 如果表单无效
  if (!isFormValid.value) {
    uni.showToast({
      title: '请完善必填信息',
      icon: 'none'
    })
    activeTab.value = 'params' // 切换到商品参数标签
    return
  }
  
  // 整合所有商品信息
  const finalGoodsData = {
    ...goodsParams,
    images: imageList.value.map(img => img.path),
    mainImage: imageList.value[0]?.path || '',
    categoryId: categoryId.value,
    subcategoryId: subcategoryId.value,
    goodsType: goodsType.value,
    publishTime: new Date()
  }
  
  // 显示提交进度
  showUploadProgress.value = true
  uploadPercentage.value = 0
  
  // 模拟提交过程
  let progress = 0
  const timer = setInterval(() => {
    progress += Math.floor(Math.random() * 15) + 5
    if (progress >= 100) {
      progress = 100
      clearInterval(timer)
      
      // 提交完成后跳转
      setTimeout(() => {
        showUploadProgress.value = false
        
        // 清除缓存
        uni.removeStorageSync('goodsPublishParams')
        uni.removeStorageSync('goodsPublishImages')
        
        // 提示成功
        uni.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000,
          success: () => {
            // 跳转到成功页面或商品列表
            setTimeout(() => {
              router.switchTab({
                name: 'index_goods'
              })
            }, 1500)
          }
        })
      }, 800)
    }
    uploadPercentage.value = progress
  }, 200)
}

// 返回上一步
const prevStep = () => {
  // 保存当前数据到缓存中
  try {
    uni.setStorageSync('goodsPublishParams', JSON.stringify(goodsParams))
    if (imageList.value.length > 0) {
      uni.setStorageSync('goodsPublishImages', JSON.stringify(imageList.value))
    }
  } catch (e) {
    console.error('保存参数失败', e)
  }
  
  router.back()
}
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="prevStep">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">发布商品</view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh pb-150rpx">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>
      
      <template v-else>
        <!-- 分类信息 -->
        <view class="bg-white px-30rpx py-20rpx flex items-center">
          <WdIcon name="apps" size="40rpx" custom-style="color:#f43f5e" class="mr-15rpx"/>
          <text class="text-28rpx text-#333">{{ categoryInfo?.name }} > {{ subcategoryInfo?.name }}</text>
        </view>
        
        <!-- 步骤标签页 -->
        <view class="bg-white mt-20rpx px-30rpx py-20rpx">
          <view class="flex border-b border-gray-100">
            <view 
              class="flex-1 text-center py-20rpx relative transition-all"
              :class="activeTab === 'params' ? 'text-#f43f5e font-medium' : 'text-gray-500'"
              @tap="switchTab('params')"
            >
              <text class="text-30rpx">商品信息</text>
              <view v-if="activeTab === 'params'" class="absolute bottom-0 left-1/2 -translate-x-1/2 w-80rpx h-4rpx bg-#f43f5e rounded-full"></view>
            </view>
            <view 
              class="flex-1 text-center py-20rpx relative transition-all"
              :class="activeTab === 'images' ? 'text-#f43f5e font-medium' : 'text-gray-500'"
              @tap="switchTab('images')"
            >
              <text class="text-30rpx">上传图片</text>
              <view v-if="activeTab === 'images'" class="absolute bottom-0 left-1/2 -translate-x-1/2 w-80rpx h-4rpx bg-#f43f5e rounded-full"></view>
            </view>
          </view>
          
          <!-- 进度指示器 -->
          <view class="flex items-center justify-center mt-20rpx mb-10rpx">
            <view class="flex items-center w-500rpx">
              <view class="flex flex-col items-center">
                <view class="w-40rpx h-40rpx rounded-full bg-#f43f5e text-white flex items-center justify-center">
                  <text class="text-22rpx">1</text>
                </view>
                <text class="text-24rpx text-#f43f5e mt-8rpx">选择分类</text>
              </view>
              
              <view class="flex-1 h-2rpx bg-gray-200 mx-10rpx">
                <view class="h-full bg-#f43f5e" style="width: 100%;"></view>
              </view>
              
              <view class="flex flex-col items-center">
                <view class="w-40rpx h-40rpx rounded-full bg-#f43f5e text-white flex items-center justify-center">
                  <text class="text-22rpx">2</text>
                </view>
                <text class="text-24rpx text-#f43f5e mt-8rpx">填写信息</text>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 商品参数表单 -->
        <view v-show="activeTab === 'params'" class="fade-in">
          <scroll-view scroll-y class="form-container">
            <!-- 基本信息 -->
            <view class="form-section">
              <view class="section-title">
                <text class="text-30rpx font-medium text-#333">基本信息</text>
              </view>
              
              <view class="form-group">
                <view v-for="field in basicFields" :key="field.field" class="form-item">
                  <view class="form-label">
                    <text class="text-28rpx text-#333">{{ field.label }}</text>
                    <text v-if="field.required" class="text-red-500 ml-5rpx">*</text>
                  </view>
                  <view class="form-input-wrap">
                    <input 
                      :type="field.type || 'text'" 
                      v-model="goodsParams[field.field]" 
                      :placeholder="field.placeholder" 
                      class="form-input"
                      @input="validateForm"
                    />
                    <view v-if="formErrors[field.field]" class="form-error">
                      {{ formErrors[field.field] }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 商品规格 -->
            <view class="form-section" v-if="specFields.length > 0">
              <view class="section-title">
                <text class="text-30rpx font-medium text-#333">商品规格</text>
              </view>
              
              <view class="form-group">
                <view v-for="field in specFields" :key="field.field" class="form-item">
                  <view class="form-label">
                    <text class="text-28rpx text-#333">{{ field.label }}</text>
                    <text v-if="field.required" class="text-red-500 ml-5rpx">*</text>
                  </view>
                  <view class="form-input-wrap">
                    <!-- 成色特殊处理 -->
                    <view v-if="field.field === 'condition'" class="condition-selector">
                      <picker 
                        mode="selector" 
                        :range="conditionOptions" 
                        range-key="label"
                        @change="(e) => setFieldValue('condition', conditionOptions[e.detail.value].value)"
                      >
                        <view class="picker-view">
                          <text v-if="goodsParams.condition" class="text-28rpx text-#333">{{ goodsParams.condition }}</text>
                          <text v-else class="text-28rpx text-gray-400">请选择成色</text>
                          <WdIcon name="chevron-down" size="24rpx" custom-style="color:#999" class="ml-10rpx"/>
                        </view>
                      </picker>
                    </view>
                    <input 
                      v-else
                      :type="getInputType(field.field)" 
                      v-model="goodsParams[field.field]" 
                      :placeholder="`请输入${field.label}`" 
                      class="form-input"
                      @input="validateForm"
                    />
                    <view v-if="formErrors[field.field]" class="form-error">
                      {{ formErrors[field.field] }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 详细信息 -->
            <view class="form-section" v-if="detailFields.length > 0">
              <view class="section-title">
                <text class="text-30rpx font-medium text-#333">详细信息</text>
              </view>
              
              <view class="form-group">
                <view v-for="field in detailFields" :key="field.field" class="form-item">
                  <view class="form-label">
                    <text class="text-28rpx text-#333">{{ field.label }}</text>
                    <text v-if="field.required" class="text-red-500 ml-5rpx">*</text>
                  </view>
                  <view class="form-input-wrap">
                    <input 
                      :type="getInputType(field.field)" 
                      v-model="goodsParams[field.field]" 
                      :placeholder="`请输入${field.label}`" 
                      class="form-input"
                      @input="validateForm"
                    />
                    <view v-if="formErrors[field.field]" class="form-error">
                      {{ formErrors[field.field] }}
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 商品描述 -->
            <view class="form-section">
              <view class="section-title">
                <text class="text-30rpx font-medium text-#333">商品描述</text>
                <text class="text-red-500 ml-5rpx">*</text>
              </view>
              
              <view class="form-group">
                <view class="form-item">
                  <textarea 
                    v-model="goodsParams.desc" 
                    placeholder="请详细描述宝贝的品牌、型号、规格、成色、使用感受等信息，让买家更了解宝贝..." 
                    class="form-textarea"
                    maxlength="500"
                    @input="validateForm"
                  />
                  <view class="text-right text-24rpx text-gray-400 mt-10rpx">
                    {{ goodsParams.desc.length }}/500
                  </view>
                  <view v-if="formErrors.desc" class="form-error">
                    {{ formErrors.desc }}
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 按钮跳转图片上传 -->
            <view class="p-30rpx flex justify-center mb-30rpx">
              <view 
                class="h-90rpx w-400rpx flex items-center justify-center bg-gradient-to-r from-#f43f5e to-#ff7676 text-white rounded-full shadow-md shadow-pink-200"
                @tap="activeTab = 'images'"
              >
                <text class="text-30rpx">下一步：上传图片</text>
                <WdIcon name="arrow-right" size="28rpx" color="#fff" class="ml-10rpx"/>
              </view>
            </view>
          </scroll-view>
        </view>
        
        <!-- 图片上传内容 -->
        <view v-show="activeTab === 'images'" class="fade-in">
          <!-- 商品图片上传 -->
          <view class="bg-white p-30rpx mb-20rpx">
            <view class="mb-20rpx flex items-center justify-between">
              <view class="flex items-center">
                <text class="text-30rpx font-medium text-#333">商品图片</text>
                <text class="text-red-500 ml-5rpx">*</text>
                <text class="text-24rpx text-gray-500 ml-15rpx">至少上传{{ uploadMinCount }}张，第一张为主图</text>
              </view>
              <text class="text-24rpx text-gray-500">{{ imageList.length }}/{{ uploadMaxCount }}</text>
            </view>
            
            <view class="grid grid-cols-3 gap-20rpx">
              <!-- 已上传图片 -->
              <view
                v-for="(image, index) in imageList"
                :key="image.id"
                class="relative w-full aspect-square bg-gray-100 rounded-12rpx overflow-hidden border border-gray-200"
              >
                <image 
                  :src="image.path" 
                  class="w-full h-full object-cover" 
                  mode="aspectFill"
                  @tap="previewImage(index)"
                />
                
                <!-- 主图标识 -->
                <view v-if="index === 0" class="absolute top-10rpx left-10rpx bg-#f43f5e bg-opacity-90 rounded-4rpx px-8rpx py-4rpx">
                  <text class="text-20rpx text-white">主图</text>
                </view>
                
                <!-- 操作按钮 -->
                <view class="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 flex justify-between p-10rpx">
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
                class="w-full aspect-square bg-gray-100 rounded-12rpx flex flex-col items-center justify-center"
                @tap="chooseImages"
              >
                <WdIcon name="plus" size="40rpx" custom-style="color:#999"/>
                <text class="text-24rpx text-gray-500 mt-10rpx">添加图片</text>
              </view>
            </view>
            
            <!-- 上传提示 -->
            <view class="mt-20rpx">
              <text class="text-24rpx text-gray-500">提示：图片清晰度越高，成交率越高。上传真实图片，请勿上传侵权或违规图片。</text>
            </view>
          </view>
          
          <!-- 按钮返回商品信息 -->
          <view class="p-30rpx flex justify-center mb-30rpx">
            <view 
              class="h-90rpx w-400rpx flex items-center justify-center bg-white border border-gray-300 text-gray-700 rounded-full"
              @tap="activeTab = 'params'"
            >
              <WdIcon name="arrow-left" size="28rpx" custom-style="color:#666" class="mr-10rpx"/>
              <text class="text-30rpx">返回：编辑商品信息</text>
            </view>
          </view>
          
          <!-- 提交须知 -->
          <view class="bg-white p-30rpx mb-30rpx">
            <view class="flex items-center mb-20rpx">
              <WdIcon name="info-o" size="32rpx" custom-style="color:#f43f5e" class="mr-10rpx"/>
              <text class="text-30rpx font-medium text-#333">发布须知</text>
            </view>
            <view class="text-26rpx text-gray-600 leading-40rpx">
              <view>· 上传商品真实图片，保证商品信息的真实性和准确性</view>
              <view>· 禁止发布侵权、违禁、违法商品</view>
              <view>· 商品发布后，平台将对商品信息进行审核</view>
              <view>· 商品成功售出后，平台将收取一定比例的服务费</view>
            </view>
          </view>
        </view>
      </template>
    </view>
    
    <!-- 底部操作栏 -->
    <view class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 px-30rpx py-20rpx flex justify-between">
      <view class="flex-1 mr-20rpx">
        <button 
          class="h-90rpx flex items-center justify-center border border-gray-300 rounded-full bg-white text-#333"
          @tap="prevStep"
        >
          <text class="text-30rpx">返回</text>
        </button>
      </view>
      <view class="flex-1">
        <button 
          class="h-90rpx flex items-center justify-center rounded-full transition-all duration-300"
          :class="canSubmit ? 'bg-gradient-to-r from-#f43f5e to-#ff7676 text-white shadow-md shadow-pink-200' : 'bg-gray-200 text-gray-500'"
          @tap="canSubmit && submitGoods()"
        >
          <text class="text-30rpx" :class="canSubmit ? 'font-medium' : ''">立即发布</text>
        </button>
      </view>
    </view>
    
    <!-- 上传进度组件 -->
    <UploadProgress 
      :show="showUploadProgress" 
      :percentage="uploadPercentage" 
    />
  </layout>
</template>

<style>
.aspect-square {
  aspect-ratio: 1 / 1;
}

.form-container {
  height: calc(100vh - 310rpx);
}

.form-section {
  margin-top: 20rpx;
  background-color: #ffffff;
  padding: 30rpx;
}

.section-title {
  margin-bottom: 30rpx;
  border-left: 6rpx solid #f43f5e;
  padding-left: 15rpx;
}

.form-item {
  margin-bottom: 25rpx;
}

.form-label {
  display: flex;
  align-items: center;
  margin-bottom: 15rpx;
}

.form-input-wrap {
  position: relative;
}

.form-input {
  width: 100%;
  height: 80rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 0 20rpx;
  font-size: 28rpx;
}

.form-textarea {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 20rpx;
  font-size: 28rpx;
}

.form-error {
  font-size: 24rpx;
  color: #f43f5e;
  margin-top: 10rpx;
}

.condition-selector {
  width: 100%;
}

.picker-view {
  display: flex;
  align-items: center;
  width: 100%;
  height: 80rpx;
  border-radius: 8rpx;
  background-color: #f8f8f8;
  padding: 0 20rpx;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
