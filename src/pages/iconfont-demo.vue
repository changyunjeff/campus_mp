<script setup>
import { ref } from 'vue';
import IconFont from '../components/IconFont.vue';

// 示例图标列表
const iconList = ref([
  { name: 'home', color: '#4aaee8' },
  { name: 'user', color: '#e67e22' },
  { name: 'setting', color: '#27ae60' },
  { name: 'search', color: '#8e44ad' },
  { name: 'like', color: '#e74c3c' },
  { name: 'star', color: '#f1c40f' },
]);

// 示例大小列表
const sizeList = ref(['16px', '24px', '32px', '40px']);

// 处理图标点击
const handleIconClick = (iconName) => {
  uni.showToast({
    title: `点击了${iconName}图标`,
    icon: 'none'
  });
};
</script>

<template>
  <view class="container">
    <view class="header">
      <text class="title">IconFont 图标组件</text>
      <text class="subtitle">基于阿里巴巴iconfont的图标组件</text>
    </view>
    
    <view class="section">
      <text class="section-title">基础用法</text>
      <view class="icon-row">
        <view v-for="icon in iconList" :key="icon.name" class="icon-item">
          <IconFont 
            :name="icon.name" 
            :color="icon.color"
            size="32px"
            bind:tap="handleIconClick(icon.name)"
          />
          <text class="icon-name">{{ icon.name }}</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">不同尺寸</text>
      <view class="size-row">
        <view v-for="size in sizeList" :key="size" class="size-item">
          <IconFont name="star" color="#f1c40f" :size="size" />
          <text class="size-label">{{ size }}</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">禁用状态</text>
      <view class="demo-row">
        <view class="demo-item">
          <IconFont name="setting" color="#27ae60" size="32px" />
          <text class="demo-label">正常</text>
        </view>
        <view class="demo-item">
          <IconFont name="setting" color="#27ae60" size="32px" disabled />
          <text class="demo-label">禁用</text>
        </view>
      </view>
    </view>
    
    <view class="section">
      <text class="section-title">使用说明</text>
      <view class="code-block">
        <text class="code-line">// 引入组件</text>
        <text class="code-line">import IconFont from '../components/IconFont.vue';</text>
        <text class="code-line"></text>
        <text class="code-line">// 基础用法</text>
        <text class="code-line">&lt;IconFont name="home" /&gt;</text>
        <text class="code-line"></text>
        <text class="code-line">// 自定义颜色和大小</text>
        <text class="code-line">&lt;IconFont name="star" color="#f1c40f" size="32px" /&gt;</text>
        <text class="code-line"></text>
        <text class="code-line">// 禁用状态</text>
        <text class="code-line">&lt;IconFont name="setting" disabled /&gt;</text>
        <text class="code-line"></text>
        <text class="code-line">// 绑定点击事件</text>
        <text class="code-line">&lt;IconFont name="like" bind:tap="handleClick" /&gt;</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
  text-align: center;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  display: block;
}

.section {
  margin-bottom: 30px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #333;
  margin-bottom: 16px;
  display: block;
}

.icon-row, .size-row, .demo-row {
  display: flex;
  flex-wrap: wrap;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 33.33%;
  margin-bottom: 20px;
}

.icon-name {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 25%;
  margin-bottom: 16px;
}

.size-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.demo-row {
  justify-content: flex-start;
  gap: 40px;
}

.demo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.demo-label {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.code-block {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 16px;
  font-family: monospace;
}

.code-line {
  display: block;
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}
</style>