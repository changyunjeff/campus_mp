/**
 * 举报类型配置
 * 配置社区内容举报的类型和原因
 */
export const reportReasons = [
  {
    id: 1,
    description: '垃圾广告信息',
  },
  {
    id: 2, 
    description: '色情低俗内容',
  },
  {
    id: 3,
    description: '政治敏感内容',
  },
  {
    id: 4,
    description: '侵犯个人隐私',
  },
  {
    id: 5,
    description: '暴力恐怖内容',
  },
  {
    id: 6,
    description: '虚假信息',
  },
  {
    id: 7,
    description: '不友善内容',
  },
  {
    id: 8,
    description: '侵犯版权',
  },
  {
    id: 9,
    description: '其他违规内容',
  }
]

/**
 * 根据举报ID获取举报原因描述
 * @param {number} id - 举报原因ID
 * @returns {string} 举报原因描述
 */
export const getReasonById = (id) => {
  const reason = reportReasons.find(item => item.id === id)
  return reason ? reason.description : '未知原因'
}

/**
 * 获取举报原因配置
 * @returns {Array} 举报原因列表
 */
export const getReportReasons = () => {
  return reportReasons
}
