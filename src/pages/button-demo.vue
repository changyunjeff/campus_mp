<script setup>
import { ref } from 'vue';

const message = ref('');

function showMessage(type) {
  message.value = `你点击了${type}按钮！`;
  setTimeout(() => {
    message.value = '';
  }, 2000);
}
</script>

<template>
  <view class="container">
    <view class="title">
      <h1>宫崎骏风格按钮</h1>
      <p>轻量级、可自定义的UI组件</p>
    </view>
    
    <view class="section">
      <h2>按钮类型</h2>
      <view class="button-row">
        <Button @click="showMessage('主要')" type="primary">主要按钮</Button>
        <Button @click="showMessage('次要')" type="secondary">次要按钮</Button>
        <Button @click="showMessage('轮廓')" type="outline">轮廓按钮</Button>
      </view>
    </view>
    
    <view class="section">
      <h2>按钮大小</h2>
      <view class="button-row">
        <Button @click="showMessage('小')" size="small">小按钮</Button>
        <Button @click="showMessage('中')" size="medium">中按钮</Button>
        <Button @click="showMessage('大')" size="large">大按钮</Button>
      </view>
    </view>
    
    <view class="section">
      <h2>自定义宽高</h2>
      <view class="button-row">
        <Button @click="showMessage('宽')" width="200" type="primary">宽按钮 (200px)</Button>
        <Button @click="showMessage('高')" height="80" type="secondary">高按钮 (80px)</Button>
        <Button @click="showMessage('自定义')" width="180" height="60" type="outline">自定义尺寸 (180×60px)</Button>
      </view>
    </view>
    
    <view class="section">
      <h2>禁用状态</h2>
      <view class="button-row">
        <Button disabled type="primary">禁用主要按钮</Button>
        <Button disabled type="secondary">禁用次要按钮</Button>
        <Button disabled type="outline">禁用轮廓按钮</Button>
      </view>
    </view>
    
    <view v-if="message" class="message">
      {{ message }}
    </view>
  </view>
</template>

<style scoped lang="scss">
.container {
  padding: 20px;
  background-color: #f9f7f1;
  min-height: 100vh;
}

.title {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 24px;
    color: #4a6572;
    margin-bottom: 8px;
  }
  
  p {
    font-size: 16px;
    color: #7b8d93;
  }
}

.section {
  margin-bottom: 30px;
  
  h2 {
    font-size: 18px;
    color: #4a6572;
    margin-bottom: 16px;
    border-left: 4px solid #4aaee8;
    padding-left: 10px;
  }
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
}

.message {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 12px 24px;
  border-radius: 24px;
  font-size: 16px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, 20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
</style>