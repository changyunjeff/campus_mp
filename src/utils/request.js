import {objectToQuery} from '@/utils/param';
import {concat} from '@/utils/string';
import {ERR_TOKEN_EXPIRE} from '@/constants/error';

/**
 * handleExpire 处理token过期
 * @param {UniApp.RequestSuccessCallbackResult} res
 */
const handleExpire = (res) => {
    const token = uni.getStorageSync('token')
    if (!token || res.statusCode === 401) {
        console.log('token过期')

        uni.removeStorageSync('token')
        const newAccessToken = res.header['New-Access-Token']
        if (newAccessToken) {
            uni.setStorageSync('token', newAccessToken)
        }

        if (res.statusCode === 401) {
            uni.showToast({
                title: '登录过期，请重新登录...',
                icon: 'none',
                duration: 2000,
                mask: true,
            })
            return true
        }
    }
    return false
}

/**
 * @param {Options} options
 * @returns {Promise}
 */
const http = (options) => {
    return new Promise((resolve, reject) => {

        // 获取学校编码
        let schoolCode = 'suda' // 默认值
        try {
            const schoolData = uni.getStorageSync('school_selection')
            if (schoolData) {
                const { useSchoolStore } = require('@/pinia/modules/school')
                const schoolStore = useSchoolStore()
                schoolCode = schoolStore.currentSchoolCode || 'suda'
            }
        } catch (error) {
            console.warn('获取学校编码失败，使用默认值:', error)
        }

        uni.request({
            url: options.url.startsWith('http') ? url : concat(`${import.meta.env.VITE_APP_BASE_URL}`, options.url),
            method: options.method,
            header: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                'X-School': schoolCode,
                ...options.header,
            },
            data: options.data,
            timeout: options.timeout,
            success: (res) => {
                console.debug('http response:', res)
                // 处理token过期
                const needRelogin = handleExpire(res)
                if (needRelogin) {
                    reject(ERR_TOKEN_EXPIRE)
                }

                if (res.statusCode !== 200) {
                    reject(new Error(res.errMsg))
                }

                const data = res.data
                if (data.code !== 0) {
                    reject(new Error(data.msg))
                }

                resolve(data.data)
            },
            fail: (err) => {
                reject(err)
            },
            complete: () => {
            }
        })
    })
}

export const socket = (config = {}) => {
    return new Promise((resolve, reject) => {
        // 获取学校编码
        let schoolCode = 'suda' // 默认值
        try {
            const schoolData = uni.getStorageSync('school_selection')
            if (schoolData) {
                const { useSchoolStore } = require('@/pinia/modules/school')
                const schoolStore = useSchoolStore()
                schoolCode = schoolStore.currentSchoolCode || 'suda'
            }
        } catch (error) {
            console.warn('获取学校编码失败，使用默认值:', error)
        }

        const task = uni.connectSocket({
            url: concat(`${import.meta.env.VITE_APP_WEBSOCKET_URL}`, 'ws'),
            timeout: config.timeout,
            // protocols: [uni.getStorageSync('token')], // 使用子协议传递token
            header: {
                'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                'X-School': schoolCode,
            },
            success: (res) => {
                console.debug('socket res:', res)
                resolve(task) // 返回WebSocket实例以便后续操作
            },
            fail: (err) => {
                console.error('建立websocket时发生错误：', err)
                reject(err)
            }
        })
        task.onOpen((res) => {
            console.debug('websocket 已经成功建立了连接：', res)
            config.onOpen && config.onOpen(res)
        })
        task.onMessage((res) => {
            console.debug('websocket 收到了新消息', res)
            config.onMessage && config.onMessage(res)
        })
        task.onError((err) => {
            console.error('websocket 发生了错误：', err)
            config.onError && config.onError(err)
        })
        task.onClose((res) => {
            console.debug('websocket 已经关闭：', res)
            config.onClose && config.onClose(res)
        })
    })
}

/**
 * @param {string} url - 请求地址
 * @param {string} filePath - 文件路径
 * @param {Object} config - 配置
 * */
export const upload = (url, filePath, config = {}) => {
    return new Promise((resolve, reject) => {
        // 获取学校编码
        let schoolCode = 'suda' // 默认值
        try {
            const schoolData = uni.getStorageSync('school_selection')
            if (schoolData) {
                const { useSchoolStore } = require('@/pinia/modules/school')
                const schoolStore = useSchoolStore()
                schoolCode = schoolStore.currentSchoolCode || 'suda'
            }
        } catch (error) {
            console.warn('获取学校编码失败，使用默认值:', error)
        }

        const task = uni.uploadFile({
            url: url.startsWith('http') ? url : concat(`${import.meta.env.VITE_APP_BASE_URL}`, url),
            filePath: filePath,
            name: 'file',
            timeout: config.timeout,
            formData: config.formData,
            header: {
                'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                'X-School': schoolCode,
                ...config.header,
            },
            success: (res) => {
                const needRelogin = handleExpire(res)
                if (needRelogin) {
                    reject(ERR_TOKEN_EXPIRE)
                }
                if (res.statusCode === 200) {
                    try {
                        const parsedData = JSON.parse(res.data)
                        if (parsedData.code === 0) {
                            // 返回解析后的数据，而不是原始响应
                            resolve(parsedData.data)
                        } else {
                            reject(new Error(parsedData.msg || '上传失败'))
                        }
                    } catch (parseError) {
                        console.error('解析上传响应失败:', parseError)
                        reject(new Error('响应数据格式错误'))
                    }
                } else {
                    reject(new Error(`上传失败，状态码: ${res.statusCode}`))
                }
            },
            fail: (err) => {
                reject(err)
            },
        })
        if (config.callback) {
            task.onProgressUpdate((res) => {
                config.callback({
                    progress: Math.round((res.totalBytesSent / res.totalBytesExpectedToSend) * 100)
                })
            })
        }
    })
}

