<script setup>
import { computed } from 'vue';

// 定义组件属性
const props = defineProps({
  // 图标名称，必须与iconfont中的图标名称一致
  name: {
    type: String,
    required: true
  },
  // 图标大小，可以是数字或字符串
  size: {
    type: [Number, String],
    default: '24px'
  },
  // 图标颜色
  color: {
    type: String,
    default: ''
  },
  // 是否禁用点击
  disabled: {
    type: Boolean,
    default: false
  },
  // 自定义类名
  customClass: {
    type: String,
    default: ''
  }
});

// 计算图标样式
const iconStyle = computed(() => {
  const style = {};
  
  // 处理大小
  if (props.size) {
    const sizeValue = typeof props.size === 'number' ? `${props.size}px` : props.size;
    style.fontSize = sizeValue;
  }
  
  // 处理颜色
  if (props.color) {
    style.color = props.color;
  }
  
  return style;
});

// 计算图标类名
const iconClass = computed(() => {
  const classes = ['iconfont', `icon-${props.name}`];
  
  // 添加禁用类名
  if (props.disabled) {
    classes.push('icon-disabled');
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
  <i 
    :class="iconClass" 
    :style="iconStyle"
    @tap="handleClick"
  ></i>
</template>

<style scoped>
.iconfont {
  display: inline-block;
  font-style: normal;
  line-height: 1;
  text-align: center;
  text-transform: none;
  vertical-align: middle;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  transition: all 0.3s ease;
  cursor: pointer;
}

.icon-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>