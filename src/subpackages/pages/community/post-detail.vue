<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { formatTime } from '@/utils/time'
import User from '/static/images/user.png'
import { onLoad, onPullDownRefresh, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import events from '@/utils/events'
import { throttle } from 'lodash'
import Layout from '@/layout/index.vue'
import InputSection from '@/components/InputSection.vue'
import SharePopups from '@/components/share-popups.vue'
import { useShare } from '@/composables/share'
import { useRouter } from 'uni-mini-router'
import { CommunityApi } from '@/api/community'
import { UserApi } from '@/api/user'

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
const commentPageSize = ref(20)
const commentTotal = ref(0)
const isLoadingComments = ref(false)

// 评论输入
const commentInput = ref('')
const isSubmitting = ref(false)

// 回复弹窗相关
const replyDialogVisible = ref(false)
const replyDialogTitle = ref('')
const allReplies = ref([])
const currentComment = ref(null)
const replyPage = ref(1)
const replyPageSize = ref(20)
const replyTotal = ref(0)
const isLoadingReplies = ref(false)

// 初始化分享
onMounted(() => {
  initShare()
})

// 加载帖子详情
const loadPostDetail = async () => {
  try {
    const res = await CommunityApi.getPostDetail(postId.value)
    
    // 更新帖子数据
    Object.assign(post, {
      id: res.data.id,
      user: {
        id: res.data.author.id,
        nickname: res.data.author.nickname,
        avatar: res.data.author.avatar || User,
        level: res.data.author.level || 1,
        gender: res.data.author.gender || 'unknown',
        isFollowed: res.data.is_followed || false
      },
      content: res.data.content,
      images: res.data.images || [],
      tags: res.data.tags || [],
      publishTime: res.data.publish_time * 1000, // 转换为毫秒
      stats: res.data.stats,
      isLiked: res.data.is_liked,
      isFavorited: res.data.is_favorited
    })
    
    // 加载评论
    await loadComments()
  } catch (error) {
    console.error('加载帖子详情失败:', error)
    uni.showToast({
      title: '加载失败',
      icon: 'none'
    })
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
    
    const newComments = res.data.comments.map(comment => ({
      id: comment.id,
      user: {
        id: comment.author.id,
        nickname: comment.author.nickname,
        avatar: comment.author.avatar || User,
        level: comment.author.level || 1,
        gender: comment.author.gender || 'unknown'
      },
      content: comment.content,
      publishTime: comment.publish_time * 1000,
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
        publishTime: reply.publish_time * 1000,
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
    
    commentTotal.value = res.data.total
  } catch (error) {
    console.error('加载评论失败:', error)
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
    
    const newReplies = res.data.replies.map(reply => ({
      id: reply.id,
      user: {
        id: reply.author.id,
        nickname: reply.author.nickname,
        avatar: reply.author.avatar || User,
        level: reply.author.level || 1
      },
      replyTo: reply.reply_to,
      content: reply.content,
      publishTime: reply.publish_time * 1000,
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
    
    replyTotal.value = res.data.total
  } catch (error) {
    console.error('加载回复失败:', error)
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
}

// 处理点赞
const handleLike = throttle(async () => {
  try {
    await CommunityApi.likePost(postId.value)
    
    // 更新本地状态
    post.isLiked = !post.isLiked
    post.stats.likes += post.isLiked ? 1 : -1
  } catch (error) {
    console.error('点赞失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}, 1000)

// 处理收藏
const handleFavorite = throttle(async () => {
  try {
    await CommunityApi.favoritePost(postId.value)
    
    // 更新本地状态
    post.isFavorited = !post.isFavorited
    post.stats.favorites += post.isFavorited ? 1 : -1
    
    uni.showToast({
      title: post.isFavorited ? '收藏成功' : '已取消收藏',
      icon: 'none'
    })
  } catch (error) {
    console.error('收藏失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
  }
}, 1000)

// 处理分享
const handleShare = throttle(async () => {
  showSharePopup.value = true
  
  try {
    await CommunityApi.sharePost(postId.value)
    post.stats.shares++
  } catch (error) {
    console.error('分享统计失败:', error)
  }
}, 1000)

// 生成二维码
const handleGenerateQrCode = () => {
  qrcodeLoading.value = true
  // 模拟生成二维码
  setTimeout(() => {
    qrcodeUrl.value = 'https://via.placeholder.com/200'
    qrcodeLoading.value = false
  }, 1000)
}

// 处理评论点赞
const handleCommentLike = throttle(async (comment) => {
  try {
    await CommunityApi.likeComment(comment.id)
    
    // 更新本地状态
    comment.isLiked = !comment.isLiked
    comment.likes += comment.isLiked ? 1 : -1
  } catch (error) {
    console.error('评论点赞失败:', error)
  }
}, 1000)

// 处理回复点赞
const handleReplyLike = throttle(async (reply) => {
  try {
    await CommunityApi.likeReply(reply.id)
    
    // 更新本地状态
    reply.isLiked = !reply.isLiked
    reply.likes += reply.isLiked ? 1 : -1
  } catch (error) {
    console.error('回复点赞失败:', error)
  }
}, 1000)

// 发送评论或回复
const handleSend = async (text) => {
  if (!text.trim() || isSubmitting.value) return
  
  isSubmitting.value = true
  
  try {
    if (currentComment.value) {
      // 发送回复
      const res = await CommunityApi.createReply({
        comment_id: currentComment.value.id,
        reply_to_id: '', // TODO: 处理回复给特定用户
        content: text
      })
      
      // 添加到回复列表
      const newReply = {
        id: res.data.id,
        user: {
          id: res.data.author.id,
          nickname: res.data.author.nickname,
          avatar: res.data.author.avatar || User,
          level: res.data.author.level || 1
        },
        replyTo: res.data.reply_to,
        content: res.data.content,
        publishTime: res.data.publish_time * 1000,
        likes: 0,
        isLiked: false
      }
      
      allReplies.value.unshift(newReply)
      currentComment.value.replyCount++
    } else {
      // 发送评论
      const res = await CommunityApi.createComment({
        post_id: postId.value,
        content: text
      })
      
      // 添加到评论列表
      const newComment = {
        id: res.data.id,
        user: {
          id: res.data.author.id,
          nickname: res.data.author.nickname,
          avatar: res.data.author.avatar || User,
          level: res.data.author.level || 1,
          gender: res.data.author.gender || 'unknown'
        },
        content: res.data.content,
        publishTime: res.data.publish_time * 1000,
        likes: 0,
        isLiked: false,
        replyCount: 0,
        hotReplies: []
      }
      
      comments.value.unshift(newComment)
      post.stats.comments++
    }
    
    // 重置输入
    commentInput.value = ''
    
    uni.showToast({
      title: currentComment.value ? '回复成功' : '评论成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('发送失败:', error)
    uni.showToast({
      title: '发送失败，请重试',
      icon: 'none'
    })
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
      await UserApi.followUser(post.user.id)
    }
    
    post.user.isFollowed = !post.user.isFollowed
    
    uni.showToast({
      title: post.user.isFollowed ? '已关注' : '已取消关注',
      icon: 'none'
    })
  } catch (error) {
    console.error('关注操作失败:', error)
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    })
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
    name: 'user-profile',
    params: { userId }
  })
}, 1000)

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面标题
const pageTitle = ref('帖子详情')

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

onLoad((options) => {
  // 获取帖子ID
  postId.value = options.id || ''
  
  if (postId.value) {
    // 加载帖子详情
    loadPostDetail()
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<template>
  <Layout>
    <view class="bg-#f8f8f8 min-h-100vh">
      <!-- 帖子详情卡片 -->
      <view class="bg-white rounded-t-20rpx p-30rpx mt-20rpx" @longpress="handleLongPress">
        <!-- 用户信息 -->
        <view class="flex justify-between items-center mb-20rpx">
          <view class="flex items-center" @tap="viewUserProfile(post.user.id)">
            <image class="w-80rpx h-80rpx rounded-full border-2rpx border-gray-100" :src="post.user.avatar" mode="aspectFill"></image>
            <view class="ml-20rpx">
              <view class="flex items-center">
                <text class="text-30rpx font-bold mr-10rpx">{{ post.user.nickname }}</text>
                <view class="flex items-center justify-center" :class="post.user.gender === 'male' ? 'text-blue-500' : 'text-pink-500'">
                  <WdIcon 
                    :name="post.user.gender === 'male' ? 'gender-male' : 'gender-female'" 
                    size="24" 
                    :custom-style="post.user.gender === 'male' ? 'color:#3b82f6' : 'color:#ec4899'"
                  />
                </view>
                <view class="ml-10rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-20rpx px-12rpx py-4rpx rounded-full">
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
          >
            {{ post.user.isFollowed ? '已关注' : '+ 关注' }}
          </view>
        </view>
        
        <!-- 帖子内容 -->
        <view class="mb-30rpx">
          <text class="text-32rpx text-#333" user-select>{{ post.content }}</text>
        </view>
        
        <!-- 标签 -->
        <view v-if="post.tags && post.tags.length > 0" class="flex flex-wrap mb-20rpx">
          <view 
            v-for="(tag, index) in post.tags" 
            :key="index" 
            class="mr-16rpx mb-16rpx px-16rpx py-6rpx bg-blue-50 text-blue-500 text-24rpx rounded-8rpx"
          >
            # {{ tag }}
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
          <view class="text-26rpx text-gray-500">按热度排序 
            <WdIcon name="chevron-down" size="24rpx" color="#666" />
          </view>
        </view>
        
        <!-- 评论列表 -->
        <view v-if="comments.length > 0" class="mb-30rpx">
          <!-- 评论项 -->
          <view 
            v-for="comment in comments" 
            :key="comment.id" 
            class="mb-30rpx pb-20rpx border-b border-gray-100 last:border-b-0"
          >
            <!-- 评论主体 -->
            <view class="flex">
              <!-- 头像 -->
              <image 
                :src="comment.user.avatar" 
                class="w-70rpx h-70rpx rounded-full flex-shrink-0 mr-20rpx" 
                @tap="viewUserProfile(comment.user.id)"
              />
              
              <!-- 评论内容区 -->
              <view class="flex-1">
                <!-- 用户信息 -->
                <view class="flex items-center mb-10rpx">
                  <text class="text-28rpx font-semibold text-#333 mr-10rpx">{{ comment.user.nickname }}</text>
                  <view class="ml-10rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-20rpx px-10rpx py-2rpx rounded-full">
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
                      <WdIcon name="message-circle" size="32rpx" color="#999" />
                    </view>
                    
                    <!-- 点赞按钮 -->
                    <view 
                      class="flex items-center transition-all duration-300" 
                      :class="comment.isLiked ? 'text-red-500' : 'text-gray-500'"
                      @tap="handleCommentLike(comment)"
                    >
                      <WdIcon 
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
                    <view class="flex-1">
                      <view class="flex flex-wrap items-center">
                        <text class="text-26rpx font-semibold text-blue-500 mr-8rpx">{{ reply.user.nickname }}: </text>
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
                  @tap="openReplyDialog(comment)"
                >
                  <text class="text-24rpx text-blue-500">共{{ comment.replyCount }}条回复</text>
                  <WdIcon name="arrow-right" size="24rpx" color="#3b82f6" />
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 无评论提示 -->
        <view v-else class="py-60rpx flex flex-col items-center justify-center">
          <WdIcon name="message-square" size="80rpx" color="#ddd" />
          <text class="mt-20rpx text-28rpx text-gray-400">暂无评论，快来抢沙发吧~</text>
        </view>
      </view>
    </view>
    
    <!-- 底部评论输入框 -->
    <InputSection
        v-model="commentInput"
        placeholder="说点什么..."
        :show-emoji="true"
        send-button-text="发送"
        @send="handleSend"
    />
    
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
            <WdIcon name="x" size="40rpx" color="#666" />
          </view>
        </view>
        
        <!-- 回复列表 -->
        <scroll-view scroll-y class="flex-1 px-30rpx py-20rpx">
          <view 
            v-for="reply in allReplies" 
            :key="reply.id" 
            class="mb-30rpx pb-20rpx border-b border-gray-100 last:border-b-0"
          >
            <view class="flex">
              <!-- 头像 -->
              <image 
                :src="reply.user.avatar" 
                class="w-60rpx h-60rpx rounded-full flex-shrink-0 mr-20rpx" 
                @tap="viewUserProfile(reply.user.id)"
              />
              
              <!-- 回复内容区 -->
              <view class="flex-1">
                <!-- 用户信息 -->
                <view class="flex items-center flex-wrap mb-6rpx">
                  <text class="text-28rpx font-semibold text-#333 mr-8rpx">{{ reply.user.nickname }}</text>
                  <view class="mr-8rpx bg-gradient-to-r from-blue-400 to-blue-500 text-white text-16rpx px-8rpx py-2rpx rounded-full">
                    Lv{{ reply.user.level }}
                  </view>
                </view>
                
                <!-- 回复内容 -->
                <view class="mb-10rpx">
                  <text v-if="reply.replyTo" class="text-26rpx text-gray-500">回复 <text class="text-blue-500">@{{ reply.replyTo.nickname }}:</text> </text>
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
        <view class="p-20rpx border-t border-gray-200">
          <InputSection
            v-model="commentInput"
            placeholder="回复..."
            :show-emoji="true"
            send-button-text="回复"
            @send="handleSend"
          />
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
</style> 