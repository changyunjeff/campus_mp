const list = [
    {
        path: 'pages/index/community',
        text: '社区',
        icon: 'home',
        name: 'home',
        iconActive: 'home-fill',
        style: {
            navigationBarTitleText: '社区',
            // enablePullDownRefresh: true,
			// onReachBottomDistance: 30,
        },
        meta: {
            title: '社区中心',
            footer: true,
        }
    },
    {
        path: 'pages/index/goods',
        text: '闲置',
        icon: 'shopping',
        name: 'goods',
        iconActive: 'shopping-fill',
        style: {
            navigationBarTitleText: '首页',
            enablePullDownRefresh: true,
            onReachBottomDistance: 100,
        },
        meta: {
            title: '商品闲置',
            footer: true,
            pageScroll: true, // 启用页面级滚动
        }
    },
    {
        text: '发布',
        path: 'pages/index/add',
    },
    {
        path: 'pages/index/message',
        text: '消息',
        icon: 'message',
        name: 'message',
        iconActive: 'message-fill',
        meta: {
            title: '我的消息',
            footer: true,
        }
    },
    {
        path: 'pages/index/personal',
        text: '我的',
        icon: 'meh',
        name: 'personal',
        iconActive: 'smile-fill',
        meta: {
            title: '个人中心',
            footer: true,
        }
    }
]

export default list