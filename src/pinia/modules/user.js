import {defineStore} from 'pinia'
import {AuthApi} from '@/api/auth'
import { useConnection } from '@/composables/connection'
import {useMessage} from "@/composables/message";

export const useUserStore = defineStore('user', () => {

    const openid = ref('')

    const login = async ()=>{
        try {
            const {code} = await uni.login({
                provider: 'weixin',
            })
            if (!code) {
                throw new Error('获取code失败')
            }
            console.debug('📤 获取登录code:', code)
            // 在每次登录前先删除旧的access token，因为每次登录都会生成新的access token和refresh token
            const res = await AuthApi.login(code)
            console.debug('📥 登录成功:', res)
            openid.value = res.openid
            console.debug('openid:', openid.value)
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
        login
    }
}, {
    persist: {
        key: 'user',
        paths: ['openid'],
        storage: {
            getItem: uni.getStorageSync,
            setItem: uni.setStorageSync,
        }
    }
})