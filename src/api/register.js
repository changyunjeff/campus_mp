import {get, post, put, del, upload} from '@/utils/request'

/**
 * RegisterApi 注册接口
 */
export const RegisterApi = {
    /**
     * 检查当前注册进度
     * @returns {Promise<Object>} 注册进度信息
     */
    check: () => get('/register/current'),

    /**
     * 提交注册流程
     * @param {Object} data 表单数据
     * @returns {Promise<Object>} 提交结果
     */
    process: (data) => post('/register/process', data),

    /**
     * 提交第一步：选择身份
     * @param {Object} data
     * @param {number} data.role 角色ID
     * @returns {Promise<Object>}
     */
    submitStep1: (data) => post('/register/submit1', {
        role: data.role
    }),

    /**
     * 提交第二步：学生证信息
     * @param {Object} data
     * @param {string} data.code 学号
     * @param {string} data.real_name 真实姓名
     * @param {Object} data.front_media 正面照片媒体信息
     * @param {Object} data.back_media 反面照片媒体信息
     * @returns {Promise<Object>}
     */
    submitStep2: (data) => post('/register/submit2', {
        code: data.code,
        real_name: data.real_name,
        front_media: data.front_media,
        back_media: data.back_media
    }),

    /**
     * 提交第三步：联系方式
     * @param {Object} data
     * @param {string} data.phone 手机号
     * @param {string} data.sms_code 短信验证码
     * @param {string} data.email_address 邮箱地址
     * @param {string} data.nick_name 昵称
     * @returns {Promise<Object>}
     */
    submitStep3: (data) => post('/register/submit3', {
        phone: data.phone,
        sms_code: data.sms_code,
        email_address: data.email_address,
        nick_name: data.nick_name
    }),

    /**
     * 上传注册流程媒体文件到OSS（第一步：仅上传）
     * @param {Object} params
     * @param {string} params.file 文件路径
     * @param {string} params.procedure_id 注册流程ID
     * @param {string} params.type 媒体类型 (student_card_front/student_card_back)
     * @param {Function} params.onProgress 进度回调
     * @returns {Promise<Object>}
     */
    uploadMediaToOSS: ({file, procedure_id, type, onProgress}) => upload('/media/upload/register/procedure', file, {
        formData: {
            procedure_id: procedure_id,
            type: type,
        },
        callback: onProgress
    }),

    /**
     * 删除注册流程媒体文件
     * @param {Object} data
     * @param {string} data.media_id 媒体ID
     * @param {boolean} data.hard_delete 是否硬删除
     * @returns {Promise<Object>}
     */
    deleteMedia: (data) => post('/media/delete/register/procedure', {
        media_id: data.media_id,
        hard_delete: data.hard_delete || false
    }),

    /**
     * 删除注册流程OSS文件（第一步上传后的删除）
     * @param {Object} data
     * @param {string} data.object_key OSS对象键
     * @returns {Promise<Object>}
     */
    deleteOSSFile: (data) => post('/media/delete/register/procedure', {
        object_key: data.object_key
    }),

    /**
     * 获取短信验证码
     * @param {String} phone 手机号
     * @returns {Promise<Object>} 发送结果
     */
    getSMSCode: (phone) => {
        return new Promise(resolve => {
            console.log('Send SMS to:', phone)

            setTimeout(() => {
                resolve({
                    status: 'success',
                    message: '验证码已发送'
                })

                // 显示提示
                uni.showToast({
                    title: '验证码已发送',
                    icon: 'none'
                })
            }, 800)
        })
    },

    /**
     * 切换验证状态（仅用于测试）
     * @param {String} status 状态 ('success', 'rejected', 'pending')
     * @param {String} reason 驳回原因
     * @returns {Promise<Object>} 结果
     */
    toggleVerifyStatus: (status, reason = '') => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    status: 'success',
                    verifyStatus: status,
                    rejectReason: reason
                })
            }, 500)
        })
    }
}