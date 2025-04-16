<script setup>
import Layout from '@/layout/index.vue'
const { show } = useTabbar()

const activeTab = ref('recommend')

// 社区页面的tab选项
const communityTabs = [
  { name: 'recommend', label: '推荐' },
  { name: 'follow', label: '关注' },
  { name: 'nearby', label: '附近' },
  { name: 'latest', label: '最新' }
]

// 处理tab切换
const handleTabChange = (tabName) => {
  console.log('切换到标签:', tabName)
  // 这里可以根据选中的tab加载不同的内容
}

onMounted(() => {
    show()
})
</script>

<template>
    <layout>
        <custom-status-bar>
            <template #left>
                <WdIcon name="search" size="32rpx" color="#666"/>
            </template>
            <template #center>
                <tab-group 
                    :tabs="communityTabs" 
                    v-model:active-tab="activeTab"
                    @change="handleTabChange"
                />
            </template>
        </custom-status-bar>
        
        <!-- 宫崎骏风格的Tab按钮组 -->
        <view class="community-container">
            <!-- 内容区域 -->
            <view class="tab-content-area">
                <view v-if="activeTab === 'recommend'" class="content-item">
                    <view class="content-placeholder">
                        <image class="totoro-image" src="/static/totoro.svg" mode="aspectFit"></image>
                        <text class="placeholder-text">推荐内容区域</text>
                    </view>
                </view>
                <view v-else-if="activeTab === 'follow'" class="content-item">
                    <view class="content-placeholder">
                        <text class="placeholder-text">关注内容区域</text>
                    </view>
                </view>
                <view v-else-if="activeTab === 'nearby'" class="content-item">
                    <view class="content-placeholder">
                        <text class="placeholder-text">附近内容区域</text>
                    </view>
                </view>
                <view v-else-if="activeTab === 'latest'" class="content-item">
                    <view class="content-placeholder">
                        <text class="placeholder-text">最新内容区域</text>
                    </view>
                </view>
            </view>
        </view>
        
        <custom-tab-bar/>
    </layout>
</template>

<style lang="scss" scoped>
.community-container {
  padding: 10rpx 0;
  background-color: #f8f8f8;
}

.tab-content-area {
  min-height: 300rpx;
  padding: 30rpx 0;
}

.content-item {
  width: 100%;
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.totoro-image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: #90A4AE;
  text-align: center;
}
</style>