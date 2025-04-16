import { createSSRApp } from 'vue'
import 'uno.css'
import App from './App.vue'
import Pinia from './pinia'
import Router from './router'
import hooks from './hooks'

export function createApp() {
  const app = createSSRApp(App)
  app
    .use(Pinia)
    .use(Router)
    .use(hooks)
  return {
    app,
    Pinia,
  }
}
