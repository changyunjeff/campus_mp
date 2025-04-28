/**
 * 封装 toast 提示功能
 * @returns {Object} toast - 提示工具对象
 */
export function useToast() {
  /**
   * 显示成功提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长(ms)
   */
  const success = (message, duration = 1500) => {
    uni.showToast({
      title: message,
      icon: 'success',
      duration
    })
  }

  /**
   * 显示错误提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长(ms)
   */
  const error = (message, duration = 1500) => {
    uni.showToast({
      title: message,
      icon: 'error',
      duration
    })
  }

  /**
   * 显示普通提示
   * @param {string} message - 提示消息
   * @param {number} duration - 显示时长(ms)
   */
  const show = (message, duration = 1500) => {
    uni.showToast({
      title: message,
      icon: 'none',
      duration
    })
  }

  /**
   * 显示加载提示
   * @param {string} message - 提示消息
   */
  const loading = (message = '加载中...') => {
    uni.showLoading({
      title: message,
      mask: true
    })
  }

  /**
   * 隐藏加载提示
   */
  const hideLoading = () => {
    uni.hideLoading()
  }

  return {
    success,
    error,
    show,
    loading,
    hideLoading
  }
}