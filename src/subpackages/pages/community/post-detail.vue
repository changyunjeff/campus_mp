<script setup>
import {ref, reactive, computed, onMounted} from 'vue'
import {formatTime} from '@/utils/time'
import User from '/static/images/user.png'
import {onLoad, onShareAppMessage, onShareTimeline} from '@dcloudio/uni-app'
import events from '@/utils/events'
import {throttle} from 'lodash'
import Layout from '@/layout/index.vue'
import InputSection from '@/components/InputSection.vue'
import SharePopups from '@/components/share-popups.vue'
import {useShare} from '@/subpackages/composables/share'
import {useRouter} from 'uni-mini-router'
import {CommunityApi} from '@/api/community'
import {UserApi} from '@/api/user'
import {useToast} from "@/composables/toast"
import {useMessage} from '@/composables/message'
import Amap from '@/components/Amap.vue'
import {useUserStore} from "@/pinia/modules/user";

// 初始化分享功能
const {
  showSharePopup,
  showQrcodePopup,
  qrcodeUrl,
  qrcodeLoading,
  canShareToTimeline,
  init: initShare,
  openSharePopup,
  closeSharePopup,
  shareToWechat,
  shareToMoments,
  generateQrCode,
  closeQrcodePopup,
  saveQrcodeToAlbum,
  createShareMessageOptions,
  createShareTimelineOptions
} = useShare()

const toast = useToast()
const {sendLikeMessage, sendFavoriteMessage, sendCommentMessage, sendFollowMessage} = useMessage()

const userStore = useUserStore()

// 路由
const router = useRouter()

// 帖子ID
const postId = ref('')

// 帖子数据
const post = reactive({
  id: '',
  user: {
    id: '',
    nickname: '',
    avatar: '',
    level: 1,
    gender: 'unknown',
    isFollowed: false
  },
  content: '',
  images: [],
  tags: [],
  topics: [], // 添加话题字段
  publishTime: 0,
  stats: {
    views: 0,
    likes: 0,
    comments: 0,
    favorites: 0,
    shares: 0
  },
  isLiked: false,
  isFavorited: false
})

// 评论数据
const comments = ref([])
const commentPage = ref(1)
const commentPageSize = ref(10)
const commentTotal = ref(0)
const isLoadingComments = ref(false)

// scroll-view 相关状态
const refresherTriggered = ref(false)
const scrollTop = ref(0)
const refresherEnabled = ref(true)

// 评论输入
const commentInput = ref('')
const isSubmitting = ref(false)

// 回复评论相关状态
const replyingToComment = ref(null) // 当前正在回复的评论
const replyingToReply = ref(null) // 当前正在回复的回复（二级回复）

// 回复弹窗相关
const replyDialogVisible = ref(false)
const replyDialogTitle = ref('')
const allReplies = ref([])
const currentComment = ref(null)
const replyPage = ref(1)
const replyPageSize = ref(20)
const replyTotal = ref(0)
const isLoadingReplies = ref(false)

// 地图相关状态
const showLocationMap = ref(false)

// 初始化分享
onMounted(() => {
  initShare()
})

// 加载帖子详情
const loadPostDetail = async () => {
  try {
    const res = await CommunityApi.getPostDetail(postId.value)
    console.debug('res:', res)
    // 更新帖子数据

    Object.assign(post, {
      id: res.id,
      user: {
        id: res.author.id,
        nickname: res.author.nickname,
        avatar: res.author.avatar || User,
        level: res.author.level || 1,
        gender: res.author.gender || 'unknown',
        isFollowed: res.is_followed || false
      },
      content: res.content,
      images: res.images || [],
      tags: res.tags || [],
      topics: res.topics || [], // 添加话题数据
      location: res.location, // 添加位置信息
      publishTime: res.publish_time, // 转换为毫秒
      stats: res.stats,
      isLiked: res.is_liked,
      isFavorited: res.is_favorited
    })
  } catch (err) {
    console.error('加载帖子详情失败:', err)
    toast.show('加载失败')
  }
}

// 加载评论列表
const loadComments = async (loadMore = false) => {
  if (isLoadingComments.value) return

  isLoadingComments.value = true

  try {
    const res = await CommunityApi.getComments(postId.value, {
      page: loadMore ? commentPage.value + 1 : 1,
      page_size: commentPageSize.value
    })

    const newComments = res.comments.map(comment => ({
      id: comment.id,
      user: {
        id: comment.author.id,
        nickname: comment.author.nickname,
        avatar: comment.author.avatar || User,
        level: comment.author.level || 1,
        gender: comment.author.gender || 'unknown'
      },
      content: comment.content,
      publishTime: comment.publish_time, // ✅ 后端返回毫秒时间戳
      likes: comment.likes,
      isLiked: comment.is_liked,
      replyCount: comment.reply_count,
      hotReplies: (comment.hot_replies || []).map(reply => ({
        id: reply.id,
        user: {
          id: reply.author.id,
          nickname: reply.author.nickname,
          avatar: reply.author.avatar || User,
          level: reply.author.level || 1
        },
        replyTo: reply.reply_to,
        content: reply.content,
        publishTime: reply.publish_time, // ✅ 后端返回毫秒时间戳
        likes: reply.likes,
        isLiked: reply.is_liked
      }))
    }))

    if (loadMore) {
      comments.value.push(...newComments)
      commentPage.value++
    } else {
      comments.value = newComments
      commentPage.value = 1
    }

    commentTotal.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingComments.value = false
  }
}

