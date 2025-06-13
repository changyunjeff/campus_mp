<template>
  <view class="choose-school-container">
    <!-- 背景装饰 -->
    <view class="background-decoration">
      <view class="decoration-circle decoration-circle-1"></view>
      <view class="decoration-circle decoration-circle-2"></view>
    </view>
    
    <!-- 头部logo和标题 -->
    <view class="header-section" :class="{ 'header-animate': showContent }">
      <image class="logo" src="/static/logo.webp" mode="aspectFit" />
      <text class="main-title">选择您的学校</text>
      <text class="sub-title">为您提供专属的校园服务体验</text>
    </view>
    
    <!-- 学校列表 -->
    <view class="schools-section" :class="{ 'schools-animate': showContent }">
      <view 
        v-for="(school, index) in availableSchools" 
        :key="school.id"
        class="school-card"
        :class="{ 
          'school-selected': selectedSchoolId === school.id,
          'card-animate': showContent
        }"
        :style="{ 'animation-delay': `${index * 0.1 + 0.3}s` }"
        @tap="handleSchoolSelect(school)"
      >
        <!-- 学校图标 -->
        <view class="school-icon" :style="{ backgroundColor: school.color + '1A' }">
          <view class="icon-placeholder" :style="{ backgroundColor: school.color }">
            <text class="icon-text">{{ school.shortName }}</text>
          </view>
        </view>
        
        <!-- 学校信息 -->
        <view class="school-info">
          <text class="school-name">{{ school.name }}</text>
          <text class="school-desc">{{ school.description }}</text>
        </view>
        
        <!-- 选中状态 -->
        <view class="selection-indicator" v-if="selectedSchoolId === school.id">
          <WdIcon name="check" size="20" color="#fff" />
        </view>
      </view>
    </view>
    
    <!-- 确认按钮 -->
    <view class="button-section" :class="{ 'button-animate': showContent }">
      <button 
        class="confirm-button"
        :class="{ 
          'button-enabled': selectedSchoolId,
          'button-loading': isConfirming
        }"
        :disabled="!selectedSchoolId || isConfirming"
        :loading="isConfirming"
        @tap="handleConfirm"
      >
        {{ isConfirming ? '正在确认...' : '确认选择' }}
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'uni-mini-router'
import { useSchoolStore } from '@/pinia/modules/school'
import { useToast } from '@/composables/toast'
import { getSchoolById } from '@/configs/school.config.js'
import { sleep } from '@/utils/time'

const router = useRouter()
const schoolStore = useSchoolStore()
const toast = useToast()

// 页面状态
const showContent = ref(false)
const selectedSchoolId = ref('')
const isConfirming = ref(false)

// 计算属性
const availableSchools = computed(() => schoolStore.availableSchools)

// 处理学校选择
const handleSchoolSelect = (school) => {
  if (!school) return
  
  selectedSchoolId.value = school.id
  
  // 振动反馈
  uni.vibrateShort({
    type: 'light'
  })
  
  console.log('🏫 选择学校:', school.name)
}

// 处理确认选择
const handleConfirm = async () => {
  if (!selectedSchoolId.value || isConfirming.value) return
  
  isConfirming.value = true
  
  try {
    // 保存学校选择
    const success = schoolStore.selectSchool(selectedSchoolId.value)
    
    if (success) {
      const selectedSchool = getSchoolById(selectedSchoolId.value)
      
      // 显示成功提示
      toast.success(`已选择 ${selectedSchool.name}`)
      
      // 等待动画完成
      await sleep(800)
      
      // 跳转到欢迎页面进行登录
      router.replace({
        path: '/pages/welcome'
      })
    } else {
      toast.error('选择失败，请重试')
    }
  } catch (error) {
    console.error('学校选择失败:', error)
    toast.error('选择失败，请重试')
  } finally {
    isConfirming.value = false
  }
}

// 页面初始化
onMounted(async () => {
  console.log('🎓 学校选择页面初始化')
  
  // 加载本地学校选择数据
  schoolStore.loadFromStorage()
  
  // 如果已经有选择，预设为当前选择
  if (schoolStore.selectedSchoolId) {
    selectedSchoolId.value = schoolStore.selectedSchoolId
    
    // 如果已经选择过学校，直接跳转到欢迎页面
    // if (!schoolStore.needsSchoolSelection) {
    //   console.log('✅ 已有学校选择，直接跳转到欢迎页面')
    //   router.replace({
    //     path: '/pages/welcome'
    //   })
    //   return
    // }
  }
  
  // 启动动画
  await sleep(500)
  showContent.value = true
})
</script>

