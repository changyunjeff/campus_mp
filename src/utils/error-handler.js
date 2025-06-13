import { useToast } from "@/composables/toast";

/**
 * 错误类型枚举
 */
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  UNKNOWN: 'unknown'
};

/**
 * 错误处理器类
 */
class ErrorHandler {
  constructor() {
    this.toast = useToast();
  }

  /**
   * 处理消息发送错误
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文
   */
  handleMessageError(error, context = {}) {
    const errorType = this.categorizeError(error);
    const message = this.getErrorMessage(errorType, error.message);
    
    console.error('消息错误:', {
      type: errorType,
      message: error.message,
      context,
      stack: error.stack
    });

    // 显示用户友好的错误提示
    this.toast.error(message);
    
    return {
      type: errorType,
      message,
      originalError: error
    };
  }

  /**
   * 处理网络请求错误
   * @param {Error} error - 错误对象
   */
  handleNetworkError(error) {
    const message = this.isNetworkOffline() 
      ? '网络连接已断开，请检查网络设置'
      : '网络请求失败，请稍后重试';
    
    this.toast.error(message);
    
    return {
      type: ERROR_TYPES.NETWORK,
      message,
      originalError: error
    };
  }

  /**
   * 处理验证错误
   * @param {string} field - 字段名
   * @param {string} message - 错误消息
   */
  handleValidationError(field, message) {
    const errorMessage = `${field}: ${message}`;
    this.toast.warning(errorMessage);
    
    return {
      type: ERROR_TYPES.VALIDATION,
      field,
      message: errorMessage
    };
  }

  /**
   * 分类错误类型
   * @param {Error} error - 错误对象
   * @returns {string} 错误类型
   */
  categorizeError(error) {
    if (error.message.includes('网络') || error.message.includes('timeout')) {
      return ERROR_TYPES.NETWORK;
    }
    if (error.message.includes('登录') || error.message.includes('认证')) {
      return ERROR_TYPES.AUTHENTICATION;
    }
    if (error.message.includes('权限')) {
      return ERROR_TYPES.PERMISSION;
    }
    if (error.message.includes('输入') || error.message.includes('格式')) {
      return ERROR_TYPES.VALIDATION;
    }
    return ERROR_TYPES.UNKNOWN;
  }

  /**
   * 获取用户友好的错误消息
   * @param {string} type - 错误类型
   * @param {string} originalMessage - 原始错误消息
   * @returns {string} 用户友好的错误消息
   */
  getErrorMessage(type, originalMessage) {
    const messageMap = {
      [ERROR_TYPES.NETWORK]: '网络连接异常，请检查网络后重试',
      [ERROR_TYPES.AUTHENTICATION]: '登录状态已过期，请重新登录',
      [ERROR_TYPES.PERMISSION]: '没有操作权限，请联系管理员',
      [ERROR_TYPES.VALIDATION]: originalMessage,
      [ERROR_TYPES.UNKNOWN]: '操作失败，请稍后重试'
    };

    return messageMap[type] || originalMessage;
  }

  /**
   * 检查网络连接状态
   * @returns {boolean} 是否离线
   */
  isNetworkOffline() {
    return !navigator.onLine;
  }
}

// 创建单例实例
let errorHandlerInstance = null;

/**
 * 获取错误处理器实例
 * @returns {ErrorHandler} 错误处理器实例
 */
export function useErrorHandler() {
  if (!errorHandlerInstance) {
    errorHandlerInstance = new ErrorHandler();
  }
  return errorHandlerInstance;
}

/**
 * 快捷方法：处理异步操作的错误
 */
export function withErrorHandling(asyncFn, errorContext = {}) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      const handler = useErrorHandler();
      handler.handleMessageError(error, errorContext);
      throw error;
    }
  };
} 