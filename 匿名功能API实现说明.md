# 匿名功能 API 实现说明文档

## 🎯 功能概述

本次更新为校园社区系统新增了**匿名发布功能**，允许用户选择是否以匿名方式发布帖子、评论和回复。该功能在保护用户隐私的同时，确保管理员仍可进行有效的内容管理。

### 核心特性
- ✅ 支持匿名发布帖子、评论、回复
- ✅ 智能生成匿名用户信息（如：大二计算机学院男生）
- ✅ 管理员可查看真实用户信息
- ✅ 保持权限检查和安全性
- ✅ 完全向下兼容现有功能

---

## 📋 API 接口变更

### 1. 创建帖子接口

**接口地址：** `POST /posts`

**新增参数：**
```json
{
  "content": "帖子内容",
  "images": ["图片URL列表"],
  "tags": ["标签列表"],
  "is_anonymous": true  // 新增：是否匿名发布，可选，默认false
}
```

### 2. 创建评论接口

**接口地址：** `POST /comments`

**新增参数：**
```json
{
  "post_id": "帖子ID",
  "content": "评论内容",
  "is_anonymous": true  // 新增：是否匿名评论，可选，默认false
}
```

### 3. 创建回复接口

**接口地址：** `POST /replies`

**新增参数：**
```json
{
  "comment_id": "评论ID",
  "reply_to_id": "回复对象ID",
  "content": "回复内容",
  "is_anonymous": true  // 新增：是否匿名回复，可选，默认false
}
```

---

## 📊 数据结构变化

### Author 信息结构

#### 普通用户视角
```json
{
  "author": {
    "id": "anon_abc123",           // 匿名ID（anon_ + 用户ID前6位）
    "nickname": "大二计算机学院男生",    // 生成的匿名昵称
    "avatar": "/static/images/anonymous_avatar.png",  // 默认匿名头像
    "gender": "male",              // 保留性别信息（用于昵称生成）
    "level": 0,                    // 匿名用户等级为0
    "grade": "",                   // 匿名时不显示具体年级
    "college": ""                  // 匿名时不显示具体学院
  },
  "is_anonymous": true             // 标识这是匿名内容
}
```

#### 管理员视角
```json
{
  "author": {
    "id": "real_user_id_123",      // 真实用户ID
    "nickname": "张三（匿名：大二计算机学院男生）",  // 显示真实+匿名信息
    "avatar": "real_user_avatar_url",     // 真实头像
    "gender": "male",
    "level": 5,
    "grade": "大二",
    "college": "计算机学院",
    "real_name": "张三",           // 管理员可见的真实姓名
    "anonymous_nickname": "大二计算机学院男生"  // 对外显示的匿名昵称
  },
  "is_anonymous": true
}
```

### 匿名昵称生成规则

1. **格式：** `{年级}{学院}{性别}` 
2. **示例：**
   - `大一计算机学院女生`
   - `大三经济管理学院男生`
   - `研一外国语学院女生`

3. **匿名ID规则：** `anon_` + 真实用户ID的前6位字符

---

## 🏗️ 类型定义

### 完整的 TypeScript 类型支持

所有API接口的类型定义已完整定义在 `frontend/mp/src/types/community.d.js` 中，包括：

#### 📁 类型文件结构
```
frontend/mp/src/
├── types/
│   ├── community.d.js     // 社区模块类型定义 ⭐ 新增
│   └── goods.d.js        // 商品模块类型定义
└── api/
    ├── community.js       // 社区API接口 ✅ 已更新
    └── goods.js          // 商品API接口
```

#### 🔍 主要类型定义

**基础类型：**
- `Author` - 用户信息（支持匿名）
- `AuthorInfo` - 扩展用户信息
- `AnonymousDisplayInfo` - 匿名显示信息
- `AdminViewAuthor` - 管理员视角用户信息

**帖子相关：**
- `Post` - 帖子完整信息
- `CreatePostRequest` - 创建帖子请求
- `PostListRequest` / `PostListResponse` - 帖子列表

**评论相关：**
- `Comment` - 评论完整信息
- `CreateCommentRequest` - 创建评论请求
- `CommentListRequest` / `CommentListResponse` - 评论列表

