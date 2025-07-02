<script setup>
import Layout from "@/layout/index.vue"
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'

const router = useRouter()

// 页面状态
const loading = ref(true)
const loadingSubCategories = ref(false)
const selectedCategory = ref(null)
const selectedSubCategory = ref(null)

// 分类数据
const categories = ref([])
const subCategories = ref([])

// 显示子分类
const showSubCategories = ref(false)

// 加载分类数据
const loadCategories = async () => {
  try {
    loading.value = true
    console.log('开始加载分类数据...')
    
    const response = await GoodsApi.getAllCategories()
    console.log('获取分类数据响应:', response)
    
    categories.value = response || []
    console.log('分类数据加载成功:', categories.value)
  } catch (error) {
    console.error('加载分类失败:', error)
    uni.showToast({
      title: error.message || '加载分类失败',
      icon: 'none'
    })
    // 如果加载失败，显示默认提示
    categories.value = []
  } finally {
    loading.value = false
  }
}

// 加载子分类数据
const loadSubCategories = async (parentId) => {
  try {
    loadingSubCategories.value = true
    console.log('开始加载子分类数据，父分类ID:', parentId)
    
    const response = await GoodsApi.getSubcategories(parentId)
    console.log('获取子分类数据响应:', response)
    
    subCategories.value = response || []
    console.log('子分类数据加载成功:', subCategories.value)
    return subCategories.value
  } catch (error) {
    console.error('加载子分类失败:', error)
    uni.showToast({
      title: error.message || '加载子分类失败',
      icon: 'none'
    })
    subCategories.value = []
    return []
  } finally {
    loadingSubCategories.value = false
  }
}

// 选择一级分类
const selectCategory = async (category) => {
  selectedCategory.value = category
  console.log('选择一级分类:', category)
  
  // 获取子分类
  const subs = await loadSubCategories(category.id)
  
  if (subs.length > 0) {
    showSubCategories.value = true
    selectedSubCategory.value = null
  } else {
    // 没有子分类，直接跳转到发布页面
    goToPublish()
  }
}

// 选择子分类
const selectSubCategory = (subCategory) => {
  selectedSubCategory.value = subCategory
  console.log('选择子分类:', subCategory)
  goToPublish()
}

// 返回上级分类
const goBackToCategories = () => {
  showSubCategories.value = false
  selectedCategory.value = null
  selectedSubCategory.value = null
  subCategories.value = []
}

// 跳转到发布页面
const goToPublish = () => {
  if (!selectedCategory.value) {
    uni.showToast({
      title: '请选择商品分类',
      icon: 'none'
    })
    return
  }

  const params = {
    categoryId: selectedCategory.value.id,
    categoryName: selectedCategory.value.name,
    subcategoryId: selectedSubCategory.value.id,
    subcategoryName: selectedSubCategory.value.name
  }

  if (selectedSubCategory.value) {
    params.subcategoryId = selectedSubCategory.value.id
    params.subcategoryName = selectedSubCategory.value.name
  }

  console.log('跳转到发布页面，参数:', params)

  router.push({
    name: 'goods_publish_submit',
    params: params
  })
}

