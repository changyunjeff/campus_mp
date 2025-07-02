<script setup>
import Layout from '@/layout/index.vue'
import {ref, reactive, onMounted} from 'vue'
import {useRouter} from 'uni-mini-router'
import {formatTime} from '@/utils/time'
import User from '/static/images/user.png'
import events from '@/utils/events'
import {debounce, throttle} from 'lodash'
import {onLoad, onPullDownRefresh, onReachBottom} from '@dcloudio/uni-app'
import {GoodsApi} from '@/api/goods'
import {useToast} from "@/composables/toast";
import {useTabbar} from '@/composables/tabbar'

const {show} = useTabbar()
const router = useRouter()
const toast = useToast()

// 数据状态
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const categories = ref([])
const goods = reactive([])

// 分页参数
const pagination = reactive({
  page: 1,
  pageSize: 10,
  hasMore: true,
  total: 0
})

// 筛选参数
const filters = reactive({
  categoryId: null,
  orderBy: 'created_at',
  orderDirection: 'desc'
})

// 搜索关键词
const searchKeyword = ref('')

// ==================== 数据加载函数 ====================

// 加载分类数据
const loadCategories = async () => {
  try {
    const response = await GoodsApi.getAllCategories()
    const rawCategories = response || []
    // 为分类添加图标和颜色
    categories.value = rawCategories.map(category => {
      return {
        ...category,
        icon: category.icon,
        color: category.color
      }
    })
  } catch (error) {
    console.error('加载分类失败:', error)
    toast.show('加载分类失败')
  }
}

// 加载商品列表
const loadGoodsList = async (isRefresh = false) => {
  if (loading.value && !isRefresh) return

  try {
    if (isRefresh) {
      refreshing.value = true
      pagination.page = 1
      goods.length = 0
    } else {
      if (pagination.page === 1) {
        loading.value = true
      } else {
        loadingMore.value = true
      }
    }

    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      orderBy: filters.orderBy,
      orderDirection: filters.orderDirection
    }

    if (filters.categoryId) {
      params.categoryId = filters.categoryId
    }

    const response = await GoodsApi.getGoodsList(params)

    // 修改响应码判断：实际返回的是 code: 0
    const {items, total, page, page_size, has_more} = response

    // 处理商品数据，添加前端需要的字段
    const processedItems = items.map(item => ({
      ...item,
      // 添加is_liked字段，默认为false（后续可以从用户收藏列表中获取）
      is_liked: false,
      // 处理卖家信息，因为API只返回seller_open_id
      seller: {
        nickname: '用户', // 默认昵称，可以后续通过seller_open_id获取详细信息
        avatar_url: null
      }
    }))

    console.log('处理商品数据:', processedItems)

    if (isRefresh || pagination.page === 1) {
      goods.length = 0
      goods.push(...processedItems)
    } else {
      goods.push(...processedItems)
    }

    pagination.total = total
    pagination.hasMore = has_more

    if (processedItems.length > 0) {
      pagination.page++
    }
    
    console.log('分页信息更新 - 当前页:', pagination.page, '总数:', pagination.total, '是否有更多:', pagination.hasMore)
  } catch (error) {
    console.error('加载商品列表失败:', error)
    toast.show('加载商品失败')
  } finally {
    loading.value = false
    refreshing.value = false
    loadingMore.value = false
  }
}

// ==================== 事件处理函数 ====================

// 处理分类点击
const handleCategoryClick = throttle(async (category) => {
  console.log('选择分类:', category.name)

  // 更新筛选条件
  filters.categoryId = filters.categoryId === category.id ? null : category.id

  // 重新加载商品列表
  pagination.page = 1
  await loadGoodsList(true)
}, 1000)

// 处理商品点击
const viewGoodsDetail = throttle(async (goodsId) => {
  console.log('查看商品详情:', goodsId)

  try {
    // 记录浏览
    await GoodsApi.viewGoods(goodsId)
  } catch (error) {
    console.error('记录浏览失败:', error)
  }

  // 跳转到商品详情页
  router.push({
    name: 'goods_details',
    params: {
      id: goodsId
    }
  })
}, 1000)