**回复相关：**
- `Reply` - 回复完整信息  
- `CreateReplyRequest` - 创建回复请求
- `ReplyListRequest` / `ReplyListResponse` - 回复列表

#### 💡 IDE智能提示支持

更新后的API接口提供完整的类型提示：

```javascript
// ✅ 现在有完整的类型提示
const postData: CreatePostRequest = {
  content: "帖子内容",
  is_anonymous: true,  // 💫 IDE会自动提示这个字段
  images: ["url1", "url2"],
  // 其他字段也会有完整提示...
}

// ✅ 返回值类型也明确定义
const result: Post = await CommunityApi.createPost(postData)
console.log(result.author.nickname) // 💫 IDE知道这些字段的存在
```

---

## 🔧 前端集成指南

### 1. 快速开始 - 匿名功能集成

#### 基础使用示例

```javascript
import { CommunityApi } from '@/api/community'

// 📝 发布匿名帖子 - 完整类型支持
const publishAnonymousPost = async () => {
  /** @type {CreatePostRequest} */
  const postData = {
    content: "这是一个匿名帖子",
    images: ["https://example.com/image1.jpg"],
    is_anonymous: true,  // 🎭 开启匿名模式
    visibility: "public",
    tags: ["校园生活"]
  }
  
  try {
    /** @type {Post} */
    const result = await CommunityApi.createPost(postData)
    
    // ✅ 返回的帖子信息会包含匿名用户信息
    console.log('匿名帖子发布成功:', {
      id: result.id,
      authorId: result.author.id,        // "anon_abc123"
      authorName: result.author.nickname, // "大二计算机学院男生"
      isAnonymous: result.is_anonymous    // true
    })
  } catch (error) {
    console.error('发布失败:', error)
  }
}

// 💬 发布匿名评论
const postAnonymousComment = async (postId) => {
  /** @type {CreateCommentRequest} */
  const commentData = {
    post_id: postId,
    content: "这是一个匿名评论",
    is_anonymous: true  // 🎭 匿名评论
  }
  
  try {
    /** @type {Comment} */
    const result = await CommunityApi.createComment(commentData)
    console.log('匿名评论成功:', result)
  } catch (error) {
    console.error('评论失败:', error)
  }
}

// 💭 发布匿名回复
const postAnonymousReply = async (commentId, replyToId) => {
  /** @type {CreateReplyRequest} */
  const replyData = {
    comment_id: commentId,
    reply_to_id: replyToId,
    content: "这是一个匿名回复",
    is_anonymous: true  // 🎭 匿名回复
  }
  
  try {
    /** @type {Reply} */
    const result = await CommunityApi.createReply(replyData)
    console.log('匿名回复成功:', result)
  } catch (error) {
    console.error('回复失败:', error)
  }
}
```

### 2. Vue 组件集成示例