/**
 * batch_upload 多文件上传 - 微信小程序适配版本
 * 由于微信小程序不支持files数组方式，统一使用循环上传
 * @param {string} url - 请求地址
 * @param {Array} files - 文件列表
 * @param {Object} config - 配置
 * */
export const batch_upload = (url, files, config = {}) => {
    return new Promise((resolve, reject) => {
        if (!files || files.length === 0) {
            reject(new Error('文件列表为空'))
            return
        }

        // 用于跟踪每个文件的上传进度
        const progressMap = new Map()
        // 用于存储每个文件上传的Promise
        const uploadPromises = []

        // 计算总体进度并回调
        const updateTotalProgress = () => {
            if (!config.callback) return
            
            let totalProgress = 0
            progressMap.forEach(progress => {
                totalProgress += progress
            })
            
            // 计算平均进度
            const averageProgress = Math.round(totalProgress / files.length)
            config.callback({
                progress: averageProgress,
                detail: Object.fromEntries(progressMap)
            })
        }

        // 为每个文件创建上传任务
        files.forEach((file, index) => {
            // 初始化进度为0
            progressMap.set(index, 0)
            
            // 创建单个文件的上传配置
            const fileConfig = {
                ...config,
                formData: {
                    ...config.formData,
                    index: index // 可选：传递文件索引
                },
                callback: (progressInfo) => {
                    // 更新此文件的进度
                    progressMap.set(index, progressInfo.progress)
                    // 计算并回调总体进度
                    updateTotalProgress()
                }
            }
            
            // 添加到上传Promise数组
            uploadPromises.push(
                upload(url, file, fileConfig)
                    .then(result => ({
                        index,
                        result,
                        success: true
                    }))
                    .catch(error => ({
                        index,
                        error,
                        success: false
                    }))
            )
        })

        // 等待所有上传完成
        Promise.all(uploadPromises)
            .then(results => {
                // 检查是否有失败的上传
                const failedUploads = results.filter(r => !r.success)
                
                if (failedUploads.length > 0) {
                    // 有失败的上传，但仍然返回所有结果
                    resolve({
                        success: results.filter(r => r.success).map(r => r.result),
                        failed: failedUploads.map(f => ({ index: f.index, error: f.error }))
                    })
                } else {
                    // 所有上传成功
                    resolve(results.map(r => r.result))
                }
            })
            .catch(err => {
                reject(err)
            })
    })
}

export const download = (url, filePath, config = {}) => {
    return new Promise((resolve, reject) => {
        const task = uni.downloadFile({
            url: url.startsWith('http') ? url : concat(`${import.meta.env.VITE_APP_BASE_URL}`, url),
            filePath: filePath,
            timeout: config.timeout,
            success: (res) => {
                if (res.statusCode === 200) {
                    resolve(res)
                }
            },
            fail: (err) => {
                reject(err)
            },
        })
        if (config.callback) {
            task.onProgressUpdate((res) => {
                config.callback({
                    progress: Math.round((res.totalBytesSent / res.totalBytesExpectedToSend) * 100)
                })
            })
        }
    })
}

/**
 * get
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 配置
 * */
export const get = (url, params = null, config = {}) => {
    return http({
        url: params ? `${url}?${objectToQuery(params)}` : url,
        method: 'GET',
        ...config,
    })
}

/**
 * post
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} config - 配置
 * */
export const post = (url, data = null, config = {}) => {
    return http({
        url: url,
        method: 'POST',
        data: data,
        ...config,
    })
}

/**
 * put
 * @param {string} url - 请求地址
 * @param {Object} data - 请求参数
 * @param {Object} config - 配置
 * */
export const put = (url, data = null, config = {}) => {
    return http({
        url: url,
        method: 'PUT',
        data: data,
        ...config,
    })
}

/**
 * delete
 * @param {string} url - 请求地址
 * @param {Object} params - 请求参数
 * @param {Object} config - 配置
 * */
export const del = (url, params = null, config = {}) => {
    return http({
        url: params ? `${url}?${objectToQuery(params)}` : url,
        method: 'DELETE',
        ...config,
    })
}