// 加载回复列表
const loadReplies = async (comment, loadMore = false) => {
  if (isLoadingReplies.value) return

  isLoadingReplies.value = true

  try {
    const res = await CommunityApi.getReplies(comment.id, {
      page: loadMore ? replyPage.value + 1 : 1,
      page_size: replyPageSize.value
    })

    const newReplies = res.replies.map(reply => ({
      id: reply.id,
      user: {
        id: reply.author.id,
        nickname: reply.author.nickname,
        avatar: reply.author.avatar || User,
        level: reply.author.level || 1
      },
      replyTo: reply.reply_to,
      content: reply.content,
      publishTime: reply.publish_time, // ✅ 后端返回毫秒时间戳
      likes: reply.likes,
      isLiked: reply.is_liked
    }))

    if (loadMore) {
      allReplies.value.push(...newReplies)
      replyPage.value++
    } else {
      allReplies.value = newReplies
      replyPage.value = 1
    }

    replyTotal.value = res.total
  } catch (err) {
    console.error(err)
  } finally {
    isLoadingReplies.value = false
  }
}

// 打开回复弹窗
const openReplyDialog = async (comment) => {
  currentComment.value = comment
  replyDialogTitle.value = `${comment.replyCount}条回复`
  replyDialogVisible.value = true

  // 加载回复列表
  await loadReplies(comment)
}

// 关闭回复弹窗
const closeReplyDialog = () => {
  replyDialogVisible.value = false
  currentComment.value = null
  allReplies.value = []
  replyingToReply.value = null // 清除回复状态
}

// 处理点赞
const handleLike = throttle(async () => {
  try {
    await CommunityApi.likePost(postId.value)

    // 更新本地状态
    post.isLiked = !post.isLiked
    post.stats.likes += post.isLiked ? 1 : -1
    
    // 如果是点赞操作，发送通知消息
    if (post.isLiked) {
      // 这里应该通过消息系统发送点赞通知给帖子作者
      // 实际实现中应该在后端处理，这里只是示例
      console.log('发送点赞通知给用户:', post)
      await sendLikeMessage(post.user.id, post.id, post.content, post.images[0])
    }
  } catch (err) {
    console.error(err)
    toast.error('点赞失败')
  }
}, 1000)

// 处理收藏
const handleFavorite = throttle(async () => {
  try {
    await CommunityApi.favoritePost(postId.value)

    // 更新本地状态
    post.isFavorited = !post.isFavorited
    post.stats.favorites += post.isFavorited ? 1 : -1

    // 如果是收藏操作，发送通知消息
    if (post.isFavorited) {
      // 这里应该通过消息系统发送收藏通知给帖子作者
      // 实际实现中应该在后端处理，这里只是示例
      console.log('发送收藏通知给用户:', post)
      await sendFavoriteMessage(post.user.id, post.id, post.content, post.images[0])
    }
    
    toast.show(post.isFavorited ? '收藏成功' : '已取消收藏')
  } catch (err) {
    console.error(err)
    toast.show('操作失败')
  }
}, 1000)

// 处理分享
const handleShare = throttle(async () => {
  showSharePopup.value = true

  try {
    await CommunityApi.sharePost(postId.value)
    post.stats.shares++
  } catch (err) {
    console.error(err)
  }
}, 1000)

// 生成二维码
const handleGenerateQrCode = async () => {
  await generateQrCode("post_detail", {id:post.id})
}

// 处理评论点赞
const handleCommentLike = throttle(async (comment) => {
  try {
    await CommunityApi.likeComment(comment.id)

    // 更新本地状态
    comment.isLiked = !comment.isLiked
    comment.likes += comment.isLiked ? 1 : -1
  } catch (err) {
    console.error(err)
  }
}, 1000)

// 处理回复点赞
const handleReplyLike = throttle(async (reply) => {
  try {
    await CommunityApi.likeReply(reply.id)

    // 更新本地状态
    reply.isLiked = !reply.isLiked
    reply.likes += reply.isLiked ? 1 : -1
  } catch (err) {
    console.error(err)
  }
}, 1000)

