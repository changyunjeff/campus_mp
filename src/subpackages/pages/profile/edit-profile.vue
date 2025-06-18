<script setup>
import {ref, reactive} from 'vue'
import {onLoad} from '@dcloudio/uni-app'
import Layout from '@/layout/index.vue'
import {useRouter} from 'uni-mini-router'
import {useToast} from '@/composables/toast'
import events from '@/utils/events'
import {UserApi} from '@/api/user'
import {MediaApi} from '@/api/media'
import User from '/static/images/user.png'
import {useUserStore} from "@/pinia/modules/user";

const router = useRouter()
const toast = useToast()
const userStore = useUserStore()

// 用户资料数据（模拟数据）
const userProfile = reactive({
  openid: '',
  realName: '未知',
  nickname: '微信用户',
  gender: 0, // 0未知 1男 2女
  role: 0, // 0学生 1教师 2校工
  grade: 0, // 0未知 1 大一 2 大二 3 大三 4 大四 5 研一 6 研二 7 研三 8 博一 9 博二 10 博三 11 博四
  college: '计算机学院',
  phone: '138****8888',
  email: 'zhangsan@example.com',
  bio: '',
  banEndTime: -1, // -1表示未被封禁，其他为毫秒时间戳
  avatar: User
})

// 表单验证状态
const formValid = ref(true)
const nicknameError = ref('')
const emailError = ref('')
const bioError = ref('')
const collegeError = ref('')

// 裁剪功能已移除，现在直接上传原图

// 性别选项
const genderOptions = [
  {label: '未知', value: 0},
  {label: '男', value: 1},
  {label: '女', value: 2}
]

// 性别显示文本
const genderText = {
  0: '未知',
  1: '男',
  2: '女'
}

// 角色显示文本
const roleText = {
  0: '学生',
  1: '教师',
  2: '校工'
}

// 年级显示文本
const gradeText = {
  0: '未知',
  1: '大一',
  2: '大二',
  3: '大三',
  4: '大四',
  5: '研一',
  6: '研二',
  7: '研三',
  8: '博一',
  9: '博二',
  10: '博三',
  11: '博四'
}

// 年级选项
const gradeOptions = [
  {label: '未知', value: 0},
  {label: '大一', value: 1},
  {label: '大二', value: 2},
  {label: '大三', value: 3},
  {label: '大四', value: 4},
  {label: '研一', value: 5},
  {label: '研二', value: 6},
  {label: '研三', value: 7},
  {label: '博一', value: 8},
  {label: '博二', value: 9},
  {label: '博三', value: 10},
  {label: '博四', value: 11}
]

// 选择性别
const chooseGender = () => {
  const actions = genderOptions.map(option => ({
    name: option.label,
    callback: () => {
      userProfile.gender = option.value
    }
  }))

  events.emit('openActionSheet', actions, '选择性别')
}

// 选择年级
const chooseGrade = () => {
  const actions = gradeOptions.map(option => ({
    name: option.label,
    callback: () => {
      userProfile.grade = option.value
    }
  }))

  events.emit('openActionSheet', actions, '选择年级')
}

// 验证昵称
const validateNickname = (value) => {
  if (!value || value.trim().length === 0) {
    nicknameError.value = '昵称不能为空'
    return false
  }
  if (value.length > 20) {
    nicknameError.value = '昵称不能超过20个字符'
    return false
  }
  nicknameError.value = ''
  return true
}

// 验证邮箱
const validateEmail = (value) => {
  if (!value || value.trim().length === 0) {
    emailError.value = '邮箱不能为空'
    return false
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    emailError.value = '请输入正确的邮箱格式'
    return false
  }
  emailError.value = ''
  return true
}

// 验证个人介绍
const validateBio = (value) => {
  if (value && value.length > 100) {
    bioError.value = '个人介绍不能超过100个字符'
    return false
  }
  bioError.value = ''
  return true
}

// 验证学院
const validateCollege = (value) => {
  if (value && value.length > 50) {
    collegeError.value = '学院名称不能超过50个字符'
    return false
  }
  collegeError.value = ''
  return true
}

const isUploading = ref(false)

// 处理头像选择并直接上传
const chooseAvatar = () => {

  // 如果正在上传，则不处理
  if (isUploading.value) {
    toast.show('正在上传图片，请稍后')
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'], // 只使用压缩版本
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const tempFilePath = res.tempFilePaths[0]
      console.log('选择的图片路径:', tempFilePath)

      try {
        // 显示上传进度
        isUploading.value = true
        events.emit('showUpload', 0)

        // 使用设置当前头像的API，确保头像被正确设置
        const uploadResult = await MediaApi.setCurrentUserAvatar({
          file: tempFilePath,
          onProgress: (progress) => {
            events.emit('updateUpload', progress)
          }
        })

        console.log('头像上传成功:', uploadResult)

        if (uploadResult && uploadResult.url && uploadResult.media_id) {
          // 更新本地用户资料中的头像
          userProfile.avatar = uploadResult.url

          // 同时保存到本地存储
          userStore.setAvatar({
            url: uploadResult.url,
            object_key: uploadResult.object_key,
            type: uploadResult.type
          })

          toast.show('头像更新成功')

          // 重新获取用户资料，确保头像信息同步
          console.log('重新获取用户资料以同步头像...')
          await loadUserProfile()
        }

      } catch (error) {
        console.error('上传头像失败:', error)
        toast.show('头像上传失败，请重试')
      } finally {
        isUploading.value = false
        events.emit('hideUpload')
      }
    },
    fail: () => {
      toast.show('选择图片失败')
    }
  })
}