#### 发布帖子页面（支持匿名）
```vue
<template>
  <view class="publish-post-page">
    <!-- 帖子内容输入 -->
    <textarea 
      v-model="postContent"
      placeholder="分享你的想法..."
      class="content-input"
    />
    
    <!-- 匿名开关区域 -->
    <view class="anonymous-section">
      <view class="anonymous-switch">
        <switch 
          :checked="isAnonymous" 
          @change="handleAnonymousToggle"
          color="#007AFF"
        />
        <text class="switch-label">匿名发布</text>
      </view>
      
      <!-- 匿名提示 -->
      <view v-if="isAnonymous" class="anonymous-tip">
        <text class="tip-text">
          🎭 开启后将以"{{ anonymousNickname }}"的形式显示
        </text>
      </view>
    </view>
    
    <!-- 发布按钮 -->
    <button 
      @click="publishPost"
      :disabled="!canPublish"
      class="publish-btn"
    >
      {{ isPublishing ? '发布中...' : '发布' }}
    </button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { CommunityApi } from '@/api/community'
import { useUserStore } from '@/pinia/modules/user'

const userStore = useUserStore()

// 响应式数据
const postContent = ref('')
const isAnonymous = ref(false)
const isPublishing = ref(false)

// 计算属性
const anonymousNickname = computed(() => {
  // 根据用户信息生成匿名昵称预览
  const user = userStore.userInfo
  return `${user.grade || '大二'}${user.college || '计算机学院'}${user.gender === 'male' ? '男生' : '女生'}`
})

const canPublish = computed(() => {
  return postContent.value.trim().length > 0 && !isPublishing.value
})

// 方法
const handleAnonymousToggle = (e) => {
  isAnonymous.value = e.detail.value
}

const publishPost = async () => {
  if (!canPublish.value) return
  
  isPublishing.value = true
  
  try {
    /** @type {CreatePostRequest} */
    const postData = {
      content: postContent.value.trim(),
      is_anonymous: isAnonymous.value,  // 🎭 关键参数
      visibility: 'public'
    }
    
    /** @type {Post} */
    const result = await CommunityApi.createPost(postData)
    
    uni.showToast({
      title: isAnonymous.value ? '匿名帖子发布成功' : '帖子发布成功',
      icon: 'success'
    })
    
    // 返回上一页或首页
    uni.navigateBack()
    
  } catch (error) {
    console.error('发布失败:', error)
    uni.showToast({
      title: '发布失败，请重试',
      icon: 'error'
    })
  } finally {
    isPublishing.value = false
  }
}
</script>

<style scoped>
.publish-post-page {
  padding: 20rpx;
}

.content-input {
  width: 100%;
  min-height: 300rpx;
  padding: 20rpx;
  border: 1px solid #e5e5e5;
  border-radius: 12rpx;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.anonymous-section {
  margin-bottom: 40rpx;
  padding: 20rpx;
  background: #f8f9fa;
  border-radius: 12rpx;
}

.anonymous-switch {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.switch-label {
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.anonymous-tip {
  padding: 16rpx;
  background: #fff3cd;
  border-radius: 8rpx;
  border-left: 4rpx solid #ffc107;
}

.tip-text {
  font-size: 24rpx;
  color: #856404;
}

.publish-btn {
  width: 100%;
  background: #007AFF;
  color: white;
  border: none;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
}

.publish-btn:disabled {
  background: #ccc;
}
</style>
```

#### 评论输入组件（支持匿名）
```vue
<template>
  <view class="comment-input-wrapper">
    <!-- 匿名开关（可折叠） -->
    <view v-if="showAnonymousOption" class="anonymous-toggle">
      <switch 
        :checked="isAnonymous"
        @change="(e) => isAnonymous = e.detail.value"
        size="mini"
      />
      <text class="toggle-text">匿名</text>
    </view>
    
    <!-- 评论输入框 -->
    <view class="input-section">
      <textarea
        v-model="commentText"
        :placeholder="placeholder"
        class="comment-input"
        auto-height
        :max-height="200"
      />
      
      <button 
        @click="submitComment"
        :disabled="!canSubmit"
        class="submit-btn"
      >
        发送
      </button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, defineProps, defineEmits } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: '说点什么...'
  },
  showAnonymousOption: {
    type: Boolean,
    default: true
  },
  postId: String,
  commentId: String,
  replyToId: String
})

const emit = defineEmits(['success'])

const commentText = ref('')
const isAnonymous = ref(false)
const isSubmitting = ref(false)

const canSubmit = computed(() => {
  return commentText.value.trim().length > 0 && !isSubmitting.value
})

const submitComment = async () => {
  if (!canSubmit.value) return
  
  isSubmitting.value = true
  
  try {
    let result
    
    if (props.commentId) {
      // 创建回复
      /** @type {CreateReplyRequest} */
      const replyData = {
        comment_id: props.commentId,
        reply_to_id: props.replyToId,
        content: commentText.value.trim(),
        is_anonymous: isAnonymous.value
      }
      result = await CommunityApi.createReply(replyData)
    } else {
      // 创建评论
      /** @type {CreateCommentRequest} */
      const commentData = {
        post_id: props.postId,
        content: commentText.value.trim(),
        is_anonymous: isAnonymous.value
      }
      result = await CommunityApi.createComment(commentData)
    }
    
    // 重置表单
    commentText.value = ''
    isAnonymous.value = false
    
    emit('success', result)
    
  } catch (error) {
    console.error('提交失败:', error)
    uni.showToast({
      title: '发送失败',
      icon: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
```

---

## ⚠️ 重要注意事项

### 1. 兼容性保证
- **向下兼容：** 不传 `is_anonymous` 参数时，默认为非匿名发布
- **现有数据：** 历史数据不受影响，正常显示

