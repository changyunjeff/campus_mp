<script setup>
import tabbarList from '@/configs/tabbar.js'
import {useTabbar} from '@/composables/tabbar.js'
import PublishMenu from '@/components/publishMenu.vue'

const { selected, show, hide, hiddened, setSelected } = useTabbar()
const router = useRouter()
const showPublishMenu = ref(false)

const switchTabHandler = (index, path) => {
  if (index === selected.value) {
    return 
  }
  if (index === 2) {
    // 显示发布菜单
    handlePublishClick()
    return
  }
  setSelected(index)
  router.pushTab(`/${path}`)
}

// 处理发布按钮点击
const handlePublishClick = () => {
  hide() // 隐藏底部导航栏
  showPublishMenu.value = true
}

// 处理发布菜单关闭
const handlePublishMenuClose = () => {
  showPublishMenu.value = false
  show() // 显示底部导航栏
}

</script>
<template>
  <view>
    <view class="tab-bar" :class="{ 'tab-bar-hide': hiddened }">
      <view 
        v-for="(item, index) in tabbarList" 
        :key="index" 
        class="tab-bar-item"
        @click="switchTabHandler(index, item.path)"
      >
        <block v-if="index === 2">
          <view class="center-button">
            <view class="publish-button">
              <text class="publish-icon">+</text>
            </view>
          </view>
        </block>
        <block v-else>
          <IconFont
            :name="selected === index ? item.iconActive : item.icon"
            size="24px"
            :color="selected === index ? '#ff4b4b' : '#999'"
            :class="selected === index ? 'tab-bar-icon':''"
          />
          <text :class="['tab-bar-text', {'text-active': selected === index}]">
            {{ item.text }}
          </text>
        </block>
      </view>
    </view>

    <!-- 发布菜单 -->
    <PublishMenu 
      :visible="showPublishMenu" 
      @close="handlePublishMenuClose" 
    />
  </view>
</template>

<style lang="scss" scoped>
.tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 152rpx;
  background: white;
  display: flex;
  padding-bottom: env(safe-area-inset-bottom);
  border-top: 1px solid #f0f0f0;
  box-shadow: 0 -2px 6px rgba(0, 0, 0, 0.04);
  z-index: 999;
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.3s ease, opacity 0.3s ease;

  &-hide {
    transform: translateY(110%);
    opacity: 0;
  }

  &-item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  &-icon {
    transition: transform 0.2s ease;
  }

  &-text {
    font-size: 10px;
    color: #999;
    margin-top: 4px;
    transition: color 0.2s ease;

    &.text-active {
      color: #ff4b4b;
      font-weight: bold;
    }
  }
}

.center-button {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publish-button {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #ff4b4b 0%, #ff6666 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 4px 8px rgba(255, 75, 75, 0.2);
  transition: transform 0.2s ease;

  &:active {
    transform: scale(0.95);
  }
}

.publish-icon {
  color: white;
  font-size: 24px;
  font-weight: bold;
}
</style>