// 保存资料
const saveProfile = async () => {
  // 验证表单
  const isNicknameValid = validateNickname(userProfile.nickname)
  const isEmailValid = validateEmail(userProfile.email)
  const isBioValid = validateBio(userProfile.bio)
  const isCollegeValid = validateCollege(userProfile.college)

  if (!isNicknameValid || !isEmailValid || !isBioValid || !isCollegeValid) {
    toast.show('请检查表单输入')
    return
  }

  try {
    // 显示加载状态
    uni.showLoading({title: '保存中...'})

    // 调用API保存
    const updateData = {
      nickname: userProfile.nickname,
      gender: userProfile.gender,
      email: userProfile.email,
      introduction: userProfile.bio,
      grade: userProfile.grade,
      college: userProfile.college,
      location: '' // 如果需要地理位置字段可以添加
    }

    // 调用实际的API
    await UserApi.updateProfile(updateData)

    // 保存成功
    uni.hideLoading()
    toast.show('保存成功')

    // 返回上一页
    setTimeout(() => {
      router.back()
    }, 1500)

  } catch (error) {
    uni.hideLoading()
    toast.show('保存失败，请重试')
    console.error('保存资料失败:', error)
  }
}

// 格式化封禁时间
const formatBanTime = (timestamp) => {
  if (timestamp === -1) return '未被封禁'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// 获取用户资料
const loadUserProfile = async () => {
  try {
    uni.showLoading({title: '加载中...'})
    const res = await UserApi.getMyProfile()
    const userAvatar = userStore.getAvatarUrl()

    // 更新用户资料数据
    Object.assign(userProfile, {
      openid: res.open_id,
      realName: res.username || '', // 后端返回的真实姓名字段
      nickname: res.nickname,
      gender: res.gender,
      role: res.role,
      grade: res.grade || 0,
      college: res.college || '计算机学院',
      phone: res.phone,
      email: res.email,
      bio: res.introduction,
      banEndTime: res.banned_at || -1,
      avatar: userAvatar
    })

    uni.hideLoading()
  } catch (error) {
    toast.show('获取用户信息失败')
    console.error('获取用户信息失败:', error)
  } finally {
    uni.hideLoading()
  }
}

// 页面加载
onLoad((options) => {
  // 加载用户资料
  loadUserProfile()
})
</script>

<template>
  <Layout>
    <template #center>
      <text class="text-lg font-medium text-gray-800">编辑资料</text>
    </template>

    <view class="min-h-screen bg-gray-50">
      <!-- 头像区域 -->
      <view class="bg-white py-6 mb-3">
        <view class="flex flex-col items-center">
          <view class="relative mb-4">
            <image
                :src="userProfile.avatar"
                class="w-24 h-24 rounded-full border-4 border-gray-100 shadow-md"
                mode="aspectFill"
            />
            <view
                class="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg active:opacity-80"
                @tap="chooseAvatar"
            >
              <WdIcon name="camera" size="16" color="white"/>
            </view>
          </view>
          <text class="text-sm text-gray-500">点击更换头像</text>
        </view>
      </view>

      <!-- 基本信息 -->
      <wd-cell-group border custom-class="mb-3 rounded-none">
        <wd-cell-group title="基本信息" custom-class="bg-white">
          <!-- OpenID -->
          <wd-cell title="OpenID" center>
            <template #icon>
              <WdIcon name="user" size="18" color="#666" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                {{ userProfile.openid }}
              </view>
            </template>
          </wd-cell>

          <!-- 真实姓名 -->
          <wd-cell title="真实姓名" center>
            <template #icon>
              <WdIcon name="note" size="18" color="#666" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                {{ userProfile.realName }}
              </view>
            </template>
          </wd-cell>

          <!-- 角色 -->
          <wd-cell title="角色" center>
            <template #icon>
              <WdIcon name="user-avatar" size="18" color="#666" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                {{ roleText[userProfile.role] }}
              </view>
            </template>
          </wd-cell>

          <!-- 手机号 -->
          <wd-cell title="手机号" center>
            <template #icon>
              <WdIcon name="phone" size="18" color="#666" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded">
                {{ userProfile.phone }}
              </view>
            </template>
          </wd-cell>

          <!-- 封禁状态 -->
          <wd-cell v-if="userProfile.banEndTime !== -1" title="解封时间" center>
            <template #icon>
              <WdIcon name="warning" size="18" color="#ef4444" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="bg-red-100 text-red-500 text-xs px-2 py-1 rounded">
                {{ formatBanTime(userProfile.banEndTime) }}
              </view>
            </template>
          </wd-cell>
        </wd-cell-group>
      </wd-cell-group>

      <!-- 可编辑信息 -->
      <wd-cell-group border custom-class="mb-3 rounded-none">
        <wd-cell-group title="个人信息" custom-class="bg-white">
          <!-- 昵称 -->
          <wd-cell title="昵称" center>
            <template #icon>
              <WdIcon name="edit" size="18" color="#3b82f6" class="mr-2"/>
            </template>
            <wd-input
                v-model="userProfile.nickname"
                placeholder="请输入昵称"
                clearable
                :maxlength="20"
                show-word-limit
                :error="!!nicknameError"
                @blur="validateNickname(userProfile.nickname)"
                custom-style="text-align: right;"
            />
          </wd-cell>
          <view v-if="nicknameError" class="px-4 pb-2">
            <text class="text-red-500 text-sm">{{ nicknameError }}</text>
          </view>

          <!-- 性别 -->
          <wd-cell title="性别" center clickable @click="chooseGender">
            <template #icon>
              <WdIcon name="gender-male" size="18" color="#3b82f6" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="flex items-center">
                <text class="text-gray-600 mr-2">{{ genderText[userProfile.gender] }}</text>
                <WdIcon name="arrow-right" size="16" color="#999"/>
              </view>
            </template>
          </wd-cell>

          <!-- 年级 -->
          <wd-cell title="年级" center clickable @click="chooseGrade">
            <template #icon>
              <WdIcon name="usergroup" size="18" color="#3b82f6" class="mr-2"/>
            </template>
            <template #right-icon>
              <view class="flex items-center">
                <text class="text-gray-600 mr-2">{{ gradeText[userProfile.grade] }}</text>
                <WdIcon name="arrow-right" size="16" color="#999"/>
              </view>
            </template>
          </wd-cell>

          <!-- 学院 -->
          <wd-cell title="学院" center>
            <template #icon>
              <WdIcon name="books" size="18" color="#3b82f6" class="mr-2"/>
            </template>
            <wd-input
                v-model="userProfile.college"
                placeholder="请输入学院名称"
                clearable
                :maxlength="50"
                show-word-limit
                :error="!!collegeError"
                @blur="validateCollege(userProfile.college)"
                custom-style="text-align: right;"
            />
          </wd-cell>
          <view v-if="collegeError" class="px-4 pb-2">
            <text class="text-red-500 text-sm">{{ collegeError }}</text>
          </view>

          <!-- 邮箱 -->
          <wd-cell title="邮箱" center>
            <template #icon>
              <WdIcon name="mail" size="18" color="#3b82f6" class="mr-2"/>
            </template>
            <wd-input
                v-model="userProfile.email"
                placeholder="请输入邮箱地址"
                clearable
                type="email"
                :error="!!emailError"
                @blur="validateEmail(userProfile.email)"
                custom-style="text-align: right;"
            />
          </wd-cell>
          <view v-if="emailError" class="px-4 pb-2">
            <text class="text-red-500 text-sm">{{ emailError }}</text>
          </view>
        </wd-cell-group>
      </wd-cell-group>

      <!-- 个人介绍 -->
      <wd-cell-group border custom-class="mb-6 rounded-none">
        <wd-cell-group title="个人介绍" custom-class="bg-white">
          <view class="p-4">
            <wd-textarea
                v-model="userProfile.bio"
                placeholder="介绍一下自己吧..."
                :maxlength="100"
                show-word-limit
                :auto-height="true"
                :error="!!bioError"
                @blur="validateBio(userProfile.bio)"
                custom-style="min-height: 100px;"
            />
            <view v-if="bioError" class="mt-2">
              <text class="text-red-500 text-sm">{{ bioError }}</text>
            </view>
          </view>
        </wd-cell-group>
      </wd-cell-group>

      <!-- 保存按钮 -->
      <view class="px-4 pb-8">
        <wd-button
            type="primary"
            size="large"
            block
            round
            @click="saveProfile"
            custom-class="h-12 shadow-lg"
        >
          保存修改
        </wd-button>
      </view>

      <!-- 底部提示 -->
      <view class="text-center pb-6">
        <text class="text-xs text-gray-400">
          修改信息需要管理员审核，请耐心等待
        </text>
      </view>
    </view>

    <!-- 头像裁剪组件已移除，现在直接上传原图 -->
  </Layout>
</template>

<style scoped>
/* 自定义样式 */
:deep(.wd-cell-group__title) {
  color: #374151;
  font-weight: 600;
  font-size: 16px;
  padding: 12px 16px 8px;
}

:deep(.wd-cell) {
  padding: 16px;
}

:deep(.wd-cell__title) {
  font-weight: 500;
  color: #374151;
}

:deep(.wd-cell__value) {
  color: #6b7280;
}

:deep(.wd-input__inner) {
  text-align: right;
}

:deep(.wd-textarea__inner) {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
}

:deep(.wd-radio__label) {
  font-size: 14px;
  color: #374151;
}

:deep(.wd-button--primary) {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
}

:deep(.wd-button--primary:active) {
  background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}
</style>