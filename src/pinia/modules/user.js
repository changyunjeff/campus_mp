import {defineStore} from 'pinia'
import {AuthApi} from '@/api/auth'

export const useUserStore = defineStore('user', () => {
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
            return res
        } catch (err) {
            console.log(err) 
        }
    }

    return {
        login
    }
})