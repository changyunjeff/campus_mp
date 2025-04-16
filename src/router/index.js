import json from '@/pages.json'
import { createRouter } from 'uni-mini-router'
import pagesJsonToRoutes from "uni-parse-pages";

const routers = pagesJsonToRoutes(json)
const router = createRouter({
  routes: routers
})

router.beforeEach((to, from) => {
  console.log('beforeEach', to, from) 
})

router.afterEach((to, from) => {
  console.log('afterEach', to, from) 
})

export default router