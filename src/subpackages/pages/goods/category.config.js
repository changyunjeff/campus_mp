/**
 * 商品分类配置文件
 * 定义商品发布时可选择的分类结构
 */

// 一级分类列表
export const categories = [
  {
    id: 'digital',
    name: '电脑办公',
    icon: 'laptop',
    color: '#1989fa'
  },
  {
    id: 'mobile',
    name: '次元仓',
    icon: 'mobile',
    color: '#f43f5e'
  },
  {
    id: 'appliances',
    name: '智能穿戴',
    icon: 'watch',
    color: '#ff9500'
  },
  {
    id: 'fun',
    name: 'Fun!',
    icon: 'emoji-smile',
    color: '#ff2d55'
  },
  {
    id: 'music',
    name: 'Music!',
    icon: 'music',
    color: '#5856d6'
  },
  {
    id: 'books',
    name: '图书',
    icon: 'book',
    color: '#34c759'
  },
  {
    id: 'sports',
    name: '运动器材',
    icon: 'dumbbell',
    color: '#007aff'
  },
  {
    id: 'clothes',
    name: '服饰鞋包',
    icon: 'shirt',
    color: '#ff6b22'
  },
  {
    id: 'beauty',
    name: '美妆日化',
    icon: 'star',
    color: '#ff375f'
  },
  {
    id: 'furniture',
    name: '家居日用',
    icon: 'home',
    color: '#af52de'
  }
]

