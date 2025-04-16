<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 按钮宽度，可以是数字或字符串
  width: {
    type: [Number, String],
    default: 'auto'
  },
  // 按钮高度，可以是数字或字符串
  height: {
    type: [Number, String],
    default: 'auto'
  },
  // 按钮类型：primary, secondary, outline
  type: {
    type: String,
    default: 'primary'
  },
  // 是否禁用
  disabled: {
    type: Boolean,
    default: false
  },
  // 按钮大小：small, medium, large
  size: {
    type: String,
    default: 'medium'
  },
  // 自定义类名
  customClass: {
    type: String,
    default: ''
  }
});

// 计算按钮样式
const buttonStyle = computed(() => {
  const style = {};
  
  // 处理宽度
  if (props.width !== 'auto') {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  
  // 处理高度
  if (props.height !== 'auto') {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  
  return style;
});

// 计算按钮类名
const buttonClass = computed(() => {
  const classes = ['ghibli-button'];
  
  // 添加类型类名
  classes.push(`ghibli-button--${props.type}`);
  
  // 添加大小类名
  classes.push(`ghibli-button--${props.size}`);
  
  // 添加禁用类名
  if (props.disabled) {
    classes.push('ghibli-button--disabled');
  }
  
  // 添加自定义类名
  if (props.customClass) {
    classes.push(props.customClass);
  }
  
  return classes.join(' ');
});

// 定义事件
const emit = defineEmits(['click']);

const handleClick = (event) => {
  if (!props.disabled) {
    emit('click', event);
  }
};
</script>

<template>
  <button 
    :class="buttonClass" 
    :style="buttonStyle"
    :disabled="disabled"
    @click="handleClick"
  >
    <div class="ghibli-button__content">
      <slot></slot>
    </div>
    <div class="ghibli-button__decoration"></div>
  </button>
</template>

<style scoped lang="scss">
.ghibli-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s ease;
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Arial Rounded MT Bold', 'Arial', sans-serif;
  
  // 自然风格的阴影
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1), 
              0 2px 4px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15),
                0 3px 6px rgba(0, 0, 0, 0.1);
    
    &::before {
      opacity: 0.6;
    }
    
    .ghibli-button__decoration {
      transform: translateY(0);
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  // 按钮内容
  &__content {
    position: relative;
    z-index: 2;
  }
  
  // 装饰元素 - 宫崎骏风格的云朵或波浪效果
  &__decoration {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 6px;
    background: linear-gradient(90deg, 
                rgba(255, 255, 255, 0.7) 0%, 
                rgba(255, 255, 255, 0.3) 50%, 
                rgba(255, 255, 255, 0.7) 100%);
    opacity: 0.5;
    transform: translateY(6px);
    transition: all 0.3s ease;
    border-radius: 0 0 24px 24px;
  }
  
  // 主要按钮样式
  &--primary {
    background: linear-gradient(135deg, #4aaee8 0%, #2c88c9 100%);
    color: white;
    padding: 12px 24px;
  }
  
  // 次要按钮样式
  &--secondary {
    background: linear-gradient(135deg, #f5b461 0%, #e67e22 100%);
    color: white;
    padding: 12px 24px;
  }
  
  // 轮廓按钮样式
  &--outline {
    background: transparent;
    color: #4aaee8;
    border: 2px solid #4aaee8;
    padding: 10px 22px;
    
    .ghibli-button__decoration {
      background: linear-gradient(90deg, 
                  rgba(74, 174, 232, 0.7) 0%, 
                  rgba(74, 174, 232, 0.3) 50%, 
                  rgba(74, 174, 232, 0.7) 100%);
    }
  }
  
  // 按钮大小
  &--small {
    font-size: 14px;
    padding: 8px 16px;
  }
  
  &--medium {
    font-size: 16px;
    // 默认大小，padding已在类型样式中定义
  }
  
  &--large {
    font-size: 18px;
    padding: 16px 32px;
  }
  
  // 禁用状态
  &--disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
    box-shadow: none;
  }
}
</style>