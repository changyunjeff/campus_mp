/**
 * 分享工具类
 * 基于微信小程序的分享 API
 */

/**
 * 检查当前环境是否支持分享到朋友圈
 * 微信基础库 2.11.3 开始支持分享朋友圈
 * @returns {boolean} 是否支持分享到朋友圈
 */
export const checkShareToTimelineSupport = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    if (systemInfo.platform === 'android' || systemInfo.platform === 'ios') {
      const version = systemInfo.SDKVersion || ''
      const versionArr = version.split('.')
      return parseInt(versionArr[0]) > 2 || 
             (parseInt(versionArr[0]) === 2 && parseInt(versionArr[1]) > 11) ||
             (parseInt(versionArr[0]) === 2 && parseInt(versionArr[1]) === 11 && parseInt(versionArr[2]) >= 3)
    }
    return false
  } catch (e) {
    console.error('获取系统信息失败', e)
    return false
  }
}

/**
 * 创建分享参数对象 - 分享给好友
 * @param {Object} options 分享参数
 * @param {string} options.title 分享标题
 * @param {string} options.path 分享路径，必须是以 / 开头的完整路径
 * @param {string} [options.imageUrl] 分享图片地址，可选
 * @returns {Object} 分享参数对象
 */
export const createShareAppMessageOptions = (options) => {
  return {
    title: options.title || '分享内容',
    path: options.path,
    imageUrl: options.imageUrl
  }
}

/**
 * 创建分享参数对象 - 分享到朋友圈
 * @param {Object} options 分享参数
 * @param {string} options.title 分享标题
 * @param {string} options.query 分享参数，必须是 key=value 的格式，不能有 path
 * @param {string} [options.imageUrl] 分享图片地址，可选
 * @returns {Object} 分享参数对象
 */
export const createShareTimelineOptions = (options) => {
  return {
    title: options.title || '分享内容',
    query: options.query,
    imageUrl: options.imageUrl
  }
}

/**
 * 复制链接到剪贴板
 * @param {string} link 要复制的链接
 * @param {Function} [successCallback] 成功回调
 * @param {Function} [failCallback] 失败回调
 */
export const copyLink = (link, successCallback, failCallback) => {
  uni.setClipboardData({
    data: link,
    success: () => {
      if (typeof successCallback === 'function') {
        successCallback()
      }
    },
    fail: (err) => {
      console.error('复制链接失败', err)
      if (typeof failCallback === 'function') {
        failCallback(err)
      }
    }
  })
}

/**
 * 保存图片到相册
 * @param {string} filePath 图片路径
 * @param {Function} [successCallback] 成功回调
 * @param {Function} [failCallback] 失败回调
 */
export const saveImageToAlbum = (filePath, successCallback, failCallback) => {
  // 保存图片到相册前，先获取权限
  uni.getSetting({
    success: (res) => {
      if (!res.authSetting['scope.writePhotosAlbum']) {
        uni.authorize({
          scope: 'scope.writePhotosAlbum',
          success: () => {
            // 获取权限后保存图片
            saveImage()
          },
          fail: (err) => {
            console.error('获取保存图片权限失败', err)
            if (typeof failCallback === 'function') {
              failCallback(err)
            }
          }
        })
      } else {
        // 已有权限，直接保存
        saveImage()
      }
    },
    fail: (err) => {
      console.error('获取设置失败', err)
      if (typeof failCallback === 'function') {
        failCallback(err)
      }
    }
  })
  
  // 保存图片的方法
  function saveImage() {
    uni.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        if (typeof successCallback === 'function') {
          successCallback()
        }
      },
      fail: (err) => {
        console.error('保存图片失败', err)
        if (typeof failCallback === 'function') {
          failCallback(err)
        }
      }
    })
  }
}

export default {
  checkShareToTimelineSupport,
  createShareAppMessageOptions,
  createShareTimelineOptions,
  copyLink,
  saveImageToAlbum
} 