// 处理点击评论进行回复
const handleCommentReply = (comment) => {
  replyingToComment.value = comment
  replyingToReply.value = null // 清除对回复的回复状态
  // 聚焦到输入框
  setTimeout(() => {
    // 这里可以添加聚焦输入框的逻辑
  }, 100)
}

// 处理点击回复进行回复（二级回复）
const handleReplyToReply = (reply, parentComment = null) => {
  replyingToReply.value = reply
  replyingToComment.value = parentComment || currentComment.value
  // 聚焦到输入框
  setTimeout(() => {
    // 这里可以添加聚焦输入框的逻辑
  }, 100)
}

// 取消回复评论
const cancelReplyComment = () => {
  replyingToComment.value = null
  replyingToReply.value = null
}



// 发送评论或回复
const handleSend = async (text) => {
  if (!text.trim() || isSubmitting.value) return

  isSubmitting.value = true

  try {
    if (currentComment.value) {
      // 在回复弹窗中发送回复
      const res = await CommunityApi.createReply({
        comment_id: currentComment.value.id,
        reply_to_id: replyingToReply.value ? replyingToReply.value.id : '', // 如果是回复回复，传入被回复的回复ID
        content: text
      })

      // 添加到回复列表
      const newReply = {
        id: res.id,
        user: {
          id: res.author.id,
          nickname: res.author.nickname,
          avatar: res.author.avatar || User,
          level: res.author.level || 1
        },
        replyTo: res.reply_to,
        content: res.content,
        publishTime: res.publish_time, // ✅ 已经是毫秒时间戳
        likes: res.likes,
        isLiked: res.is_liked
      }

      allReplies.value.unshift(newReply)
      currentComment.value.replyCount++

      // 发送评论消息给被回复的用户（如果不是自己）
      const targetUserId = replyingToReply.value ? replyingToReply.value.user.id : currentComment.value.user.id
      if (targetUserId !== userStore.openid) {
        try {
          await sendCommentMessage(
            targetUserId,
            post.id,
            'community',
            text,
            post.content.substring(0, 50),
            post.images?.[0] || ''
          )
          console.log('回复消息已发送')
        } catch (msgErr) {
          console.error('发送回复消息失败:', msgErr)
        }
      }

      // 清除回复状态
      replyingToReply.value = null
      toast.show('回复成功')
    } else if (replyingToComment.value) {
      // 直接回复某个评论或回复
      const res = await CommunityApi.createReply({
        comment_id: replyingToComment.value.id,
        reply_to_id: replyingToReply.value ? replyingToReply.value.id : '', // 如果是回复回复，传入被回复的回复ID
        content: text
      })

      // 更新对应评论的回复数量
      const targetComment = comments.value.find(c => c.id === replyingToComment.value.id)
      if (targetComment) {
        targetComment.replyCount++

        // 如果热门回复少于2条，添加到热门回复
        if (!targetComment.hotReplies) {
          targetComment.hotReplies = []
        }
        if (targetComment.hotReplies.length < 2) {
          const newReply = {
            id: res.id,
            user: {
              id: res.author.id,
              nickname: res.author.nickname,
              avatar: res.author.avatar || User,
              level: res.author.level || 1
            },
            replyTo: res.reply_to,
            content: res.content,
            publishTime: res.publish_time,
            likes: res.likes,
            isLiked: res.is_liked
          }
          targetComment.hotReplies.unshift(newReply)
        }
      }

      // 发送评论消息给被回复的用户（如果不是自己）
      const targetUserId = replyingToReply.value ? replyingToReply.value.user.id : replyingToComment.value.user.id
      if (targetUserId !== userStore.openid) {
        try {
          await sendCommentMessage(
            targetUserId,
            post.id,
            'community',
            text,
            post.content.substring(0, 50),
            post.images?.[0] || ''
          )
          console.log('回复消息已发送')
        } catch (msgErr) {
          console.error('发送回复消息失败:', msgErr)
        }
      }

      // 取消回复状态
      replyingToComment.value = null
      replyingToReply.value = null
      toast.show('回复成功')
    } else {
      // 发送评论
      const res = await CommunityApi.createComment({
        post_id: postId.value,
        content: text
      })

      // 添加到评论列表
      const newComment = {
        id: res.id,
        user: {
          id: res.author.id,
          nickname: res.author.nickname,
          avatar: res.author.avatar || User,
          level: res.author.level || 1,
          gender: res.author.gender || 'unknown'
        },
        content: res.content,
        publishTime: res.publish_time, // ✅ 已经是毫秒时间戳，不需要乘以1000
        likes: res.likes,
        isLiked: res.is_liked,
        replyCount: res.reply_count,
        hotReplies: res.hot_replies || []
      }

      comments.value.unshift(newComment)
      post.stats.comments++
      
      // 发送评论消息给帖子作者（如果不是自己）
      if (post.user.id !== userStore.openid) {
        try {
          await sendCommentMessage(
            post.user.id,
            post.id,
            'community',
            text,
            post.content.substring(0, 50),
            post.images?.[0] || ''
          )
          console.log('评论消息已发送给帖子作者')
        } catch (msgErr) {
          console.error('发送评论消息失败:', msgErr)
        }
      }
      
      toast.show('评论成功')
    }

    // 重置输入
    commentInput.value = ''
  } catch (err) {
    console.error(err)
    toast.show('发送失败，请重试')
  } finally {
    isSubmitting.value = false
  }
}

