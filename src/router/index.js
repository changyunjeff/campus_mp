import json from '@/pages.json'
import { createRouter } from 'uni-mini-router'
import pagesJsonToRoutes from "uni-parse-pages"

const routers = pagesJsonToRoutes(json)
const router = createRouter({
  routes: routers
})

// 获取当前用户ID的工具函数
const getCurrentUserId = () => {
  // 这里应该从你的用户状态管理中获取当前用户ID
  // 临时从本地存储获取，你可以根据实际情况调整
  return uni.getStorageSync('openid')
}

router.beforeEach(async (to, from) => {
  console.log('beforeEach', to, from)
  
  // 判断是否跳转到其他用户主页，但实际是自己
  if (to.name === 'other_index' && to.params?.id) {
    const currentUserId = getCurrentUserId()
    const targetUserId = to.params.id
    
    // 如果目标用户ID是当前用户自己，跳转到个人主页
    if (currentUserId && targetUserId === currentUserId) {
      console.log('检测到用户访问自己的主页，跳转到personal页面')
      return router.pushTab({
        name: 'personal'
      })
    }
  }
  
  if(!!to?.meta?.verify) {
    // 如果验证完成了，会设置一个缓存，下次进来就不再显示引导页
    const dontShow = uni.getStorageSync('isDontShowGuide')
    if(!dontShow) {
      return router.replace({
        name: 'validation-step1'
      })
    }
  }
})

router.afterEach((to, from) => {
  console.log('afterEach', to, from) 
})

export default router