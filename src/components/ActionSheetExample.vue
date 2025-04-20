<script setup>
import { inject } from 'vue'

// 注入父组件提供的actionSheet方法
const actionSheet = inject('actionSheet')

// 示例：打开ActionSheet
const openExampleActionSheet = () => {
  // 设置ActionSheet的标题和选项
  const title = '操作选项'
  const actions = [
    { name: '选项1', callback: () => console.log('选择了选项1') },
    { name: '选项2', callback: () => console.log('选择了选项2') },
    { name: '选项3', callback: () => console.log('选择了选项3') },
  ]
  
  // 调用父组件提供的open方法打开ActionSheet
  actionSheet.open(actions, title)
}
</script>

<template>
  <view class="action-sheet-example">
    <button class="open-button" @click="openExampleActionSheet">打开操作菜单</button>
  </view>
</template>

<style lang="scss" scoped>
.action-sheet-example {
  padding: 20px;
  
  .open-button {
    background-color: #3b82f6;
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  }
}
</style>