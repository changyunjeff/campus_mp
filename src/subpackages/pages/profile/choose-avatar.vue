<script setup>
import Layout from "@/layout/index.vue"
import { ref, reactive, onMounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useRouter, useRoute } from 'uni-mini-router'
import { upload } from '@/utils/request'
import events from '@/utils/events'

const router = useRouter()
const route = useRoute()

// 裁剪区域尺寸
const cropperSize = ref(0)
// 裁剪框尺寸
const clipSize = ref(280)
// 裁剪框的位置
const clipPosition = reactive({
  x: 0,
  y: 0
})
// 图片信息
const imageInfo = reactive({
  path: '', // 图片路径
  width: 0, // 图片宽度
  height: 0, // 图片高度
  top: 0, // 图片顶部位置
  left: 0, // 图片左侧位置
  scale: 1, // 缩放比例
  rotate: 0 // 旋转角度
})
// 触摸信息
const touch = reactive({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  oldScale: 1,
  oldRotate: 0,
  isMoving: false
})

// 初始化页面
onLoad(() => {
  // 从本地存储获取图片路径
  const tempPath = uni.getStorageSync('tempAvatarPath')
  
  if (tempPath) {
    console.log('从本地存储获取图片路径:', tempPath)
    imageInfo.path = tempPath
    initImage()
  } else {
    console.error('未获取到图片路径')
    uni.showToast({
      title: '未获取到图片',
      icon: 'none'
    })
    setTimeout(() => {
      router.back()
    }, 1500)
  }
})

// 初始化裁剪框大小
onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  cropperSize.value = Math.min(systemInfo.windowWidth, systemInfo.windowHeight - 200)
  
  // 裁剪框居中
  clipPosition.x = (cropperSize.value - clipSize.value) / 2
  clipPosition.y = (cropperSize.value - clipSize.value) / 2
})

// 初始化图片
const initImage = () => {
  console.log('开始初始化图片:', imageInfo.path)
  uni.getImageInfo({
    src: imageInfo.path,
    success: (res) => {
      console.log('图片信息获取成功:', res)
      // 获取图片信息
      imageInfo.width = res.width
      imageInfo.height = res.height
      
      // 计算初始缩放比例，使图片适合裁剪区域
      const scale = cropperSize.value / Math.max(res.width, res.height)
      imageInfo.scale = scale
      
      // 居中图片
      imageInfo.left = (cropperSize.value - res.width * scale) / 2
      imageInfo.top = (cropperSize.value - res.height * scale) / 2
    },
    fail: (err) => {
      console.error('图片信息获取失败:', err)
      uni.showToast({
        title: '图片加载失败',
        icon: 'none'
      })
    }
  })
}

// 触摸开始
const handleTouchStart = (e) => {
  if (e.touches.length === 1) {
    // 单指移动
    touch.startX = e.touches[0].clientX
    touch.startY = e.touches[0].clientY
    touch.isMoving = true
  } else if (e.touches.length === 2) {
    // 双指缩放/旋转
    touch.startX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    touch.startY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    
    // 保存初始状态
    touch.oldScale = imageInfo.scale
    touch.oldRotate = imageInfo.rotate
  }
}

// 触摸移动
const handleTouchMove = (e) => {
  e.preventDefault()
  
  if (e.touches.length === 1 && touch.isMoving) {
    // 单指移动
    const moveX = e.touches[0].clientX - touch.startX
    const moveY = e.touches[0].clientY - touch.startY
    
    imageInfo.left += moveX
    imageInfo.top += moveY
    
    touch.startX = e.touches[0].clientX
    touch.startY = e.touches[0].clientY
  } else if (e.touches.length === 2) {
    // 计算双指中心点
    const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
    const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    
    // 计算双指距离
    const dx = e.touches[0].clientX - e.touches[1].clientX
    const dy = e.touches[0].clientY - e.touches[1].clientY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 计算初始双指距离
    const startDx = touch.startX * 2 - e.touches[0].clientX - e.touches[1].clientX
    const startDy = touch.startY * 2 - e.touches[0].clientY - e.touches[1].clientY
    const startDistance = Math.sqrt(startDx * startDx + startDy * startDy)
    
    // 缩放比例变化
    const scale = distance / startDistance
    
    // 限制缩放范围
    let newScale = touch.oldScale * scale
    newScale = Math.max(0.5, Math.min(5, newScale))
    
    // 计算缩放后位置调整
    const scaleDiff = newScale - imageInfo.scale
    
    // 以双指中心为基准点进行缩放
    const diffX = (centerX - imageInfo.left) * (scaleDiff / imageInfo.scale)
    const diffY = (centerY - imageInfo.top) * (scaleDiff / imageInfo.scale)
    
    imageInfo.scale = newScale
    imageInfo.left -= diffX
    imageInfo.top -= diffY
  }
}

