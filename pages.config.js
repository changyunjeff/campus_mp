import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'
import tabbar from './src/configs/tabbar'

export default defineUniPages({
  pages: [
    ...tabbar,
    {
      path: 'pages/welcome',
      type: 'home',
      style: {
        navigationBarTitleText: '欢迎页',
      },
    },
    {
      path: 'pages/iconfont-demo',
      style: {
        navigationBarTitleText: '首页',
      },
    },
    {
      path: 'pages/websocket-demo',
      style: {
        navigationBarTitleText: 'WebSocket 示例',
      },
    }
  ],
  subPackages: [],
  globalStyle: {
    backgroundColor: '@bgColor',
    backgroundColorBottom: '@bgColorBottom',
    backgroundColorTop: '@bgColorTop',
    backgroundTextStyle: '@bgTxtStyle',
    navigationBarBackgroundColor: '#000000',
    navigationBarTextStyle: '@navTxtStyle',
    navigationBarTitleText: 'Uni Creator',
    navigationStyle: 'custom',
  },
  tabBar: {
    custom: true,
    color: "#999",
    selectedColor: "#ff4b4b",
    backgroundColor: "#ffffff",
    borderStyle: "white",
    list: [
      {
        text: "社区",
        pagePath: "pages/index/community",
      },
      {
        text: "闲置",
        pagePath: "pages/index/goods",
      },
      {
        text: "",
        pagePath: "pages/index/add",
      },
      {
        text: "消息",
        pagePath: "pages/index/message",
      },
      {
        text: "我的",
        pagePath: "pages/index/personal",
      },
    ],
  },
  usingComponents: {},
})
