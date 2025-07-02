/**
 * 商品规格参数配置文件
 * 定义不同分类下的商品规格参数
 */

// 字段类型定义
export const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  DATE: 'date'
}

// 基础字段定义
export const BASIC_FIELDS = [
  {
    field: 'title',
    label: '商品标题',
    type: FIELD_TYPES.TEXT,
    required: true,
    placeholder: '请输入商品标题',
    maxLength: 50
  },
  {
    field: 'price',
    label: '售价',
    type: FIELD_TYPES.NUMBER,
    required: true,
    placeholder: '请输入售价',
    min: 0.01,
    max: 99999
  },
  {
    field: 'originalPrice',
    label: '原价',
    type: FIELD_TYPES.NUMBER,
    required: false,
    placeholder: '请输入原价（选填）',
    min: 0.01,
    max: 99999
  },
  {
    field: 'condition',
    label: '商品状况',
    type: FIELD_TYPES.SELECT,
    required: true,
    options: ['全新', '95成新', '9成新', '8成新', '7成新', '6成新及以下'],
    defaultValue: '全新'
  },
  {
    field: 'location',
    label: '交易地点',
    type: FIELD_TYPES.TEXT,
    required: false,
    placeholder: '请选择交易地点'
  },
  {
    field: 'description',
    label: '商品描述',
    type: FIELD_TYPES.TEXTAREA,
    required: true,
    placeholder: '请详细描述商品的品牌、型号、规格、成色、使用感受等信息...',
    maxLength: 500
  }
]