// 触摸结束
const handleTouchEnd = () => {
  touch.isMoving = false
}

// 旋转图片
const rotateImage = () => {
  imageInfo.rotate = (imageInfo.rotate + 90) % 360
}

// 重新选择图片
const reChooseImage = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['original', 'compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      imageInfo.path = res.tempFilePaths[0]
      // 重置图片状态
      imageInfo.scale = 1
      imageInfo.rotate = 0
      initImage()
    }
  })
}

// 裁剪图片
const cropImage = () => {
  // 显示加载提示
  uni.showLoading({
    title: '处理中...',
    mask: true
  })
  
  // 获取Canvas节点
  const query = uni.createSelectorQuery()
  query.select('#clipCanvas')
    .fields({ node: true, size: true })
    .exec((res) => {
      if (!res[0] || !res[0].node) {
        console.error('获取Canvas节点失败')
        uni.hideLoading()
        uni.showToast({
          title: '裁剪失败，请重试',
          icon: 'none'
        })
        return
      }
      
      const canvas = res[0].node
      const ctx = canvas.getContext('2d')
      
      // 设置Canvas尺寸
      const canvasSize = clipSize.value * 2
      const dpr = uni.getSystemInfoSync().pixelRatio
      canvas.width = canvasSize * dpr
      canvas.height = canvasSize * dpr
      ctx.scale(dpr, dpr)
      
      // 清空画布
      ctx.clearRect(0, 0, canvasSize, canvasSize)
      
      // 创建图片对象
      const img = canvas.createImage()
      
      // 加载图片
      img.onload = () => {
        // 计算裁剪参数
        const { left, top, scale, rotate } = imageInfo
        const clipX = (clipPosition.x - left) / scale
        const clipY = (clipPosition.y - top) / scale
        const clipWidth = clipSize.value / scale
        const clipHeight = clipSize.value / scale
        
        // 保存当前状态
        ctx.save()
        
        // 设置圆形裁剪区域
        ctx.beginPath()
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2)
        ctx.clip()
        
        // 移动到画布中心进行旋转
        ctx.translate(canvasSize / 2, canvasSize / 2)
        ctx.rotate((rotate * Math.PI) / 180)
        ctx.translate(-canvasSize / 2, -canvasSize / 2)
        
        // 绘制图片
        ctx.drawImage(
          img,
          clipX, 
          clipY, 
          clipWidth, 
          clipHeight,
          0, 
          0, 
          canvasSize, 
          canvasSize
        )
        
        // 恢复状态
        ctx.restore()
        
        // 导出图片
        wx.canvasToTempFilePath({
          canvas: canvas,
          x: 0,
          y: 0,
          width: canvasSize,
          height: canvasSize,
          destWidth: canvasSize,
          destHeight: canvasSize,
          fileType: 'jpg',
          quality: 0.9,
          success: (res) => {
            console.log('图片裁剪成功:', res.tempFilePath)
            uploadAvatar(res.tempFilePath)
          },
          fail: (err) => {
            console.error('图片导出失败:', err)
            uni.hideLoading()
            uni.showToast({
              title: '图片处理失败',
              icon: 'none'
            })
          }
        })
      }
      
      img.onerror = () => {
        console.error('图片加载失败')
        uni.hideLoading()
        uni.showToast({
          title: '图片加载失败',
          icon: 'none'
        })
      }
      
      img.src = imageInfo.path
    })
}

