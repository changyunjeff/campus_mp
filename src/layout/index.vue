<script setup>
</script>

<template>
<view class="app-container">
    <view class="status-bar" />

    <view class="header">
        <slot name="header"></slot>
    </view>
    
    <slot/>

    <view class="footer">
        <slot name="footer"></slot>
    </view>
</view>
</template>

<style lang="scss" scoped>
.app-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }

.status-bar {
    width: 100%;
    height: var(--status-bar-height);
    background-color: red;
}

.header {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    background-color: green;
}

.footer {
    width: 100%;
    min-height: 100rpx;
    background-color: blue;
}
</style>