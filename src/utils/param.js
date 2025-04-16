/**
 * 解析 URL 查询参数
 * @param {string} url URL 字符串
 * @returns {object} 查询参数对象
 */
export function getQueryString(url) {
    const search = url.split('?')[1]
    if (!search) return {}

    return search.split('&').reduce((params, param) => {
        const [key, value] = param.split('=')
        params[decodeURIComponent(key)] = decodeURIComponent(value || '')
        return params
    }, {})
}

/**
 * 将对象转换为URL查询参数
 * @param {object} params 参数对象
 * @returns {string} URL查询参数字符串
 */
export function objectToQuery(params) {
    if (!params) return ''
    return Object.keys(params)
        .filter(key => params[key] !== undefined && params[key] !== null && params[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
        .join('&')
}

/**
 * 解析URL参数为对象(支持复杂参数)
 * @param {string} url URL字符串
 * @returns {object} 参数对象
 */
export function getQueryParams(url) {
    const search = url.split('?')[1]
    if (!search) return {}
    
    return JSON.parse(
        '{"' +
        decodeURIComponent(search)
            .replace(/"/g, '\\"')
            .replace(/&/g, '","')
            .replace(/=/g, '":"') +
        '"}'
    )
}

/**
 * 将对象转换为URL参数
 * @param {object} obj 参数对象
 * @returns {string} URL参数字符串
 */
export function param2Obj(url) {
    const search = decodeURIComponent(url.split('?')[1]).replace(/\+/g, ' ')
    if (!search) {
      return {}
    }
    const obj = {}
    const searchArr = search.split('&')
    searchArr.forEach(v => {
      const index = v.indexOf('=')
      if (index !== -1) {
        const name = v.substring(0, index)
        const val = v.substring(index + 1, v.length)
        obj[name] = val
      }
    })
    return obj
  }