// 二级分类映射
export const subCategories = {
  digital: [
    {
      id: 'laptop',
      name: '笔记本',
      icon: 'https://img.icons8.com/fluency/48/null/macbook.png'
    },
    {
      id: 'keyboard',
      name: '机械键盘/鼠标',
      icon: 'https://img.icons8.com/fluency/48/null/keyboard.png'
    },
    {
      id: 'mini_pc',
      name: 'mini主机',
      icon: 'https://img.icons8.com/fluency/48/null/mac-mini.png'
    },
    {
      id: 'hard_drive',
      name: '移动硬盘',
      icon: 'https://img.icons8.com/fluency/48/null/hdd.png'
    },
    {
      id: 'touch_keyboard',
      name: '妙控键盘',
      icon: 'https://img.icons8.com/fluency/48/null/keyboard.png'
    }
  ],
  mobile: [
    {
      id: 'iphone',
      name: '苹果手机',
      icon: 'https://img.icons8.com/fluency/48/null/iphone.png'
    },
    {
      id: 'android',
      name: '安卓手机',
      icon: 'https://img.icons8.com/fluency/48/null/android.png'
    },
    {
      id: 'ipad',
      name: '平板电脑',
      icon: 'https://img.icons8.com/fluency/48/null/ipad.png'
    },
    {
      id: 'accessories',
      name: '手机配件',
      icon: 'https://img.icons8.com/fluency/48/null/smartphone-approve.png'
    }
  ],
  appliances: [
    {
      id: 'earphones',
      name: '耳机/耳麦',
      icon: 'https://img.icons8.com/fluency/48/null/earbud-headphones.png'
    },
    {
      id: 'smart_watch',
      name: '智能手表',
      icon: 'https://img.icons8.com/fluency/48/null/apple-watch.png'
    },
    {
      id: 'vr',
      name: 'VR/AR眼镜',
      icon: 'https://img.icons8.com/fluency/48/null/virtual-reality.png'
    },
    {
      id: 'smart_glasses',
      name: '智能眼镜',
      icon: 'https://img.icons8.com/fluency/48/null/google-glass.png'
    },
    {
      id: 'weather',
      name: '小天才',
      icon: 'https://img.icons8.com/fluency/48/null/smart-watch.png'
    },
    {
      id: 'band',
      name: '智能手环',
      icon: 'https://img.icons8.com/fluency/48/null/smart-watch.png'
    }
  ],
  fun: [
    {
      id: 'camera',
      name: '摄影影像',
      icon: 'https://img.icons8.com/fluency/48/null/compact-camera.png'
    },
    {
      id: 'sports',
      name: '运动器材',
      icon: 'https://img.icons8.com/fluency/48/null/bench-press.png'
    },
    {
      id: 'games',
      name: '游戏娱乐',
      icon: 'https://img.icons8.com/fluency/48/null/controller.png'
    },
    {
      id: 'audio',
      name: '影音娱乐',
      icon: 'https://img.icons8.com/fluency/48/null/film-reel.png'
    }
  ],
  music: [
    {
      id: 'instruments',
      name: '潮流乐器',
      icon: 'https://img.icons8.com/fluency/48/null/guitar.png'
    },
    {
      id: 'guitar',
      name: '吉他/贝斯',
      icon: 'https://img.icons8.com/fluency/48/null/guitar.png'
    },
    {
      id: 'effects',
      name: '效果器',
      icon: 'https://img.icons8.com/fluency/48/null/audio-wave.png'
    },
    {
      id: 'audio',
      name: '乐器音箱',
      icon: 'https://img.icons8.com/fluency/48/null/speaker.png'
    }
  ],
  books: [
    {
      id: 'paper_book',
      name: '电纸书',
      icon: 'https://img.icons8.com/fluency/48/null/kindle.png'
    },
    {
      id: 'reading_pen',
      name: '点读笔',
      icon: 'https://img.icons8.com/fluency/48/null/pen.png'
    },
    {
      id: 'study_machine',
      name: '学习机',
      icon: 'https://img.icons8.com/fluency/48/null/laptop-coding.png'
    },
    {
      id: 'translator',
      name: '翻译机',
      icon: 'https://img.icons8.com/fluency/48/null/translation.png'
    },
    {
      id: 'tape',
      name: '录音笔',
      icon: 'https://img.icons8.com/fluency/48/null/micro.png'
    }
  ],
  sports: [
    {
      id: 'fitness',
      name: '健身器材',
      icon: 'https://img.icons8.com/fluency/48/null/dumbbell.png'
    },
    {
      id: 'bicycles',
      name: '自行车',
      icon: 'https://img.icons8.com/fluency/48/null/bicycle.png'
    },
    {
      id: 'balls',
      name: '球类',
      icon: 'https://img.icons8.com/fluency/48/null/basketball.png'
    },
    {
      id: 'outdoor',
      name: '户外装备',
      icon: 'https://img.icons8.com/fluency/48/null/camping-tent.png'
    }
  ],
  clothes: [
    {
      id: 'clothing',
      name: '服装',
      icon: 'https://img.icons8.com/fluency/48/null/t-shirt.png'
    },
    {
      id: 'shoes',
      name: '鞋靴',
      icon: 'https://img.icons8.com/fluency/48/null/sneakers.png'
    },
    {
      id: 'bags',
      name: '箱包',
      icon: 'https://img.icons8.com/fluency/48/null/shopping-bag.png'
    },
    {
      id: 'watches',
      name: '钟表',
      icon: 'https://img.icons8.com/fluency/48/null/watch.png'
    },
    {
      id: 'jewelry',
      name: '珠宝首饰',
      icon: 'https://img.icons8.com/fluency/48/null/diamond.png'
    }
  ],
  beauty: [
    {
      id: 'makeup',
      name: '彩妆',
      icon: 'https://img.icons8.com/fluency/48/null/lipstick.png'
    },
    {
      id: 'skincare',
      name: '护肤',
      icon: 'https://img.icons8.com/fluency/48/null/moisturizer.png'
    },
    {
      id: 'perfume',
      name: '香水',
      icon: 'https://img.icons8.com/fluency/48/null/perfume.png'
    },
    {
      id: 'tools',
      name: '美容工具',
      icon: 'https://img.icons8.com/fluency/48/null/hair-dryer.png'
    }
  ],
  furniture: [
    {
      id: 'furniture',
      name: '家具',
      icon: 'https://img.icons8.com/fluency/48/null/sofa.png'
    },
    {
      id: 'kitchenware',
      name: '厨具',
      icon: 'https://img.icons8.com/fluency/48/null/frying-pan.png'
    },
    {
      id: 'textiles',
      name: '家纺',
      icon: 'https://img.icons8.com/fluency/48/null/bed.png'
    },
    {
      id: 'cleaning',
      name: '清洁用品',
      icon: 'https://img.icons8.com/fluency/48/null/broom.png'
    }
  ]
}

// 获取所有一级分类
export function getAllCategories() {
  return categories
}

// 根据一级分类ID获取二级分类
export function getSubcategories(categoryId) {
  return subCategories[categoryId] || []
}

// 根据ID获取分类信息
export function getCategoryById(categoryId) {
  return categories.find(category => category.id === categoryId) || null
}

// 根据一级分类ID和二级分类ID获取二级分类信息
export function getSubcategoryById(categoryId, subcategoryId) {
  const subcategories = getSubcategories(categoryId)
  return subcategories.find(subcategory => subcategory.id === subcategoryId) || null
}

// 获取所有可用分类，以嵌套结构返回
export function getCategoryTree() {
  return categories.map(category => ({
    ...category,
    children: getSubcategories(category.id)
  }))
}
