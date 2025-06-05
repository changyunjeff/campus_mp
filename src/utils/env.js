/**
 * 获取环境变量
 * @param {string} key 环境变量名
 * @param {any} defaultValue 默认值
 * @returns {string|any} 环境变量值
 */
export function getEnv(key, defaultValue = undefined) {
    return import.meta.env[key] ?? defaultValue
}

/**
 * 获取以 VITE_ 开头的环境变量
 * @param {string} key 不包含 VITE_ 前缀的变量名
 * @param {any} defaultValue 默认值
 * @returns {string|any} 环境变量值
 */
export function getViteEnv(key, defaultValue = '') {
    return import.meta.env[`VITE_${key}`] ?? defaultValue
}

export function isDevelopment() {
    if (import.meta.env.MODE === 'development') {
        return true
    }

    // 默认假设为生产环境
    return false
}

// 使用示例
// const defaultUrl = getEnv('VITE_DEFAULT_URL')
// const defaultUrl = getViteEnv('DEFAULT_URL') // 自动添加 VITE_ 前缀