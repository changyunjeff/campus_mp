<script setup>
import Layout from "@/layout/index.vue"
import {ref, reactive, onMounted, computed, nextTick} from 'vue'
import {onLoad, onPullDownRefresh} from '@dcloudio/uni-app'
import {useRouter} from 'uni-mini-router'
import GoodsInfo from '@/subpackages/components/goods/info.vue'
import InputSection from '@/components/InputSection.vue'
import {GoodsApi} from '@/api/goods.js'
import {formatTime} from '@/utils/time.js'
import Amap from '@/components/Amap.vue'
import {useToast} from "@/composables/toast"
import {useUserStore} from "@/pinia/modules/user"
import events from "@/utils/events";

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

// 商品ID
const goodsId = ref(null)

// 加载状态
const loading = ref(false)
const showAllDesc = ref(false)

// 商品数据
const goods = reactive({
  id: null,
  title: '',
  price: 0,
  original_price: 0,
  images: [],
  description: '',
  is_real: false,
  is_certified: false,
  views: 0,
  likes: 0,
  is_liked: false,
  location: '',
  latitude: 0,
  longitude: 0,
  condition: '',
  category: {
    id: '',
    name: '',
    icon: '',
    color: '',
    description: ''
  },
  seller: {
    id: '',
    nickname: '',
    avatar_url: ''
  },
  publish_time: 0,
  // 评论数据 - 使用新的数据结构
  comments: {
    items: [],
    total: 0,
    page: 1,
    page_size: 10,
    has_more: false
  }
})

// 当前轮播图索引
const currentSwiperIndex = ref(0)

// 设置商品类型
const goodsType = ref('phone')

// 商品描述是否超长（3行）
const descRef = ref(null)
const isDescOverflow = ref(false)

// 地图相关状态
const showLocationMap = ref(false)

// 留言弹窗相关
const commentsDialogVisible = ref(false)
const commentInput = ref('')
const isSubmitting = ref(false)
const loadingComments = ref(false)
const isLoadingMore = ref(false)

// 回复弹窗相关
const replyDialogVisible = ref(false)
const replyDialogTitle = ref('')
const allReplies = ref([])
const currentComment = ref(null)
const replyPage = ref(1)
const replyPageSize = ref(20)
const replyTotal = ref(0)
const isLoadingReplies = ref(false)
const isLoadingMoreReplies = ref(false)

// 回复状态
const replyingToReply = ref(null) // 当前正在回复的回复

// 获取商品详情
const getGoodsDetail = async () => {
  if (!goodsId.value || loading.value) return

  try {
    loading.value = true
    const data = await GoodsApi.getGoodsDetail(goodsId.value)

    // 更新商品数据
    Object.assign(goods, {
      id: data.id,
      title: data.title,
      price: data.price,
      original_price: data.original_price,
      images: data.images || [],
      description: data.description,
      is_real: data.is_real,
      is_certified: data.is_certified,
      views: data.views,
      likes: data.likes,
      is_liked: data.is_liked,
      location: data.location,
      latitude: data.latitude,
      longitude: data.longitude,
      condition: data.condition,
      category: data.category || {},
      seller: data.seller || {},
      publish_time: data.publish_time,
      // 处理评论数据 - 后端在商品详情中返回的是评论数组
      comments: {
        items: data.comments || [],
        total: data.comments ? data.comments.length : 0,
        page: 1,
        page_size: 10,
        has_more: false // 商品详情中的评论通常只返回最新几条，完整列表通过专门的接口获取
      }
    })

    // 设置卖家ID（用于路由跳转等）
    if (goods.seller) {
      goods.seller.id = data.seller_open_id
    }

    // 检查描述是否超长
    // nextTick(() => {
    //   checkDescOverflow()
    // })
  } catch (error) {
    console.error('获取商品详情失败：', error)
    toast.show('获取商品详情失败，请重试')
  } finally {
    loading.value = false
  }
}

// 轮播图片轮播时触发
const onSwiperChange = (event) => {
  currentSwiperIndex.value = event.detail.current
}

// 收藏商品
const handleLike = async () => {
  try {
    if (goods.is_liked) {
      await GoodsApi.unlikeGoods(goods.id)
      goods.is_liked = false
      goods.likes = Math.max(0, goods.likes - 1)
      toast.show('已取消收藏')
    } else {
      await GoodsApi.likeGoods(goods.id)
      goods.is_liked = true
      goods.likes += 1
      toast.show('已收藏')
    }
  } catch (error) {
    console.error('收藏操作失败：', error)
    toast.show('操作失败，请重试')
  }
}

// 展开/收起描述
const toggleDescription = () => {
  showAllDesc.value = !showAllDesc.value
}

