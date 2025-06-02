/**
 * 商品信息配置文件
 * 根据不同商品类型配置显示不同的商品属性
 */

// 各类商品的规格配置
export const goodsSpecs = {
  // 手机类商品
  phone: {
    // 规格信息字段
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'model', label: '型号' },
      { field: 'version', label: '版本' },
      { field: 'capacity', label: '容量' },
      { field: 'color', label: '颜色' },
      { field: 'condition', label: '成色' }
    ],
    // 详细信息字段
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'display', label: '屏幕显示' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '官方原价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  },
  
  // 数码配件
  digital: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'model', label: '型号' },
      { field: 'color', label: '颜色' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '官方原价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  },
  
  // 图书教材
  book: {
    specs: [
      { field: 'bookName', label: '书名' },
      { field: 'author', label: '作者' },
      { field: 'publisher', label: '出版社' },
      { field: 'isbn', label: 'ISBN' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'underline', label: '笔记划线' },
      { field: 'cover', label: '封面状态' },
      { field: 'edition', label: '版次' },
      { field: 'originPrice', label: '原价' }
    ]
  },
  
  // 服装鞋帽
  clothing: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'size', label: '尺码' },
      { field: 'color', label: '颜色' },
      { field: 'style', label: '款式' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'material', label: '材质' },
      { field: 'washing', label: '洗涤次数' },
      { field: 'originPrice', label: '专柜价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  },
  
  // 美妆护肤
  beauty: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'productName', label: '产品名称' },
      { field: 'capacity', label: '容量' },
      { field: 'expiry', label: '保质期' },
      { field: 'openStatus', label: '开封状态' }
    ],
    details: [
      { field: 'remainingAmount', label: '剩余量' },
      { field: 'productionDate', label: '生产日期' },
      { field: 'expiryDate', label: '到期日期' },
      { field: 'originPrice', label: '专柜价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  },
  
  // 电器家居
  appliance: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'model', label: '型号' },
      { field: 'color', label: '颜色' },
      { field: 'power', label: '功率' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '原价' },
      { field: 'purchaseTime', label: '购买时间' },
      { field: 'warranty', label: '保修情况' }
    ]
  },
  
  // 自行车/交通工具
  transportation: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'model', label: '型号' },
      { field: 'type', label: '类型' },
      { field: 'color', label: '颜色' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'distance', label: '使用里程' },
      { field: 'originPrice', label: '原价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  },
  
  // 运动器材
  sports: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'productName', label: '产品名称' },
      { field: 'type', label: '类型' },
      { field: 'material', label: '材质' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '原价' },
      { field: 'purchaseTime', label: '购买时间' },
      { field: 'useFrequency', label: '使用频率' }
    ]
  },
  
  // 乐器
  instrument: {
    specs: [
      { field: 'brand', label: '品牌' },
      { field: 'instrumentName', label: '乐器名称' },
      { field: 'material', label: '材质' },
      { field: 'color', label: '颜色' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '原价' },
      { field: 'purchaseTime', label: '购买时间' },
      { field: 'timbre', label: '音色情况' }
    ]
  },
  
  // 游戏装备
  game: {
    specs: [
      { field: 'gameName', label: '游戏名称' },
      { field: 'server', label: '服务器' },
      { field: 'accountLevel', label: '账号等级' },
      { field: 'rank', label: '段位/排名' },
      { field: 'itemType', label: '道具类型' }
    ],
    details: [
      { field: 'equipment', label: '装备情况' },
      { field: 'heroes', label: '英雄数量' },
      { field: 'skins', label: '皮肤数量' },
      { field: 'bind', label: '是否绑定' },
      { field: 'specialItem', label: '特殊物品' }
    ]
  },
  
  // 其他类型
  other: {
    specs: [
      { field: 'productName', label: '商品名称' },
      { field: 'brand', label: '品牌' },
      { field: 'condition', label: '成色' }
    ],
    details: [
      { field: 'condition', label: '成色情况' },
      { field: 'function', label: '功能问题' },
      { field: 'originPrice', label: '原价' },
      { field: 'purchaseTime', label: '购买时间' }
    ]
  }
}

// 商品类型映射表
export const goodsTypeMap = {
  // 手机、平板、电脑类
  'iPhone': 'phone',
  '华为手机': 'phone',
  '小米手机': 'phone',
  'OPPO': 'phone',
  'vivo': 'phone',
  '三星手机': 'phone',
  '手机': 'phone',
  '平板电脑': 'digital',
  '笔记本电脑': 'digital',
  
  // 数码配件类
  '耳机': 'digital',
  '充电器': 'digital',
  '数据线': 'digital',
  '手表': 'digital',
  '相机': 'digital',
  
  // 图书类
  '教材': 'book',
  '考研资料': 'book',
  '课本': 'book',
  '小说': 'book',
  '杂志': 'book',
  
  // 服装鞋帽类
  '衣服': 'clothing',
  '裤子': 'clothing',
  '鞋子': 'clothing',
  '帽子': 'clothing',
  '包包': 'clothing',
  
  // 美妆护肤类
  '口红': 'beauty',
  '面霜': 'beauty',
  '护肤品': 'beauty',
  '彩妆': 'beauty',
  
  // 电器家居类
  '电饭煲': 'appliance',
  '吹风机': 'appliance',
  '电风扇': 'appliance',
  '台灯': 'appliance',
  
  // 交通类
  '自行车': 'transportation',
  '电动车': 'transportation',
  '滑板': 'transportation',
  
  // 运动器材类
  '篮球': 'sports',
  '足球': 'sports',
  '乒乓球拍': 'sports',
  '瑜伽垫': 'sports',
  
  // 乐器类
  '吉他': 'instrument',
  '钢琴': 'instrument',
  '尤克里里': 'instrument',
  
  // 游戏类
  '游戏账号': 'game',
  '游戏点卡': 'game',
  '游戏装备': 'game'
}

/**
 * 根据商品名称或类型获取对应的规格配置
 * @param {string} goodsName - 商品名称或类型
 * @returns {Object} 商品规格配置
 */
export function getGoodsSpecConfig(goodsName = '') {
  // 如果没有商品名称，返回默认配置
  if (!goodsName) return goodsSpecs.other
  
  // 遍历商品类型映射表，查找匹配的类型
  for (const key in goodsTypeMap) {
    if (goodsName.includes(key)) {
      return goodsSpecs[goodsTypeMap[key]]
    }
  }
  
  // 默认返回其他类型的配置
  return goodsSpecs.other
}

/**
 * 根据商品类型获取对应的规格配置
 * @param {string} goodsType - 商品类型
 * @returns {Object} 商品规格配置
 */
export function getSpecConfigByType(goodsType = 'other') {
  return goodsSpecs[goodsType] || goodsSpecs.other
}
