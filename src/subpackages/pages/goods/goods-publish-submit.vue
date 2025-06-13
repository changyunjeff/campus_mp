<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import UploadProgress from '@/components/upload-progress.vue'
import { GoodsApi } from '@/api/goods'

const router = useRouter()

// 加载状态
const loading = ref(true)

// 分类信息
const categoryId = ref('')
const subcategoryId = ref('')
const subcategoryName = ref('')
const categoryInfo = ref(null)
const subcategoryInfo = ref(null)
const specConfig = ref({})

// 当前激活的步骤标签 (params: 参数信息, images: 图片上传)
const activeTab = ref('params')

// 商品参数和价格
const goodsParams = reactive({
  title: '',
  price: '',
  originPrice: '',
  desc: '',
  location: '' // 新增交易地点字段
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

// 动态字段值
const customFieldValues = ref({})

// 加载页面数据
onLoad(async (options) => {
  // 获取分类和子分类ID
  categoryId.value = options.categoryId || ''
  subcategoryId.value = options.subcategoryId || ''
  subcategoryName.value = options.subcategoryName || ''
  
  try {
    loading.value = true
    
    // 获取分类信息
    if (categoryId.value) {
      const categoryResponse = await GoodsApi.getAllCategories()
      categoryInfo.value = categoryResponse.find(cat => cat.id === categoryId.value)
    }
    
    // 获取子分类信息
    if (categoryId.value && subcategoryId.value) {
      const subcategoriesResponse = await GoodsApi.getSubcategories(categoryId.value)
      subcategoryInfo.value = subcategoriesResponse.find(subcat => subcat.id === subcategoryId.value)
    }
    
    // 获取分类规格配置
    if (subcategoryId.value) {
      const specsResponse = await GoodsApi.getCategorySpecs(subcategoryId.value)
      specConfig.value = specsResponse
    }
    
    // 初始化商品参数
    initGoodsParams()
    
    // 尝试从缓存读取保存的数据
    tryLoadFromCache()
    
  } catch (error) {
    console.error('加载分类数据失败', error)
    uni.showToast({
      title: '加载分类数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
})

// 初始化商品参数
const initGoodsParams = () => {
  // 合并规格字段和详情字段
  const allFields = [
    ...(specConfig.value.specs || []),
    ...(specConfig.value.details || [])
  ]
  
  // 初始化表单字段
  allFields.forEach(field => {
    goodsParams[field.field_name] = ''
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

// 设置字段值
const setFieldValue = (fieldName, value) => {
  customFieldValues.value[fieldName] = value
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
      if (spec.is_required) {
        requiredFields.push(spec.field_name)
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
const chooseImage = () => {
  uni.chooseImage({
    count: uploadMaxCount - imageList.value.length, // 限制剩余可选数量
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      // 直接添加图片到列表，暂不上传
      res.tempFilePaths.forEach((filePath, index) => {
        const imageInfo = {
          id: Date.now().toString() + index,
          path: filePath,
          url: filePath, // 小程序临时地址
          uploaded: false // 标记为未上传
        }
        imageList.value.push(imageInfo)
      })
      
      uni.showToast({
        title: '图片添加成功',
        icon: 'success'
      })

      console.debug('图片选择成功', {
        count: res.tempFilePaths.length,
        totalImages: imageList.value.length
      })
    },
    fail: (error) => {
      console.error('选择图片失败', error)
      uni.showToast({
        title: '选择图片失败',
        icon: 'none'
      })
    }
  })
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
const getInputType = (fieldType) => {
  switch (fieldType) {
    case 'number':
      return 'digit'
    case 'date':
      return 'date'
    case 'text':
    default:
      return 'text'
  }
}

// 分组显示的表单项
const basicFields = computed(() => {
  return [
    { field: 'title', label: '标题', placeholder: '请输入宝贝标题', required: true },
    { field: 'price', label: '售价', placeholder: '请输入售价', required: true, type: 'digit' },
    { field: 'originPrice', label: '原价', placeholder: '请输入原价，不填则与售价相同', type: 'digit' },
    { field: 'location', label: '交易地点', placeholder: '请输入交易地点，如宿舍楼下、图书馆等', required: true }
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

// 渲染表单项
const renderFormField = (field) => {
  if (field.field_type === 'select') {
    return 'select'
  }
  return 'input'
}

// 提交商品
const submitGoods = async () => {
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
  
  // 显示提交进度
  showUploadProgress.value = true
  uploadPercentage.value = 0
  
  try {
    // Step 1: 先创建商品（不含媒体）
    uni.showLoading({ title: '创建商品中...' })
    
    // 整合商品数据
    const createGoodsData = {
      title: goodsParams.title,
      description: goodsParams.desc || '',
      price: parseFloat(goodsParams.price) || 0,
      original_price: parseFloat(goodsParams.originPrice) || parseFloat(goodsParams.price) || 0,
      category_id: subcategoryId.value || categoryId.value,
      location: goodsParams.location || '',
      condition: '全新', // 默认为全新，后续可以让用户选择
      is_real: true,
      media_ids: [], // 先创建商品，后续关联媒体
    }
    
    // 添加动态字段
    Object.keys(customFieldValues.value).forEach(key => {
      if (!['title', 'description', 'price', 'original_price', 'category_id', 'location', 'condition', 'is_real', 'media_ids'].includes(key)) {
        createGoodsData[key] = customFieldValues.value[key]
      }
    })

    console.debug('创建商品数据', { createGoodsData })

    const goodsResult = await GoodsApi.createGoods(createGoodsData)
    uploadPercentage.value = 30
    
    // Step 2: 上传图片到OSS
    if (imageList.value.length > 0) {
      uni.showLoading({ title: '上传图片中...' })
      
      const filePaths = imageList.value.map(img => img.path)
      
      // 使用批量上传
      const uploadResults = await GoodsApi.batchUploadGoodsImages(
        filePaths, 
        goodsResult.id,
        (progress) => {
          // 更新上传进度：30% + 上传进度的40%
          uploadPercentage.value = 30 + Math.round(progress.progress * 0.4)
        }
      )
      
      uploadPercentage.value = 70
      
      // Step 3: 创建媒体记录关联到商品
      uni.showLoading({ title: '关联图片中...' })
      
      // 处理批量上传结果
      const mediaInfoList = []
      if (Array.isArray(uploadResults)) {
        // 所有上传成功
        uploadResults.forEach(result => {
          mediaInfoList.push({
            object_key: result.object_key,
            url: result.url,
            type: result.type || 'goods_image'
          })
        })
      } else if (uploadResults.success) {
        // 部分成功的情况
        uploadResults.success.forEach(result => {
          mediaInfoList.push({
            object_key: result.object_key,
            url: result.url,
            type: result.type || 'goods_image'
          })
        })
        
        if (uploadResults.failed && uploadResults.failed.length > 0) {
          console.warn('部分图片上传失败', uploadResults.failed)
        }
      }
      
      if (mediaInfoList.length > 0) {
        await GoodsApi.createGoodsMediaRecords({
          goods_id: goodsResult.id,
          media_list: mediaInfoList
        })
      }
    }
    
    uploadPercentage.value = 100
    uni.hideLoading()
    showUploadProgress.value = false
    
    // 发布成功
    uni.showToast({
      title: '发布成功！',
      icon: 'success',
      duration: 2000
    })
    
    // 清除本地数据
    clearFormData()
    
    // 延迟跳转到商品详情页
    setTimeout(() => {
      router.replace(`/subpackages/pages/goods/goods-details?id=${goodsResult.id}`)
    }, 2000)

    console.debug('商品发布成功', { goodsId: goodsResult.id, mediaCount: imageList.value.length })
    
  } catch (error) {
    uploadPercentage.value = 0
    showUploadProgress.value = false
    uni.hideLoading()
    
    console.error('商品发布失败', error)
    
    uni.showToast({
      title: error.message || '发布失败，请重试',
      icon: 'none',
      duration: 3000
    })
  }
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

// 清除表单数据
const clearFormData = () => {
  // 清除基本参数
  goodsParams.title = ''
  goodsParams.price = ''
  goodsParams.originPrice = ''
  goodsParams.desc = ''
  goodsParams.location = ''
  
  // 清除动态字段
  customFieldValues.value = {}
  
  // 清除图片
  imageList.value = []
  
  // 清除分类信息
  categoryId.value = ''
  subcategoryId.value = ''
  
  // 清除本地缓存
  try {
    uni.removeStorageSync('goodsPublishParams')
    uni.removeStorageSync('goodsPublishImages')
    uni.removeStorageSync('goodsPublishCategory')
  } catch (e) {
    console.error('清除缓存失败', e)
  }
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
                <view v-for="field in specFields" :key="field.field_name" class="form-item">
                  <view class="form-label">
                    <text class="text-28rpx text-#333">{{ field.field_label }}</text>
                    <text v-if="field.is_required" class="text-red-500 ml-5rpx">*</text>
                  </view>
                  <view class="form-input-wrap">
                    <!-- 下拉选择 -->
                    <view v-if="field.field_type === 'select'" class="condition-selector">
                      <picker 
                        mode="selector" 
                        :range="field.options || []"
                        @change="(e) => setFieldValue(field.field_name, field.options[e.detail.value])"
                      >
                        <view class="picker-view">
                          <text v-if="customFieldValues[field.field_name]" class="text-28rpx text-#333">{{ customFieldValues[field.field_name] }}</text>
                          <text v-else class="text-28rpx text-gray-400">{{ field.placeholder || `请选择${field.field_label}` }}</text>
                          <WdIcon name="chevron-down" size="24rpx" custom-style="color:#999" class="ml-10rpx"/>
                        </view>
                      </picker>
                    </view>
                    <!-- 输入框 -->
                    <input 
                      v-else
                      :type="getInputType(field.field_type)" 
                      v-model="customFieldValues[field.field_name]" 
                      :placeholder="field.placeholder || `请输入${field.field_label}`" 
                      class="form-input"
                      @input="validateForm"
                    />
                    <view v-if="formErrors[field.field_name]" class="form-error">
                      {{ formErrors[field.field_name] }}
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
                <view v-for="field in detailFields" :key="field.field_name" class="form-item">
                  <view class="form-label">
                    <text class="text-28rpx text-#333">{{ field.field_label }}</text>
                    <text v-if="field.is_required" class="text-red-500 ml-5rpx">*</text>
                  </view>
                  <view class="form-input-wrap">
                    <input 
                      :type="getInputType(field.field_type)" 
                      v-model="customFieldValues[field.field_name]" 
                      :placeholder="field.placeholder || `请输入${field.field_label}`" 
                      class="form-input"
                      @input="validateForm"
                    />
                    <view v-if="formErrors[field.field_name]" class="form-error">
                      {{ formErrors[field.field_name] }}
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
                @tap="chooseImage"
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
