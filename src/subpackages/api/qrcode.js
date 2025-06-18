import {post} from '@/utils/request'

// 二维码API
export const qrcodeApi = {
  /**
   * 生成二维码
   * @param {string} path 页面路径
   * @param {number} width 额外参数
   * @returns {Promise<string>} 二维码图片URL
   */
  generate: (path, width) => post('/qrcode/generate', {
    path,
    width
  }),
}

export default qrcodeApi 