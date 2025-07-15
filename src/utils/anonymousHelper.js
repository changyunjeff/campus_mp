/**
 * 匿名功能辅助工具
 * @description 提供匿名相关的错误处理、用户帮助和功能介绍
 */

export class AnonymousHelper {
  
  /**
   * 处理匿名相关的API错误
   * @param {Error} error - 错误对象
   * @param {string} context - 错误上下文描述
   */
  static handleAnonymousError(error, context = '') {
    console.error(`匿名功能错误 (${context}):`, error)
    
    // 根据错误类型显示不同的提示
    switch (error.code) {
      case 'ANONYMOUS_NOT_SUPPORTED':
        uni.showToast({
          title: '当前版本不支持匿名功能',
          icon: 'none',
          duration: 2000
        })
        break
      
      case 'ANONYMOUS_INFO_GENERATION_FAILED':
        uni.showToast({
          title: '匿名信息生成失败，请重试',
          icon: 'none',
          duration: 2000
        })
        break
        
      case 'PERMISSION_DENIED':
        uni.showToast({
          title: '没有权限进行此操作',
          icon: 'none',
          duration: 2000
        })
        break
        
      default:
        uni.showToast({
          title: context ? `${context}失败` : '操作失败',
          icon: 'none',
          duration: 2000
        })
    }
  }

  /**
   * 显示匿名功能说明对话框
   * @param {string} type - 说明类型 (publish/comment/general)
   */
  static showAnonymousHelp(type = 'general') {
    const helpContent = {
      publish: {
        title: '匿名发布说明',
        content: '开启匿名发布后，其他用户看到的将是"大二计算机学院男生"这样的信息，而不是您的真实姓名和头像。管理员仍可查看真实信息以确保内容安全。'
      },
      comment: {
        title: '匿名评论说明',
        content: '开启匿名评论后，您的评论将以匿名身份显示，其他用户无法看到您的真实信息。但管理员仍可查看真实身份进行内容管理。'
      },
      general: {
        title: '匿名功能说明',
        content: '匿名功能可以保护您的隐私，让您更自由地表达想法。开启后，其他用户看到的是生成的匿名信息，管理员仍可查看真实信息确保平台安全。'
      }
    }
    
    const config = helpContent[type] || helpContent.general
    
    uni.showModal({
      title: config.title,
      content: config.content,
      showCancel: false,
      confirmText: '我知道了',
      confirmColor: '#3b82f6'
    })
  }

  /**
   * 显示匿名功能介绍引导
   * @param {Function} callback - 完成后的回调函数
   */
  static showAnonymousIntroduction(callback) {
    const steps = [
      {
        title: '🎭 匿名功能介绍',
        content: '新增匿名发布功能，保护您的隐私，让表达更自由！'
      },
      {
        title: '🛡️ 隐私保护',
        content: '开启后，其他用户看到的是"大二计算机学院男生"这样的匿名信息。'
      },
      {
        title: '⚖️ 安全管理',
        content: '管理员仍可查看真实信息，确保内容安全和平台秩序。'
      },
      {
        title: '🎯 使用场景',
        content: '适合分享敏感话题、求助问题或表达个人观点时使用。'
      }
    ]
    
    let currentStep = 0
    
    const showStep = () => {
      if (currentStep >= steps.length) {
        // 标记用户已看过介绍
        try {
          uni.setStorageSync('anonymous_intro_shown', true)
        } catch (error) {
          console.warn('保存介绍状态失败:', error)
        }
        callback && callback()
        return
      }
      
      const step = steps[currentStep]
      const isLast = currentStep === steps.length - 1
      
      uni.showModal({
        title: step.title,
        content: step.content,
        cancelText: '跳过',
        confirmText: isLast ? '开始使用' : '下一步',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            currentStep++
            setTimeout(showStep, 300)
          } else {
            // 用户选择跳过
            try {
              uni.setStorageSync('anonymous_intro_shown', true)
            } catch (error) {
              console.warn('保存介绍状态失败:', error)
            }
            callback && callback()
          }
        }
      })
    }
    
    showStep()
  }

  /**
   * 检查是否需要显示匿名功能介绍
   * @returns {boolean} 是否需要显示介绍
   */
  static shouldShowIntroduction() {
    try {
      return !uni.getStorageSync('anonymous_intro_shown')
    } catch (error) {
      console.warn('读取介绍状态失败:', error)
      return true
    }
  }

  /**
   * 验证用户信息是否支持匿名功能
   * @param {Object} userInfo - 用户信息
   * @returns {boolean} 是否支持匿名功能
   */
  static validateUserForAnonymous(userInfo) {
    if (!userInfo) {
      console.warn('用户信息为空，无法使用匿名功能')
      return false
    }
    
    // 检查必要的用户信息字段
    const requiredFields = ['grade', 'college', 'gender']
    const missingFields = requiredFields.filter(field => !userInfo[field])
    
    if (missingFields.length > 0) {
      console.warn('用户信息不完整，缺少字段:', missingFields)
      uni.showModal({
        title: '信息不完整',
        content: '使用匿名功能需要完善个人资料中的年级、学院和性别信息。',
        cancelText: '稍后再说',
        confirmText: '去完善',
        confirmColor: '#3b82f6',
        success: (res) => {
          if (res.confirm) {
            // 跳转到个人资料页
            uni.navigateTo({
              url: '/pages/profile/edit'
            })
          }
        }
      })
      return false
    }
    
    return true
  }

  /**
   * 记录匿名功能使用统计（简化版本）
   * @param {string} action - 操作类型 (publish/comment/reply)
   * @param {boolean} isAnonymous - 是否使用匿名
   */
  static recordUsageStats(action, isAnonymous) {
    try {
      const stats = uni.getStorageSync('anonymous_usage_stats') || {}
      const today = new Date().toISOString().split('T')[0]
      
      if (!stats[today]) {
        stats[today] = { total: 0, anonymous: 0 }
      }
      
      stats[today].total++
      if (isAnonymous) {
        stats[today].anonymous++
      }
      
      // 只保留最近7天的统计（简化存储）
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const cutoffDate = sevenDaysAgo.toISOString().split('T')[0]
      
      Object.keys(stats).forEach(date => {
        if (date < cutoffDate) {
          delete stats[date]
        }
      })
      
      uni.setStorageSync('anonymous_usage_stats', stats)
    } catch (error) {
      console.warn('记录使用统计失败:', error)
    }
  }

  /**
   * 获取匿名功能使用统计（简化版本）
   * @param {number} days - 获取最近几天的统计，默认7天
   * @returns {Object} 统计信息
   */
  static getUsageStats(days = 7) {
    try {
      const stats = uni.getStorageSync('anonymous_usage_stats') || {}
      const result = {
        totalActions: 0,
        anonymousActions: 0,
        anonymousRate: 0
      }
      
      const today = new Date()
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        
        const dayStats = stats[dateStr] || { total: 0, anonymous: 0 }
        result.totalActions += dayStats.total
        result.anonymousActions += dayStats.anonymous
      }
      
      result.anonymousRate = result.totalActions > 0 
        ? (result.anonymousActions / result.totalActions * 100).toFixed(1)
        : 0
      
      return result
    } catch (error) {
      console.warn('获取使用统计失败:', error)
      return {
        totalActions: 0,
        anonymousActions: 0,
        anonymousRate: 0
      }
    }
  }
}

export default AnonymousHelper 