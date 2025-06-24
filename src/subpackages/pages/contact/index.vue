<script setup>
import Layout from '@/layout/index.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import {onLoad} from '@dcloudio/uni-app'
import { useRouter } from 'uni-mini-router'
import { throttle, debounce } from 'lodash'
import User from '/static/images/user.png'
import { useToast } from '@/composables/toast'
import { UserApi } from '@/api/user'

const router = useRouter()
const toast = useToast()

// Tab选项
const contactTabs = [
  { name: 'friends', label: '好友', count: 0 },
  { name: 'followers', label: '粉丝', count: 0 },
  { name: 'following', label: '关注', count: 0 }
]

// 当前激活的tab
const activeTab = ref('friends')

// 搜索相关
const searchInput = ref('')
const isSearching = ref(false)
const searchResults = ref([])

// 数据状态
const loading = ref(false)
const contactData = reactive({
  friends: [],
  followers: [],
  following: []
})

// 分页状态
const pagination = reactive({
  friends: { page: 1, pageSize: 20, hasMore: true },
  followers: { page: 1, pageSize: 20, hasMore: true },
  following: { page: 1, pageSize: 20, hasMore: true }
})

// 当前显示的用户列表
const currentUsers = computed(() => {
  if (isSearching.value && searchInput.value.trim()) {
    return searchResults.value
  }
  return contactData[activeTab.value] || []
})

// 加载联系人数据
const loadContacts = async (tab = activeTab.value, refresh = false) => {
  if (loading.value) return
  
  loading.value = true
  
  try {
    if (refresh) {
      pagination[tab].page = 1
      pagination[tab].hasMore = true
      contactData[tab] = []
    }

    let response
    const params = {
      page: pagination[tab].page,
      page_size: pagination[tab].pageSize
    }

    switch (tab) {
      case 'friends':
        response = await UserApi.getFriendList(params)
        break
      case 'followers':
        response = await UserApi.getMyFollowerList(params)
        break
      case 'following':
        response = await UserApi.getMyFollowingList(params)
        break
      default:
        return
    }

    const users = response.list || []
    console.log('API响应数据:', response)
    console.log('用户列表:', users)
    
    // 处理用户数据，添加前端需要的字段
    const processedUsers = users.map(user => ({
      id: user.open_id,
      nickname: user.nickname || '未设置昵称',
      avatar: user.avatar && user.avatar.length > 0 ? user.avatar[0].url : User,
      gender: user.gender === 1 ? 'male' : user.gender === 2 ? 'female' : 'unknown',
      signature: user.introduction || '这个人很懒，什么都没留下',
      location: user.location || '未知',
      relationship: user.relationship,
      isOnline: false, // 稍后通过在线状态API更新
      lastSeen: 0 // 初始值为0，稍后通过在线状态API更新
    }))

    if (refresh) {
      contactData[tab] = processedUsers
    } else {
      contactData[tab].push(...processedUsers)
    }

    // 更新分页状态
    pagination[tab].hasMore = users.length === pagination[tab].pageSize
    if (pagination[tab].hasMore) {
      pagination[tab].page++
    }

    // 更新tab计数
    updateTabCounts()
    
    console.log('处理后的用户数据:', processedUsers)
    console.log('当前activeTab:', activeTab.value)
    console.log('contactData:', contactData)

    // 获取在线状态
    if (processedUsers.length > 0) {
      await updateOnlineStatus(processedUsers.map(u => u.id))
    }

  } catch (error) {
    console.error('加载联系人失败:', error)
    toast.show('加载失败，请重试')
  } finally {
    loading.value = false
  }
}

// 更新tab计数
const updateTabCounts = () => {
  contactTabs[0].count = contactData.friends.length
  contactTabs[1].count = contactData.followers.length
  contactTabs[2].count = contactData.following.length
}

