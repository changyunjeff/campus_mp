<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  tabs: {
    type: Array,
    default: () => [
      { name: 'tab1', label: '选项一' },
      { name: 'tab2', label: '选项二' },
      { name: 'tab3', label: '选项三' }
    ]
  },
  activeTab: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:activeTab', 'change'])

const currentTab = ref(props.activeTab || props.tabs[0]?.name)

// 切换标签
const switchTab = (tab) => {
  if (currentTab.value === tab.name) return
  
  currentTab.value = tab.name
  emit('update:activeTab', tab.name)
  emit('change', tab.name)
}

// 监听activeTab属性变化
watch(() => props.activeTab, (newVal) => {
  if (newVal && newVal !== currentTab.value) {
    currentTab.value = newVal
  }
}, { immediate: true })
</script>

<template>
  <view class="tab-group-container">
    <view class="tab-group">
      <view 
        v-for="(tab, index) in tabs" 
        :key="tab.name"
        class="tab-item"
        :class="{ 'active': currentTab === tab.name }"
        @click="switchTab(tab)"
      >
        <text class="tab-label">{{ tab.label }}</text>
        <view class="tab-icon" v-if="tab.icon">
          <slot :name="`icon-${tab.name}`">
            <IconFont :name="tab.icon" size="20px" :color="currentTab === tab.name ? '#4A6572' : '#B0BEC5'" />
          </slot>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tab-group-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.tab-group {
  display: flex;
  position: relative;
  background-color: transparent;
  border-bottom: 1px solid #eee;
  padding: 0;
  margin: 0;
  overflow: visible;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24rpx 0;
  position: relative;
  transition: all 0.3s ease;
  z-index: 1;
  border-bottom: 4rpx solid transparent;
  
  &.active {
    border-bottom: 4rpx solid #ff6b6b;
    .tab-label {
      color: $uni-color-error;
      font-weight: 500;
    }
  }
}

.tab-label {
  font-size: 32rpx;
  color: #666;
  transition: all 0.3s ease;
  line-height: 1.2;
  text-align: center;
  padding: 0 8rpx;
}

.tab-icon {
  margin-top: 8rpx;
}
</style>