### 2. 权限和安全
- **权限检查：** 匿名内容的权限检查仍使用真实用户ID
- **举报功能：** 匿名内容可正常举报，管理员可查看真实用户信息
- **数据追溯：** 所有匿名内容都能追溯到真实用户

### 3. 数据库变更
```sql
-- 已添加的数据库字段
ALTER TABLE posts ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE comments ADD COLUMN is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE replies ADD COLUMN is_anonymous BOOLEAN DEFAULT false;

-- 添加索引以优化查询
CREATE INDEX idx_posts_is_anonymous ON posts(is_anonymous);
CREATE INDEX idx_comments_is_anonymous ON comments(is_anonymous);
CREATE INDEX idx_replies_is_anonymous ON replies(is_anonymous);
```

### 4. 性能考虑
- **匿名信息生成：** 在应用层动态生成，不存储到数据库
- **缓存策略：** 匿名昵称可根据用户基础信息缓存
- **查询优化：** 添加了适当的数据库索引

---

## 🚀 前端开发建议

### 1. 开发优先级

**阶段一：核心组件（推荐先开发）**
1. `AnonymousSwitch` - 匿名开关组件 ⭐ 
2. `PostPublishForm` - 发布页面匿名集成
3. `CommentInput` - 评论输入匿名支持

**阶段二：显示优化**
4. `UserAvatar` - 统一用户头像显示组件
5. `AuthorInfo` - 统一作者信息展示组件
6. 更新现有帖子列表、详情页的用户信息显示

**阶段三：高级功能**
7. 匿名内容标识（小图标、特殊样式）
8. 用户匿名偏好设置持久化
9. 管理员视角的真实用户信息显示

### 2. 状态管理建议

使用 Pinia 管理匿名相关状态：

```javascript
// stores/community.js
import { defineStore } from 'pinia'

export const useCommunityStore = defineStore('community', {
  state: () => ({
    publishSettings: {
      defaultAnonymous: false,        // 默认匿名模式
      rememberChoice: true,           // 记住用户选择
      lastAnonymousChoice: false      // 上次的匿名选择
    },
    
    anonymousPreview: {
      nickname: '',                   // 预计算的匿名昵称
      avatar: '/static/images/anonymous_avatar.png'
    }
  }),

  actions: {
    // 设置匿名模式偏好
    setAnonymousPreference(isAnonymous) {
      this.publishSettings.defaultAnonymous = isAnonymous
      if (this.publishSettings.rememberChoice) {
        this.publishSettings.lastAnonymousChoice = isAnonymous
        // 持久化到本地存储
        uni.setStorageSync('anonymous_preference', isAnonymous)
      }
    },

    // 加载匿名偏好
    loadAnonymousPreference() {
      try {
        const saved = uni.getStorageSync('anonymous_preference')
        if (saved !== '') {
          this.publishSettings.lastAnonymousChoice = saved
        }
      } catch (error) {
        console.warn('读取匿名偏好失败:', error)
      }
    },

    // 生成匿名昵称预览
    generateAnonymousPreview(userInfo) {
      const grade = userInfo.grade || '大二'
      const college = userInfo.college || '计算机学院'
      const gender = userInfo.gender === 'male' ? '男生' : '女生'
      this.anonymousPreview.nickname = `${grade}${college}${gender}`
    }
  }
})
```

### 3. 错误处理和用户体验

```javascript
// utils/anonymousHelper.js
export const AnonymousHelper = {
  // 处理匿名相关的API错误
  handleAnonymousError(error, context = '') {
    console.error(`匿名功能错误 (${context}):`, error)
    
    switch (error.code) {
      case 'ANONYMOUS_NOT_SUPPORTED':
        uni.showToast({
          title: '当前版本不支持匿名功能',
          icon: 'none'
        })
        break
      
      case 'ANONYMOUS_INFO_GENERATION_FAILED':
        uni.showToast({
          title: '匿名信息生成失败，请重试',
          icon: 'none'
        })
        break
        
      default:
        uni.showToast({
          title: context ? `${context}失败` : '操作失败',
          icon: 'none'
        })
    }
  },

  // 显示匿名功能说明
  showAnonymousHelp() {
    uni.showModal({
      title: '匿名发布说明',
      content: '开启匿名发布后，其他用户看到的将是"大二计算机学院男生"这样的信息，而不是您的真实姓名和头像。管理员仍可查看真实信息以确保内容安全。',
      showCancel: false,
      confirmText: '我知道了'
    })
  }
}
```