// 更新在线状态
const updateOnlineStatus = async (userIds) => {
  try {
    console.log('批量获取在线状态 - 用户ID列表:', userIds)
    const response = await UserApi.getBatchOnlineStatus(userIds)
    console.log('批量获取在线状态 - API响应:', response)
    const statusList = response.status_list || []
    
    // 更新当前tab的用户在线状态
    contactData[activeTab.value].forEach(user => {
      const status = statusList.find(s => s.user_id === user.id)
      if (status) {
        user.isOnline = status.is_online
        // 处理最后在线时间，如果为0则使用当前时间减去随机时间作为默认值
        user.lastSeen = status.last_online_time
        
        console.log(`用户 ${user.nickname} (${user.id}) - 在线状态: ${status.is_online}, 最后在线时间: ${status.last_online_time}, 处理后时间: ${user.lastSeen}`)
      }
    })
  } catch (error) {
    console.error('获取在线状态失败:', error)
  }
}

// 处理tab切换
const handleTabChange = throttle(async (tabName) => {
  if (activeTab.value === tabName) return
  
  activeTab.value = tabName
  // 清空搜索
  searchInput.value = ''
  isSearching.value = false
  searchResults.value = []
  
  // 如果该tab还没有数据，则加载
  if (contactData[tabName].length === 0) {
    await loadContacts(tabName, true)
  }
}, 300)

// 搜索功能
const handleSearch = debounce(async (value) => {
  const keyword = value.trim()
  
  if (!keyword) {
    isSearching.value = false
    searchResults.value = []
    return
  }
  
  isSearching.value = true
  
  try {
    const response = await UserApi.searchUsers({
      keyword: keyword,
      page: 1,
      page_size: 50
    })
    
    const users = response.list || []
    searchResults.value = users.map(user => ({
      id: user.open_id,
      nickname: user.nickname || '未设置昵称',
      avatar: user.avatar && user.avatar.length > 0 ? user.avatar[0].url : User,
      gender: user.gender === 1 ? 'male' : user.gender === 2 ? 'female' : 'unknown',
      signature: user.introduction || '这个人很懒，什么都没留下',
      location: user.location || '未知',
      relationship: user.relationship,
      isOnline: false,
      lastSeen: 0 // 初始值为0，稍后通过在线状态API更新
    }))
    
    // 获取搜索结果的在线状态
    if (searchResults.value.length > 0) {
      await updateSearchOnlineStatus()
    }
  } catch (error) {
    console.error('搜索失败:', error)
    searchResults.value = []
  }
}, 500)

// 更新搜索结果的在线状态
const updateSearchOnlineStatus = async () => {
  try {
    const userIds = searchResults.value.map(u => u.id)
    const response = await UserApi.getBatchOnlineStatus(userIds)
    const statusList = response.status_list || []
    
    searchResults.value.forEach(user => {
      const status = statusList.find(s => s.user_id === user.id)
      if (status) {
        user.isOnline = status.is_online
        // 处理最后在线时间，如果为0则使用当前时间减去随机时间作为默认值
        user.lastSeen = status.last_online_time
      }
    })
  } catch (error) {
    console.error('获取搜索结果在线状态失败:', error)
  }
}

// 监听搜索输入
const onSearchInput = (e) => {
  console.debug('搜索输入: ', e)
  searchInput.value = e.detail.value
  handleSearch(e.detail.value)
}

// 清空搜索
const clearSearch = () => {
  searchInput.value = ''
  isSearching.value = false
  searchResults.value = []
}

// 处理用户操作
const handleUserAction = throttle(async (user, action) => {
  try {
    switch (action) {
      case 'follow':
        await UserApi.followUser(user.id)
        user.relationship = user.relationship === 0 ? 2 : 1
        toast.show('已关注')
        break
      case 'unfollow':
        await UserApi.unfollowUser(user.id)
        user.relationship = user.relationship === 2 ? 0 : 0
        toast.show('已取消关注')
        break
      case 'message':
        router.push({
          name: 'private_chat',
          params: { id: user.id }
        })
        break
    }
  } catch (error) {
    console.error('操作失败:', error)
    toast.show('操作失败，请重试')
  }
}, 1000)

