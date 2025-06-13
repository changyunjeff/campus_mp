<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useToast } from '@/composables/toast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  imagePath: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'confirm', 'reselect'])

const toast = useToast()

// 画布相关
const canvasId = 'avatar-cropper-canvas'
const canvasSize = 300 // 画布大小（正方形，单位px）
const imageInfo = ref({
  width: 0,
  height: 0,
  x: 0,
  y: 0,
  scale: 1,
  originalWidth: 0,
  originalHeight: 0
})

// 修复图片路径格式
const fixImagePath = (path) => {
  if (!path) return path
  
  // 小程序临时文件路径可能有不同格式，直接返回原始路径
  // 经测试发现 http://tmp/ 是小程序的特殊临时文件协议，不应该移除
  console.log('图片路径无需修复，直接使用:', path)
  return path
}

// 是否正在处理
const isProcessing = ref(false)

// 监听显示状态和图片路径
watch(() => props.visible, (newVal) => {
  if (newVal && props.imagePath) {
    nextTick(() => {
      initImage()
    })
  }
})

// 监听图片路径变化（重新选择图片时）
watch(() => props.imagePath, (newPath) => {
  if (newPath && props.visible) {
    console.log('图片路径发生变化，重新初始化:', newPath)
    nextTick(() => {
      initImage()
    })
  }
})

// 初始化图片
const initImage = () => {
  if (!props.imagePath) {
    console.error('图片路径为空')
    return
  }
  
  const fixedPath = fixImagePath(props.imagePath)
  console.log('开始初始化图片:', props.imagePath, '修复后路径:', fixedPath)
  
  uni.getImageInfo({
    src: fixedPath,
    success: (res) => {
      console.log('图片信息获取成功:', res)
      
      // 计算图片适配画布的初始尺寸和位置
      const { width, height } = res
      // 使用min确保图片完整显示在画布内，而不是超出边界
      const scale = Math.min(canvasSize / width, canvasSize / height)
      
      const scaledWidth = width * scale
      const scaledHeight = height * scale
      
      imageInfo.value = {
        originalWidth: width,
        originalHeight: height,
        width: scaledWidth,
        height: scaledHeight,
        x: (canvasSize - scaledWidth) / 2,
        y: (canvasSize - scaledHeight) / 2,
        scale: scale,
        fixedPath: fixedPath // 保存修复后的路径
      }
      
      console.log('计算后的图片信息:', imageInfo.value)
      
      // 延迟绘制，确保Canvas已准备好
      setTimeout(() => {
        drawImage()
      }, 200)
    },
    fail: (error) => {
      console.error('获取图片信息失败:', error)
      console.error('失败的图片路径:', fixedPath)
      toast.show('图片加载失败')
    }
  })
}

// 绘制图片到画布
const drawImage = () => {
  console.log('开始绘制图片到Canvas')
  
  const ctx = uni.createCanvasContext(canvasId)
  
  if (!ctx) {
    console.error('无法创建Canvas上下文')
    return
  }
  
  // 使用修复后的图片路径
  const imagePath = imageInfo.value.fixedPath || fixImagePath(props.imagePath)
  
  // 清空画布
  ctx.clearRect(0, 0, canvasSize, canvasSize)
  
  // 绘制白色背景，便于看到图片
  ctx.setFillStyle('#f0f0f0')
  ctx.fillRect(0, 0, canvasSize, canvasSize)
  
  // 绘制图片
  console.log('绘制图片参数:', {
    src: imagePath,
    x: imageInfo.value.x,
    y: imageInfo.value.y,
    width: imageInfo.value.width,
    height: imageInfo.value.height
  })
  
  // 确保图片坐标不会超出Canvas边界
  const drawX = Math.max(imageInfo.value.x, -imageInfo.value.width * 0.5)
  const drawY = Math.max(imageInfo.value.y, -imageInfo.value.height * 0.5)
  const drawX2 = Math.min(drawX, canvasSize)
  const drawY2 = Math.min(drawY, canvasSize)
  
  console.log('实际绘制坐标:', { drawX, drawY, drawX2, drawY2 })
  
  try {
    ctx.drawImage(
      imagePath,
      imageInfo.value.x,
      imageInfo.value.y,
      imageInfo.value.width,
      imageInfo.value.height
    )
    
    console.log('图片绘制命令已执行')
  } catch (error) {
    console.error('绘制图片时出错:', error)
  }
  
  // 绘制裁剪框（正方形）
  const cropSize = Math.min(canvasSize * 0.8, 220) // 裁剪框大小
  const cropX = (canvasSize - cropSize) / 2
  const cropY = (canvasSize - cropSize) / 2
  
  // 绘制半透明遮罩
  ctx.setFillStyle('rgba(0, 0, 0, 0.5)')
  ctx.fillRect(0, 0, canvasSize, cropY) // 上
  ctx.fillRect(0, cropY, cropX, cropSize) // 左
  ctx.fillRect(cropX + cropSize, cropY, canvasSize - cropX - cropSize, cropSize) // 右
  ctx.fillRect(0, cropY + cropSize, canvasSize, canvasSize - cropY - cropSize) // 下
  
  // 绘制裁剪框边框
  ctx.setStrokeStyle('#ffffff')
  ctx.setLineWidth(2)
  ctx.strokeRect(cropX, cropY, cropSize, cropSize)
  
  // 绘制四个角的装饰
  const cornerSize = 15
  ctx.setStrokeStyle('#ffffff')
  ctx.setLineWidth(3)
  
  // 左上角
  ctx.beginPath()
  ctx.moveTo(cropX, cropY + cornerSize)
  ctx.lineTo(cropX, cropY)
  ctx.lineTo(cropX + cornerSize, cropY)
  ctx.stroke()
  
  // 右上角
  ctx.beginPath()
  ctx.moveTo(cropX + cropSize - cornerSize, cropY)
  ctx.lineTo(cropX + cropSize, cropY)
  ctx.lineTo(cropX + cropSize, cropY + cornerSize)
  ctx.stroke()
  
  // 左下角
  ctx.beginPath()
  ctx.moveTo(cropX, cropY + cropSize - cornerSize)
  ctx.lineTo(cropX, cropY + cropSize)
  ctx.lineTo(cropX + cornerSize, cropY + cropSize)
  ctx.stroke()
  
  // 右下角
  ctx.beginPath()
  ctx.moveTo(cropX + cropSize - cornerSize, cropY + cropSize)
  ctx.lineTo(cropX + cropSize, cropY + cropSize)
  ctx.lineTo(cropX + cropSize, cropY + cropSize - cornerSize)
  ctx.stroke()
  
  ctx.draw(false, () => {
    console.log('Canvas绘制完成')
  })
}

