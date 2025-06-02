<script setup>
import Layout from '@/layout/index.vue'
import { ref, onMounted, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

// 页面数据
const categoryName = ref('')
const categoryId = ref(null)
const filterOptions = ref([
  { name: '综合', active: true, key: 'comprehensive' },
  { name: '价格', active: false, key: 'price', asc: true },
  { name: '销量', active: false, key: 'sales' },
  { name: '新品', active: false, key: 'new' }
])
const goodsList = ref([])
const loading = ref(false)
const hasMore = ref(true)
const isRefreshing = ref(false)
const page = ref(1)
const pageSize = 10
const showFilterPanel = ref(false)
const activeSubCategory = ref('全部')

// 子分类列表 - 根据主分类动态生成
const subCategories = computed(() => {
  const categoryMap = {
    '手机': ['全部', 'iPhone', '华为', '小米', 'OPPO', 'vivo', '三星', '荣耀'],
    '数码': ['全部', '平板电脑', '笔记本', '智能手表', '耳机', '相机'],
    '美妆': ['全部', '护肤', '彩妆', '香水', '美容工具'],
    '四级': ['全部', '考试资料', '练习册', '真题集', '词汇书'],
    '明星周边': ['全部', '签名照', '专辑', '海报', '手办'],
    '母婴': ['全部', '奶粉', '尿不湿', '玩具', '童装'],
    '游戏交易': ['全部', '账号', '装备', '点卡', '游戏本体'],
    '潮玩动漫': ['全部', '手办', '盲盒', '漫画', '周边'],
    '交通工具': ['全部', '自行车', '电动车', '平衡车', '滑板'],
    '家电': ['全部', '厨房电器', '生活电器', '大家电', '智能设备']
  }
  
  return categoryMap[categoryName.value] || ['全部']
})

// 价格区间选项
const priceRanges = ref([
  { min: 0, max: 100, label: '0-100元', active: false },
  { min: 100, max: 300, label: '100-300元', active: false },
  { min: 300, max: 500, label: '300-500元', active: false },
  { min: 500, max: 1000, label: '500-1000元', active: false },
  { min: 1000, max: 3000, label: '1000-3000元', active: false },
  { min: 3000, max: null, label: '3000元以上', active: false }
])

// 筛选条件
const filters = ref({
  minPrice: '',
  maxPrice: '',
  onlyNew: false,
  onlyReal: false,
  onlyCertified: false,
  location: ''
})

// 模拟数据生成函数
const generateMockGoods = (count) => {
  const brands = {
    '手机': ['iPhone', '华为', '小米', 'OPPO', 'vivo', '三星', '荣耀', '魅族'],
    '数码': ['Apple', '华为', '小米', '三星', '索尼', '戴尔', '联想'],
    '美妆': ['MAC', '兰蔻', '雅诗兰黛', '欧莱雅', '资生堂', '纪梵希'],
    '四级': ['新东方', '朗文', '考研', '春雨', '文曲星'],
    '明星周边': ['周杰伦', '蔡徐坤', '肖战', '易烊千玺', 'TFBOYS'],
    '母婴': ['花王', '帮宝适', '好奇', '美素佳儿', '贝亲'],
    '游戏交易': ['王者荣耀', '和平精英', '英雄联盟', '原神', '绝地求生'],
    '潮玩动漫': ['POP MART', '奈良美智', 'KAWS', '蒂德利特'],
    '交通工具': ['小牛', '永久', '九号', 'Ninebot'],
    '家电': ['美的', '格力', '海尔', '小米', '松下', '西门子']
  }
  
  const brandList = brands[categoryName.value] || ['品牌']
  
  return Array.from({ length: count }, (_, i) => {
    const brand = brandList[Math.floor(Math.random() * brandList.length)]
    const isNew = Math.random() > 0.7
    const daysSincePublish = Math.floor(Math.random() * 30)
    
    return {
      id: Date.now() + i,
      name: `${brand} ${categoryName.value}${Math.floor(Math.random() * 1000)}`,
      price: (Math.random() * 1000 + 100).toFixed(2),
      originPrice: ((Math.random() * 1000 + 500) + 100).toFixed(2),
      sales: Math.floor(Math.random() * 1000),
      image: `https://picsum.photos/300/300?random=${Math.random()}`,
      location: ['广州', '深圳', '东莞', '佛山', '北京', '上海', '杭州'][Math.floor(Math.random() * 7)],
      seller: {
        nickname: `卖家${Math.floor(Math.random() * 1000)}`,
        avatar: 'https://picsum.photos/100/100',
      },
      isReal: Math.random() > 0.3,
      isCertified: Math.random() > 0.6,
      isNew: isNew,
      publishTime: Date.now() - daysSincePublish * 24 * 60 * 60 * 1000,
      show: false,
      subCategory: activeSubCategory.value === '全部' ? 
                  subCategories.value[Math.floor(Math.random() * subCategories.value.length)] : 
                  activeSubCategory.value
    }
  }).filter(item => {
    // 如果选择了子分类且不是"全部"，则过滤
    if (activeSubCategory.value !== '全部' && item.subCategory !== activeSubCategory.value) {
      return false
    }
    
    // 价格筛选
    if (filters.value.minPrice && parseFloat(item.price) < parseFloat(filters.value.minPrice)) {
      return false
    }
    if (filters.value.maxPrice && parseFloat(item.price) > parseFloat(filters.value.maxPrice)) {
      return false
    }
    
    // 其他筛选条件
    if (filters.value.onlyNew && !item.isNew) {
      return false
    }
    if (filters.value.onlyReal && !item.isReal) {
      return false
    }
    if (filters.value.onlyCertified && !item.isCertified) {
      return false
    }
    if (filters.value.location && item.location !== filters.value.location) {
      return false
    }
    
    return true
  })
}

// 处理筛选点击
const handleFilterClick = (index) => {
  // 如果是价格选项且已激活，则切换排序方向
  if (filterOptions.value[index].key === 'price' && filterOptions.value[index].active) {
    filterOptions.value[index].asc = !filterOptions.value[index].asc
  } else {
    filterOptions.value = filterOptions.value.map((option, i) => ({
      ...option,
      active: i === index
    }))
  }
  
  // 重置列表并重新加载
  page.value = 1
  goodsList.value = []
  loadGoods()
}

// 处理子分类点击
const handleSubCategoryClick = (subCategory) => {
  activeSubCategory.value = subCategory
  page.value = 1
  goodsList.value = []
  loadGoods()
  
  // 关闭筛选面板
  showFilterPanel.value = false
}

// 处理价格范围点击
const handlePriceRangeClick = (index) => {
  priceRanges.value = priceRanges.value.map((range, i) => ({
    ...range,
    active: i === index
  }))
  
  const selectedRange = priceRanges.value[index]
  filters.value.minPrice = selectedRange.min
  filters.value.maxPrice = selectedRange.max
}

// 应用筛选条件
const applyFilters = () => {
  page.value = 1
  goodsList.value = []
  loadGoods()
  showFilterPanel.value = false
}

// 重置筛选条件
const resetFilters = () => {
  filters.value = {
    minPrice: '',
    maxPrice: '',
    onlyNew: false,
    onlyReal: false,
    onlyCertified: false,
    location: ''
  }
  priceRanges.value = priceRanges.value.map(range => ({
    ...range,
    active: false
  }))
}

// 加载商品数据
const loadGoods = async () => {
  loading.value = true
  try {
    // 模拟网络请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    const newGoods = generateMockGoods(pageSize)
    
    // 根据当前筛选条件排序
    const activeFilter = filterOptions.value.find(option => option.active)
    if (activeFilter) {
      if (activeFilter.key === 'price') {
        newGoods.sort((a, b) => {
          return activeFilter.asc 
            ? parseFloat(a.price) - parseFloat(b.price)
            : parseFloat(b.price) - parseFloat(a.price)
        })
      } else if (activeFilter.key === 'sales') {
        newGoods.sort((a, b) => b.sales - a.sales)
      } else if (activeFilter.key === 'new') {
        newGoods.sort((a, b) => b.publishTime - a.publishTime)
      }
    }
    
    // 模拟数据加载完毕的情况
    if (page.value >= 3) {
      hasMore.value = false
    }

    // 添加新商品
    goodsList.value.push(...newGoods)

    // 使用setTimeout创建入场动画
    newGoods.forEach((item, index) => {
      setTimeout(() => {
        item.show = true
      }, index * 100)
    })

    page.value++
  } catch (error) {
    console.error('加载商品失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
    isRefreshing.value = false
  }
}

// 加载更多
const loadMore = () => {
  if (!loading.value && hasMore.value) {
    loadGoods()
  }
}

// 刷新
const refresh = () => {
  isRefreshing.value = true
  page.value = 1
  hasMore.value = true
  goodsList.value = []
  loadGoods()
}

// 商品点击
const handleGoodsClick = (item) => {
  router.push({
    name: 'goods-details',
    query: {
      id: item.id
    }
  })
}

// 收藏商品
const handleLike = (item, event) => {
  event.stopPropagation()
  item.likes = item.likes ? item.likes - 1 : 1
  uni.showToast({
    title: item.likes ? '已收藏' : '已取消收藏',
    icon: 'none'
  })
}

// 切换筛选面板
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value
}

// 页面加载
onLoad((options) => {
  categoryName.value = options.name || '商品分类'
  categoryId.value = options.id
  loadGoods()
})

onMounted(() => {
  loadGoods()
})
</script>

<template>
  <layout>
    <template #left>
      <view class="flex items-center h-full">
        <WdIcon
          name="arrow-left"
          size="40rpx"
          color="#333"
          @tap="router.back()"
        />
      </view>
    </template>
    <template #center>
      <view class="text-32rpx font-medium text-#333">{{ categoryName }}</view>
    </template>
    <template #right>
      <view class="flex items-center h-full" @tap="toggleFilterPanel">
        <WdIcon
          name="filter-o"
          size="40rpx"
          color="#333"
        />
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 子分类横向滚动 -->
      <scroll-view 
        scroll-x 
        class="whitespace-nowrap bg-white py-16rpx px-10rpx shadow-sm mb-10rpx"
        show-scrollbar="false"
      >
        <view 
          v-for="(subCategory, index) in subCategories" 
          :key="index"
          class="inline-block mx-10rpx px-20rpx py-10rpx rounded-full transition-all duration-300"
          :class="activeSubCategory === subCategory ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
          @tap="handleSubCategoryClick(subCategory)"
        >
          <text class="text-26rpx">{{ subCategory }}</text>
        </view>
      </scroll-view>

      <!-- 筛选栏 -->
      <view class="sticky top-0 z-10 bg-white shadow-sm">
        <view class="flex items-center h-80rpx">
          <view
            v-for="(option, index) in filterOptions"
            :key="index"
            class="flex-1 flex items-center justify-center h-full transition-all duration-300"
            :class="{'text-#f43f5e': option.active}"
            @tap="handleFilterClick(index)"
          >
            <text class="text-28rpx">{{ option.name }}</text>
            <WdIcon
              v-if="option.key === 'price'"
              :name="option.active ? (option.asc ? 'arrow-up' : 'arrow-down') : 'sort'"
              size="24rpx"
              :custom-style="option.active ? 'color: #f43f5e' : 'color: #999'"
              class="ml-8rpx"
            />
            <WdIcon
              v-else-if="option.active"
              name="success"
              size="24rpx"
              custom-style="color: #f43f5e"
              class="ml-8rpx"
            />
          </view>
        </view>
      </view>

      <!-- 筛选面板 -->
      <view 
        v-if="showFilterPanel" 
        class="fixed top-0 left-0 w-screen h-screen bg-black bg-opacity-50 z-20 flex justify-end"
        @tap.self="showFilterPanel = false"
      >
        <view class="bg-white w-80vw h-full transform transition-all duration-300 animate-slide-in-right">
          <view class="p-30rpx border-b border-gray-100">
            <view class="text-32rpx font-bold text-#333 mb-30rpx">筛选</view>
            
            <!-- 价格区间 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-#333 mb-20rpx">价格区间</view>
              <view class="grid grid-cols-3 gap-15rpx">
                <view 
                  v-for="(range, index) in priceRanges" 
                  :key="index"
                  class="text-center py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="range.active ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="handlePriceRangeClick(index)"
                >
                  {{ range.label }}
                </view>
              </view>
              <view class="flex items-center mt-20rpx">
                <input 
                  type="digit" 
                  v-model="filters.minPrice" 
                  placeholder="最低价" 
                  class="flex-1 h-70rpx bg-gray-100 rounded-8rpx px-20rpx text-26rpx"
                />
                <text class="mx-15rpx text-gray-400">-</text>
                <input 
                  type="digit" 
                  v-model="filters.maxPrice" 
                  placeholder="最高价" 
                  class="flex-1 h-70rpx bg-gray-100 rounded-8rpx px-20rpx text-26rpx"
                />
              </view>
            </view>
            
            <!-- 其他条件 -->
            <view class="mb-30rpx">
              <view class="text-28rpx text-#333 mb-20rpx">其他条件</view>
              <view class="flex flex-wrap">
                <view 
                  class="mr-20rpx mb-20rpx px-20rpx py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="filters.onlyNew ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="filters.onlyNew = !filters.onlyNew"
                >
                  仅看新品
                </view>
                <view 
                  class="mr-20rpx mb-20rpx px-20rpx py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="filters.onlyReal ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="filters.onlyReal = !filters.onlyReal"
                >
                  仅看实拍
                </view>
                <view 
                  class="mr-20rpx mb-20rpx px-20rpx py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="filters.onlyCertified ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="filters.onlyCertified = !filters.onlyCertified"
                >
                  官方验证
                </view>
              </view>
            </view>
            
            <!-- 地区选择 -->
            <view class="mb-50rpx">
              <view class="text-28rpx text-#333 mb-20rpx">发货地</view>
              <view class="flex flex-wrap">
                <view 
                  class="mr-20rpx mb-20rpx px-20rpx py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="filters.location === '' ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="filters.location = ''"
                >
                  不限
                </view>
                <view 
                  v-for="(city, index) in ['广州', '深圳', '东莞', '佛山', '北京', '上海']" 
                  :key="index"
                  class="mr-20rpx mb-20rpx px-20rpx py-10rpx rounded-8rpx text-26rpx transition-all duration-300"
                  :class="filters.location === city ? 'bg-#f43f5e bg-opacity-10 text-#f43f5e' : 'bg-gray-100 text-gray-600'"
                  @tap="filters.location = city"
                >
                  {{ city }}
                </view>
              </view>
            </view>
            
            <!-- 按钮 -->
            <view class="flex">
              <button 
                class="flex-1 h-80rpx mr-20rpx bg-gray-100 text-#333 rounded-8rpx text-28rpx"
                @tap="resetFilters"
              >
                重置
              </button>
              <button 
                class="flex-1 h-80rpx bg-gradient-to-r from-#f43f5e to-#ff7676 text-white rounded-8rpx text-28rpx"
                @tap="applyFilters"
              >
                确定
              </button>
            </view>
          </view>
        </view>
      </view>

      <!-- 商品列表 -->
      <scroll-view
        scroll-y
        class="px-20rpx pt-20rpx"
        @scrolltolower="loadMore"
        @refresherrefresh="refresh"
        refresher-enabled
        :refresher-triggered="isRefreshing"
        :style="{ height: 'calc(100vh - 80rpx - 88rpx - 76rpx)' }"
      >
        <view class="grid grid-cols-2 gap-20rpx">
          <view
            v-for="item in goodsList"
            :key="item.id"
            class="goods-item bg-white rounded-16rpx overflow-hidden shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
            :class="{'opacity-0': !item.show}"
            @tap="handleGoodsClick(item)"
          >
            <!-- 商品主图 -->
            <view class="relative">
              <image
                :src="item.image"
                mode="aspectFill"
                class="w-full h-240rpx object-cover"
              />

              <!-- 标签 -->
              <view class="absolute top-10rpx left-10rpx flex">
                <view v-if="item.isReal" class="bg-black bg-opacity-60 rounded-8rpx px-10rpx py-4rpx mr-10rpx">
                  <text class="text-20rpx text-white font-medium">实拍</text>
                </view>
                <view v-if="item.isNew" class="bg-#f43f5e bg-opacity-90 rounded-8rpx px-10rpx py-4rpx">
                  <text class="text-20rpx text-white font-medium">新品</text>
                </view>
              </view>

              <!-- 收藏按钮 -->
              <view
                class="absolute top-10rpx right-10rpx w-60rpx h-60rpx rounded-full bg-black bg-opacity-40 flex items-center justify-center transition-all duration-300 active:scale-90 active:bg-opacity-60"
                @tap.stop="handleLike(item, $event)"
              >
                <WdIcon
                  :name="item.likes ? 'like' : 'like-o'"
                  size="32rpx"
                  :custom-style="item.likes ? 'color:#f43f5e' : 'color:#fff'"
                />
              </view>
            </view>

            <!-- 商品信息 -->
            <view class="p-16rpx">
              <!-- 标题和价格 -->
              <text class="text-26rpx text-#333 line-clamp-2 h-72rpx">{{ item.name }}</text>
              <view class="flex items-center mt-10rpx">
                <text class="text-28rpx font-600 text-#f43f5e mr-8rpx">¥{{ item.price }}</text>
                <text class="text-22rpx text-gray-400 line-through">¥{{ item.originPrice }}</text>
              </view>
              
              <!-- 标签 -->
              <view class="flex mt-8rpx overflow-hidden h-36rpx">
                <view v-if="activeSubCategory === '全部'" class="mr-8rpx px-8rpx bg-#f43f5e bg-opacity-10 rounded-4rpx">
                  <text class="text-20rpx text-#f43f5e">{{ item.subCategory }}</text>
                </view>
                <view v-if="item.sales > 500" class="mr-8rpx px-8rpx bg-orange-500 bg-opacity-10 rounded-4rpx">
                  <text class="text-20rpx text-orange-500">热销</text>
                </view>
              </view>

              <!-- 卖家信息和位置 -->
              <view class="flex justify-between items-center mt-10rpx">
                <view class="flex items-center">
                  <image :src="item.seller.avatar" class="w-32rpx h-32rpx rounded-full mr-8rpx"/>
                  <text class="text-22rpx text-gray-500 truncate max-w-120rpx">{{ item.seller.nickname }}</text>
                  <!-- 官方验证标签 -->
                  <view v-if="item.isCertified" class="ml-6rpx px-6rpx py-2rpx bg-blue-500 bg-opacity-10 rounded-4rpx">
                    <text class="text-18rpx text-blue-500">验</text>
                  </view>
                </view>
                <view class="flex items-center">
                  <WdIcon name="location-o" size="22rpx" custom-style="color:#999" class="mr-2rpx"/>
                  <text class="text-22rpx text-gray-500">{{ item.location }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="loading" class="py-30rpx flex justify-center">
          <WdIcon name="loading" size="40rpx" custom-style="color:#f43f5e" class="animate-spin"/>
        </view>
        <view v-if="!hasMore && goodsList.length > 0" class="py-30rpx text-center text-26rpx text-gray-400">
          没有更多商品了
        </view>
        <view v-if="!loading && goodsList.length === 0" class="py-60rpx flex flex-col items-center justify-center">
          <WdIcon name="search" size="80rpx" custom-style="color:#ddd" class="mb-20rpx"/>
          <text class="text-28rpx text-gray-400">暂无符合条件的商品</text>
        </view>
      </scroll-view>
    </view>
  </layout>
</template>

<style>
.goods-item {
  opacity: 0;
  transform: translateY(20rpx);
  transition: all 0.3s ease-out;
}

.goods-item.opacity-0 {
  transform: translateY(20rpx);
}

.goods-item:not(.opacity-0) {
  opacity: 1;
  transform: translateY(0);
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out forwards;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