// 分享商品
const shareGoods = () => {
  uni.showShareMenu({
    withShareTicket: true,
    menus: ['shareAppMessage', 'shareTimeline']
  })
}

// 跳转到商家店铺
const goToSeller = () => {
  router.push({
    name: 'other_index',
    params: {
      id: goods.seller?.id
    }
  })
}

// 联系卖家
const contactSeller = () => {
  router.push({
    name: 'private_chat',
    params: {
      goodsId: goods.id,
      id: goods.seller?.id
    }
  })
}

// 立即购买
const handleBuy = () => {
  router.push({
    name: 'goods_order_confirm',
    params: {
      id: goods.id,
      title: goods.title,
      price: goods.price,
      original_price: goods.original_price,
      cover: goods.images[0]?.url || '',
      seller_id: goods.seller?.id,
      seller_avatar: goods.seller?.avatar_url,
      seller_nickname: goods.seller?.nickname,
    }
  })
}

// 显示更多图片
const viewAllImages = () => {
  const imageUrls = goods.images.map(img => img.url)
  uni.previewImage({
    urls: imageUrls,
    current: imageUrls[currentSwiperIndex.value]
  })
}

// 获取评论列表
const getCommentList = async (page = 1, isLoadMore = false) => {
  if (!goodsId.value) return

  try {
    if (isLoadMore) {
      isLoadingMore.value = true
    } else {
      loadingComments.value = true
    }

    const data = await GoodsApi.getCommentList(
        goodsId.value,
        page,
        goods.comments.page_size,
        'created_at',
        'desc',
        true
    )

    if (isLoadMore && page > 1) {
      // 加载更多，追加到现有列表
      goods.comments.items.push(...data.items)
    } else {
      // 首次加载或刷新，替换列表
      goods.comments.items = data.items || []
    }

    goods.comments.total = data.total || 0
    goods.comments.page = data.page || page
    goods.comments.page_size = data.page_size || 10
    goods.comments.has_more = data.has_more || false

  } catch (error) {
    console.error('获取评论列表失败：', error)
    toast.show('获取评论列表失败，请重试')
  } finally {
    loadingComments.value = false
    isLoadingMore.value = false
  }
}

// 获取回复列表
const getReplyList = async (comment, page = 1, isLoadMore = false) => {
  if (!comment || !comment.id) return

  try {
    if (isLoadMore) {
      isLoadingMoreReplies.value = true
    } else {
      isLoadingReplies.value = true
    }

    const data = await GoodsApi.getGoodsReplyList(
        comment.id,
        page,
        replyPageSize.value,
        'created_at',
        'desc'
    )

    if (isLoadMore && page > 1) {
      // 加载更多，追加到现有列表
      allReplies.value.push(...data.items)
    } else {
      // 首次加载或刷新，替换列表
      allReplies.value = data.items || []
    }

    replyTotal.value = data.total || 0
    replyPage.value = data.page || page
    
    // 更新has_more状态
    const hasMore = data.has_more || false
    
    return hasMore

  } catch (error) {
    console.error('获取回复列表失败：', error)
    toast.show('获取回复列表失败，请重试')
  } finally {
    isLoadingReplies.value = false
    isLoadingMoreReplies.value = false
  }
}

// 检查是否可以回复评论（只有商品发布者可以回复）
const canReplyToComment = () => {
  return goods.seller?.id === userStore.openid
}

// 打开留言弹窗
const openCommentsDialog = async () => {
  commentsDialogVisible.value = true
  await getCommentList(1, false)
}

// 关闭留言弹窗
const closeCommentsDialog = () => {
  commentsDialogVisible.value = false
}

// 打开回复弹窗
const openReplyDialog = async (comment) => {
  if (!canReplyToComment()) {
    toast.show('只有商品发布者可以回复评论')
    return
  }

  currentComment.value = comment
  replyDialogTitle.value = `回复 ${comment.user?.nickname || comment.user}`
  replyDialogVisible.value = true
  replyPage.value = 1

  // 加载回复列表
  await getReplyList(comment, 1, false)
}

// 关闭回复弹窗
const closeReplyDialog = () => {
  replyDialogVisible.value = false
  currentComment.value = null
  allReplies.value = []
  replyingToReply.value = null
}

// 处理回复回复
const handleReplyToReply = (reply) => {
  replyingToReply.value = reply
}

// 取消回复回复
const cancelReplyToReply = () => {
  replyingToReply.value = null
}