// 上传头像
const uploadAvatar = (filePath) => {
  // 显示上传进度
  events.emit('showUpload', 0)
  
  // 模拟上传过程
  const mockUpload = () => {
    let progress = 0
    const timer = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5
      if (progress >= 100) {
        clearInterval(timer)
        progress = 100
        // 完成上传
        events.emit('updateUpload', progress)
        setTimeout(() => {
          events.emit('hideUpload')
          
          // 模拟更新用户头像
          uni.setStorageSync('userAvatar', filePath)
          
          // 清除临时图片路径
          uni.removeStorageSync('tempAvatarPath')
          
          uni.hideLoading()
          uni.showToast({
            title: '头像更新成功',
            icon: 'success'
          })
          
          // 返回上一页
          setTimeout(() => {
            router.back()
          }, 1500)
        }, 500)
      } else {
        events.emit('updateUpload', progress)
      }
    }, 300)
  }
  
  // 实际项目中使用真实上传
  // 当API准备好后使用以下代码替换mockUpload函数调用
  /*
  upload('/api/user/avatar', filePath, {
    callback: (data) => {
      // 更新上传进度
      events.emit('updateUpload', data.progress)
    }
  }).then((res) => {
    events.emit('hideUpload')
    uni.hideLoading()
    
    // 更新用户头像信息
    const data = JSON.parse(res.data).data
    uni.setStorageSync('userAvatar', data.avatarUrl)
    
    uni.showToast({
      title: '头像更新成功',
      icon: 'success'
    })
    
    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)
  }).catch((err) => {
    events.emit('hideUpload')
    uni.hideLoading()
    
    uni.showToast({
      title: '上传失败，请重试',
      icon: 'none'
    })
    console.error('上传失败:', err)
  })
  */
  
  // 临时使用模拟上传
  mockUpload()
}

// 取消裁剪
const cancelCrop = () => {
  router.back()
}
</script>

<template>
  <layout>
    <template #center>
      <text class="text-32rpx font-bold">裁剪头像</text>
    </template>
    
    <view class="flex flex-col items-center w-full h-full bg-#f8f8f8">
      <view class="relative mt-30rpx" :style="{ width: cropperSize + 'px', height: cropperSize + 'px' }">
        <!-- 裁剪区域背景 -->
        <view class="cropper-mask absolute inset-0 bg-black bg-opacity-40 z-10">
          <!-- 裁剪框 -->
          <view 
            class="absolute rounded-full border-2 border-white z-20 box-content"
            :style="{
              width: clipSize + 'px',
              height: clipSize + 'px',
              left: clipPosition.x + 'px',
              top: clipPosition.y + 'px'
            }"
          ></view>
        </view>
        
        <!-- 图片层 -->
        <view 
          class="absolute z-0"
          :style="{
            width: imageInfo.width * imageInfo.scale + 'px',
            height: imageInfo.height * imageInfo.scale + 'px',
            left: imageInfo.left + 'px',
            top: imageInfo.top + 'px',
            transform: `rotate(${imageInfo.rotate}deg)`
          }"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
        >
          <image 
            :src="imageInfo.path" 
            mode="widthFix"
            class="w-full h-full"
          />
        </view>
      </view>
      
      <!-- 操作提示 -->
      <view class="mt-30rpx text-center text-28rpx text-gray-600">
        <text>拖动调整位置，捏合手指缩放图片</text>
      </view>
      
      <!-- 操作按钮 -->
      <view class="mt-40rpx flex justify-around items-center w-full px-30rpx">
        <view 
          class="w-90rpx h-90rpx rounded-full bg-white shadow flex items-center justify-center"
          @tap="rotateImage"
        >
          <WdIcon name="rotate-cw" size="40rpx" color="#666" />
        </view>
        
        <view 
          class="w-120rpx h-120rpx rounded-full bg-white shadow flex items-center justify-center"
          @tap="reChooseImage"
        >
          <WdIcon name="image" size="50rpx" color="#666" />
        </view>
        
        <view 
          class="w-90rpx h-90rpx rounded-full bg-white shadow flex items-center justify-center"
          @tap="cancelCrop"
        >
          <WdIcon name="x" size="40rpx" color="#666" />
        </view>
      </view>
      
      <!-- 裁剪按钮 -->
      <view class="fixed bottom-60rpx left-0 right-0 px-40rpx">
        <view
          class="w-full h-90rpx bg-gradient-to-r from-blue-500 to-blue-400 rounded-full shadow-lg flex items-center justify-center active:opacity-90"
          @tap="cropImage"
        >
          <text class="text-white text-34rpx font-medium">确认</text>
        </view>
      </view>
      
      <!-- 用于实际裁剪的隐藏画布 -->
      <canvas
        id="clipCanvas"
        type="2d"
        class="absolute opacity-0"
        :style="{ width: clipSize.value * 2 + 'px', height: clipSize.value * 2 + 'px', left: '-9999px', top: '-9999px' }"
      ></canvas>
    </view>
  </layout>
</template>

<style lang="scss" scoped>
.cropper-mask {
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
}
</style>
