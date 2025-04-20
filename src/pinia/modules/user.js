import {defineStore} from 'pinia'
import {AuthApi} from '@/api/auth'
import { useConnection } from '@/composables/connection'

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

            const res = await AuthApi.login(code)
            console.debug('📥 登录成功:', res)
            openid.value = res.openid
            console.debug('openid:', openid.value)
            const connection = useConnection()
            await connection.connect()
            return res
        } catch (err) {
            console.log(err) 
        }
    }

    return {
        openid,
        login
    }
})