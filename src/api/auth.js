import { post } from '@/utils/request'

/**
 * AuthApi 认证接口
 * @param {Function} login 登录
 */
export const AuthApi = {
    /**
     * login 登录
     * @param {string} code 
     * @returns {Promise<LoginResponse>}
     */
    login: (code) => post('/wxlogin', { code }),
}