// 触摸处理（支持拖拽移动图片）
const handleTouchMove = (e) => {
  e.preventDefault()
  
  if (e.touches.length === 1 && imageInfo.value.lastX !== null) {
    const touch = e.touches[0]
    const deltaX = touch.clientX - imageInfo.value.lastX
    const deltaY = touch.clientY - imageInfo.value.lastY
    
    // 更新图片位置
    imageInfo.value.x += deltaX * 2 // 增加移动敏感度
    imageInfo.value.y += deltaY * 2
    
    // 更新上次触摸位置
    imageInfo.value.lastX = touch.clientX
    imageInfo.value.lastY = touch.clientY
    
    // 重新绘制
    drawImage()
  }
}

const handleTouchStart = (e) => {
  e.preventDefault()
  console.log('触摸开始')
  
  if (e.touches.length === 1) {
    const touch = e.touches[0]
    imageInfo.value.lastX = touch.clientX
    imageInfo.value.lastY = touch.clientY
  }
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  console.log('触摸结束')
  
  imageInfo.value.lastX = null
  imageInfo.value.lastY = null
}

// 确认裁剪
const confirmCrop = async () => {
  if (isProcessing.value) return
  
  try {
    isProcessing.value = true
    console.log('开始裁剪图片')
    
    // 先重新绘制一次，确保Canvas内容是最新的
    await new Promise(resolve => {
      drawImage()
      setTimeout(resolve, 300) // 等待绘制完成
    })
    
    // 计算裁剪区域
    const cropSize = Math.min(canvasSize * 0.8, 220)
    const cropX = (canvasSize - cropSize) / 2
    const cropY = (canvasSize - cropSize) / 2
    
    console.log('裁剪区域:', { cropX, cropY, cropSize })
    console.log('Canvas ID:', canvasId)
    
    // 导出裁剪后的图片
    const result = await new Promise((resolve, reject) => {
      const exportConfig = {
        canvasId: canvasId,
        x: cropX,
        y: cropY,
        width: cropSize,
        height: cropSize,
        destWidth: 300, // 输出尺寸
        destHeight: 300,
        quality: 0.8,
        fileType: 'jpg',
        success: (res) => {
          console.log('Canvas导出成功，图片路径:', res.tempFilePath)
          resolve(res.tempFilePath)
        },
        fail: (error) => {
          console.error('Canvas导出失败:', error)
          console.error('导出配置:', exportConfig)
          reject(error)
        }
      }
      
      console.log('开始导出Canvas，配置:', exportConfig)
      uni.canvasToTempFilePath(exportConfig)
    })
    
    console.log('准备emit confirm事件，图片路径:', result)
    emit('confirm', result)
    
  } catch (error) {
    console.error('裁剪失败:', error)
    
    if (error.errMsg && error.errMsg.includes('canvas is empty')) {
      toast.show('图片未正确加载，请重新选择')
    } else {
      toast.show('裁剪失败，请重试')
    }
  } finally {
    isProcessing.value = false
  }
}

