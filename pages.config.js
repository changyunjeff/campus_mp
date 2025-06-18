import {defineUniPages} from '@uni-helper/vite-plugin-uni-pages'
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
        },
        {
            path: 'pages/choose-school',
            name: 'choose-school',
            type: 'home',
            style: {
                navigationBarTitleText: '选择学校',
                navigationStyle: 'custom',
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
                        title: '聊天',
                        footer: true,
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
                    path: 'pages/message/likesAndFavorite',
                    name: 'likesAndFavorite',
                    meta: {
                        title: '喜欢和收藏'
                    }
                },
                {
                    path: 'pages/message/NewFans',
                    name: 'NewFans',
                    meta: {
                        title: '新增关注'
                    }
                },
                {
                    path: 'pages/message/CommentAndMention',
                    name: 'CommentAndMention',
                    meta: {
                        title: '评论和@'
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
                {
                    path: 'pages/community/post-detail',
                    name: 'post_detail',
                    style: {
                        navigationBarTitleText: '帖子详情'
                    },
                    meta: {
                        title: '帖子详情',
                        footer: true,
                        verify: true,
                    }
                },
                {
                    path: 'pages/community/community-search',
                    name: 'community_search',
                    style: {
                        navigationBarTitleText: '搜索'
                    },
                    meta: {
                        title: '搜索'
                    }
                },
                {
                    path: 'pages/community/publish-post',
                    name: 'publish_post',
                    style: {
                        navigationBarTitleText: '发布帖子'
                    },
                    meta: {
                        title: '发布帖子',
                        verify: true,
                    }
                },
                {
                    path: 'pages/community/topic-detail',
                    name: 'topic_detail',
                    style: {
                        navigationBarTitleText: '帖子详情'
                    },
                    meta: {
                        title: '帖子详情',
                        verify: true,
                    }
                },
                {
                    path: 'pages/community/report',
                    name: 'report',
                    style: {
                        navigationBarTitleText: '举报'
                    },
                    meta: {
                        title: '举报'
                    }
                },
                {
                    path: 'pages/community/community-personal-center',
                    name: 'community_personal_center',
                    style: {
                        navigationBarTitleText: '个人中心'
                    },
                    meta: {
                        title: '个人中心'
                    }
                },
                {
                    path: 'pages/goods/categories',
                    name: 'categories',
                    style: {
                        navigationBarTitleText: '分类'
                    },
                    meta: {
                        title: '分类'
                    }
                },
                {
                    path: 'pages/goods/goods-details',
                    name: 'goods-details',
                    style: {
                        navigationBarTitleText: '商品详情'
                    },
                    meta: {
                        title: '商品详情',
                        footer: true,
                    }
                },
                {
                    path: 'pages/goods/order-confirm',
                    name: 'order_confirm',
                    style: {
                        navigationBarTitleText: '确认订单'
                    },
                    meta: {
                        title: '确认订单'
                    }
                },
                {
                    path: 'pages/goods/addresses',
                    name: 'addresses',
                    style: {
                        navigationBarTitleText: '地址管理'
                    },
                    meta: {
                        title: '地址管理'
                    }
                },
                {
                    path: 'pages/goods/pay-confirm',
                    name: 'pay_confirm',
                    style: {
                        navigationBarTitleText: '确认支付'
                    },
                    meta: {
                        title: '确认支付'
                    }
                },
                {
                    path: 'pages/goods/goods-publish-category',
                    name: 'publish_goods_category',
                    style: {
                        navigationBarTitleText: '发布商品-选择类别'
                    },
                    meta: {
                        title: '发布商品-选择类别'
                    }
                },
                {
                    path: 'pages/goods/goods-publish-submit',
                    name: 'publish_goods_submit',
                    style: {
                        navigationBarTitleText: '发布商品-填写参数'
                    },
                    meta: {
                        title: '发布商品-填写参数'
                    }
                },
                {
                    path: 'pages/goods/goods-personal-center',
                    name: 'goods_personal_center',
                    style: {
                        navigationBarTitleText: '个人中心'
                    },
                    meta: {
                        title: '个人中心',
                        verify: true
                    }
                },
                {
                    path: 'pages/profile/edit-profile',
                    name: 'edit_profile',
                    style: {
                        navigationBarTitleText: '编辑资料'
                    },
                    meta: {
                        title: '编辑资料'
                    }
                },
                {
                    path: 'pages/profile/other-index',
                    name: 'other_index',
                    style: {
                        navigationBarTitleText: '用户资料'
                    },
                    meta: {
                        title: '用户资料'
                    }
                },
                {
                    path: 'pages/contact/index',
                    name: 'Contact',
                    style: {
                        navigationBarTitleText: '通讯录'
                    },
                    meta: {
                        title: '通讯录',
                    }
                },
                {
                    path: 'pages/settings/index',
                    name: 'settings',
                    style: {
                        navigationBarTitleText: '系统设置'
                    },
                    meta: {
                        title: '系统设置'
                    }
                },
                {
                    path: 'pages/settings/blocked-users',
                    name: 'blocked_users',
                    style: {
                        navigationBarTitleText: '我的屏蔽'
                    },
                    meta: {
                        title: '我的屏蔽'
                    }
                },
                {
                    path: 'pages/settings/user-agreement',
                    name: 'user_agreement',
                    style: {
                        navigationBarTitleText: '用户协议'
                    },
                    meta: {
                        title: '用户协议'
                    }
                },
                {
                    path: 'pages/settings/privacy-policy',
                    name: 'privacy_policy',
                    style: {
                        navigationBarTitleText: '隐私政策'
                    },
                    meta: {
                        title: '隐私政策'
                    }
                },
                {
                    path: 'pages/settings/contact-us',
                    name: 'contact_us',
                    style: {
                        navigationBarTitleText: '联系我们'
                    },
                    meta: {
                        title: '联系我们'
                    }
                },
                {
                    path: 'pages/activity/center',
                    name: 'activity_center',
                    style: {
                        navigationBarTitleText: '活动中心'
                    },
                    meta: {
                        title: '活动中心'
                    },
                },
                {
                    path: 'pages/activity/publish',
                    name: 'activity_publish',
                    style: {
                        navigationBarTitleText: '发布活动'
                    },
                    meta: {
                        title: '发布活动'
                    },
                },
                {
                    path: 'pages/activity/my',
                    name: 'activity_my',
                    style: {
                        navigationBarTitleText: '我的活动'
                    },
                    meta: {
                        title: '我的活动'
                    },
                },
                {
                    path: 'pages/activity/detail',
                    name: 'activity_detail',
                    style: {
                        navigationBarTitleText: '活动详情'
                    },
                    meta: {
                        title: '活动详情'
                    },
                },
                {
                    path: 'pages/feedback/index',
                    name: 'feedback',
                    style: {
                        navigationBarTitleText: '反馈与建议'
                    },
                    meta: {
                        title: '反馈与建议'
                    }
                }
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
