/**
 * 延迟执行函数
 * @param {number} ms 延迟的毫秒数
 * @returns {Promise<void>} 返回Promise对象
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}