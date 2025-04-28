import { useRequest } from '@/composables/request'

const { get, post, put, del, upload } = useRequest()

/**
 * RegisterApi 注册接口
 * 使用模拟数据以便前端测试视觉效果
 */
export const RegisterApi = {
    /**
     * 检查当前注册进度
     * @returns {Promise<Object>} 注册进度信息
     */
    check: () => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    status: 'in_progress',
                    stage: 0,
                    processId: 'mock-process-id-' + Date.now()
                })
            }, 500)
        })
    },
    
    /**
     * 提交注册流程
     * @param {Object} data 表单数据
     * @param {Object} auth 验证信息
     * @returns {Promise<Object>} 提交结果
     */
    process: (data, auth = null) => {
        return new Promise(resolve => {
            console.log('Process data:', data)
            console.log('Auth data:', auth)
            
            setTimeout(() => {
                resolve({
                    status: 'success',
                    message: '提交成功'
                })
            }, 1000)
        })
    },
    
    /**
     * 上传文件
     * @param {String} processId 流程ID
     * @param {String} filePath 文件路径
     * @param {Function} onProgress 上传进度回调
     * @returns {Promise<Object>} 上传结果
     */
    uploadFile: (processId, filePath, onProgress) => {
        return new Promise(resolve => {
            // 模拟上传进度
            let progress = 0
            const interval = setInterval(() => {
                progress += 10
                if (progress <= 100) {
                    onProgress({
                        loaded: progress,
                        total: 100
                    })
                } else {
                    clearInterval(interval)
                }
            }, 300)
            
            // 生成临时URL（实际情况下这是服务器返回的URL）
            setTimeout(() => {
                resolve({
                    media_url: filePath, // 使用本地临时路径模拟上传后的URL
                    object_key: 'mock-object-key-' + Date.now()
                })
            }, 3000)
        })
    },
    
    /**
     * 删除文件
     * @param {String} objectKey 文件标识
     * @returns {Promise<Object>} 删除结果
     */
    deleteFile: (objectKey) => {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    status: 'success',
                    message: '删除成功'
                })
            }, 500)
        })
    },
    
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