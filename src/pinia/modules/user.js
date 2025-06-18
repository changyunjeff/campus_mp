import {defineStore} from 'pinia'
import {AuthApi} from '@/api/auth'
import { useConnection } from '@/composables/connection'
import {useMessage} from "@/composables/message";
import DefaultAvatar from "/static/images/user.png"

export const useUserStore = defineStore('user', () => {

    const openid = ref('')
    const avatar = reactive({
        url: '',
        object_key: '',
        type: ''
    })
    const nickname = ref('')

    const setNickname = (_nickname) => {
        nickname.value = _nickname
    }
    const getNickname = () => {
        return nickname.value || '未知用户'
    }

    /** setAvatar 设置头像
     * 使用方法
     * setAvatar({
     *   url: 'https://example.com/avatar.png',
     *   object_key: 'avatar.png',
     *   type: 'image/png'
     * })
     * */
    const setAvatar = (_avatar) => {
        console.debug("设置头像:", _avatar)
        Object.assign(avatar, _avatar)
    }

    // 获取头像
    const getAvatarUrl = () => {
        console.debug("获取头像url...")
        if (!avatar.url) {
            console.debug("头像为空，使用默认头像")
        }
        return avatar.url || DefaultAvatar
    }

    // 获取头像的object key
    const getAvatarObjectKey = () => {
        return avatar.object_key || ''
    }

    const login = async ()=>{
        try {
            const {code} = await uni.login({
                provider: 'weixin',
            })
            if (!code) {
                throw new Error('获取code失败')
            }
            // 在每次登录前先删除旧的access token，因为每次登录都会生成新的access token和refresh token
            const res = await AuthApi.login(code)
            openid.value = res.openid
            // 连接WebSocket
            const connection = useConnection()
            await connection.connect()
            // 注册消息处理函数
            const message = useMessage()
            message.registerHandlers()
            return res
        } catch (err) {
            console.log(err)
            throw err
        }
    }

    return {
        openid,
        avatar,
        nickname,
        login,
        setNickname,
        getNickname,
        setAvatar,
        getAvatarUrl,
        getAvatarObjectKey,
    }
}, {
    persist: {
        key: 'user',
        paths: ['openid', 'avatar', 'nickname'],
        storage: {
            getItem: uni.getStorageSync,
            setItem: uni.setStorageSync,
        }
    }
})