// 收藏商品
const handleLike = throttle(async (goodsItem, event) => {
  event.stopPropagation()

  try {
    if (goodsItem.is_liked) {
      await GoodsApi.unlikeGoods(goodsItem.id)
      goodsItem.is_liked = false
      goodsItem.likes = Math.max(0, goodsItem.likes - 1)
      toast.show('取消收藏成功')
    } else {
      await GoodsApi.likeGoods(goodsItem.id)
      goodsItem.is_liked = true
      goodsItem.likes = goodsItem.likes + 1
      toast.show('收藏成功')
    }
  } catch (error) {
    console.error('操作失败:', error)
    toast.show('操作失败，请重试')
  }
}, 1000)

// 跳转到搜索页
const goToSearch = () => {
  router.push({
    name: 'search',
    params: {
      type: 'goods'
    }
  })
}

// 长按操作
const actions = [
  {
    name: "收藏",
  },
  {
    name: "分享",
  },
  {
    name: "举报",
  }
]

const title = "商品操作"

const handleLongPress = (goodsItem) => {
  console.log('长按商品:', goodsItem.id)
  events.emit('openActionSheet', actions, title)
}

// ==================== 生命周期和页面事件 ====================

// 页面加载
onMounted(async () => {
  console.log('商品页面已挂载')
  show()
  await Promise.all([
    loadCategories(),
    loadGoodsList()
  ])
  console.log('初始数据加载完成，商品数量:', goods.length)
})

// 下拉刷新
onPullDownRefresh(async () => {
  console.log('下拉刷新触发')
  await loadGoodsList(true)
  uni.stopPullDownRefresh()
})

// 上拉加载更多
onReachBottom(async () => {
  console.log('触底加载更多 - hasMore:', pagination.hasMore, 'loadingMore:', loadingMore.value)
  if (pagination.hasMore && !loadingMore.value) {
    await loadGoodsList()
  }
})
</script>