// 查看用户资料
const viewUserProfile = throttle((userId) => {
  router.push({
    name: 'other_index',
    params: { id: userId }
  })
}, 1000)

// 获取在线状态文本
const getOnlineStatus = (user) => {
  if (user.isOnline) {
    return '在线'
  } else if (user.lastSeen && user.lastSeen > 0) {
    const diff = Date.now() - user.lastSeen
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) {
      return '刚刚在线'
    } else if (minutes < 60) {
      return `${minutes}分钟前在线`
    } else if (hours < 24) {
      return `${hours}小时前在线`
    } else {
      return `${days}天前在线`
    }
  } else {
    return '很久未上线'
  }
}

// 获取关系状态文本和样式
const getRelationshipInfo = (user, tabType) => {
  switch (tabType) {
    case 'friends':
      return {
        text: '取关',
        type: 'secondary',
        action: 'unfollow'
      }
    case 'followers':
      return user.relationship === 2 ? {
        text: '已关注',
        type: 'success',
        action: 'unfollow'
      } : {
        text: '回关',
        type: 'primary',
        action: 'follow'
      }
    case 'following':
      return {
        text: '取关',
        type: 'secondary',
        action: 'unfollow'
      }
    default:
      return {
        text: '关注',
        type: 'primary',
        action: 'follow'
      }
  }
}

// 加载更多
const loadMore = async () => {
  if (!pagination[activeTab.value].hasMore || loading.value) return
  await loadContacts(activeTab.value, false)
}

onMounted(async () => {
  console.log('通讯录页面加载完成')
  // 默认加载好友列表
  await loadContacts('friends', true)
})