### 4. 性能优化建议

```javascript
// 匿名昵称生成缓存
const anonymousNicknameCache = new Map()

function getCachedAnonymousNickname(userId, userInfo) {
  if (anonymousNicknameCache.has(userId)) {
    return anonymousNicknameCache.get(userId)
  }
  
  const nickname = generateAnonymousNickname(userInfo)
  anonymousNicknameCache.set(userId, nickname)
  return nickname
}

// 定期清理缓存（避免内存泄漏）
setInterval(() => {
  if (anonymousNicknameCache.size > 100) {
    anonymousNicknameCache.clear()
  }
}, 5 * 60 * 1000) // 5分钟
```

---

## 📞 技术支持

如果在集成过程中遇到问题，请联系后端开发团队：

- **API文档更新：** 已同步更新到 Swagger 文档
- **测试环境：** 功能已在开发环境部署测试
- **代码审查：** 所有代码已通过 Code Review

---

## 📝 更新日志

### Version 1.0.0 (当前版本)
- ✅ 新增匿名发布帖子功能
- ✅ 新增匿名评论功能  
- ✅ 新增匿名回复功能
- ✅ 新增智能匿名昵称生成
- ✅ 新增管理员真实用户信息查看
- ✅ 新增数据库匿名字段支持
- ✅ 完成API接口文档更新

### 计划中的功能
- 🔄 匿名用户行为分析（数据统计）
- 🔄 匿名内容专项管理界面
- 🔄 匿名用户互动优化
- 🔄 匿名内容推荐算法调整

---

## ✅ 总结与下一步

### 🎯 当前完成状态

**✅ 已完成：**
- 后端匿名功能完整实现（Domain、Application、Infrastructure 层）
- API 接口支持匿名参数传递
- 类型定义文件完整编写（community.d.js）
- API 文件类型注解完善（community.js）
- 详细的开发文档和使用示例

**⏳ 待前端开发：**
- AnonymousSwitch 组件开发
- 发布页面匿名选项集成
- 评论/回复匿名功能集成
- 用户信息显示组件适配

### 🔧 前端开发清单

1. **第一阶段（核心功能）**
   - [ ] 创建 AnonymousSwitch 组件
   - [ ] 修改发布帖子页面，集成匿名开关
   - [ ] 修改评论组件，添加匿名选项
   - [ ] 测试匿名发布、评论、回复功能

2. **第二阶段（体验优化）**
   - [ ] 优化用户信息显示组件
   - [ ] 添加匿名内容标识
   - [ ] 实现匿名偏好记忆功能
   - [ ] 添加匿名功能说明和帮助

3. **第三阶段（完善功能）**
   - [ ] 管理员视角真实信息显示
   - [ ] 性能优化和缓存机制
   - [ ] 全面测试和bug修复

### ⚠️ 重要注意事项

1. **安全性**
   - 前端只需传递 `is_anonymous` 参数
   - 匿名信息生成完全由后端处理
   - 真实用户信息永远不在前端暴露

2. **向下兼容**
   - 所有新增参数都是可选的
   - 现有功能不会受到影响
   - 渐进式升级，不强制使用匿名功能

3. **用户体验**
   - 提供匿名昵称预览功能
   - 记住用户的匿名偏好选择
   - 清楚说明匿名功能的作用和限制

### 📋 快速检查清单

**前端开发者在开始之前，请确认：**
- [ ] 已了解所有API的类型定义（community.d.js）
- [ ] 已查看Vue组件集成示例
- [ ] 已了解匿名功能的基本原理和限制
- [ ] 已准备好匿名头像素材（/static/images/anonymous_avatar.png）

**后端开发者确认项：**
- [x] 所有API接口已就绪且经过测试
- [x] 数据库字段已添加并建立索引
- [x] 匿名信息生成逻辑已完善
- [x] 权限和安全检查已到位

---

*最后更新时间：{{ new Date().toISOString().split('T')[0] }}* 