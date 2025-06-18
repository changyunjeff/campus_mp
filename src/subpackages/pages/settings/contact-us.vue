<script setup>
import Layout from '@/layout/index.vue'
import { ref } from 'vue'
import { useToast } from '@/composables/toast'

const toast = useToast()

// 联系方式数据
const contactMethods = [
  {
    icon: 'phone',
    title: '客服热线',
    content: '400-xxx-xxxx',
    desc: '工作时间：9:00-18:00',
    action: 'call'
  },
  {
    icon: 'message',
    title: '官方邮箱',
    content: 'support@campus-helper.com',
    desc: '我们会在24小时内回复',
    action: 'email'
  },
  {
    icon: 'wechat',
    title: '微信客服',
    content: 'campus_helper_service',
    desc: '扫码添加客服微信',
    action: 'wechat'
  },
  {
    icon: 'qq',
    title: 'QQ群',
    content: '123456789',
    desc: '加入官方用户交流群',
    action: 'qq'
  }
]

// 常见问题
const faqList = [
  {
    question: '如何完成身份认证？',
    answer: '点击"我的认证"，按照提示上传学生证或工作证等相关证明材料即可完成认证。'
  },
  {
    question: '忘记密码怎么办？',
    answer: '您可以通过绑定的手机号或邮箱找回密码，或联系客服协助处理。'
  },
  {
    question: '如何举报不当内容？',
    answer: '在相关内容页面点击举报按钮，选择举报理由并提交，我们会及时处理。'
  },
  {
    question: '如何注销账号？',
    answer: '请联系客服申请注销账号，注销后所有数据将被永久删除且无法恢复。'
  }
]

// 展开的FAQ项
const expandedFaq = ref(-1)

// 处理联系方式点击
const handleContactClick = (method) => {
  switch (method.action) {
    case 'call':
      uni.makePhoneCall({
        phoneNumber: method.content.replace(/[^0-9]/g, ''),
        fail: () => {
          toast.error('无法拨打电话')
        }
      })
      break
    case 'email':
      uni.setClipboardData({
        data: method.content,
        success: () => {
          toast.success('邮箱地址已复制到剪贴板')
        }
      })
      break
    case 'wechat':
      uni.setClipboardData({
        data: method.content,
        success: () => {
          toast.success('微信号已复制到剪贴板')
        }
      })
      break
    case 'qq':
      uni.setClipboardData({
        data: method.content,
        success: () => {
          toast.success('QQ群号已复制到剪贴板')
        }
      })
      break
  }
}

// 切换FAQ展开状态
const toggleFaq = (index) => {
  expandedFaq.value = expandedFaq.value === index ? -1 : index
}

</script>

