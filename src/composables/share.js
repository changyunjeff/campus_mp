import { ref } from 'vue'
import shareUtils from '@/utils/share'
import { qrcodeApi } from '@/api/qrcode'
import { useToast } from '@/composables/toast'

/**
 * 分享功能组合式API
 * @returns {Object} 分享相关的状态和方法
 */
export function useShare() {
  // 初始化toast
  const toast = useToast()
  
  // 弹窗状态
  const showSharePopup = ref(false)
  const showQrcodePopup = ref(false)

  // 二维码状态
  const qrcodeUrl = ref('')
  const qrcodeLoading = ref(false)
  
  // 检查朋友圈分享支持
  const canShareToTimeline = ref(false)
  
  // 初始化
  const init = () => {
    canShareToTimeline.value = shareUtils.checkShareToTimelineSupport()
  }

  /**
   * 打开分享弹窗
   */
  const openSharePopup = () => {
    showSharePopup.value = true
  }

  /**
   * 关闭分享弹窗
   */
  const closeSharePopup = () => {
    showSharePopup.value = false
  }

  /**
   * 分享到微信好友
   */
  const shareToWechat = () => {
    closeSharePopup()
    // 微信小程序会通过button的open-type="share"自动处理
  }

  /**
   * 分享到朋友圈
   */
  const shareToMoments = () => {
    closeSharePopup()
    // 微信小程序会通过button的open-type="share"自动处理
  }

  /**
   * 生成分享链接
   * @param {string} path 页面路径
   * @param {Object} params 参数
   * @returns {string} 分享链接
   */
  const generateShareLink = (path, params = {}) => {
    // 构建查询字符串
    const queryString = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&')
    
    // 返回小程序页面路径
    return queryString ? `${path}?${queryString}` : path
  }

  /**
   * 生成二维码
   * @param {string} path 页面路径
   * @param {Object} params 参数
   */
  const generateQrCode = async (path, params = {}) => {
    closeSharePopup()
    qrcodeLoading.value = true
    showQrcodePopup.value = true

    try {
      // 获取分享链接
      const sharePath = generateShareLink(path, params)
      
      // 使用二维码API生成二维码
      const url = await qrcodeApi.generate(sharePath)
      qrcodeUrl.value = url
    } catch (err) {
      showQrcodePopup.value = false
      toast.show('生成二维码失败')
      console.error('生成二维码失败:', err)
    } finally {
      qrcodeLoading.value = false
    }
  }

  /**
   * 关闭二维码弹窗
   */
  const closeQrcodePopup = () => {
    showQrcodePopup.value = false
  }

  /**
   * 保存二维码到相册
   */
  const saveQrcodeToAlbum = () => {
    if (!qrcodeUrl.value) {
      toast.show('二维码未生成')
      return
    }

    shareUtils.saveImageToAlbum(
      qrcodeUrl.value,
      () => toast.show('已保存到相册'),
      (err) => {
        console.error('保存失败:', err)
        toast.show('保存失败，请重试')
      }
    )
  }

  /**
   * 创建分享消息选项（分享给好友时使用）
   * @param {Object} options 分享选项
   * @returns {Object} 微信小程序分享选项
   */
  const createShareMessageOptions = (options) => {
    return shareUtils.createShareAppMessageOptions(options)
  }

  /**
   * 创建分享朋友圈选项
   * @param {Object} options 分享选项
   * @returns {Object} 微信小程序分享朋友圈选项
   */
  const createShareTimelineOptions = (options) => {
    return shareUtils.createShareTimelineOptions(options)
  }

  return {
    // 状态
    showSharePopup,
    showQrcodePopup,
    qrcodeUrl,
    qrcodeLoading,
    canShareToTimeline,
    
    // 方法
    init,
    openSharePopup,
    closeSharePopup,
    shareToWechat,
    shareToMoments,
    generateShareLink,
    generateQrCode,
    closeQrcodePopup,
    saveQrcodeToAlbum,
    createShareMessageOptions,
    createShareTimelineOptions
  }
} 