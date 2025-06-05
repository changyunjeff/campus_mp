/**
 * @typedef {object} Location
 * @property {number} latitude
 * @property {number} longitude
 * */

/**
 * @function ll2String 将经纬度对象转为string，经度在前，纬度在后，保留6个小数位 如 lat,long
 * @param {Location} param
 * @returns {string} 格式化后的经纬度字符串，如："116.397428,39.909230"
 */
export function ll2String(param) {
    if (!param || typeof param.longitude !== 'number' || typeof param.latitude !== 'number') {
        console.warn('⚠️ 无效的经纬度参数:', param)
        return ''
    }

    try {
        // 确保经纬度在有效范围内
        const longitude = Math.max(-180, Math.min(180, param.longitude))
        const latitude = Math.max(-90, Math.min(90, param.latitude))

        // 格式化为6位小数
        return `${longitude.toFixed(6)},${latitude.toFixed(6)}`
    } catch (error) {
        console.error('❌ 经纬度格式化失败:', error)
        return ''
    }
}

/**
 * @function str2ll 将string或对象转为经纬度对象
 * @param {string|object} input 经纬度字符串（格式："经度,纬度"）或经纬度对象
 * @returns {Location|null} 经纬度对象，格式：{longitude: number, latitude: number}
 */
export function str2ll(input) {
    if (!input) {
        console.warn('⚠️ 输入参数为空:', input)
        return null
    }

    try {
        let longitude, latitude

        if (typeof input === 'string') {
            // 字符串格式："经度,纬度"
            const parts = input.split(',').map(Number)
            if (parts.length !== 2) {
                console.warn('⚠️ 经纬度字符串格式错误:', input)
                return null
            }
            [longitude, latitude] = parts
        } else if (typeof input === 'object') {
            // 对象格式：{longitude: number, latitude: number} 或 {longitude, latitude}
            if (typeof input.longitude === 'number' && typeof input.latitude === 'number') {
                longitude = input.longitude
                latitude = input.latitude
            } else {
                console.warn('⚠️ 经纬度对象格式错误:', input)
                return null
            }
        } else {
            console.warn('⚠️ 不支持的经纬度输入格式:', input)
            return null
        }

        // 验证经纬度的有效性
        if (isNaN(longitude) || isNaN(latitude) ||
            longitude < -180 || longitude > 180 ||
            latitude < -90 || latitude > 90) {
            console.warn('⚠️ 经纬度值超出有效范围:', {longitude, latitude})
            return null
        }

        return {
            longitude,
            latitude
        }
    } catch (error) {
        console.error('❌ 经纬度解析失败:', error)
        return null
    }
}

/**
 * @function formatDistance 传入一个float值，返回米或公里，保留1位小数，比如 198.2米
 * @param {number} distance 距离值（米）
 * @returns {string} 格式化后的距离字符串
 */
export function formatDistance(distance) {
    if (typeof distance !== 'number' || isNaN(distance) || distance < 0) {
        console.warn('⚠️ 无效的距离值:', distance)
        return '0米'
    }

    try {
        if (distance < 1000) {
            // 不足1公里，以米为单位
            return `${Math.round(distance)}米`
        } else {
            // 超过1公里，以公里为单位，保留一位小数
            return `${(distance / 1000).toFixed(1)}公里`
        }
    } catch (error) {
        console.error('❌ 距离格式化失败:', error)
        return '0米'
    }
}

// 辅助函数：验证经纬度的有效性
export function isValidCoordinate(longitude, latitude) {
    return !isNaN(longitude) && !isNaN(latitude) &&
        longitude >= -180 && longitude <= 180 &&
        latitude >= -90 && latitude <= 90
}
