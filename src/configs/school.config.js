/**
 * 学校配置文件
 * 支持的学校列表和相关配置
 */

// 学校列表配置
export const SCHOOL_LIST = [
  {
    id: 'suda',
    name: '苏州大学',
    shortName: '苏大',
    code: 'SUDA',
    logo: '/static/schools/suda.png',
    color: '#1E90FF',
    description: '百年名校，传承文脉'
  },
  {
    id: 'usts',
    name: '苏州科技大学',
    shortName: '苏科大',
    code: 'USTS',
    logo: '/static/schools/usts.png',
    color: '#00CED1',
    description: '科技创新，追求卓越'
  },
  {
    id: 'xjtlu',
    name: '西交利物浦大学',
    shortName: '西浦',
    code: 'XJTLU',
    logo: '/static/schools/xjtlu.png',
    color: '#8B0000',
    description: '中西合璧，国际视野'
  },
  {
    id: 'ruc_suzhou',
    name: '中国人民大学苏州校区',
    shortName: '人大苏州',
    code: 'RUC_SUZHOU',
    logo: '/static/schools/ruc_suzhou.png',
    color: '#DC143C',
    description: '人文社科，学术前沿'
  }
]

// 根据ID获取学校信息
export const getSchoolById = (id) => {
  return SCHOOL_LIST.find(school => school.id === id)
}

// 根据code获取学校信息
export const getSchoolByCode = (code) => {
  return SCHOOL_LIST.find(school => school.code === code)
}

// 获取所有学校ID列表
export const getAllSchoolIds = () => {
  return SCHOOL_LIST.map(school => school.id)
}

// 验证学校ID是否有效
export const isValidSchoolId = (id) => {
  return SCHOOL_LIST.some(school => school.id === id)
}

export default {
  SCHOOL_LIST,
  getSchoolById,
  getSchoolByCode,
  getAllSchoolIds,
  isValidSchoolId
}
