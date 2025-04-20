<script setup>
import Layout from '@/layout/index.vue'
import ActionSheetExample from '@/components/ActionSheetExample.vue'

// 页面标题
const pageTitle = '操作菜单示例'
</script>

<template>
  <layout>
    <template #center>
      <text>{{ pageTitle }}</text>
    </template>
    
    <view class="demo-container">
      <view class="section">
        <view class="section-title">ActionSheet 操作菜单示例</view>
        <view class="section-desc">点击下方按钮，调用Layout组件中的ActionSheet</view>
        
        <ActionSheetExample />
      </view>
      
      <view class="section">
        <view class="section-title">使用说明</view>
        <view class="section-content">
          <text class="text-item">1. 在子组件中通过inject('actionSheet')注入父组件提供的方法</text>
          <text class="text-item">2. 使用actionSheet.open(title, actions)方法打开操作菜单</text>
          <text class="text-item">3. actions数组中可以包含name和callback属性</text>
          <text class="text-item">4. callback会在选项被点击时自动调用</text>
        </view>
      </view>
    </view>
  </layout>
</template>

<style lang="scss" scoped>
.demo-container {
  padding: 20px;
  
  .section {
    margin-bottom: 30px;
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    &-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #333;
    }
    
    &-desc {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }
    
    &-content {
      .text-item {
        display: block;
        font-size: 14px;
        color: #666;
        line-height: 1.6;
        margin-bottom: 8px;
      }
    }
  }
}
</style>