<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, computed, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { GoodsApi } from '@/api/goods'

const router = useRouter()

// 当前选中的一级分类ID
const selectedCategoryId = ref('')
// 当前选中的二级分类数据
const subCategoriesData = ref([])
// 选中分类的历史记录，用于显示最近使用
const recentCategories = ref([])
// 加载状态
const loading = ref(true)
// 分类数据
const categories = ref([])

// 初始化页面数据
onLoad(() => {
  // 获取本地缓存的最近使用分类
  try {
    const cached = uni.getStorageSync('recentCategories')
    if (cached) {
      recentCategories.value = JSON.parse(cached)
    }
  } catch (e) {
    console.error('获取最近使用分类失败', e)
  }
  
  // 获取分类数据
  loadCategories()
})

// 加载分类数据
const loadCategories = async () => {
  try {
    loading.value = true
    const response = await GoodsApi.getCategoryTree()
    categories.value = response
    // 默认选中第一个分类
    if (categories.value.length > 0) {
      selectCategory(categories.value[0].id)
    }
  } catch (error) {
    console.error('获取分类失败', error)
    uni.showToast({
      title: '获取分类失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 选择一级分类
const selectCategory = async (categoryId) => {
  selectedCategoryId.value = categoryId
  // 获取二级分类数据
  try {
    const response = await GoodsApi.getSubcategories(categoryId)
    subCategoriesData.value = response || []
  } catch (error) {
    console.error('获取子分类失败', error)
    subCategoriesData.value = []
    uni.showToast({
      title: '获取子分类失败',
      icon: 'none'
    })
  }
}

// 选择二级分类
const selectSubcategory = (subcategory) => {
  // 记录选择的分类到最近使用
  saveToRecentCategories({
    parentId: selectedCategoryId.value,
    categoryId: subcategory.id,
    name: subcategory.name,
    icon: subcategory.icon
  })
  
  // 跳转到下一步骤（发布商品详情页）
  router.push({
    name: 'publish_goods_submit',
    params: {
      categoryId: selectedCategoryId.value,
      subcategoryId: subcategory.id,
      subcategoryName: subcategory.name
    }
  })
}

// 从最近使用中选择分类
const selectFromRecent = (recent) => {
  // 跳转到下一步骤
  router.push({
    name: 'publish_goods_submit',
    params: {
      categoryId: recent.parentId,
      subcategoryId: recent.categoryId
    }
  })
}

// 保存到最近使用分类
const saveToRecentCategories = (category) => {
  // 移除已存在的相同项
  let updatedRecent = recentCategories.value.filter(item => 
    !(item.parentId === category.parentId && item.categoryId === category.categoryId)
  )
  
  // 添加到开头
  updatedRecent.unshift(category)
  
  // 只保留最近5个
  if (updatedRecent.length > 5) {
    updatedRecent = updatedRecent.slice(0, 5)
  }
  
  recentCategories.value = updatedRecent
  
  // 保存到本地缓存
  try {
    uni.setStorageSync('recentCategories', JSON.stringify(updatedRecent))
  } catch (e) {
    console.error('保存最近使用分类失败', e)
  }
}

// 是否有最近使用的分类
const hasRecentCategories = computed(() => recentCategories.value.length > 0)

// 按类型分组的分类（根据API返回的数据动态分组）
const groupedCategories = computed(() => {
  if (!categories.value || categories.value.length === 0) {
    return { work: { title: 'Work!', items: [] }, fun: { title: 'Fun!', items: [] }, life: { title: 'Life!', items: [] } }
  }
  
  // 简单的分组逻辑，可以根据实际需要调整
  const itemsPerGroup = Math.ceil(categories.value.length / 3)
  
  return {
    work: { 
      title: 'Work!', 
      items: categories.value.slice(0, itemsPerGroup)
    },
    fun: { 
      title: 'Fun!', 
      items: categories.value.slice(itemsPerGroup, itemsPerGroup * 2)
    },
    life: { 
      title: 'Life!', 
      items: categories.value.slice(itemsPerGroup * 2)
    }
  }
})

// 返回按钮处理
const handleBack = () => {
  router.back()
}
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full" @tap="handleBack">
        <WdIcon name="arrow-left" size="40rpx" color="#333"/>
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">选择宝贝分类</view>
    </template>

    <!-- 加载中 -->
    <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
      <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
    </view>

    <view v-else class="flex h-100vh">
      <!-- 左侧分类导航 -->
      <scroll-view scroll-y class="left-nav bg-gray-50 w-180rpx h-full">
        <!-- 最近使用 -->
        <template v-if="hasRecentCategories">
          <view class="category-group py-20rpx">
            <view class="px-20rpx py-10rpx">
              <text class="text-24rpx text-#4fc08d font-medium">最近使用</text>
            </view>
          </view>
        </template>
        
        <!-- 工作分类组 -->
        <view class="category-group py-15rpx">
          <view class="px-20rpx py-10rpx">
            <text class="text-24rpx text-blue-500 font-medium">{{ groupedCategories.work.title }}</text>
          </view>
          
          <view 
            v-for="item in groupedCategories.work.items" 
            :key="item.id"
            class="py-30rpx px-20rpx text-center transition-colors duration-200"
            :class="selectedCategoryId === item.id ? 'bg-white text-#333' : 'text-gray-600'"
            @tap="selectCategory(item.id)"
          >
            <text class="text-26rpx">{{ item.name }}</text>
          </view>
        </view>
        
        <!-- 娱乐分类组 -->
        <view class="category-group py-15rpx">
          <view class="px-20rpx py-10rpx">
            <text class="text-24rpx text-pink-500 font-medium">{{ groupedCategories.fun.title }}</text>
          </view>
          
          <view 
            v-for="item in groupedCategories.fun.items" 
            :key="item.id"
            class="py-30rpx px-20rpx text-center transition-colors duration-200"
            :class="selectedCategoryId === item.id ? 'bg-white text-#333' : 'text-gray-600'"
            @tap="selectCategory(item.id)"
          >
            <text class="text-26rpx">{{ item.name }}</text>
          </view>
        </view>
        
        <!-- 生活分类组 -->
        <view class="category-group py-15rpx">
          <view class="px-20rpx py-10rpx">
            <text class="text-24rpx text-orange-500 font-medium">{{ groupedCategories.life.title }}</text>
          </view>
          
          <view 
            v-for="item in groupedCategories.life.items" 
            :key="item.id"
            class="py-30rpx px-20rpx text-center transition-colors duration-200"
            :class="selectedCategoryId === item.id ? 'bg-white text-#333' : 'text-gray-600'"
            @tap="selectCategory(item.id)"
          >
            <text class="text-26rpx">{{ item.name }}</text>
          </view>
        </view>
      </scroll-view>
      
      <!-- 右侧内容区域 -->
      <view class="right-content flex-1 bg-white h-full">
        <scroll-view scroll-y class="h-full">
          <!-- 最近使用 -->
          <view v-if="hasRecentCategories" class="p-30rpx">
            <view class="mb-20rpx">
              <text class="text-28rpx font-medium text-#333">最近使用</text>
            </view>
            
            <view class="grid grid-cols-3 gap-20rpx">
              <view 
                v-for="(item, index) in recentCategories" 
                :key="index"
                class="flex flex-col items-center py-20rpx bg-gray-50 rounded-12rpx transition-transform duration-200 active:scale-95"
                @tap="selectFromRecent(item)"
              >
                <WdIcon :name="item.icon" size="60rpx" custom-style="color:#f43f5e" class="mb-10rpx"/>
                <text class="text-26rpx text-#333 truncate w-90%">{{ item.name }}</text>
              </view>
            </view>
          </view>
          
          <!-- 二级分类 -->
          <view class="p-30rpx" v-if="subCategoriesData.length > 0">
            <view class="mb-20rpx">
              <text class="text-28rpx font-medium text-#333">
                {{ categories.find(c => c.id === selectedCategoryId)?.name }}
              </text>
            </view>
            
            <view class="grid grid-cols-3 gap-y-30rpx gap-x-20rpx">
              <view 
                v-for="subcat in subCategoriesData" 
                :key="subcat.id"
                class="flex flex-col items-center py-20rpx bg-gray-50 rounded-12rpx transition-all duration-200 active:scale-95"
                :style="{ 'animation-delay': `${subCategoriesData.indexOf(subcat) * 0.05}s` }"
                @tap="selectSubcategory(subcat)"
              >
                <WdIcon :name="subcat.icon" size="70rpx" custom-style="color:#f43f5e" class="mb-10rpx"/>
                <text class="text-26rpx text-#333 truncate w-90% text-center">{{ subcat.name }}</text>
              </view>
            </view>
          </view>
          
          <!-- 无分类提示 -->
          <view v-if="subCategoriesData.length === 0 && selectedCategoryId" class="p-30rpx flex flex-col items-center justify-center" style="height: 300rpx;">
            <WdIcon name="info-circle" size="60rpx" custom-style="color:#ddd" class="mb-20rpx"/>
            <text class="text-28rpx text-gray-400">该分类暂无子分类</text>
          </view>
          
          <!-- 请选择分类提示 -->
          <view v-if="!selectedCategoryId" class="p-30rpx flex flex-col items-center justify-center" style="height: 300rpx;">
            <WdIcon name="info-circle" size="60rpx" custom-style="color:#ddd" class="mb-20rpx"/>
            <text class="text-28rpx text-gray-400">请选择左侧分类</text>
          </view>
        </scroll-view>
      </view>
    </view>
  </layout>
</template>

<style>
.left-nav {
  box-shadow: 2rpx 0 5rpx rgba(0, 0, 0, 0.05);
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
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
