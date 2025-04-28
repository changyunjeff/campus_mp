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
      root: 'subpackages',
      pages: [
        {
          path: 'pages/message/private_chat',
          name: 'private_chat',
          style: {
            navigationBarTitleText: '私聊',
          },
          meta: {
            title: '聊天'
          }
        },
        {
          path: 'pages/message/notification_chat',
          name: 'notification_chat',
          meta: {
            title: '系统通知'
          }
        },
        {
          path: 'pages/message/private_chat_more',
          name: 'private_chat_more',
          meta: {
            title: ''
          }
        },
        {
          path: 'pages/register/step1',
          name: 'validation-step1',
          style: {
            navigationBarTitleText: '选择身份',
          },
          meta: {
            title: '选择身份'
          }
        },
        {
          path: 'pages/register/step2',
          name: 'validation-step2',
          style: {
            navigationBarTitleText: '身份认证',
          },
          meta: {
            title: '身份认证'
          }
        },
        {
          path: 'pages/register/step3',
          name: 'validation-step3',
          style: {
            navigationBarTitleText: '联系方式',
          },
          meta: {
            title: '联系方式'
          }
        },
        {
          path: 'pages/register/finish',
          name: 'validation-finish',
          style: {
            navigationBarTitleText: '完成验证',
          },
          meta: {
            title: '完成验证'
          }
        },
      ]
    },
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