<style lang="scss" scoped>
.choose-school-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 40rpx 40rpx;
  background: linear-gradient(
    135deg,
    #FFB6C1 0%,    /* 浅玫瑰粉 */
    #FFC0CB 50%,   /* 粉红色 */
    #FFE4E1 100%   /* 浅薄雾玫瑰色 */
  );
  overflow: hidden;
  
  // 添加动态背景效果
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 60%
    );
    animation: rotateBackground 20s linear infinite;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(0, 0, 0, 0.3) 100%
    );
    pointer-events: none;
  }
}

// 背景装饰
.background-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  
  .decoration-circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    
    &.decoration-circle-1 {
      width: 400rpx;
      height: 400rpx;
      top: -200rpx;
      right: -200rpx;
      animation: float 6s ease-in-out infinite;
    }
    
    &.decoration-circle-2 {
      width: 300rpx;
      height: 300rpx;
      bottom: -150rpx;
      left: -150rpx;
      animation: float 8s ease-in-out infinite reverse;
    }
  }
}

// 头部区域
.header-section {
  text-align: center;
  margin-bottom: 80rpx;
  opacity: 0;
  transform: translateY(60rpx);
  z-index: 1;
  
  &.header-animate {
    animation: slideInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  .logo {
    width: 150rpx;
    height: 150rpx;
    margin-bottom: 40rpx;
    filter: drop-shadow(0 8rpx 16rpx rgba(0, 0, 0, 0.2));
  }
  
  .main-title {
    display: block;
    font-size: 48rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 16rpx;
    text-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.2);
  }
  
  .sub-title {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  }
}

// 学校列表区域
.schools-section {
  width: 100%;
  max-width: 600rpx;
  margin-bottom: 60rpx;
  opacity: 0;
  z-index: 1;
  
  &.schools-animate {
    animation: fadeIn 0.6s ease forwards 0.2s;
  }
}

.school-card {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 
    0 8rpx 24rpx rgba(255, 182, 193, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateX(-60rpx);
  
  &.card-animate {
    animation: slideInLeft 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &.school-selected {
    background: rgba(255, 255, 255, 0.25);
    border: 2rpx solid rgba(255, 255, 255, 0.4);
    box-shadow: 
      0 12rpx 32rpx rgba(255, 182, 193, 0.4),
      inset 0 0 0 1px rgba(255, 255, 255, 0.3);
  }
  
  .school-icon {
    width: 100rpx;
    height: 100rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 24rpx;
    
    .icon-placeholder {
      width: 60rpx;
      height: 60rpx;
      border-radius: 12rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .icon-text {
        color: #fff;
        font-size: 24rpx;
        font-weight: 600;
      }
    }
  }
  
  .school-info {
    flex: 1;
    
    .school-name {
      display: block;
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    }
    
    .school-desc {
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.4;
      text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
    }
  }
  
  .selection-indicator {
    width: 60rpx;
    height: 60rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow: 0 4rpx 12rpx rgba(102, 126, 234, 0.3);
  }
}

// 按钮区域
.button-section {
  width: 100%;
  max-width: 600rpx;
  opacity: 0;
  z-index: 1;
  
  &.button-animate {
    animation: fadeIn 0.6s ease forwards 0.6s;
  }
}

.confirm-button {
  width: 100%;
  height: 96rpx;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  color: white;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 
    0 8rpx 24rpx rgba(255, 182, 193, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  &.button-enabled {
    background: linear-gradient(135deg, #667eea, #764ba2);
    box-shadow: 0 8rpx 24rpx rgba(102, 126, 234, 0.4);
    
    &:active {
      transform: scale(0.98);
    }
    
    &::before {
      opacity: 1;
    }
  }
  
  &[disabled] {
    opacity: 0.6;
  }
}

// 动画定义
@keyframes rotateBackground {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20rpx);
  }
}

@keyframes slideInUp {
  0% {
    opacity: 0;
    transform: translateY(60rpx);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInLeft {
  0% {
    opacity: 0;
    transform: translateX(-60rpx);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeIn {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes scaleIn {
  0% {
    transform: scale(0);
  }
  100% {
    transform: scale(1);
  }
}
</style> 