// 页面加载
onLoad((options) => {
  loadCategories()
})
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="showSubCategories ? goBackToCategories() : router.back()">
        <WdIcon
          name="arrow-left"
          size="40rpx"
          color="#333"
        />
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">
        {{ showSubCategories ? `选择${selectedCategory?.name}子分类` : '选择商品分类' }}
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载状态 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
        <text class="ml-20rpx text-28rpx text-gray-400">加载分类中...</text>
      </view>

      <!-- 分类选择 -->
      <template v-else>
        <!-- 面包屑导航 -->
        <view v-if="selectedCategory" class="bg-white px-30rpx py-20rpx border-b border-gray-100">
          <view class="flex items-center text-26rpx text-gray-500">
            <text>商品分类</text>
            <WdIcon name="arrow-right" size="24rpx" custom-style="color:#999" class="mx-10rpx"/>
            <text :class="{ 'text-#f43f5e': showSubCategories }">{{ selectedCategory.name }}</text>
            <template v-if="selectedSubCategory">
              <WdIcon name="arrow-right" size="24rpx" custom-style="color:#999" class="mx-10rpx"/>
              <text class="text-#f43f5e">{{ selectedSubCategory.name }}</text>
            </template>
          </view>
        </view>

        <!-- 一级分类列表 -->
        <view v-if="!showSubCategories" class="p-30rpx">
          <!-- 空状态 -->
          <view v-if="categories.length === 0" class="bg-white rounded-16rpx p-40rpx text-center">
            <WdIcon name="info-o" size="80rpx" custom-style="color:#ddd" class="mb-20rpx"/>
            <text class="block text-28rpx text-gray-400 mb-20rpx">暂无分类数据</text>
            <view 
              class="inline-block px-30rpx py-15rpx bg-blue-500 rounded-full"
              @tap="loadCategories"
            >
              <text class="text-26rpx text-white">重新加载</text>
            </view>
          </view>

          <!-- 分类网格 -->
          <view v-else class="grid grid-cols-2 gap-20rpx">
            <view 
              v-for="category in categories" 
              :key="category.id"
              class="bg-white rounded-16rpx p-30rpx shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="selectCategory(category)"
            >
              <view class="flex flex-col items-center">
                <view 
                  class="w-100rpx h-100rpx rounded-20rpx mb-20rpx flex items-center justify-center"
                  :style="`background-color: ${category.color}20;`"
                >
                  <WdIcon 
                    :name="category.icon" 
                    size="60rpx" 
                    :custom-style="`color: ${category.color}`"
                  />
                </view>
                <text class="text-28rpx text-#333 font-medium text-center">{{ category.name }}</text>
                <text v-if="category.description" class="text-22rpx text-gray-400 text-center mt-5rpx">{{ category.description }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 子分类列表 -->
        <view v-else class="p-30rpx">
          <!-- 子分类加载状态 -->
          <view v-if="loadingSubCategories" class="bg-white rounded-16rpx p-40rpx text-center">
            <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin mb-20rpx"/>
            <text class="block text-28rpx text-gray-400">加载子分类中...</text>
          </view>

          <!-- 无子分类直接选择 -->
          <view v-else-if="subCategories.length === 0" class="bg-white rounded-16rpx p-40rpx text-center">
            <WdIcon name="info-o" size="80rpx" custom-style="color:#ddd" class="mb-20rpx"/>
            <text class="block text-28rpx text-gray-400 mb-40rpx">该分类暂无子分类</text>
            <view 
              class="inline-block px-50rpx py-20rpx bg-gradient-to-r from-#f43f5e to-#ff7676 rounded-full"
              @tap="goToPublish"
            >
              <text class="text-28rpx text-white">直接发布</text>
            </view>
          </view>

          <!-- 子分类网格 -->
          <view v-else class="grid grid-cols-1 gap-20rpx">
            <view 
              v-for="subCategory in subCategories" 
              :key="subCategory.id"
              class="bg-white rounded-16rpx p-30rpx shadow-sm flex items-center transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="selectSubCategory(subCategory)"
            >
              <view 
                class="w-80rpx h-80rpx rounded-12rpx mr-30rpx flex items-center justify-center"
                :style="`background-color: ${subCategory.color}20;`"
              >
                <WdIcon 
                  :name="subCategory.icon" 
                  size="40rpx" 
                  :custom-style="`color: ${subCategory.color}`"
                />
              </view>
              <view class="flex-1">
                <text class="text-30rpx text-#333 font-medium">{{ subCategory.name }}</text>
                <text v-if="subCategory.description" class="block text-24rpx text-gray-500 mt-5rpx">{{ subCategory.description }}</text>
              </view>
              <WdIcon name="arrow-right" size="32rpx" custom-style="color:#999"/>
            </view>

            <!-- 其他选项 -->
            <view 
              class="bg-white rounded-16rpx p-30rpx shadow-sm flex items-center transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="goToPublish"
            >
              <view class="w-80rpx h-80rpx rounded-12rpx mr-30rpx bg-gray-100 flex items-center justify-center">
                <WdIcon name="more-o" size="40rpx" custom-style="color:#999"/>
              </view>
              <view class="flex-1">
                <text class="text-30rpx text-#333 font-medium">其他</text>
                <text class="block text-24rpx text-gray-500 mt-5rpx">不在以上分类中</text>
              </view>
              <WdIcon name="arrow-right" size="32rpx" custom-style="color:#999"/>
            </view>
          </view>
        </view>

        <!-- 提示信息 -->
        <view class="px-30rpx pb-30rpx">
          <view class="bg-#fff3cd rounded-12rpx p-30rpx">
            <view class="flex items-start">
              <WdIcon name="warning-o" size="32rpx" custom-style="color:#f59e0b" class="mr-15rpx mt-5rpx"/>
              <view class="flex-1">
                <text class="text-26rpx text-#92400e leading-36rpx">
                  请选择合适的商品分类，这将帮助其他用户更好地找到您的商品。分类选择错误可能会影响商品的曝光率。
                </text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </view>
  </layout>
</template>

<style scoped>
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
</style>
