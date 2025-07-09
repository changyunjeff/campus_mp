/**
 * 拼接多个路径，确保结果中路由之间只有一个斜杠
 * @param {...string} paths - 多个路径字符串
 * @returns {string} 拼接后的路径字符串
 */
export function concat(...paths) {
    if (paths.length === 0) return '';
    // 取第一个路径，去掉末尾多余的斜杠
    let result = paths[0].replace(/\/+$/, '');
    for (let i = 1; i < paths.length; i++) {
        // 对后面的每个路径去掉前导斜杠，然后拼接
        result += '/' + paths[i].replace(/^\/+/, '');
    }
    return result;
}

/**
 * 将数组转换为逗号分隔的字符串
 * @param {Array} arr - 要转换的数组
 * @param {string} [separator=','] - 分隔符
 * @returns {string} 转换后的字符串
 */
export function arrayToString(arr, separator = ',') {
    if (!Array.isArray(arr)) return '';
    return arr.filter(item => item != null).join(separator);
}

/**
 * 生成一个自定义的uuid字符串
 * @returns {string} uuid字符串
 */
export function uuid() {
    const randomPart = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    const uuid = `${randomPart()}${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}-${randomPart()}${randomPart()}${randomPart()}`;

    // 确保UUID的版本和变体
    return uuid.replace(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[0-9a-f]{4}-/, (match) => {
        return match.slice(0, 14) + '4' + match.slice(15); // 设置版本为4
    }).replace(/-([89ab])/g, '-8'); // 设置变体
}

/**
 * @function copy 深拷贝一个引用对象
 * */
export function copy(refObj) {
    return JSON.parse(JSON.stringify(refObj))
}

/**
 * @function sub 截取字符串的子串，并添加省略号
 * @param {String} str 要截取的字符串
 * @param {Number} len 截取的长度
 * @returns {string} 截取后的字符串
 */
export function sub(str, len) {
    if (typeof str !== 'string' || !str) return '';
    if (str.length <= len) return str;
    return str.substring(0, len) + '...';
}