<template>
  <Layout>
    <template #center>
      <text class="text-32rpx font-bold text-gray-800">联系我们</text>
    </template>
    
    <view class="contact-container min-h-screen bg-gray-50">
      <scroll-view class="scroll-container" scroll-y>
        
        <!-- 联系方式 -->
        <view class="contact-methods p-30rpx">
          <view class="section-title mb-32rpx">
            <text class="text-32rpx font-bold text-gray-800">联系方式</text>
          </view>
          
          <view class="methods-grid space-y-16rpx">
            <view 
              v-for="method in contactMethods"
              :key="method.action"
              class="method-item bg-white rounded-16rpx p-32rpx flex items-center transition-all duration-300 active:scale-98 shadow-sm"
              @tap="handleContactClick(method)"
            >
              <!-- 图标 -->
              <view class="method-icon w-88rpx h-88rpx rounded-16rpx bg-blue-50 flex items-center justify-center mr-24rpx">
                <WdIcon :name="method.icon" size="44rpx" color="#4dabf7" />
              </view>
              
              <!-- 内容 -->
              <view class="method-content flex-1">
                <text class="method-title text-30rpx font-semibold text-gray-800 mb-8rpx block">
                  {{ method.title }}
                </text>
                <text class="method-detail text-26rpx text-blue-600 mb-8rpx block font-medium">
                  {{ method.content }}
                </text>
                <text class="method-desc text-24rpx text-gray-500">
                  {{ method.desc }}
                </text>
              </view>
              
              <!-- 箭头 -->
              <view class="method-arrow">
                <WdIcon name="arrow-right" size="32rpx" color="#ccc" />
              </view>
            </view>
          </view>
        </view>
        
        <!-- 常见问题 -->
        <view class="faq-section p-30rpx pt-0">
          <view class="section-title mb-32rpx">
            <text class="text-32rpx font-bold text-gray-800">常见问题</text>
          </view>
          
          <view class="faq-list space-y-16rpx">
            <view 
              v-for="(faq, index) in faqList"
              :key="index"
              class="faq-item bg-white rounded-16rpx overflow-hidden shadow-sm"
            >
              <!-- 问题 -->
              <view 
                class="faq-question p-32rpx flex items-center justify-between transition-all duration-200 active:bg-gray-50"
                @tap="toggleFaq(index)"
              >
                <text class="question-text text-28rpx font-medium text-gray-800 flex-1 pr-16rpx">
                  {{ faq.question }}
                </text>
                <view 
                  class="question-arrow transition-all duration-300"
                  :class="{ 'rotate-90': expandedFaq === index }"
                >
                  <WdIcon name="arrow-right" size="32rpx" color="#666" />
                </view>
              </view>
              
              <!-- 答案 -->
              <view 
                class="faq-answer transition-all duration-300 overflow-hidden"
                :class="expandedFaq === index ? 'max-h-200rpx opacity-100' : 'max-h-0 opacity-0'"
              >
                <view class="answer-content px-32rpx pb-32rpx">
                  <text class="answer-text text-26rpx text-gray-600 leading-relaxed">
                    {{ faq.answer }}
                  </text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <!-- 意见反馈 -->
        <view class="feedback-section p-30rpx pt-0">
          <view class="section-title mb-32rpx">
            <text class="text-32rpx font-bold text-gray-800">意见反馈</text>
          </view>
          
          <view class="feedback-card bg-white rounded-16rpx p-40rpx text-center shadow-sm">
            <view class="feedback-icon mb-24rpx">
              <WdIcon name="mail" size="80rpx" color="#4dabf7" />
            </view>
            <text class="feedback-title text-30rpx font-semibold text-gray-800 mb-16rpx block">
              帮助我们改进
            </text>
            <text class="feedback-desc text-26rpx text-gray-600 leading-relaxed mb-32rpx block">
              您的宝贵意见是我们持续改进的动力，请告诉我们您的想法和建议
            </text>
            <view 
              class="feedback-btn bg-blue-500 text-white py-24rpx px-48rpx rounded-full text-28rpx font-medium transition-all duration-200 active:bg-blue-600 active:scale-95 inline-block"
              @tap="handleContactClick(contactMethods[1])"
            >
              发送反馈
            </view>
          </view>
        </view>
        
        <!-- 版本信息 -->
        <view class="version-section p-30rpx pt-0 pb-60rpx">
          <view class="version-card bg-white rounded-16rpx p-32rpx text-center shadow-sm">
            <text class="version-title text-28rpx font-medium text-gray-700 mb-8rpx block">
              校园助手
            </text>
            <text class="version-number text-24rpx text-gray-500">
              版本 1.0.0
            </text>
          </view>
        </view>
      </scroll-view>
    </view>
  </Layout>
</template>

<style lang="scss" scoped>
.contact-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 180rpx);
}

.scroll-container {
  flex: 1;
  overflow-y: auto;
}

.section-title {
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: -16rpx;
    top: 50%;
    transform: translateY(-50%);
    width: 6rpx;
    height: 32rpx;
    background: linear-gradient(to bottom, #ff7875, #ff4d4f);
    border-radius: 3rpx;
  }
}

.method-item {
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.98);
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  }
}

.method-icon {
  transition: all 0.3s ease;
}

.method-item:active .method-icon {
  transform: scale(1.1);
}

.method-arrow {
  opacity: 0.6;
  transition: all 0.3s ease;
}

.method-item:hover .method-arrow {
  opacity: 1;
  transform: translateX(4rpx);
}

.faq-item {
  border: 2rpx solid transparent;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: rgba(77, 171, 247, 0.2);
  }
}

.question-arrow {
  transition: all 0.3s ease;
  
  &.rotate-90 {
    transform: rotate(90deg);
  }
}

.faq-answer {
  transition: all 0.3s ease;
  
  &.max-h-0 {
    max-height: 0;
  }
  
  &.max-h-200rpx {
    max-height: 200rpx;
  }
}

.feedback-btn,
.method-item {
  &:active {
    transform: scale(0.98);
  }
}

// 阴影样式
.shadow-sm {
  box-shadow: 0 1rpx 2rpx 0 rgba(0, 0, 0, 0.05);
}
</style> 