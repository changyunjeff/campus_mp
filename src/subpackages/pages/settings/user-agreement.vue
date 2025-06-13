<script setup>
import Layout from '@/layout/index.vue'

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-32rpx font-bold text-gray-800">用户协议</text>
    </template>
    
    <view class="agreement-container min-h-screen bg-gray-50 p-30rpx">
      <view class="agreement-content bg-white rounded-16rpx p-40rpx">
        <view class="agreement-title text-center mb-40rpx">
          <text class="text-36rpx font-bold text-gray-800">校园助手用户协议</text>
          <text class="block text-24rpx text-gray-500 mt-16rpx">生效日期：2024年1月1日</text>
        </view>
        
        <view class="agreement-text text-28rpx text-gray-700 leading-loose space-y-32rpx">
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第一条 协议的确认和接纳</text>
            <text class="section-content">欢迎使用校园助手！校园助手用户协议（以下简称"本协议"）是您与校园助手之间就校园助手软件服务所订立的相关权利义务规范。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第二条 服务描述</text>
            <text class="section-content">校园助手是一款为校园用户提供社交、学习、生活服务的应用程序，包括但不限于：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 校园社区交流</text>
              <text class="list-item block mb-8rpx">• 二手物品交易</text>
              <text class="list-item block mb-8rpx">• 学习资源分享</text>
              <text class="list-item block mb-8rpx">• 校园活动信息</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第三条 用户账号</text>
            <text class="section-content">用户在使用本服务前需要注册一个账号。用户应当使用真实、准确、完整的信息注册账号，并对账号信息的真实性、准确性和完整性承担责任。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第四条 用户行为规范</text>
            <text class="section-content">用户在使用本服务时，应当遵守相关法律法规，不得从事以下行为：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 发布违法、不良信息</text>
              <text class="list-item block mb-8rpx">• 侵犯他人合法权益</text>
              <text class="list-item block mb-8rpx">• 干扰平台正常运营</text>
              <text class="list-item block mb-8rpx">• 进行商业欺诈行为</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第五条 隐私保护</text>
            <text class="section-content">我们重视用户隐私保护，具体隐私政策请参见《校园助手隐私政策》。我们承诺按照相关隐私政策保护用户个人信息。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第六条 免责声明</text>
            <text class="section-content">用户明确同意其使用本服务所存在的风险将完全由其自己承担。校园助手不对因使用或无法使用本服务所产生的任何直接、间接、附带或衍生性损失承担责任。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">第七条 协议修改</text>
            <text class="section-content">校园助手有权在必要时修改本协议。协议修改后，将在应用程序中公布修改后的协议。如果不同意修改后的协议，用户有权停止使用本服务。</text>
          </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="bottom-safe-area h-80rpx"></view>
      </view>
    </view>
  </Layout>
</template>

<style lang="scss" scoped>
.agreement-container {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.agreement-content {
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.section {
  margin-bottom: 32rpx;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -20rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 6rpx;
    height: 32rpx;
    background: linear-gradient(to bottom, #4dabf7, #339af0);
    border-radius: 3rpx;
  }
}

.list-item {
  position: relative;
  color: #666;
}
</style> 