// 监听页面显示
onLoad(async (params)=>{
  if (params.type) {  // type: fans/follow
    if (params.type === 'fans') {
      await handleTabChange('followers');
      // Ensure data is loaded if not already present by handleTabChange
      if (contactData.followers.length === 0) {
        await loadContacts('followers', true);
      }
    } else if (params.type === 'follow') {
      await handleTabChange('following');
      // Ensure data is loaded if not already present by handleTabChange
      if (contactData.following.length === 0) {
        await loadContacts('following', true);
      }
    }
  } else {
    // Default behavior if no type parameter is provided
    // Or if you want to ensure friends list is loaded if no specific tab is requested via params
    if (activeTab.value === 'friends' && contactData.friends.length === 0) {
        await loadContacts('friends', true);
    }
  }
})

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-34rpx font-bold">通讯录</text>
    </template>
    
    <view class="contact-container">
      <!-- 搜索框 -->
      <view class="search-container">
        <view class="search-box">
          <WdIcon name="search" size="32rpx" color="#999" />
          <input 
            v-model="searchInput"
            class="search-input"
            placeholder="搜索好友"
            placeholder-class="search-placeholder"
            @input="onSearchInput"
          />
          <view v-if="searchInput" class="clear-btn" @tap="clearSearch">
            <WdIcon name="close" size="28rpx" color="#ccc" />
          </view>
        </view>
      </view>
      
      <!-- 搜索提示 -->
      <view v-if="isSearching && searchInput" class="search-tip">
        <text class="search-tip-text">搜索"{{ searchInput }}"，找到 {{ searchResults.length }} 个结果</text>
      </view>
      
      <!-- Tab导航 -->
      <view v-if="!isSearching" class="tab-container">
        <view 
          v-for="tab in contactTabs" 
          :key="tab.name"
          :class="['tab-item', { 'active': activeTab === tab.name }]"
          @tap="handleTabChange(tab.name)"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view v-if="tab.count > 0" class="tab-count">{{ tab.count }}</view>
        </view>
      </view>
      
      <!-- 用户列表 -->
      <scroll-view class="user-list" scroll-y @scrolltolower="loadMore">
        <view class="user-list-content">
          <!-- 加载中状态 -->
          <view v-if="loading && currentUsers.length === 0" class="loading-state">
            <view class="loading-icon">
              <WdIcon name="loader" size="60rpx" color="#999" />
            </view>
            <text class="loading-text">加载中...</text>
          </view>
          
          <!-- 空状态 -->
          <view v-else-if="currentUsers.length === 0" class="empty-state">
            <view class="empty-icon">
              <WdIcon 
                :name="isSearching ? 'search' : 'users'" 
                size="80rpx" 
                color="#ddd" 
              />
            </view>
            <text class="empty-text">
              {{ isSearching ? '没有找到相关用户' : '暂无数据' }}
            </text>
          </view>
          
          <!-- 用户项 -->
          <view 
            v-for="user in currentUsers" 
            :key="user.id"
            class="user-item"
            @tap="viewUserProfile(user.id)"
          >
            <!-- 用户信息 -->
            <view class="user-info">
              <!-- 头像区域 -->
              <view class="avatar-container">
                <image 
                  :src="user.avatar || User" 
                  class="user-avatar"
                  mode="aspectFill"
                />
                <!-- 在线状态指示器 -->
                <view v-if="user.isOnline" class="online-indicator"></view>
                <!-- 性别标识 -->
                <view 
                  v-if="user.gender !== 'unknown'" 
                  :class="['gender-indicator', user.gender === 'male' ? 'male' : 'female']"
                >
                  <WdIcon 
                    :name="user.gender === 'male' ? 'gender-male' : 'gender-female'" 
                    size="20rpx"
                    :color="user.gender === 'male' ? '#3b82f6' : '#ec4899'"
                  />
                </view>
              </view>
              
              <!-- 用户详情 -->
              <view class="user-details">
                <view class="user-main">
                  <text class="user-nickname">{{ user.nickname }}</text>
                  <text class="user-location">{{ user.location }}</text>
                </view>
                <text class="user-signature">{{ user.signature }}</text>
                <text class="user-status">{{ getOnlineStatus(user) }}</text>
              </view>
            </view>
            
            <!-- 操作按钮 -->
            <view class="user-actions">
              <!-- 发消息按钮 -->
              <view 
                class="action-btn message-btn"
                @tap.stop="handleUserAction(user, 'message')"
              >
                <WdIcon name="chat1" size="32rpx" color="#666" />
              </view>
              
              <!-- 关注/取关按钮 -->
              <view 
                :class="['action-btn', 'follow-btn', getRelationshipInfo(user, activeTab).type]"
                @tap.stop="handleUserAction(user, getRelationshipInfo(user, activeTab).action)"
              >
                <text class="follow-text">{{ getRelationshipInfo(user, activeTab).text }}</text>
              </view>
            </view>
          </view>
          
          <!-- 加载更多提示 -->
          <view v-if="loading && currentUsers.length > 0" class="loading-more">
            <text class="loading-more-text">加载中...</text>
          </view>
          
          <!-- 没有更多数据提示 -->
          <view v-if="!pagination[activeTab].hasMore && currentUsers.length > 0 && !isSearching" class="no-more">
            <text class="no-more-text">没有更多了</text>
          </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="bottom-safe-area"></view>
      </scroll-view>
    </view>
  </Layout>
</template>

<style lang="scss" scoped>
.contact-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180rpx);
  background-color: #f8f9fa;
}

// 搜索框样式
.search-container {
  padding: 20rpx 30rpx;
  background: #fff;
  border-bottom: 2rpx solid #f0f0f0;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 50rpx;
  padding: 16rpx 24rpx;
  transition: all 0.3s ease;
  
  &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 2rpx rgba(24, 144, 255, 0.3);
  }
}

.search-input {
  flex: 1;
  margin: 0 16rpx;
  font-size: 28rpx;
  background: transparent;
  border: none;
  outline: none;
}

.search-placeholder {
  color: #999;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  
  &:active {
    background: rgba(0, 0, 0, 0.2);
    transform: scale(0.95);
  }
}

// 搜索提示
.search-tip {
  padding: 16rpx 30rpx;
  background: #fff;
  border-bottom: 2rpx solid #f0f0f0;
}

