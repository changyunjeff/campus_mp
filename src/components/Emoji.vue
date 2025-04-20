<template>
  <view class="emoji-container">
    <!-- 表情列表区域 -->
    <swiper
        class="emoji-swiper"
        :current="currentPage"
        @change="handlePageChange"
    >
      <swiper-item
          v-for="(page, pageIndex) in emojiPages"
          :key="pageIndex"
          class="emoji-page"
      >
        <view class="emoji-grid">
          <view
              class="emoji-item"
              v-for="(emoji, index) in page.slice(0, -1)"
              :key="index"
              @tap="inputEmo(emoji)"
          >
            {{emoji.body}}
          </view>
          <!-- 删除按钮在每页的最后一个格子 -->
          <view
              class="emoji-item delete-btn"
              @tap="delEmo"
          >
            <wd-icon name="keyboard-delete" size="40rpx" color="#666" />
          </view>
        </view>
      </swiper-item>
    </swiper>

    <!-- 分页指示器 -->
    <view class="page-indicator">
      <view
          v-for="(_, index) in emojiPages"
          :key="index"
          :class="['indicator-dot', { active: index === currentPage }]"
      ></view>
    </view>
  </view>
</template>

<script setup>
import Emoji from "./emoji/json/emoji.json"

// 定义组件名
defineOptions({
  name: 'Emoji'
})

// 定义 emit
const emit = defineEmits(['inputEmo', 'delEmo', 'sendEmo'])

// 每页显示的表情数量
const EMOJIS_PER_PAGE = 24

const emolist = ref([])
const currentPage = ref(0)

// 获取表情列表
const getEmolist = () => {
  const keys = Object.keys(Emoji)
  const keya = keys.filter(v => {
    const name = v.slice(0, v.length-1)
    return v === (name+"0")
  })

  keya.forEach(v => {
    if(Emoji[v]) {
      emolist.value.push(Emoji[v])
    }
  })
}

// 将表情列表分页
const emojiPages = computed(() => {
  const pages = []
  const totalEmojis = emolist.value.length

  for (let i = 0; i < totalEmojis; i += (EMOJIS_PER_PAGE - 1)) {  // 减1是为了留出删除按钮的位置
    let page = emolist.value.slice(i, i + (EMOJIS_PER_PAGE - 1))

    // 补充空白占位符，确保每页都是固定数量
    while (page.length < EMOJIS_PER_PAGE - 1) {
      page.push({ body: '' })
    }
    // 添加一个空位用于删除按钮
    page.push({ body: '' })

    pages.push(page)
  }

  return pages
})

// 处理页面切换
const handlePageChange = (e) => {
  currentPage.value = e.detail.current
}

// 输入表情
const inputEmo = (v) => {
  emit('inputEmo', v.body)
}

// 删除表情
const delEmo = () => {
  emit('delEmo')
}

onMounted(() => {
  getEmolist()
})
</script>

<style lang="scss" scoped>
.emoji-container {
  width: 100%;
  height: 460rpx;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 32rpx;
    right: 32rpx;
    height: 2rpx;
    background: #f5f5f5;
    border-radius: 1rpx;
  }
}

.emoji-swiper {
  flex: 1;
  height: 320rpx; // 固定高度，防止上下滚动
}

.emoji-page {
  height: 100%;
}

.emoji-grid {
  height: 100%;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 6rpx;
  padding: 12rpx;

  .emoji-item {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 48rpx;

    &:active {
      background-color: #f5f5f5;
      border-radius: 12rpx;
    }

    &.delete-btn {
      background: #f5f5f5;
      border-radius: 12rpx;

      image {
        width: 48rpx;
        height: 48rpx;
      }

      &:active {
        opacity: 0.8;
      }
    }
  }
}

.page-indicator {
  height: 40rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12rpx;

  .indicator-dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: #ddd;
    transition: all 0.3s;

    &.active {
      width: 24rpx;
      border-radius: 6rpx;
      background: var(--primary-color, #007AFF);
    }
  }
}
</style>