// 关注用户
const followUser = throttle(async () => {
  try {
    if (post.user.isFollowed) {
      await UserApi.unfollowUser(post.user.id)
    } else {
      await sendFollowMessage(post.user.id)
      
      // 发送关注消息通知
      try {
        await sendFollowMessage(post.user.id)
        console.log('关注消息已发送')
      } catch (msgErr) {
        console.error('发送关注消息失败:', msgErr)
        // 不阻断关注流程，静默处理消息发送失败
      }
    }

    post.user.isFollowed = !post.user.isFollowed

    toast.show(post.user.isFollowed ? '已关注' : '已取消关注')
  } catch (err) {
    console.error(err)
    toast.show('操作失败')
  }
}, 1000)

// 查看图片大图
const viewImage = throttle((index) => {
  uni.previewImage({
    urls: post.images,
    current: index
  })
}, 1000)

// 查看用户资料
const viewUserProfile = throttle((userId) => {
  router.push({
    name: 'other_index',
    params: {id: userId}
  })
}, 1000)

// 查看话题详情
const viewTopicDetail = throttle((topicName) => {
  console.log('查看话题详情:', topicName)
  router.push({
    name: 'topic_detail',
    params: {
      name: topicName
    }
  })
}, 1000)

// 页面标题
const pageTitle = ref('帖子详情')

// 动态设置输入框placeholder
const inputPlaceholder = computed(() => {
  if (currentComment.value) {
    if (replyingToReply.value) {
      return `回复 ${replyingToReply.value.user.nickname}`
    } else {
      return '回复...'
    }
  } else if (replyingToReply.value) {
    return `回复 ${replyingToReply.value.user.nickname}`
  } else if (replyingToComment.value) {
    return `回复 ${replyingToComment.value.user.nickname}`
  } else {
    return '说点什么...'
  }
})

// 处理举报
const handleReport = () => {
  // 构建帖子信息
  const noteInfo = {
    id: post.id,
    title: post.content.substring(0, 30) + (post.content.length > 30 ? '...' : ''),
    author: post.user.nickname,
    cover: post.images.length > 0 ? post.images[0] : ''
  }

  // 跳转到举报页面
  router.push({
    name: 'report',
    params: {
      noteInfo: encodeURIComponent(JSON.stringify(noteInfo))
    }
  })
}

// 处理长按操作
const handleLongPress = () => {
  // 显示操作菜单
  events.emit('openActionSheet', [
    {
      name: "举报",
      callback: handleReport
    }
  ], "帖子操作")
}

// 下拉刷新处理
const onRefresherRefresh = async () => {
  console.log('下拉刷新帖子详情')
  refresherTriggered.value = true
  await Promise.all([
    loadPostDetail(),
    loadComments()
  ])
  refresherTriggered.value = false
}

// 触底加载处理
const onScrollToLower = async () => {
  console.log('触底加载更多评论')
  if (comments.value.length >= commentTotal.value || isLoadingComments.value) return
  
  await loadComments(true)
}

// 滚动事件处理
const onScroll = (e) => {
  scrollTop.value = e.detail.scrollTop
  // 当滚动位置大于50rpx时禁用下拉刷新，避免滚动冲突
  refresherEnabled.value = scrollTop.value <= 50
}

onLoad((options) => {
  // 获取帖子ID
  postId.value = options.id || ''

  if (postId.value) {
    // 加载帖子详情和评论列表
    Promise.all([
        loadPostDetail(),
        loadComments(),
    ])
  } else {
    toast.show('参数错误，请传入帖子ID')
    setTimeout(() => {
      router.back()
    }, 1500)
  }
})

const sortMode = [
  {
    code: 'hot',
    desc: '按热度',
  },
  {
    code: 'time',
    desc: '按时间'
  }
]

const currentSortMode = ref(0)

const toggleSortMode = ()=>{
  currentSortMode.value = (currentSortMode.value+1) % sortMode.length
}