.search-tip-text {
  font-size: 24rpx;
  color: #666;
}

// Tab导航样式
.tab-container {
  display: flex;
  background: #fff;
  border-bottom: 2rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24rpx 16rpx;
  position: relative;
  transition: all 0.3s ease;
  
  &.active {
    .tab-text {
      color: #1890ff;
      font-weight: 600;
    }
    
    &::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 60rpx;
      height: 4rpx;
      background: #1890ff;
      border-radius: 2rpx;
      animation: tab-underline 0.3s ease;
    }
  }
  
  &:active {
    background: rgba(24, 144, 255, 0.05);
  }
}

.tab-text {
  font-size: 28rpx;
  color: #666;
  margin-right: 8rpx;
  transition: all 0.3s ease;
}

.tab-count {
  background: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  padding: 2rpx 8rpx;
  border-radius: 10rpx;
  min-width: 20rpx;
  text-align: center;
  line-height: 1.2;
}

// 用户列表样式
.user-list {
  flex: 1;
  overflow-y: auto;
}

.user-list-content {
  padding: 0 30rpx;
}

// 加载状态样式
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.loading-icon {
  margin-bottom: 24rpx;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

// 空状态样式
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-icon {
  margin-bottom: 24rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

// 用户项样式
.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f5f5f5;
  background: #fff;
  margin-bottom: 16rpx;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.08);
  }
  
  &:last-child {
    border-bottom: none;
  }
}

.user-info {
  display: flex;
  align-items: center;
  flex: 1;
  margin-right: 16rpx;
}

// 头像容器
.avatar-container {
  position: relative;
  margin-right: 24rpx;
}

.user-avatar {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  border: 4rpx solid #fff;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.online-indicator {
  position: absolute;
  bottom: 4rpx;
  right: 4rpx;
  width: 20rpx;
  height: 20rpx;
  background: #52c41a;
  border: 3rpx solid #fff;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.gender-indicator {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid #fff;
  
  &.male {
    background: rgba(59, 130, 246, 0.1);
  }
  
  &.female {
    background: rgba(236, 72, 153, 0.1);
  }
}

// 用户详情
.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-main {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.user-nickname {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-right: 16rpx;
}

.user-location {
  font-size: 22rpx;
  color: #999;
  background: #f0f0f0;
  padding: 4rpx 8rpx;
  border-radius: 8rpx;
}

.user-signature {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 6rpx;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-status {
  font-size: 22rpx;
  color: #999;
}

// 操作按钮
.user-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50rpx;
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
  }
}

.message-btn {
  width: 72rpx;
  height: 72rpx;
  background: #f5f5f5;
  
  &:active {
    background: #e8e8e8;
  }
}

.follow-btn {
  padding: 16rpx 32rpx;
  min-width: 120rpx;
  
  &.primary {
    background: #1890ff;
    .follow-text {
      color: #fff;
    }
    
    &:active {
      background: #40a9ff;
    }
  }
  
  &.secondary {
    background: #f5f5f5;
    .follow-text {
      color: #666;
    }
    
    &:active {
      background: #e8e8e8;
    }
  }
  
  &.success {
    background: #f6ffed;
    border: 2rpx solid #52c41a;
    .follow-text {
      color: #52c41a;
    }
    
    &:active {
      background: #d9f7be;
    }
  }
}

.follow-text {
  font-size: 24rpx;
  font-weight: 500;
}

// 加载更多和无更多数据
.loading-more,
.no-more {
  display: flex;
  justify-content: center;
  padding: 30rpx;
}

.loading-more-text,
.no-more-text {
  font-size: 24rpx;
  color: #999;
}

// 底部安全区域
.bottom-safe-area {
  height: calc(120rpx + env(safe-area-inset-bottom));
}

// 动画
@keyframes tab-underline {
  0% {
    width: 0;
  }
  100% {
    width: 60rpx;
  }
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10rpx rgba(82, 196, 26, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(82, 196, 26, 0);
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 滚动条样式
::-webkit-scrollbar {
  display: none;
}
</style>