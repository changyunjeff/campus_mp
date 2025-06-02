<script setup>
import { ref, computed, watch } from 'vue'
import { useTabbar } from '@/composables/tabbar.js'
import addConfig from '@/configs/add.config.js'
import { useRouter } from 'uni-mini-router'

const router = useRouter()

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const tabbar = useTabbar()
const showMenu = ref(false)
const showButtons = ref(false)

// 计算按钮布局
const buttonLayout = computed(() => {
  const total = addConfig.length
  let layout = []
  
  if (total === 2) {
    // 2个按钮左右分布
    layout = [2]
  } else if (total === 3) {
    // 第一行2个，第二行1个大按钮
    layout = [2, 1]
  } else if (total === 4) {
    // 第一行3个，第二行1个大按钮
    layout = [3, 1]
  } else if (total === 5) {
    // 第一行2个，第二行2个，第三行1个大按钮
    layout = [2, 2, 1]
  } else {
    // 默认布局，每行最多3个
    const fullRows = Math.floor(total / 3)
    const remainder = total % 3
    
    for (let i = 0; i < fullRows; i++) {
      layout.push(3)
    }
    
    if (remainder > 0) {
      layout.push(remainder)
    }
  }
  
  return layout
})

// 根据布局计算按钮分组
const buttonGroups = computed(() => {
  let groups = []
  let index = 0
  
  buttonLayout.value.forEach((count, rowIndex) => {
    const isLastRow = rowIndex === buttonLayout.value.length - 1
    const rowButtons = []
    
    for (let i = 0; i < count; i++) {
      if (index < addConfig.length) {
        const button = { ...addConfig[index] }
        
        // 最后一行只有一个按钮时，设置为大按钮
        if (isLastRow && count === 1) {
          button.isLarge = true
        }
        
        rowButtons.push(button)
        index++
      }
    }
    
    groups.push(rowButtons)
  })
  
  return groups
})

// 动画控制
const animateIn = () => {
  showMenu.value = true
  setTimeout(() => {
    showButtons.value = true
  }, 200)
}

const animateOut = () => {
  showButtons.value = false
  setTimeout(() => {
    showMenu.value = false
    emit('close')
  }, 300)
}

// 监听visible变化
watch(() => props.visible, (val) => {
  if (val) {
    animateIn()
  } else {
    animateOut()
  }
})

// 处理按钮点击
const handleButtonClick = (item) => {
  animateOut()
  setTimeout(() => {
    router.push({
        name: item.path
    })
  }, 400)
}

// 关闭菜单
const closeMenu = () => {
  animateOut()
  setTimeout(() => {
    tabbar.show()
  }, 300)
}
</script>

<template>
  <view v-if="showMenu" class="publish-menu" @click.stop="closeMenu">
    <view class="mask" :class="{ 'mask-show': showMenu }"></view>
    
    <view class="menu-container" :class="{ 'menu-show': showButtons }" @click.stop>
      <view class="menu-title">
        <text class="title-text">选择发布类型</text>
        <view class="close-button" @click="closeMenu">
          <text class="close-icon">×</text>
        </view>
      </view>
      
      <view class="menu-content">
        <view 
          v-for="(group, groupIndex) in buttonGroups" 
          :key="groupIndex"
          class="button-row"
        >
          <view 
            v-for="item in group" 
            :key="item.id"
            class="button-item"
            :class="{
              'button-large': item.isLarge,
              'button-highlight': item.highlight
            }"
            @click="handleButtonClick(item)"
          >
            <view class="button-inner" :style="{ backgroundImage: `url(${item.bgImage})` }">
              <view class="button-icon">
                <IconFont :name="item.icon" size="32px" color="#ffffff" />
              </view>
              <view class="button-text">
                <text class="button-title">{{ item.title }}</text>
                <text class="button-subtitle">{{ item.subtitle }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.publish-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0);
  transition: background-color 0.3s ease;
  
  &-show {
    background-color: rgba(0, 0, 0, 0.5);
  }
}

.menu-container {
  position: relative;
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 40rpx 30rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
  transform: translateY(100%);
  transition: transform 0.3s ease;
  z-index: 1001;
  
  &.menu-show {
    transform: translateY(0);
  }
}

.menu-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  
  .title-text {
    font-size: 36rpx;
    font-weight: bold;
    color: #333;
  }
  
  .close-button {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background-color: #f5f5f5;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: background-color 0.2s ease;
    
    &:active {
      background-color: #e0e0e0;
    }
    
    .close-icon {
      font-size: 40rpx;
      color: #999;
    }
  }
}

.menu-content {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
}

.button-row {
  display: flex;
  gap: 20rpx;
}

.button-item {
  flex: 1;
  height: 180rpx;
  border-radius: 20rpx;
  overflow: hidden;
  transform: translateY(50rpx);
  opacity: 0;
  animation: buttonFadeIn 0.5s forwards;
  
  &.button-large {
    height: 220rpx;
  }
  
  &.button-highlight {
    .button-inner {
      box-shadow: 0 8rpx 20rpx rgba(255, 75, 75, 0.3);
    }
    
    .button-title {
      color: #ff4b4b;
    }
  }
  
  &:active .button-inner {
    transform: scale(0.98);
  }
  
  @for $i from 1 through 10 {
    &:nth-child(#{$i}) {
      animation-delay: #{$i * 0.05 + 0.2}s;
    }
  }
}

.button-inner {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20rpx;
  transition: transform 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.6));
    z-index: 1;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(5px);
    z-index: 0;
  }
}

.button-icon {
  position: relative;
  z-index: 2;
  margin-bottom: 10rpx;
}

.button-text {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
}

.button-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #fff;
  margin-bottom: 4rpx;
}

.button-subtitle {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.8);
}

@keyframes buttonFadeIn {
  from {
    transform: translateY(50rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>