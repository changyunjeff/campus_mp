import { defineUniPages } from '@uni-helper/vite-plugin-uni-pages'
import tabbar from './src/configs/tabbar'

export default defineUniPages({
  easycom: {
    autoscan: true,
    custom: {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue",
    },
  },
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
    },
    {
      path: 'pages/action-sheet-demo',
      name: 'action-sheet-demo',
      style: {
        navigationBarTitleText: 'ActionSheet 示例',
      },
    }
  ],
  subPackages: [
    {
      root: 'subpackages/pages/message',
      pages: [
        {
          path: 'private_chat',
          style: {
            navigationBarTitleText: '私聊',
          },
          meta: {
            title: '聊天'
          }
        },
        {
          path: 'notification_chat',
          name: 'notification_chat',
          meta: {
            title: '系统通知'
          }
        },
        {
          path: 'private_chat_more',
          name: 'private_chat_more',
          meta: {
            title: ''
          }
        },
      ]
    }
  ],
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
