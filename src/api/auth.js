import { useRequest } from '@/composables/request'

const { get, post, put, del, upload, download, socket } = useRequest()

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