const popupCommentActions = (_comment)=>{
  console.debug("comment:", _comment)

  // 如果是自己的评论，则显示删除按钮
  if (userStore.openid === _comment.user.id){
    const actions = [{
      name: '删除评论',
      callback: async ()=> {
        try {
          await CommunityApi.deleteComment(_comment.id)
          toast.show('删除成功')

          // 从本地数据中删除评论
          const index = comments.value.findIndex(comment => comment.id === _comment.id)
          if (index !== -1) {
            comments.value.splice(index, 1)
          }

          commentTotal.value--

        } catch (err) {
          console.error(err)
          toast.show('删除失败')
        }
      },
    }]

    events.emit('openActionSheet', actions)
  }
}

const popupReplyActions = throttle((_reply)=>{
  console.debug("reply:", _reply)
  // 如果是自己的回复，则显示删除按钮
  if (userStore.openid === _reply.user.id){

    const actions = [{
      name: '删除回复',
      callback: async ()=> {
        try {
          await CommunityApi.deleteReply(_reply.id)
          toast.show('删除成功')

          // 从本地数据中删除回复
          const index = allReplies.value.findIndex(reply => reply.id === _reply.id)
          if (index !== -1) {
            allReplies.value.splice(index, 1)
          }

          replyTotal.value--

        } catch (err) {
          console.error(err)
          toast.show('删除失败')
        }
      },
    }]

    events.emit('openActionSheet', actions)
  }
})
</script>

