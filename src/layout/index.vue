<script setup>
// 自定义状态栏组件
import {ref, onMounted, onUnmounted, provide} from 'vue'
import {onShow, onHide} from '@dcloudio/uni-app'
import {useGlobalStore} from '@/pinia/modules/global';
import events from "@/utils/events";
import UploadProgress from "@/components/upload-progress.vue";

const globalStore = useGlobalStore();
const router = useRouter()
const route = useRoute()

// 获取当前页面标题
const pageTitle = ref('')
const showFotter = ref(false)
const enablePageScroll = ref(false)

// 返回上一页
const goBack = () => {
  router.back()
}

const showActionSheet = ref(false)

const actionSheet = reactive({
  title: '',
  actions: [{
    name: '选项1',
    callback: null,
  }],
})

// 处理ActionSheet选项点击
const handleActionClick = (e) => {
  console.debug('ActionSheet点击了选项：', e.item, e.index, '')
  // 如果选项有回调函数，则执行
  if (e.item.callback && typeof e.item.callback === 'function') {
    e.item.callback(e.item, e.index)
  }
  // 关闭ActionSheet
  closeActionSheet()
}

const closeActionSheet = () => {
  showActionSheet.value = false
}

// 打开ActionSheet并设置内容
const openActionSheet = (actions, title = '') => {
  actionSheet.title = title
  actionSheet.actions = actions
  showActionSheet.value = true
}

const action = {
  open: openActionSheet,
  close: closeActionSheet
}

// 上传进度条控制
const showUploadProgress = ref(false)
const uploadPercentage = ref(0)

// 显示上传进度
const showUpload = (initialPercentage = 0) => {
  uploadPercentage.value = initialPercentage
  showUploadProgress.value = true
}

// 更新上传进度
const updateUploadProgress = (percentage) => {
  uploadPercentage.value = percentage
}

// 隐藏上传进度
const hideUpload = () => {
  // 先将进度设为100%，然后延迟隐藏，以便显示完成状态
  uploadPercentage.value = 100
  setTimeout(() => {
    showUploadProgress.value = false
  }, 800)
}

// 全局上传控制对象
const uploadControl = {
  show: showUpload,
  update: updateUploadProgress,
  hide: hideUpload
}

// 暴露上传控制
provide('uploadControl', uploadControl)

// 获取当前页面标题
onMounted(() => {
  console.log(route)
  pageTitle.value = route?.meta?.title || '未知标题'
  showFotter.value = route?.meta?.footer || false
  enablePageScroll.value = route?.meta?.pageScroll || false
  console.log('页面滚动模式:', enablePageScroll.value ? '页面级滚动' : '容器滚动')
})

onShow(() => {
  events.on('openActionSheet', openActionSheet)

  // 监听上传进度事件
  events.on('showUpload', showUpload)
  events.on('updateUpload', updateUploadProgress)
  events.on('hideUpload', hideUpload)
})

onHide(() => {
  events.off('openActionSheet', openActionSheet)

  // 移除上传进度事件监听
  events.off('showUpload', showUpload)
  events.off('updateUpload', updateUploadProgress)
  events.off('hideUpload', hideUpload)
})

const statusBarHeight = computed(() => {
  return `${globalStore.statusBarHeight}px`;
});

</script>

<template>
  <view :class="['app-container', { 'page-scroll-mode': enablePageScroll }]">
    <view class="status-bar"/>

    <view class="header">
      <custom-status-bar>
        <template #left>
          <slot name="left">
            <!-- 默认显示返回箭头 -->
            <view class="flex items-center h-full">
              <WdIcon
                  name="arrow-left"
                  size="40rpx"
                  color="#333"
                  @tap="goBack"
              />
            </view>
          </slot>
        </template>

        <template #center>
          <slot name="center">
            <!-- 默认显示页面标题 -->
            <text class="page-title" v-if="pageTitle">{{ pageTitle }}</text>
          </slot>
        </template>

        <template #right>
          <slot name="right"/>
        </template>
      </custom-status-bar>
    </view>

    <view :class="['content', { 'page-scroll-content': enablePageScroll }]">
      <slot></slot>
    </view>

    <view v-if="showFotter" class="footer">
      <slot name="footer"></slot>
    </view>

    <WdActionSheet :z-index="999" v-model="showActionSheet" :title="actionSheet.title" :actions="actionSheet.actions"
                   @select="handleActionClick" @close="closeActionSheet" cancel-text="取消"/>

    <!-- 全局上传进度组件 -->
    <UploadProgress
        :show="showUploadProgress"
        :percentage="uploadPercentage"
    />
  </view>
</template>

<style lang="scss" scoped>
.app-container {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.status-bar {
  width: 100%;
  height: calc(var(--status-bar-height) + var(--status-bar-height));
}

.header {
  position: fixed;
  top: calc(var(--status-bar-height) + var(--status-bar-height));
  left: 0;
  width: 100%;
  height: $uni-navigator-bar-height;
  z-index: 100;
}

.content {
  flex: 1;
  overflow-y: auto;
  padding-top: $uni-navigator-bar-height;
}

.footer {
  width: 100%;
  min-height: calc($uni-input-area-height + var(--safe-area-inset-bottom));
}

/* 页面级滚动模式样式 */
.app-container.page-scroll-mode {
  overflow: visible; /* 允许页面滚动 */
  height: auto; /* 取消固定高度 */
  min-height: 100vh; /* 保证最小高度 */
}

.content.page-scroll-content {
  overflow-y: visible; /* 取消容器滚动限制 */
  flex: none; /* 取消flex布局限制 */
}
</style>