// 分类特定规格参数
export const CATEGORY_SPECS = {
  // 电脑办公
  digital: {
    laptop: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['苹果', '华为', '联想', '戴尔', '惠普', '华硕', '宏碁', '微软', '小米', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号，如MacBook Pro 14'
      },
      {
        field: 'processor',
        label: '处理器',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入处理器型号'
      },
      {
        field: 'memory',
        label: '内存',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['8GB', '16GB', '32GB', '64GB', '其他']
      },
      {
        field: 'storage',
        label: '存储',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['256GB', '512GB', '1TB', '2TB', '其他']
      },
      {
        field: 'screenSize',
        label: '屏幕尺寸',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['13英寸', '14英寸', '15英寸', '16英寸', '17英寸', '其他']
      }
    ],
    keyboard: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['罗技', '雷蛇', '海盗船', '樱桃', '酷冷至尊', '斐尔可', '阿米洛', '其他']
      },
      {
        field: 'keyboardType',
        label: '键盘类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['机械键盘', '薄膜键盘', '静电容键盘', '其他']
      },
      {
        field: 'switchType',
        label: '轴体类型',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['青轴', '红轴', '茶轴', '黑轴', '银轴', '静音红轴', '其他']
      },
      {
        field: 'layout',
        label: '配列',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['104键', '87键', '61键', '68键', '其他']
      }
    ]
  },

  // 次元仓
  mobile: {
    iphone: [
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14', 'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', '其他']
      },
      {
        field: 'storage',
        label: '存储容量',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['128GB', '256GB', '512GB', '1TB', '其他']
      },
      {
        field: 'color',
        label: '颜色',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入颜色'
      },
      {
        field: 'network',
        label: '网络制式',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['国行', '港行', '美版', '日版', '其他']
      },
      {
        field: 'batteryHealth',
        label: '电池健康',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['100%', '99%', '98%', '97%', '96%', '95%', '90-94%', '85-89%', '80-84%', '80%以下']
      }
    ],
    android: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['华为', '小米', 'OPPO', 'vivo', '一加', '魅族', '三星', '荣耀', '真我', 'iQOO', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'storage',
        label: '存储容量',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['128GB', '256GB', '512GB', '1TB', '其他']
      },
      {
        field: 'color',
        label: '颜色',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入颜色'
      }
    ]
  },

  // 智能穿戴
  appliances: {
    earphones: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['苹果', '索尼', '森海塞尔', 'Bose', '华为', '小米', 'OPPO', 'vivo', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'type',
        label: '耳机类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['真无线', '头戴式', '入耳式', '挂耳式', '其他']
      },
      {
        field: 'noiseCancellation',
        label: '降噪功能',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['主动降噪', '被动降噪', '无降噪']
      }
    ],
    smart_watch: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['苹果', '华为', '小米', 'OPPO', 'vivo', '佳明', '颂拓', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'size',
        label: '尺寸',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['38mm', '40mm', '41mm', '42mm', '44mm', '45mm', '46mm', '49mm', '其他']
      },
      {
        field: 'connectivity',
        label: '连接类型',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['GPS版', 'GPS+蜂窝版', 'LTE版', '其他']
      }
    ]
  },

  // Fun!
  fun: {
    camera: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['佳能', '尼康', '索尼', '富士', '松下', '奥林巴斯', '徕卡', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'type',
        label: '相机类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['单反相机', '微单相机', '卡片相机', '拍立得', '胶片相机', '其他']
      },
      {
        field: 'megapixels',
        label: '像素',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入像素，如2400万'
      }
    ],
    games: [
      {
        field: 'platform',
        label: '游戏平台',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['PlayStation 5', 'PlayStation 4', 'Xbox Series X/S', 'Xbox One', 'Nintendo Switch', 'Steam Deck', 'PC', '其他']
      },
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['索尼', '微软', '任天堂', 'Valve', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入具体型号'
      }
    ]
  },

  // Music!
  music: {
    guitar: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['芬达', '吉普森', '马丁', '泰勒', '雅马哈', '卡马', '录音之王', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'type',
        label: '吉他类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['电吉他', '木吉他', '古典吉他', '贝斯', '尤克里里', '其他']
      },
      {
        field: 'strings',
        label: '弦数',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['4弦', '6弦', '12弦', '其他']
      }
    ]
  },

  // 图书
  books: {
    paper_book: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['Kindle', '汉王', '掌阅', '文石', '墨案', '其他']
      },
      {
        field: 'model',
        label: '型号',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入具体型号'
      },
      {
        field: 'screenSize',
        label: '屏幕尺寸',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['6英寸', '7英寸', '8英寸', '10英寸', '其他']
      }
    ]
  },

  // 运动器材
  sports: {
    fitness: [
      {
        field: 'type',
        label: '器材类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['哑铃', '杠铃', '跑步机', '健身车', '椭圆机', '划船机', '瑜伽垫', '其他']
      },
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入品牌'
      },
      {
        field: 'weight',
        label: '重量/规格',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入重量或规格'
      }
    ]
  },

  // 服饰鞋包
  clothes: {
    clothing: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入品牌'
      },
      {
        field: 'size',
        label: '尺码',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '其他']
      },
      {
        field: 'color',
        label: '颜色',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入颜色'
      },
      {
        field: 'season',
        label: '适用季节',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['春季', '夏季', '秋季', '冬季', '四季']
      }
    ],
    shoes: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入品牌'
      },
      {
        field: 'size',
        label: '尺码',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '其他']
      },
      {
        field: 'color',
        label: '颜色',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入颜色'
      },
      {
        field: 'type',
        label: '鞋类类型',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['运动鞋', '休闲鞋', '皮鞋', '高跟鞋', '靴子', '拖鞋', '其他']
      }
    ]
  },

  // 美妆日化
  beauty: {
    makeup: [
      {
        field: 'brand',
        label: '品牌',
        type: FIELD_TYPES.TEXT,
        required: true,
        placeholder: '请输入品牌'
      },
      {
        field: 'type',
        label: '产品类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['口红', '粉底液', '眼影', '睫毛膏', '腮红', '眉笔', '其他']
      },
      {
        field: 'shade',
        label: '色号',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入色号'
      },
      {
        field: 'expiryDate',
        label: '保质期',
        type: FIELD_TYPES.DATE,
        required: false,
        placeholder: '请选择保质期'
      }
    ]
  },

  // 家居日用
  furniture: {
    furniture: [
      {
        field: 'type',
        label: '家具类型',
        type: FIELD_TYPES.SELECT,
        required: true,
        options: ['沙发', '床', '桌子', '椅子', '柜子', '书架', '其他']
      },
      {
        field: 'material',
        label: '材质',
        type: FIELD_TYPES.SELECT,
        required: false,
        options: ['实木', '人造板', '金属', '塑料', '玻璃', '其他']
      },
      {
        field: 'size',
        label: '尺寸',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入尺寸，如长×宽×高'
      },
      {
        field: 'color',
        label: '颜色',
        type: FIELD_TYPES.TEXT,
        required: false,
        placeholder: '请输入颜色'
      }
    ]
  }
}

/**
 * 根据分类ID和子分类ID获取规格参数
 * @param {string} categoryId - 分类ID
 * @param {string} subcategoryId - 子分类ID
 * @returns {Array} 规格参数数组
 */
export function getSpecsByCategory(categoryId, subcategoryId) {
  const categorySpecs = CATEGORY_SPECS[categoryId]
  if (!categorySpecs) return []
  
  const subcategorySpecs = categorySpecs[subcategoryId]
  if (!subcategorySpecs) return []
  
  return subcategorySpecs
}

/**
 * 获取基础字段
 * @returns {Array} 基础字段数组
 */
export function getBasicFields() {
  return BASIC_FIELDS
}

/**
 * 获取完整的字段配置（基础字段 + 规格参数）
 * @param {string} categoryId - 分类ID
 * @param {string} subcategoryId - 子分类ID
 * @returns {Object} 完整的字段配置
 */
export function getFullFieldConfig(categoryId, subcategoryId) {
  const basicFields = getBasicFields()
  const specFields = getSpecsByCategory(categoryId, subcategoryId)
  
  return {
    basic: basicFields,
    specs: specFields,
    all: [...basicFields, ...specFields]
  }
} 