<template>
  <layout>
    <template #left>

    </template>
    <template #center>
      <!-- 搜索框 -->
      <view class="p-20rpx">
        <view
            class="relative flex items-center bg-white rounded-full p-20rpx px-30rpx border border-gray-200 shadow-sm">
          <WdIcon name="search" size="40rpx" color="#999"/>
          <input
              type="text"
              v-model="searchKeyword"
              class="flex-1 ml-20rpx text-30rpx text-#333 placeholder-gray-400"
              placeholder="手机"
              disabled
              @tap="goToSearch"
          />
        </view>
      </view>
    </template>

    <view class="bg-#f8f8f8">
      <!-- 免责声明 -->
      <view class="px-20rpx mb-20rpx">
        <view class="w-full py-10rpx text-center text-24rpx text-gray-500 bg-gray-100 bg-opacity-70 rounded-full">
          自由市场商品由个人发布，未经官方验证，请自行交流购买
        </view>
      </view>

      <!-- 分类导航 -->
      <view class="p-20rpx bg-white rounded-16rpx mx-20rpx mb-20rpx shadow-sm">
        <view v-if="categories.length === 0" class="text-center py-40rpx text-gray-400">
          加载中...
        </view>
        <view v-else class="grid grid-cols-5 gap-20rpx">
          <view
              v-for="category in categories"
              :key="category.id"
              class="flex flex-col items-center transition-all duration-300 active:scale-95"
              :class="{ 'bg-blue-50 rounded-12rpx': filters.categoryId === category.id }"
              @tap="handleCategoryClick(category)"
          >
            <view class="w-80rpx h-80rpx rounded-full mb-10rpx flex items-center justify-center"
                  :style="`background-color: ${category.color}20;`">
              <WdIcon
                  custom-class="iconfont" class-prefix="icon"
                  :name="category.icon"
                  size="40rpx"
                  :custom-style="`color: ${category.color}`"
              />
            </view>
            <text class="text-24rpx text-#333 truncate w-full text-center">{{ category.name }}</text>
          </view>
        </view>
      </view>

      <!-- 商品列表 -->
      <view class="px-20rpx">
        <!-- 加载状态 -->
        <view v-if="loading && goods.length === 0" class="text-center py-80rpx">
          <view class="text-gray-400">加载中...</view>
        </view>

        <!-- 空状态 -->
        <view v-else-if="goods.length === 0" class="text-center py-80rpx">
          <view class="text-gray-400 mb-20rpx">暂无商品</view>
          <view class="text-gray-300 text-24rpx">试试切换分类或刷新页面</view>
        </view>

        <!-- 商品网格 -->
        <view v-else class="grid grid-cols-2 gap-20rpx">
          <view
              v-for="item in goods"
              :key="item.id"
              class="bg-white rounded-16rpx overflow-hidden shadow-sm transition-all duration-300 active:scale-98 active:bg-gray-50"
              @tap="viewGoodsDetail(item.id)"
              @longpress="handleLongPress(item)"
          >
            <!-- 商品主图 -->
            <view class="relative">
              <image
                  :src="item.images && item.images.length > 0 ? item.images[0].url : User"
                  mode="aspectFill"
                  class="w-full h-240rpx object-cover"
                  :lazy-load="true"
              ></image>

              <!-- 实拍标签 -->
              <view v-if="item.is_real"
                    class="absolute top-10rpx left-10rpx bg-black bg-opacity-60 rounded-8rpx px-10rpx py-4rpx">
                <text class="text-20rpx text-white font-medium">实拍</text>
              </view>

              <!-- 收藏按钮 -->
              <view
                  class="absolute top-10rpx right-10rpx w-60rpx h-60rpx rounded-full bg-black bg-opacity-40 flex items-center justify-center transition-all duration-300 active:scale-90 active:bg-opacity-60"
                  @tap.stop="handleLike(item, $event)"
              >
                <WdIcon
                    custom-class="iconfont" class-prefix="icon"
                    :name="item.is_liked ? 'like' : 'like-o'"
                    size="32rpx"
                    :custom-style="item.is_liked ? 'color:#f43f5e' : 'color:#fff'"
                />
              </view>
            </view>

            <!-- 商品信息 -->
            <view class="p-16rpx">
              <!-- 标题和价格 -->
              <text class="text-26rpx text-#333 line-clamp-2 h-72rpx">{{ item.title }}</text>
              <view class="flex items-center mt-10rpx">
                <text class="text-28rpx font-600 text-#f43f5e mr-8rpx">¥{{ item.price }}</text>
                <text v-if="item.original_price && item.original_price > item.price"
                      class="text-22rpx text-gray-400 line-through">¥{{ item.original_price }}
                </text>
              </view>

              <!-- 卖家信息和位置 -->
              <view class="flex justify-between items-center mt-10rpx">
                <view class="flex items-center">
                  <image
                      :src="item.seller && item.seller.avatar_url ? item.seller.avatar_url : User"
                      class="w-32rpx h-32rpx rounded-full mr-8rpx"
                      mode="aspectFill"
                  ></image>
                  <text class="text-22rpx text-gray-500 truncate max-w-120rpx">
                    {{ item.seller && item.seller.nickname ? item.seller.nickname : '匿名用户' }}
                  </text>
                  <!-- 官方验证标签 -->
                  <view v-if="item.is_certified" class="ml-6rpx px-6rpx py-2rpx bg-blue-500 bg-opacity-10 rounded-4rpx">
                    <text class="text-18rpx text-blue-500">验</text>
                  </view>
                </view>
                <view class="flex items-center">
                  <WdIcon name="location-o" size="22rpx" custom-style="color:#999" class="mr-2rpx"/>
                  <text class="text-22rpx text-gray-500">{{ item.location || '未知' }}</text>
                </view>
              </view>

              <!-- 统计信息 -->
              <view class="flex justify-between items-center mt-8rpx text-gray-400 text-20rpx">
                <view class="flex items-center">
                  <WdIcon name="eye-o" size="20rpx" custom-style="color:#999" class="mr-4rpx"/>
                  <text>{{ item.views || 0 }}</text>
                </view>
                <view class="flex items-center">
                  <WdIcon name="like-o" size="20rpx" custom-style="color:#999" class="mr-4rpx"/>
                  <text>{{ item.likes || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view v-if="loadingMore" class="text-center py-40rpx">
          <view class="text-gray-400">加载更多...</view>
        </view>

        <!-- 没有更多 -->
        <view v-else-if="goods.length > 0 && !pagination.hasMore" class="text-center py-40rpx">
          <view class="text-gray-400">没有更多了</view>
        </view>
      </view>
    </view>

    <custom-tab-bar/>
  </layout>
</template>

<style>
/* 使用UnoCSS原子类，无需额外CSS */
</style>