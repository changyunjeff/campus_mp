import json from '@/pages.json'
import { createRouter } from 'uni-mini-router'
import pagesJsonToRoutes from "uni-parse-pages"

const routers = pagesJsonToRoutes(json)
const router = createRouter({
  routes: routers
})

router.beforeEach(async (to, from) => {
  console.log('beforeEach', to, from)
  if(!!to?.meta?.verify) {
    // 如果验证完成了，会设置一个缓存，下次进来就不再显示引导页
    const dontShow = uni.getStorageSync('isDontShowGuide')
    if(!dontShow) {
      router.push({
        name: 'validation-step1'
      })
    }
  }
})

router.afterEach((to, from) => {
  console.log('afterEach', to, from) 
})

export default router