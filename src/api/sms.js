import {get} from '@/utils/request'

/**
 * RegisterApi 注册接口
 * 使用模拟数据以便前端测试视觉效果
 */
export const SMSApi = {
    /**
     * 获取短信验证码
     * @param {String} phone 手机号
     * @returns {Promise<Object>} 发送结果
     */
    getSMSCode: (phone) => get('/sms/send', {phone}),
}