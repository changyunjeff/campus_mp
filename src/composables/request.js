import { objectToQuery } from '../utils/param';
import { concat } from '@/utils/string';
import { ERR_TOKEN_EXPIRE } from '@/constants/error';

let instance = null;


export function useRequest() {
    if (instance) return instance

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
            uni.request({
                url: options.url.startsWith('http')?url:concat(`${import.meta.env.VITE_APP_BASE_URL}`, options.url),
                method: options.method,
                header: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${uni.getStorageSync('token')}`,
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
                    resolve(res)
                },
                fail: (err) => {
                    reject(err)
                },
                complete: () => {}
            })
        })
    }

    const socket = (config={}) => {
        return new Promise((resolve, reject) => {
            const task = uni.connectSocket({
                url: concat(`${import.meta.env.VITE_APP_WEBSOCKET_URL}`, 'ws'),
                timeout: config.timeout, 
                // protocols: [uni.getStorageSync('token')], // 使用子协议传递token
                header: {
                    'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                },
                success: (res) => {
                    console.debug('socket res:', res)
                    resolve(task) // 返回WebSocket实例以便后续操作
                },
                fail: (err) => {
                    reject(err)
                }
            })
            task.onOpen((res) => {
                config.onOpen && config.onOpen(res)
            })
            task.onMessage((res) => {
                config.onMessage && config.onMessage(res)
            })
            task.onError((err) => {
                config.onError && config.onError(err)
            })
            task.onClose((res) => {
                config.onClose && config.onClose(res)
            })
        }) 
    }

    const upload = (url, filePath, config={}) => {
        return new Promise((resolve, reject) => {
            const task = uni.uploadFile({
                url: url.startsWith('http')?url:concat(`${import.meta.env.VITE_APP_BASE_URL}`, url),
                filePath: filePath,
                name: 'file',
                timeout: config.timeout,
                header: {
                    'Authorization': `Bearer ${uni.getStorageSync('token')}`,
                    ...config.header,
                },
                success: (res) => {
                    const needRelogin = handleExpire(res)
                    if (needRelogin) {
                        reject(ERR_TOKEN_EXPIRE)
                    }
                    if (res.statusCode === 200) {
                        JSON.parse(res.data).code === 0 ? resolve(res) : reject(res) 
                    } else {
                        reject(res) 
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

    const download = (url, filePath, config={}) => {
        return new Promise((resolve, reject) => {
            const task = uni.downloadFile({
                url: url.startsWith('http')?url:concat(`${import.meta.env.VITE_APP_BASE_URL}`, url),
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

    const get = (url, params=null, config={}) => {
        return http({
            url: params ? `${url}?${objectToQuery(params)}` : url,
            method: 'GET',
            ...config,
        })
    }

    const post = (url, data=null, config={}) => {
        return http({
            url: url,
            method: 'POST',
            data: data,
            ...config,
        })
    }

    const put = (url, data=null, config={}) => {
        return http({
            url: url,
            method: 'PUT',
            data: data,
           ...config,
        }) 
    }

    const del = (url, params=null, config={}) => {
        return http({
            url: params? `${url}?${objectToQuery(params)}` : url,
            method: 'DELETE',
           ...config,
        }) 
    }

    

    instance = {
        get,
        post,
        put,
        del,
        upload,
        download,
        socket,
    }
    return instance
}
