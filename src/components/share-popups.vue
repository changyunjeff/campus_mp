<!-- 第一部分：替换 v-model 为 :modelValue 和 @update:modelValue -->
<template>
    <!-- 分享弹窗 -->
    <wd-popup 
      :modelValue="showSharePopup" 
      @update:modelValue="$emit('update:showSharePopup', $event)" 
      position="bottom" 
      :z-index="1000"
    >
      <view class="share-popup">
        <view class="share-header">
          <text class="share-title">分享到</text>
          <wd-icon name="close" size="40rpx" color="#999" @tap="onCloseShare" />
        </view>
        <view class="share-options">
          <view class="share-option">
            <button open-type="share" class="share-button" @tap="onShareToWechat">
              <view class="share-icon wechat">
                <WdIcon custom-class="iconfont" class-prefix="icon" name="wechat-fill" size="60rpx" color="#07C160" />
              </view>
              <text class="share-label">微信好友</text>
            </button>
          </view>
  
          <view class="share-option" v-if="canShareToTimeline">
            <button open-type="share" class="share-button" @tap="onShareToMoments">
              <view class="share-icon moments">
                <wd-icon custom-class="iconfont" class-prefix="icon" name="wechat-fill" size="60rpx" color="#07C160" />
              </view>
              <text class="share-label">朋友圈</text>
            </button>
          </view>
  
          <view class="share-option" @tap="onGenerateQrCode">
            <view class="share-icon qrcode">
              <wd-icon name="qrcode" size="60rpx" color="#333" />
            </view>
            <text class="share-label">二维码</text>
          </view>
        </view>
        <view class="share-cancel" @tap="onCloseShare">
          <text>取消</text>
        </view>
      </view>
    </wd-popup>
  
    <!-- 二维码弹窗 -->
    <wd-popup 
      :modelValue="showQrcodePopup" 
      @update:modelValue="$emit('update:showQrcodePopup', $event)" 
      position="center" 
      :z-index="1001"
    >
      <view class="qrcode-popup">
        <view class="qrcode-header">
          <text class="qrcode-title">分享二维码</text>
          <wd-icon name="close" size="40rpx" color="#999" @tap="onCloseQrcode" />
        </view>
        <view class="qrcode-content">
          <view v-if="qrcodeLoading" class="qrcode-loading">
            <wd-loading size="36" />
            <text>生成中...</text>
          </view>
          <view v-else class="qrcode-image-wrapper">
            <image class="qrcode-image" :src="qrcodeUrl" mode="aspectFit"></image>
            <text class="qrcode-tip">扫描二维码查看详情</text>
          </view>
        </view>
<!--        <view class="qrcode-footer">-->
<!--          <wd-button type="primary" size="small" @tap="onSaveQrcode">保存到相册</wd-button>-->
<!--        </view>-->
      </view>
    </wd-popup>
  </template>
  
  <!-- 第二部分：删除不必要的导入 -->
  <script setup>
  // 定义属性
  const props = defineProps({
    showSharePopup: {
      type: Boolean,
      default: false
    },
    showQrcodePopup: {
      type: Boolean,
      default: false
    },
    qrcodeUrl: {
      type: String,
      default: ''
    },
    qrcodeLoading: {
      type: Boolean,
      default: false
    },
    canShareToTimeline: {
      type: Boolean,
      default: false
    }
  })
  
  // 定义事件
  const emit = defineEmits([
    'update:showSharePopup',
    'update:showQrcodePopup',
    'shareToWechat',
    'shareToMoments',
    'generateQrCode',
    'saveQrcode'
  ])
  
  // 关闭分享弹窗
  const onCloseShare = () => {
    emit('update:showSharePopup', false)
  }
  
  // 关闭二维码弹窗
  const onCloseQrcode = () => {
    emit('update:showQrcodePopup', false)
  }
  
  // 分享到微信好友
  const onShareToWechat = () => {
    emit('shareToWechat')
  }
  
  // 分享到朋友圈
  const onShareToMoments = () => {
    emit('shareToMoments')
  }
  
  // 生成二维码
  const onGenerateQrCode = () => {
    emit('generateQrCode')
  }
  
  // 保存二维码到相册
  const onSaveQrcode = () => {
    emit('saveQrcode')
  }
  </script>

<style scoped lang="scss">
// 分享弹窗样式
.share-popup {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 32rpx;

  .share-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .share-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .share-options {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    padding: 20rpx 0;

    .share-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 25%;
      margin-bottom: 32rpx;

      .share-icon {
        width: 100rpx;
        height: 100rpx;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 16rpx;
        background-color: rgba(0, 0, 0, 0.05);

        &.wechat,
        &.moments {
          background-color: rgba(7, 193, 96, 0.1);
        }

        &.qrcode {
          background-color: rgba(51, 51, 51, 0.1);
        }
      }

      .share-label {
        font-size: 24rpx;
        color: #666;
      }

      .share-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: transparent;
        border: none;
        padding: 0;
        line-height: normal;

        &::after {
          border: none;
        }
      }
    }
  }

  .share-cancel {
    margin-top: 16rpx;
    padding: 24rpx 0;
    text-align: center;
    border-top: 1px solid rgba(0, 0, 0, 0.05);

    text {
      font-size: 28rpx;
      color: #333;
    }
  }
}

// 二维码弹窗样式
.qrcode-popup {
  background-color: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  width: 600rpx;

  .qrcode-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .qrcode-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
  }

  .qrcode-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20rpx 0;

    .qrcode-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16rpx;
      padding: 60rpx 0;

      text {
        font-size: 28rpx;
        color: #666;
      }
    }

    .qrcode-image-wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;

      .qrcode-image {
        width: 400rpx;
        height: 400rpx;
        margin-bottom: 16rpx;
      }

      .qrcode-tip {
        font-size: 24rpx;
        color: #999;
        margin-bottom: 16rpx;
      }
    }
  }

  .qrcode-footer {
    display: flex;
    justify-content: center;
    margin-top: 32rpx;
  }
}
</style>