/**
 * 自定义指令注册文件
 * 集中管理所有自定义指令
 */

import longpress from './longpress'

export default {
  install(app) {
    // 注册长按指令
    app.directive('longpress', longpress)
    
    // 这里可以注册更多的自定义指令
    // app.directive('其他指令名', 其他指令对象)
  }
}