// 发送留言
const handleSendComment = async (text) => {
  if (!text.trim() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    const data = await GoodsApi.createGoodsComment(
        goodsId.value,
        text.trim(),
        null, // parent_id
        null, // reply_to_id
        null  // reply_to_user
    )

    // 将新评论添加到列表顶部
    goods.comments.items.unshift(data)
    goods.comments.total += 1

    // 重置输入
    commentInput.value = ''

    toast.show('留言成功')
  } catch (error) {
    console.error('发送留言失败：', error)
    toast.show('留言失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 发送回复
const handleSendReply = async (text) => {
  if (!text.trim() || isSubmitting.value || !currentComment.value) return

  isSubmitting.value = true

  try {
    const data = await GoodsApi.createGoodsReply(
        currentComment.value.id,
        text.trim(),
        replyingToReply.value ? replyingToReply.value.id : null,
        replyingToReply.value ? replyingToReply.value.user : null
    )

    // 将新回复添加到列表顶部
    allReplies.value.unshift(data)
    replyTotal.value += 1

    // 更新原评论的回复数量
    if (currentComment.value) {
      currentComment.value.reply_count = (currentComment.value.reply_count || 0) + 1
    }

    // 重置输入和回复状态
    commentInput.value = ''
    replyingToReply.value = null

    toast.show('回复成功')
  } catch (error) {
    console.error('发送回复失败：', error)
    toast.show('回复失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 删除评论
const handleDeleteComment = async (commentId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条留言吗？',
    confirmText: '删除',
    confirmColor: '#f43f5e',
    success: async (res) => {
      if (res.confirm) {
        try {
          await GoodsApi.deleteComment(commentId)

          // 从列表中移除该评论
          const index = goods.comments.items.findIndex(item => item.id === commentId)
          if (index > -1) {
            goods.comments.items.splice(index, 1)
            goods.comments.total = Math.max(0, goods.comments.total - 1)
          }

          toast.show('删除成功')
        } catch (error) {
          console.error('删除评论失败：', error)
          toast.show('删除失败，请重试')
        }
      }
    }
  })
}

// 删除回复
const handleDeleteReply = async (replyId) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这条回复吗？',
    confirmText: '删除',
    confirmColor: '#f43f5e',
    success: async (res) => {
      if (res.confirm) {
        try {
          await GoodsApi.deleteGoodsReply(replyId)

          // 从列表中移除该回复
          const index = allReplies.value.findIndex(item => item.id === replyId)
          if (index > -1) {
            allReplies.value.splice(index, 1)
            replyTotal.value = Math.max(0, replyTotal.value - 1)

            // 更新原评论的回复数量
            if (currentComment.value) {
              currentComment.value.reply_count = Math.max(0, (currentComment.value.reply_count || 0) - 1)
            }
          }

          toast.show('删除成功')
        } catch (error) {
          console.error('删除回复失败：', error)
          toast.show('删除失败，请重试')
        }
      }
    }
  })
}

// 加载更多评论
const loadMoreComments = async () => {
  if (!goods.comments.has_more || isLoadingMore.value) return

  const nextPage = goods.comments.page + 1
  await getCommentList(nextPage, true)
}

// 加载更多回复
const loadMoreReplies = async () => {
  if (!currentComment.value || isLoadingMoreReplies.value) return

  const nextPage = replyPage.value + 1
  const hasMore = await getReplyList(currentComment.value, nextPage, true)
  
  if (hasMore) {
    replyPage.value = nextPage
  }
}

// 处理图片加载失败
const handleImageError = (event) => {
  // 使用默认头像
  event.target.src = 'https://picsum.photos/100/100'
}

// 检查是否可以删除评论（需要获取当前用户信息）
const canDeleteComment = (comment) => {
  const currentUserId = userStore.openid
  return comment.user?.id === currentUserId
}

// 检查是否可以删除回复
const canDeleteReply = (reply) => {
  const currentUserId = userStore.openid
  return reply.user?.id === currentUserId
}

// 动态设置输入框placeholder
const inputPlaceholder = computed(() => {
  if (replyingToReply.value) {
    return `回复 ${replyingToReply.value.user?.nickname || replyingToReply.value.user}`
  }
  return '回复...'
})

onLoad(async (options) => {
  console.debug("options:", options)
  if (options.id) {
    goodsId.value = options.id
    await getGoodsDetail()
  } else {
    setTimeout(()=>{
      toast.show('商品id不存在')
      router.back()
    }, 1500)
  }
})

const checkDescOverflow = () => {
  if (!descRef.value) return
  // 这里假设每行44rpx，3行=132rpx，实际项目可根据字体和行高微调
  // 由于uniapp不支持直接获取scrollHeight，需用原生js
  const el = descRef.value.$el || descRef.value
  if (el && el.scrollHeight && el.offsetHeight) {
    isDescOverflow.value = el.scrollHeight > el.offsetHeight + 2 // 容错2px
  }
}

// 长按评论
const handleLongPress = (comment) => {
  console.debug("长按评论")
  if (!canDeleteComment(comment)) return

  const actions = [{
    name: "删除",
    callback: () => handleDeleteComment(comment.id),
  }]
  events.emit('openActionSheet', actions)
}

// 长按回复
const handleLongPressReply = (reply) => {
  console.debug("长按回复")
  if (!canDeleteReply(reply)) return

  const actions = [{
    name: "删除",
    callback: () => handleDeleteReply(reply.id),
  }]
  events.emit('openActionSheet', actions)
}

onPullDownRefresh(async () => {
  console.log('下拉刷新触发')
  await getGoodsDetail()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <layout>
    <template #center>
      <view class="text-32rpx font-medium text-#333">商品详情</view>
    </template>
    <template #right>
      <view class="flex items-center h-full" @tap="shareGoods">
        <WdIcon
            name="share-o"
            size="40rpx"
            color="#333"
        />
      </view>
    </template>

    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 加载中 -->
      <view v-if="loading" class="w-full h-100vh flex items-center justify-center">
        <WdIcon name="loading" size="60rpx" custom-style="color:#f43f5e" class="animate-spin"/>
      </view>

      <template v-else>
        <!-- 商品轮播图 -->
        <view class="relative bg-white">
          <swiper
              class="w-full h-750rpx"
              circular
              autoplay
              indicator-dots
              indicator-active-color="#f43f5e"
              @change="onSwiperChange"
          >
            <swiper-item v-for="(image, index) in goods.images" :key="index" @tap="viewAllImages">
              <image
                  :src="image.url"
                  mode="aspectFill"
                  class="w-full h-full transition-opacity duration-300"
              />
            </swiper-item>
          </swiper>

          <!-- 实拍标签 -->
          <view v-if="goods.is_real"
                class="absolute top-30rpx left-30rpx z-10 bg-#000000 bg-opacity-60 rounded-8rpx px-15rpx py-6rpx">
            <text class="text-24rpx text-white font-medium">实拍</text>
          </view>

          <!-- 页码提示 -->
          <view class="absolute bottom-30rpx right-30rpx z-10 bg-#000000 bg-opacity-60 rounded-full px-20rpx py-6rpx">
            <text class="text-24rpx text-white">{{ currentSwiperIndex + 1 }}/{{ goods.images.length }}</text>
          </view>
        </view>

        <!-- 价格区域 -->
        <view class="px-30rpx py-30rpx bg-white">
          <view class="flex items-end">
            <text class="text-46rpx font-bold text-#f43f5e mr-15rpx">¥{{ goods.price }}</text>
            <text class="text-28rpx text-gray-400 line-through">¥{{ goods.original_price }}</text>
          </view>

          <!-- 商品名称和关注按钮 -->
          <view class="flex justify-between items-start mt-15rpx">
            <view class="flex-1 pr-20rpx">
              <text class="text-34rpx text-#333 leading-48rpx break-words">{{ goods.title }}</text>
            </view>
          </view>

          <!-- 浏览量 -->
          <view class="flex mt-15rpx">
            <WdIcon name="view" size="32rpx" custom-style="color:#999" class="mr-10rpx"/>
            <text class="text-24rpx text-gray-400">浏览 {{ goods.views }}</text>
          </view>
        </view>

        <!-- 自由市场交易指南 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between">
            <text class="text-30rpx text-#333 font-medium">自由市场交易指南</text>
            <view class="flex items-center" @tap="router.push({name: 'market_guide'})">
              <text class="text-26rpx text-gray-500">点击查看，更懂自由市场</text>
              <WdIcon name="arrow" size="28rpx" custom-style="color:#999" class="ml-8rpx"/>
            </view>
          </view>
        </view>

        <!-- 宝贝信息 - 使用组件 -->
        <view class="mt-20rpx">
          <GoodsInfo :goods="goods" :goods-type="goodsType"/>
        </view>

        <!-- 商品描述 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="mb-20rpx">
            <text class="text-30rpx text-#333 font-medium">商品描述</text>
          </view>
          <view class="relative">
            <text
                ref="descRef"
                class="text-28rpx text-#333 leading-44rpx break-words"
                :class="{'line-clamp-3': !showAllDesc}"
            >{{ goods.description }}
            </text>
            <view
                v-if="isDescOverflow && !showAllDesc"
                class="flex justify-center items-center mt-10rpx"
                @tap="toggleDescription"
            >
              <text class="text-26rpx text-#f43f5e">展开</text>
              <WdIcon
                  name="arrow-down"
                  size="24rpx"
                  custom-style="color:#f43f5e"
                  class="ml-8rpx"
              />
            </view>
            <view
                v-if="isDescOverflow && showAllDesc"
                class="flex justify-center items-center mt-10rpx"
                @tap="toggleDescription"
            >
              <text class="text-26rpx text-#f43f5e">收起</text>
              <WdIcon
                  name="arrow-up"
                  size="24rpx"
                  custom-style="color:#f43f5e"
                  class="ml-8rpx"
              />
            </view>
          </view>
        </view>

        <!-- 卖家信息 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between" @tap="goToSeller">
            <view class="flex items-center">
              <image
                  :src="goods.seller.avatar_url || 'https://picsum.photos/100/100'"
                  class="w-80rpx h-80rpx rounded-full mr-20rpx"
                  mode="aspectFill"
                  @error="handleImageError"
              />
              <view class="flex flex-col">
                <view class="flex items-center">
                  <text class="text-30rpx text-#333 font-medium mr-10rpx">{{ goods.seller.nickname }}</text>
                  <view v-if="goods.is_certified"
                        class="px-8rpx py-4rpx bg-blue-500 bg-opacity-10 rounded-4rpx flex items-center">
                    <WdIcon name="certificate" size="24rpx" custom-style="color:#1989fa" class="mr-4rpx"/>
                    <text class="text-20rpx text-blue-500">实人认证</text>
                  </view>
                </view>
                <view class="flex items-center mt-8rpx">
                  <text class="text-24rpx text-gray-500">商品成色：{{ goods.condition }}</text>
                </view>
              </view>
            </view>
            <WdIcon name="arrow" size="32rpx" custom-style="color:#999"/>
          </view>

          <!-- 分割线 -->
          <view class="h-2rpx bg-gray-100 my-30rpx"></view>

          <!-- 卖家位置 -->
          <view class="flex items-center justify-between">
            <view class="flex items-center">
              <WdIcon name="location-o" size="32rpx" custom-style="color:#999" class="mr-15rpx"/>
              <text class="text-26rpx text-gray-500">发布于{{ goods.location }}</text>
              <text class="mx-15rpx text-gray-300">|</text>
              <text class="text-26rpx text-gray-500">{{ formatTime(goods.publish_time) }}</text>
            </view>
            <view
                v-if="goods.latitude && goods.longitude"
                class="px-20rpx py-10rpx bg-blue-50 text-blue-600 text-24rpx rounded-full active:bg-blue-100 transition-colors"
                @tap="showLocationMap = true"
            >
              查看地图
            </view>
          </view>
        </view>

        <!-- 留言区 -->
        <view class="mt-20rpx bg-white px-30rpx py-20rpx">
          <view class="flex items-center justify-between mb-20rpx">
            <text class="text-30rpx text-#333 font-medium">留言区</text>
            <view class="flex items-center" @tap="openCommentsDialog">
              <text class="text-26rpx text-blue-500 font-medium hover:underline transition-all duration-300">
                查看全部{{ goods.comments.total ? goods.comments.total : '' }}条留言
              </text>
              <WdIcon name="arrow" size="28rpx" custom-style="color:#3b82f6" class="ml-8rpx"/>
            </view>
          </view>

          <!-- 留言列表预览 -->
          <view v-if="goods.comments.items.length">
            <view
                v-for="comment in goods.comments.items.slice(0, 2)"
                :key="comment.id"
                class="py-20rpx border-b border-gray-100 last:border-none"
            >
              <view class="flex items-start">
                <image
                    :src="comment.user?.avatar || comment.user?.avatar_url || 'https://picsum.photos/100/100'"
                    class="w-60rpx h-60rpx rounded-full mr-20rpx"
                    mode="aspectFill"
                    @error="handleImageError"
                />
                <view class="flex-1">
                  <view class="flex justify-between items-center">
                    <text class="text-26rpx text-#333">{{ comment.user?.nickname || comment.user }}</text>
                    <text class="text-22rpx text-gray-400">{{ formatTime(comment.created_at || comment.time) }}</text>
                  </view>
                  <text class="text-28rpx text-#333 mt-10rpx">{{ comment.content }}</text>
                </view>
              </view>
            </view>
          </view>

          <!-- 无留言状态 -->
          <view v-else class="py-30rpx flex items-center justify-center flex-col">
            <WdIcon name="comment-o" size="60rpx" custom-style="color:#ddd" class="mb-15rpx"/>
            <text class="text-26rpx text-gray-400">暂无留言</text>
          </view>

          <!-- 留言输入框 -->
          <view class="flex items-center mt-30rpx bg-gray-100 rounded-full px-30rpx py-15rpx" @tap="openCommentsDialog">
            <WdIcon name="edit" size="32rpx" custom-style="color:#999" class="mr-15rpx"/>
            <text class="text-28rpx text-gray-400">问问更多细节问题</text>
          </view>
        </view>

        <!-- 官方提示 -->
        <view class="mt-20rpx mb-30rpx px-30rpx py-30rpx bg-white rounded-16rpx">
          <view class="flex items-start">
            <view class="flex-shrink-0 mr-20rpx">
              <WdIcon name="info-o" size="40rpx" custom-style="color:#f43f5e"/>
            </view>
            <view>
              <text class="text-26rpx text-#333 leading-40rpx">
                特别提示：请千万不要脱离平台进行交易，避免财物损失。谨防通过微信、支付宝加好友进行商品支付、转账、付押金等欺诈行为！
              </text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 底部操作栏 -->
    <view
        class="fixed bottom-0 left-0 right-0 h-130rpx bg-white border-t border-gray-100 flex items-center justify-between px-30rpx z-50">
      <view class="flex items-center">
        <view class="flex flex-col items-center mr-40rpx" @tap="handleLike">
          <WdIcon
              :name="goods.is_liked ? 'star-filled' : 'star'"
              size="44rpx"
              :custom-style="goods.is_liked ? 'color:#f43f5e' : 'color:#999'"
          />
          <text class="text-22rpx text-gray-500 mt-5rpx">收藏</text>
        </view>
        <view class="flex flex-col items-center mr-40rpx" @tap="openCommentsDialog">
          <WdIcon name="chat1" size="44rpx" custom-style="color:#999"/>
          <text class="text-22rpx text-gray-500 mt-5rpx">留言</text>
        </view>
        <view class="flex flex-col items-center" @tap="contactSeller">
          <WdIcon name="service" size="44rpx" custom-style="color:#999"/>
          <text class="text-22rpx text-gray-500 mt-5rpx">联系</text>
        </view>
      </view>

      <view class="flex">
        <button
            class="flex items-center justify-center h-90rpx w-240rpx rounded-full bg-gradient-to-r from-#f43f5e to-#ff7676 text-white text-32rpx font-medium"
            @tap="handleBuy"
        >
          直接买¥{{ goods.price }}
        </button>
      </view>
    </view>

    <!-- 留言弹窗 -->
    <view
        v-if="commentsDialogVisible"
        @tap="closeCommentsDialog"
        class="fixed inset-0 bg-black bg-opacity-50 z-200 flex flex-col justify-end transition-all duration-300"
        :class="commentsDialogVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <!-- 弹窗内容 - 防止点击穿透 -->
      <view
          @tap.stop
          class="bg-white rounded-t-32rpx flex flex-col transform transition-all duration-300"
          :class="commentsDialogVisible ? 'translate-y-0' : 'translate-y-full'"
          style="max-height: 85vh;"
      >
        <!-- 弹窗头部 -->
        <view class="relative flex justify-center items-center py-30rpx border-b border-gray-100">
          <text class="text-32rpx font-bold">留言（{{ goods.comments.total }}）</text>
          <view class="absolute right-30rpx" @tap="closeCommentsDialog">
            <WdIcon name="x" size="40rpx" color="#666"/>
          </view>
        </view>

        <!-- 留言列表 -->
        <scroll-view
            scroll-y
            class="px-30rpx py-20rpx"
            style="height: 60vh; overflow-y: auto;"
            refresher-enabled
            :refresher-triggered="loadingComments"
            @refresherrefresh="getCommentList(1, false)"
            @scrolltolower="loadMoreComments"
            lower-threshold="100"
        >
          <!-- 加载状态 -->
          <view v-if="loadingComments && !goods.comments.items.length" class="py-30rpx flex items-center justify-center">
            <WdIcon name="loading" size="40rpx" custom-style="color:#f43f5e" class="animate-spin mr-15rpx"/>
            <text class="text-26rpx text-gray-400">加载中...</text>
          </view>

          <view v-else-if="goods.comments.items.length">
            <view
                v-for="comment in goods.comments.items"
                :key="comment.id"
                class="py-20rpx border-b border-gray-100 last:border-none"
                @longpress="handleLongPress(comment)"
            >
              <view class="flex items-start">
                <image
                    :src="comment.user?.avatar || comment.user?.avatar_url || 'https://picsum.photos/100/100'"
                    class="w-60rpx h-60rpx rounded-full mr-20rpx"
                    mode="aspectFill"
                    @error="handleImageError"
                />
                <view class="flex-1">
                  <view class="flex justify-between items-center">
                    <text class="text-26rpx text-#333 font-medium">{{ comment.user?.nickname || comment.user }}</text>
                    <view class="flex items-center">
                      <text class="text-22rpx text-gray-400 mr-15rpx">{{
                          formatTime(comment.created_at || comment.time)
                        }}
                      </text>
                    </view>
                  </view>
                  <text class="text-28rpx text-#333 mt-10rpx">{{ comment.content }}</text>
                  
                  <!-- 回复按钮 - 只有商品发布者可以看到 -->
                  <view v-if="canReplyToComment()" class="mt-15rpx">
                    <view 
                      class="inline-flex items-center px-20rpx py-8rpx bg-blue-50 text-blue-600 text-24rpx rounded-full active:bg-blue-100 transition-colors"
                      @tap="openReplyDialog(comment)"
                    >
                      <WdIcon name="message-circle" size="28rpx" custom-style="color:#3b82f6" class="mr-8rpx"/>
                      <text>回复</text>
                    </view>
                  </view>
                  
                  <!-- 展开更多回复按钮 -->
                  <view 
                    v-if="comment.reply_count > 0"
                    class="mt-15rpx flex items-center text-blue-500 text-24rpx"
                    @tap="openReplyDialog(comment)"
                  >
                    <text>展开{{ comment.reply_count }}条回复</text>
                    <WdIcon name="arrow-down" size="24rpx" custom-style="color:#3b82f6" class="ml-8rpx"/>
                  </view>
                </view>
              </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="goods.comments.has_more" class="py-30rpx flex items-center justify-center">
              <view v-if="isLoadingMore" class="flex items-center">
                <WdIcon name="loading" size="32rpx" custom-style="color:#f43f5e" class="animate-spin mr-10rpx"/>
                <text class="text-26rpx text-gray-400">加载更多...</text>
              </view>
              <view v-else @tap="loadMoreComments" class="px-30rpx py-15rpx">
                <text class="text-26rpx text-blue-500">点击加载更多</text>
              </view>
            </view>

            <!-- 没有更多了 -->
            <view v-else-if="goods.comments.total > goods.comments.page_size"
                  class="py-20rpx flex items-center justify-center">
              <text class="text-24rpx text-gray-400">没有更多留言了</text>
            </view>
          </view>

          <!-- 无留言状态 -->
          <view v-else class="py-30rpx flex items-center justify-center flex-col">
            <WdIcon name="comment-o" size="60rpx" custom-style="color:#ddd" class="mb-15rpx"/>
            <text class="text-26rpx text-gray-400">暂无留言</text>
          </view>
        </scroll-view>

        <!-- 底部留言输入框 -->
        <view class="p-20rpx border-t border-gray-200 bg-white">
          <InputSection
              v-model="commentInput"
              placeholder="留言..."
              :show-emoji="true"
              send-button-text="发送"
              @send="handleSendComment"
          />
        </view>
      </view>
    </view>

    <!-- 回复弹窗 -->
    <view
        v-if="replyDialogVisible"
        @tap="closeReplyDialog"
        class="fixed inset-0 bg-black bg-opacity-50 z-200 flex flex-col justify-end transition-all duration-300"
        :class="replyDialogVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'"
    >
      <!-- 弹窗内容 - 防止点击穿透 -->
      <view
          @tap.stop
          class="bg-white rounded-t-32rpx max-h-75vh flex flex-col transform transition-all duration-300"
          :class="replyDialogVisible ? 'translate-y-0' : 'translate-y-full'"
      >
        <!-- 弹窗头部 -->
        <view class="relative flex justify-center items-center py-30rpx border-b border-gray-100">
          <text class="text-32rpx font-bold">{{ replyDialogTitle }}</text>
          <view class="absolute right-30rpx" @tap="closeReplyDialog">
            <WdIcon name="close" size="40rpx" color="#666"/>
          </view>
        </view>

        <!-- 回复列表 -->
        <scroll-view 
          scroll-y 
          class="flex-1 px-30rpx py-20rpx"
          refresher-enabled
          :refresher-triggered="isLoadingReplies"
          @refresherrefresh="getReplyList(currentComment, 1, false)"
          @scrolltolower="loadMoreReplies"
          lower-threshold="100"
        >
          <!-- 加载状态 -->
          <view v-if="isLoadingReplies && !allReplies.length" class="py-30rpx flex items-center justify-center">
            <WdIcon name="loading" size="40rpx" custom-style="color:#f43f5e" class="animate-spin mr-15rpx"/>
            <text class="text-26rpx text-gray-400">加载中...</text>
          </view>

          <view v-else-if="allReplies.length">
            <view
                v-for="reply in allReplies"
                :key="reply.id"
                class="mb-30rpx pb-20rpx border-b border-gray-100 last:border-b-0"
                @longpress="handleLongPressReply(reply)"
            >
              <view class="flex">
                <!-- 头像 -->
                <image
                    :src="reply.user?.avatar || reply.user?.avatar_url || 'https://picsum.photos/100/100'"
                    class="w-60rpx h-60rpx rounded-full flex-shrink-0 mr-20rpx"
                    mode="aspectFill"
                    @error="handleImageError"
                />

                <!-- 回复内容区 -->
                <view class="flex-1" @tap="handleReplyToReply(reply)">
                  <!-- 用户信息 -->
                  <view class="flex items-center flex-wrap mb-6rpx">
                    <text class="text-28rpx font-semibold text-#333 mr-8rpx">{{ reply.user?.nickname || reply.user }}</text>
                    <text class="text-22rpx text-gray-400">{{ formatTime(reply.created_at || reply.time) }}</text>
                  </view>

                  <!-- 回复内容 -->
                  <view class="mb-10rpx">
                    <text v-if="reply.reply_to" class="text-26rpx text-gray-500">回复
                      <text class="text-blue-500">@{{ reply.reply_to?.nickname || reply.reply_to }}:</text>
                    </text>
                    <text class="text-28rpx text-#333 leading-1.5">{{ reply.content }}</text>
                  </view>
                </view>
              </view>
            </view>

            <!-- 加载更多 -->
            <view v-if="replyPage * replyPageSize < replyTotal" class="py-30rpx flex items-center justify-center">
              <view v-if="isLoadingMoreReplies" class="flex items-center">
                <WdIcon name="loading" size="32rpx" custom-style="color:#f43f5e" class="animate-spin mr-10rpx"/>
                <text class="text-26rpx text-gray-400">加载更多...</text>
              </view>
              <view v-else @tap="loadMoreReplies" class="px-30rpx py-15rpx">
                <text class="text-26rpx text-blue-500">点击加载更多</text>
              </view>
            </view>

            <!-- 没有更多了 -->
            <view v-else-if="replyTotal > replyPageSize"
                  class="py-20rpx flex items-center justify-center">
              <text class="text-24rpx text-gray-400">没有更多回复了</text>
            </view>
          </view>

          <!-- 无回复状态 -->
          <view v-else class="py-30rpx flex items-center justify-center flex-col">
            <WdIcon name="message-circle" size="60rpx" custom-style="color:#ddd" class="mb-15rpx"/>
            <text class="text-26rpx text-gray-400">暂无回复</text>
          </view>
        </scroll-view>

        <!-- 底部回复输入框 -->
        <view class="border-t border-gray-200">
          <!-- 回复提示条 -->
          <view v-if="replyingToReply" class="bg-blue-50 px-20rpx py-15rpx flex justify-between items-center">
            <text class="text-26rpx text-blue-600">回复 {{ replyingToReply.user?.nickname || replyingToReply.user }}</text>
            <view @tap="cancelReplyToReply" class="p-8rpx">
              <WdIcon name="x" size="28rpx" color="#3b82f6"/>
            </view>
          </view>

          <view class="p-20rpx">
            <InputSection
                v-model="commentInput"
                :placeholder="inputPlaceholder"
                :show-emoji="true"
                send-button-text="回复"
                @send="handleSendReply"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 地图弹窗 -->
    <view v-if="showLocationMap && goods.latitude && goods.longitude" class="location-map-modal">
      <!-- 地图头部 -->
      <view class="location-map-header">
        <view @tap="showLocationMap = false" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="18" color="#333"/>
        </view>
        <text class="text-lg font-medium text-gray-800">交易地点</text>
        <view class="w-10"></view>
      </view>

      <!-- 地图区域 -->
      <view class="location-map-content">
        <Amap
            :preview-mode="true"
            :preview-location="`${goods.longitude},${goods.latitude}`"
            :show-search="false"
            :show-controls="true"
            :show-center-pin="false"
        />
      </view>

      <!-- 位置信息 -->
      <view class="location-map-footer">
        <text class="text-lg font-medium text-gray-800 block mb-1">位置信息</text>
        <text class="text-sm text-gray-600">{{ goods.location }}</text>
      </view>
    </view>
  </layout>
</template>

<style>
.animate-heartbeat {
  animation: heartbeat 1.2s ease-in-out;
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  15% {
    transform: scale(1.2);
  }
  30% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.2);
  }
}

/* 地图弹窗样式 */
.location-map-modal {
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

.location-map-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: white;
  border-bottom: 1px solid #f0f0f0;
  padding-top: calc(16px + constant(safe-area-inset-top));
  padding-top: calc(16px + env(safe-area-inset-top));
}

.location-map-content {
  flex: 1;
  height: 0;
  position: relative;
}

.location-map-footer {
  padding: 20px;
  background: white;
  border-top: 1px solid #f0f0f0;
  padding-bottom: calc(20px + constant(safe-area-inset-bottom));
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
}
</style>