<template>
  <Layout>
    <scroll-view 
      scroll-y 
      class="bg-#f8f8f8 h-full"
      :refresher-enabled="refresherEnabled"
      :refresher-triggered="refresherTriggered"
      @refresherrefresh="onRefresherRefresh"
      @scrolltolower="onScrollToLower"
      @scroll="onScroll"
      lower-threshold="100"
    >
      <!-- 帖子详情卡片 -->
      <view class="bg-white rounded-t-20rpx p-30rpx mt-20rpx" @longpress="handleLongPress">
        <!-- 用户信息 -->
        <view class="flex justify-between items-center mb-20rpx">
          <view class="flex items-center" @tap="viewUserProfile(post.user.id)">
            <image class="w-80rpx h-80rpx rounded-full border-2rpx border-gray-100" :src="post.user.avatar"
                   mode="aspectFill"></image>
            <view class="ml-20rpx">
              <view class="flex items-center">
                <text class="text-30rpx font-bold mr-10rpx">{{ post.user.nickname }}</text>
                <view
                    class="ml-10rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-20rpx px-12rpx py-4rpx rounded-full">
                  Lv{{ post.user.level }}
                </view>
              </view>
              <text class="text-24rpx text-gray-400">{{ formatTime(post.publishTime) }}</text>
            </view>
          </view>

          <view
              :class="['px-20rpx py-10rpx rounded-full text-26rpx transition-all duration-300',
              post.user.isFollowed ? 'bg-gray-200 text-gray-500' : 'bg-blue-500 text-white']"
              @tap="followUser"
              v-if="post.user.id !== userStore.openid"
          >
            {{ post.user.isFollowed ? '已关注' : '+ 关注' }}
          </view>
        </view>

        <!-- 帖子内容 -->
        <view class="mb-30rpx">
          <text class="text-32rpx text-#333" user-select>{{ post.content }}</text>
        </view>

        <!-- 话题 -->
        <view v-if="post.topics && post.topics.length > 0" class="flex flex-wrap mb-20rpx">
          <view
              v-for="topic in post.topics"
              :key="topic.id"
              class="mr-16rpx mb-16rpx px-16rpx py-6rpx bg-orange-50 text-blue-500 text-24rpx rounded-8rpx transition-all duration-200 active:bg-orange-100"
              @tap="viewTopicDetail(topic.name)"
          >
            # {{ topic.name }}
            <text v-if="topic.is_official" class="ml-4rpx text-18rpx">🔥</text>
          </view>
        </view>

        <!-- 帖子图片 -->
        <view v-if="post.images && post.images.length > 0" class="grid gap-10rpx mb-30rpx" :class="{
          'grid-cols-1': post.images.length === 1,
          'grid-cols-2': post.images.length === 2 || post.images.length === 4,
          'grid-cols-3': post.images.length === 3 || post.images.length >= 5
        }">
          <image
              v-for="(img, index) in post.images"
              :key="index"
              :src="img"
              mode="aspectFill"
              class="w-full rounded-12rpx object-cover transition-all duration-300 active:opacity-80"
              :class="{
              'h-400rpx': post.images.length === 1,
              'h-300rpx': post.images.length === 2,
              'h-220rpx': post.images.length >= 3
            }"
              @tap="viewImage(index)"
          ></image>
        </view>

        <!-- 位置信息 -->
        <view v-if="post.location?.address" class="flex items-center gap-3 mb-30rpx">
          <WdIcon name="location" size="16" color="#f59e0b" />
          <view class="flex-1">
            <text class="text-sm text-gray-800 block">{{ post.location.address }}</text>
          </view>
          <view 
            class="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full active:bg-blue-100 transition-colors"
            @tap="showLocationMap = true"
          >
            查看地图
          </view>
        </view>

        <!-- 数据统计 -->
        <view class="flex justify-between text-gray-500 text-24rpx border-t border-b border-gray-100 py-16rpx mb-30rpx">
          <text>{{ post.stats.views }} 次浏览</text>
          <view class="flex">
            <text class="mr-20rpx">{{ post.stats.likes }} 赞</text>
            <text class="mr-20rpx">{{ post.stats.comments }} 评论</text>
            <text>{{ post.stats.shares }} 分享</text>
          </view>
        </view>

        <!-- 互动按钮 -->
        <view class="flex justify-around">
          <view
              :class="['flex items-center px-20rpx py-10rpx rounded-30rpx transition-all duration-300', post.isLiked ? 'active' : '']"
              @tap="handleLike"
          >
            <WdIcon
                custom-class="iconfont" class-prefix="icon"
                :name="post.isLiked ? 'heart-fill' : 'heart'"
                size="40rpx"
                :custom-style="post.isLiked ? 'color:#ef4444' : 'color:#666'"
            />
            <text class="ml-10rpx" :class="post.isLiked ? 'text-red-500 font-semibold' : 'text-gray-600'">
              {{ post.stats.likes }}
            </text>
          </view>

          <view class="flex items-center px-20rpx py-10rpx rounded-30rpx">
            <WdIcon
                custom-class="iconfont" class-prefix="icon"
                name="comment"
                size="40rpx"
                custom-style="color:#666"
            />
            <text class="ml-10rpx text-gray-600">{{ post.stats.comments }}</text>
          </view>

          <view
              :class="['flex items-center px-20rpx py-10rpx rounded-30rpx', post.isFavorited ? 'active' : '']"
              @tap="handleFavorite"
          >
            <WdIcon
                custom-class="iconfont" class-prefix="icon"
                :name="post.isFavorited ? 'star-fill' : 'star'"
                size="40rpx"
                :custom-style="post.isFavorited ? 'color:#f59e0b' : 'color:#666'"
            />
            <text class="ml-10rpx" :class="post.isFavorited ? 'text-amber-500 font-semibold' : 'text-gray-600'">
              {{ post.stats.favorites }}
            </text>
          </view>

          <view class="flex items-center px-20rpx py-10rpx rounded-30rpx" @tap="handleShare">
            <WdIcon
                custom-class="iconfont" class-prefix="icon"
                name="share"
                size="40rpx"
                custom-style="color:#666"
            />
            <text class="ml-10rpx text-gray-600">分享</text>
          </view>
        </view>
      </view>

      <!-- 评论区 -->
      <view class="mt-20rpx bg-white p-30rpx rounded-t-20rpx">
        <!-- 评论区标题 -->
        <view class="flex justify-between items-center mb-30rpx">
          <text class="text-32rpx font-bold">评论 ({{ post.stats.comments }})</text>
          <view class="text-26rpx text-gray-500" @tap.stop="toggleSortMode">{{ sortMode[currentSortMode].desc }}
            <WdIcon name="chevron-down" size="24rpx" color="#666"/>
          </view>
        </view>

        <!-- 评论列表 -->
        <view v-if="comments.length > 0" class="mb-30rpx">
          <!-- 评论项 -->
          <view
              v-for="comment in comments"
              :key="comment.id"
              class="mb-30rpx pb-20rpx border-b border-gray-100 last:border-b-0"
              @tap="handleCommentReply(comment)"
          >
            <!-- 评论主体 -->
            <view class="flex" @longpress.stop="popupCommentActions(comment)">
              <!-- 头像 -->
              <image
                  :src="comment.user.avatar"
                  class="w-70rpx h-70rpx rounded-full border-4rpx border-white shadow-md flex-shrink-0 mr-20rpx"
                  mode="aspectFill"
                  @tap.stop="viewUserProfile(comment.user.id)"
              />

              <!-- 评论内容区 -->
              <view class="flex-1">
                <!-- 用户信息 -->
                <view class="flex items-center mb-10rpx">
                  <text class="text-28rpx font-semibold text-#333 mr-10rpx">{{ comment.user.nickname }}</text>
                  <view
                      class="ml-10rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-20rpx px-10rpx py-2rpx rounded-full">
                    Lv{{ comment.user.level }}
                  </view>
                </view>

                <!-- 评论内容 -->
                <view class="mb-15rpx">
                  <text class="text-28rpx text-#333 leading-1.5">{{ comment.content }}</text>
                </view>

                <!-- 评论底部信息 -->
                <view class="flex justify-between items-center">
                  <text class="text-24rpx text-gray-400">{{ formatTime(comment.publishTime) }}</text>

                  <view class="flex items-center">
                    <!-- 回复按钮 -->
                    <view class="mr-30rpx flex items-center">
                      <WdIcon name="message-circle" size="32rpx" color="#999"/>
                    </view>

                    <!-- 点赞按钮 -->
                    <view
                        class="flex items-center transition-all duration-300"
                        :class="comment.isLiked ? 'text-red-500' : 'text-gray-500'"
                        @tap.stop="handleCommentLike(comment)"
                    >
                      <WdIcon
                          custom-class="iconfont" class-prefix="icon"
                          :name="comment.isLiked ? 'heart-fill' : 'heart'"
                          size="32rpx"
                          :color="comment.isLiked ? '#ef4444' : '#999'"
                      />
                      <text class="ml-10rpx text-24rpx">{{ comment.likes }}</text>
                    </view>
                  </view>
                </view>
              </view>
            </view>

            <!-- 热门回复区域 - B站风格 -->
            <view v-if="comment.hotReplies && comment.hotReplies.length > 0" class="ml-90rpx mt-20rpx">
              <!-- 热门回复列表 - 最多显示2条 -->
              <view
                  class="bg-gray-50 rounded-12rpx p-20rpx"
              >
                <!-- 回复条目 -->
                <view
                    v-for="(reply, index) in comment.hotReplies"
                    :key="reply.id"
                    class="mb-20rpx last:mb-0"
                >
                  <view class="flex items-start">
                    <!-- 回复内容区 -->
                    <view class="flex-1" @tap.stop="handleReplyToReply(reply, comment)">
                      <view class="flex flex-wrap items-center">
                        <text class="text-26rpx font-semibold text-blue-500 mr-8rpx">{{ reply.user.nickname }}</text>
                        <text v-if="reply.replyTo" class="text-24rpx text-gray-500 mr-8rpx">回复
                          @{{ reply.replyTo.nickname }}
                        </text>
                        <text class="text-26rpx text-blue-500 mr-8rpx">:</text>
                        <text class="text-26rpx text-#333 break-all">{{ reply.content }}</text>
                      </view>
                    </view>

                    <!-- 回复点赞 -->
                    <view
                        class="flex items-center ml-20rpx transition-all duration-300"
                        :class="reply.isLiked ? 'text-red-500' : 'text-gray-500'"
                        @tap.stop="handleReplyLike(reply)"
                    >
                      <WdIcon
                          custom-class="iconfont" class-prefix="icon"
                          :name="reply.isLiked ? 'heart-fill' : 'heart'"
                          size="24rpx"
                          :color="reply.isLiked ? '#ef4444' : '#999'"
                      />
                      <text class="ml-6rpx text-22rpx">{{ reply.likes }}</text>
                    </view>
                  </view>
                </view>

                <!-- 查看全部回复按钮 - B站风格 -->
                <view
                    v-if="comment.replyCount > 0"
                    class="flex items-center justify-between mt-10rpx pt-10rpx border-t border-gray-200"
                    @tap.stop="openReplyDialog(comment)"
                >
                  <text class="text-24rpx text-blue-500">共{{ comment.replyCount }}条回复</text>
                  <WdIcon name="arrow-right" size="24rpx" color="#3b82f6"/>
                </view>
              </view>
            </view>
          </view>
        </view>

        <!-- 无评论提示 -->
        <view v-else class="py-60rpx flex flex-col items-center justify-center">
          <WdIcon name="message-square" size="80rpx" color="#ddd"/>
          <text class="mt-20rpx text-28rpx text-gray-400">暂无评论，快来抢沙发吧~</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部评论输入框 -->
    <view class="relative">
      <!-- 回复提示条 -->
      <view v-if="replyingToComment || replyingToReply"
            class="bg-blue-50 px-30rpx py-20rpx flex justify-between items-center">
        <view v-if="replyingToReply" class="flex flex-wrap">
          <text class="text-28rpx text-blue-600">回复 {{ replyingToReply.user.nickname }}</text>
          <text v-if="replyingToReply.replyTo" class="text-24rpx text-gray-500 ml-10rpx">(回复给
            @{{ replyingToReply.replyTo.nickname }})
          </text>
        </view>
        <text v-else class="text-28rpx text-blue-600">回复 {{ replyingToComment.user.nickname }}</text>
        <view @tap="cancelReplyComment" class="p-10rpx">
          <WdIcon name="x" size="32rpx" color="#3b82f6"/>
        </view>
      </view>

      <InputSection
          v-model="commentInput"
          :placeholder="inputPlaceholder"
          :show-emoji="true"
          send-button-text="发送"
          @send="handleSend"
      />
    </view>

    <!-- B站风格回复弹窗 -->
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
            <WdIcon name="x" size="40rpx" color="#666"/>
          </view>
        </view>

        <!-- 回复列表 -->
        <scroll-view scroll-y class="flex-1 px-30rpx py-20rpx">
          <view
              v-for="reply in allReplies"
              :key="reply.id"
              class="mb-30rpx pb-20rpx border-b border-gray-100 last:border-b-0"
          >
            <view class="flex" @longpress="popupReplyActions(reply)">
              <!-- 头像 -->
              <image
                  :src="reply.user.avatar"
                  class="w-60rpx h-60rpx rounded-full flex-shrink-0 mr-20rpx"
                  @tap.stop="viewUserProfile(reply.user.id)"
              />

              <!-- 回复内容区 -->
              <view class="flex-1" @tap.stop="handleReplyToReply(reply)">
                <!-- 用户信息 -->
                <view class="flex items-center flex-wrap mb-6rpx">
                  <text class="text-28rpx font-semibold text-#333 mr-8rpx">{{ reply.user.nickname }}</text>
                  <view
                      class="mr-8rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-16rpx px-8rpx py-2rpx rounded-full">
                    Lv{{ reply.user.level }}
                  </view>
                </view>

                <!-- 回复内容 -->
                <view class="mb-10rpx">
                  <text v-if="reply.replyTo" class="text-26rpx text-gray-500">回复
                    <text class="text-blue-500">@{{ reply.replyTo.nickname }}:</text>
                  </text>
                  <text class="text-28rpx text-#333 leading-1.5">{{ reply.content }}</text>
                </view>

                <!-- 回复底部信息 -->
                <view class="flex justify-between items-center">
                  <text class="text-24rpx text-gray-400">{{ formatTime(reply.publishTime) }}</text>

                  <!-- 回复点赞 -->
                  <view
                      class="flex items-center transition-all duration-300"
                      :class="reply.isLiked ? 'text-red-500' : 'text-gray-500'"
                      @tap="handleReplyLike(reply)"
                  >
                    <WdIcon
                        custom-class="iconfont" class-prefix="icon"
                        :name="reply.isLiked ? 'heart-fill' : 'heart'"
                        size="28rpx"
                        :color="reply.isLiked ? '#ef4444' : '#999'"
                    />
                    <text class="ml-8rpx text-24rpx">{{ reply.likes }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </scroll-view>

        <!-- 底部回复输入框 -->
        <view class="border-t border-gray-200">
          <!-- 回复提示条 -->
          <view v-if="replyingToReply" class="bg-blue-50 px-20rpx py-15rpx flex justify-between items-center">
            <view class="flex flex-wrap">
              <text class="text-26rpx text-blue-600">回复 {{ replyingToReply.user.nickname }}</text>
              <text v-if="replyingToReply.replyTo" class="text-22rpx text-gray-500 ml-8rpx">(回复给
                @{{ replyingToReply.replyTo.nickname }})
              </text>
            </view>
            <view @tap="replyingToReply = null" class="p-8rpx">
              <WdIcon name="x" size="28rpx" color="#3b82f6"/>
            </view>
          </view>

          <view class="p-20rpx">
            <InputSection
                v-model="commentInput"
                :placeholder="inputPlaceholder"
                :show-emoji="true"
                send-button-text="回复"
                @send="handleSend"
            />
          </view>
        </view>
      </view>
    </view>

    <!-- 分享弹窗组件 -->
    <SharePopups
        v-model:showSharePopup="showSharePopup"
        v-model:showQrcodePopup="showQrcodePopup"
        :qrcodeUrl="qrcodeUrl"
        :qrcodeLoading="qrcodeLoading"
        :canShareToTimeline="canShareToTimeline"
        @shareToWechat="shareToWechat"
        @shareToMoments="shareToMoments"
        @generateQrCode="handleGenerateQrCode"
        @saveQrcode="saveQrcodeToAlbum"
    />

    <!-- 地图弹窗 -->
    <view v-if="showLocationMap && post.location" class="location-map-modal">
      <!-- 地图头部 -->
      <view class="location-map-header">
        <view @tap="showLocationMap = false" class="p-2 active:opacity-60 transition-opacity">
          <WdIcon name="arrow-left" size="18" color="#333"/>
        </view>
        <text class="text-lg font-medium text-gray-800">帖子位置</text>
        <view class="w-10"></view>
      </view>
      
      <!-- 地图区域 -->
      <view class="location-map-content">
        <Amap
          :preview-mode="true"
          :preview-location="`${post.location.longitude},${post.location.latitude}`"
          :show-search="false"
          :show-controls="true"
          :show-center-pin="false"
        />
      </view>
      
      <!-- 位置信息 -->
      <view class="location-map-footer">
        <text class="text-lg font-medium text-gray-800 block mb-1">位置信息</text>
        <text class="text-sm text-gray-600">{{ post.location.address }}</text>
      </view>
    </view>
  </Layout>
</template>

<style>
/* 动画效果 */
.active {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
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