// 取消裁剪
const cancelCrop = () => {
  emit('close')
}

// 调试：检查Canvas状态
const debugCanvas = () => {
  console.log('=== Canvas调试信息 ===')
  console.log('Canvas ID:', canvasId)
  console.log('Canvas 大小:', canvasSize)
  console.log('图片信息:', imageInfo.value)
  console.log('原始图片路径:', props.imagePath)
  console.log('修复后路径:', imageInfo.value.fixedPath)
  
  // 尝试导出整个Canvas作为调试
  uni.canvasToTempFilePath({
    canvasId: canvasId,
    success: (res) => {
      console.log('Canvas全图导出成功:', res.tempFilePath)
    },
    fail: (error) => {
      console.error('Canvas全图导出失败:', error)
    }
  })
}

// 重新选择图片
const reselect = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('重新选择的图片:', tempFilePath)
      
      // 重新初始化图片
      emit('reselect', tempFilePath)
    },
    fail: () => {
      toast.show('选择图片失败')
    }
  })
}
</script>

<template>
  <view v-if="visible" class="avatar-cropper-overlay">
    <view class="avatar-cropper-container" @tap.stop>
      <!-- 头部标题 -->
      <view class="cropper-header">
        <text class="header-title">裁剪头像</text>
        <text class="header-subtitle">拖拽调整图片位置，获得最佳效果</text>
      </view>
      
      <!-- 裁剪区域 -->
      <view class="cropper-content">
        <view class="canvas-container">
          <canvas
            :canvas-id="canvasId"
            :id="canvasId"
            class="cropper-canvas"
            @touchstart="handleTouchStart"
            @touchmove="handleTouchMove"
            @touchend="handleTouchEnd"
          />
        </view>
      </view>
      
      <!-- 操作按钮区域 -->
      <view class="cropper-footer">
        <!-- 重新选择按钮 -->
        <view class="footer-left">
          <view 
            class="action-btn secondary-btn"
            hover-class="btn-hover"
            @tap.stop="reselect"
          >
            <view class="btn-icon">📷</view>
            <text class="btn-text">重选</text>
          </view>
          
          <!-- 调试按钮（开发时可用） -->
          <view 
            v-if="false"
            class="action-btn secondary-btn ml-2"
            hover-class="btn-hover"
            @tap.stop="debugCanvas"
          >
            <text class="btn-text">调试</text>
          </view>
        </view>
        
        <!-- 主要操作按钮 -->
        <view class="footer-right">
          <view 
            class="action-btn cancel-btn"
            hover-class="btn-hover"
            @tap.stop="cancelCrop"
          >
            <text class="btn-text">取消</text>
          </view>
          
          <view 
            class="action-btn confirm-btn"
            :class="{ 'btn-disabled': isProcessing }"
            hover-class="btn-hover"
            @tap.stop="confirmCrop"
          >
            <view v-if="isProcessing" class="loading-icon">⏳</view>
            <text class="btn-text">{{ isProcessing ? '处理中...' : '确认' }}</text>
          </view>
        </view>
      </view>
      
      <!-- 遮罩层关闭区域 -->
      <view class="close-mask" @tap="cancelCrop"></view>
    </view>
  </view>
</template>

<style scoped>
.avatar-cropper-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.avatar-cropper-container {
  width: 90vw;
  max-width: 500rpx;
  background: #fff;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.cropper-header {
  padding: 40rpx 40rpx 20rpx;
  text-align: center;
  border-bottom: 1px solid #f0f0f0;
}

.header-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.header-subtitle {
  display: block;
  font-size: 26rpx;
  color: #666;
}

.cropper-content {
  padding: 30rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8f9fa;
}

.canvas-container {
  border-radius: 16rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.cropper-canvas {
  width: 300px;
  height: 300px;
  background: #000;
  touch-action: none;
  display: block;
}

.cropper-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx 40rpx;
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.footer-left {
  flex: 1;
}

.footer-right {
  display: flex;
  gap: 20rpx;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 120rpx;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  transition: all 0.3s ease;
  cursor: pointer;
  gap: 8rpx;
}

.secondary-btn {
  background: #f5f5f5;
  color: #666;
  border: 2rpx solid #e0e0e0;
  padding: 0 24rpx;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 2rpx solid #e0e0e0;
  padding: 0 32rpx;
}

.confirm-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 0 40rpx;
  box-shadow: 0 4rpx 12rpx rgba(59, 130, 246, 0.3);
}

.btn-disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-hover {
  opacity: 0.8;
  transform: scale(0.98);
}

.btn-text {
  font-weight: 500;
}

.btn-icon, .loading-icon {
  font-size: 24rpx;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.close-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: -1;
}
</style>