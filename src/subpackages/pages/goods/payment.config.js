/**
 * 支付方式配置文件
 * 用于配置系统支持的支付方式
 */

export const paymentMethods = [
  {
    id: 'wechat_pay',
    name: '微信支付',
    icon: 'wechat-pay',
    color: '#09BB07',
    desc: '亿万用户的选择，更快更安全',
    isDefault: false,
    enabled: true,
    badge: '',
    order: 1
  },
  {
    id: 'alipay',
    name: '支付宝',
    icon: 'alipay',
    color: '#1677FF',
    desc: '10亿人都在用，真安全，更方便',
    isDefault: true,
    enabled: true,
    badge: '限时抢随机立减',
    order: 2
  },
  {
    id: 'huabei',
    name: '花呗分期',
    icon: 'huabei',
    color: '#FF6500',
    desc: '分期无压力 可分12期慢慢还',
    isDefault: false,
    enabled: true,
    badge: '0首付无压力',
    order: 3
  },
  {
    id: 'fenqi',
    name: '发条分期',
    icon: 'credit-card',
    color: '#F43F5E',
    desc: '首付0元 可分1年慢慢还',
    isDefault: false,
    enabled: true,
    badge: '先用后付',
    order: 4
  },
  {
    id: 'credit_card',
    name: '信用卡分期',
    icon: 'visa',
    color: '#1D4ED8',
    desc: '0首付 分期还款无压力',
    isDefault: false,
    enabled: true,
    badge: '抢免息活动',
    order: 5
  },
  {
    id: 'union_pay',
    name: '组合支付',
    icon: 'union-pay',
    color: '#7D30E2',
    desc: '信用额度不够，现金渠道白用',
    isDefault: false,
    enabled: true,
    badge: '',
    order: 6
  }
]

/**
 * 获取所有可用的支付方式
 * @returns {Array} 可用的支付方式列表
 */
export function getAvailablePaymentMethods() {
  return paymentMethods
    .filter(method => method.enabled)
    .sort((a, b) => a.order - b.order)
}

/**
 * 获取默认支付方式
 * @returns {Object|null} 默认支付方式对象，如果没有则返回第一个可用的支付方式
 */
export function getDefaultPaymentMethod() {
  const methods = getAvailablePaymentMethods()
  return methods.find(method => method.isDefault) || methods[0] || null
}

/**
 * 根据ID获取支付方式
 * @param {string} id 支付方式ID
 * @returns {Object|null} 支付方式对象，如果不存在则返回null
 */
export function getPaymentMethodById(id) {
  return paymentMethods.find(method => method.id === id) || null
}
