<script setup>
import Layout from '@/layout/index.vue'

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-32rpx font-bold text-gray-800">隐私政策</text>
    </template>
    
    <view class="privacy-container min-h-screen bg-gray-50 p-30rpx">
      <view class="privacy-content bg-white rounded-16rpx p-40rpx">
        <view class="privacy-title text-center mb-40rpx">
          <text class="text-36rpx font-bold text-gray-800">校园助手隐私政策</text>
          <text class="block text-24rpx text-gray-500 mt-16rpx">更新日期：2024年1月1日</text>
        </view>
        
        <view class="privacy-text text-28rpx text-gray-700 leading-loose space-y-32rpx">
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">引言</text>
            <text class="section-content">校园助手（以下简称"我们"）深知个人信息对您的重要性，并会尽全力保护您的个人信息安全可靠。我们致力于维持您对我们的信任，恪守以下原则，保护您的个人信息。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">我们收集的信息</text>
            <text class="section-content">为了给您提供更好的服务，我们可能会收集以下信息：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 基本信息：昵称、头像、性别、学校等</text>
              <text class="list-item block mb-8rpx">• 设备信息：设备型号、操作系统、唯一设备标识符等</text>
              <text class="list-item block mb-8rpx">• 位置信息：您授权的地理位置信息</text>
              <text class="list-item block mb-8rpx">• 使用记录：您在应用中的操作记录、偏好设置等</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">信息使用目的</text>
            <text class="section-content">我们收集您的个人信息主要用于以下目的：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 提供、维护和改进我们的服务</text>
              <text class="list-item block mb-8rpx">• 为您推荐相关内容和服务</text>
              <text class="list-item block mb-8rpx">• 保障账号和服务安全</text>
              <text class="list-item block mb-8rpx">• 遵守法律法规要求</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">信息共享与披露</text>
            <text class="section-content">我们不会向第三方出售、出租或以其他方式披露您的个人信息，除非：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 获得您的明确同意</text>
              <text class="list-item block mb-8rpx">• 法律法规要求或政府机关要求</text>
              <text class="list-item block mb-8rpx">• 为保护我们或他人的合法权益</text>
              <text class="list-item block mb-8rpx">• 与授权合作伙伴共享（仅限于提供服务所需）</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">信息安全</text>
            <text class="section-content">我们采用行业标准的安全措施保护您的个人信息，包括数据加密、访问控制、安全传输等技术手段，防止个人信息遭到未经授权的访问、使用或泄露。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">您的权利</text>
            <text class="section-content">您对自己的个人信息享有以下权利：</text>
            <view class="list mt-16rpx pl-32rpx">
              <text class="list-item block mb-8rpx">• 查阅权：查看我们收集的您的个人信息</text>
              <text class="list-item block mb-8rpx">• 更正权：更正不准确或不完整的个人信息</text>
              <text class="list-item block mb-8rpx">• 删除权：要求删除您的个人信息</text>
              <text class="list-item block mb-8rpx">• 撤回同意权：撤回您对个人信息处理的同意</text>
            </view>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">未成年人保护</text>
            <text class="section-content">我们非常重视对未成年人个人信息的保护。如果您是未成年人，建议您请您的监护人仔细阅读本隐私政策，并在征得您的监护人同意后使用我们的服务。</text>
          </view>
          
          <view class="section">
            <text class="section-title text-32rpx font-semibold text-gray-800 mb-16rpx block">联系我们</text>
            <text class="section-content">如果您对本隐私政策有任何疑问、意见或建议，可以通过以下方式联系我们：</text>
            <view class="contact-info mt-16rpx pl-32rpx">
              <text class="contact-item block mb-8rpx text-blue-600">邮箱：privacy@campus-helper.com</text>
              <text class="contact-item block mb-8rpx text-blue-600">电话：400-xxx-xxxx</text>
            </view>
          </view>
        </view>
        
        <!-- 底部安全区域 -->
        <view class="bottom-safe-area h-80rpx"></view>
      </view>
    </view>
  </Layout>
</template>

<style lang="scss" scoped>
.privacy-container {
  padding-bottom: calc(80rpx + env(safe-area-inset-bottom));
}

.privacy-content {
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
    background: linear-gradient(to bottom, #52c41a, #389e0d);
    border-radius: 3rpx;
  }
}

.list-item {
  position: relative;
  color: #666;
}

.contact-item {
  position: relative;
  color: #1890ff;
}
</style> 