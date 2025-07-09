/**
 * 省市区数据
 * 这是一个简化版本，实际使用时建议使用完整的国家统计局数据
 */
export const regionData = [
  {
    name: '江苏省',
    code: '32',
    children: [
      {
        name: '苏州市',
        code: '3205',
        children: [
          { name: '姑苏区', code: '320508' },
          { name: '吴中区', code: '320506' },
          { name: '相城区', code: '320507' },
          { name: '虎丘区', code: '320505' },
          { name: '吴江区', code: '320509' },
          { name: '昆山市', code: '320583' },
          { name: '张家港市', code: '320582' },
          { name: '常熟市', code: '320581' },
          { name: '太仓市', code: '320585' }
        ]
      },
      {
        name: '南京市',
        code: '3201',
        children: [
          { name: '玄武区', code: '320102' },
          { name: '鼓楼区', code: '320106' },
          { name: '建邺区', code: '320105' },
          { name: '秦淮区', code: '320104' },
          { name: '雨花台区', code: '320114' },
          { name: '栖霞区', code: '320113' },
          { name: '浦口区', code: '320111' },
          { name: '江宁区', code: '320115' },
          { name: '六合区', code: '320116' },
          { name: '溧水区', code: '320117' },
          { name: '高淳区', code: '320118' }
        ]
      },
      {
        name: '无锡市',
        code: '3202',
        children: [
          { name: '锡山区', code: '320205' },
          { name: '惠山区', code: '320206' },
          { name: '滨湖区', code: '320211' },
          { name: '梁溪区', code: '320213' },
          { name: '新吴区', code: '320214' },
          { name: '江阴市', code: '320281' },
          { name: '宜兴市', code: '320282' }
        ]
      },
      {
        name: '常州市',
        code: '3204',
        children: [
          { name: '天宁区', code: '320402' },
          { name: '钟楼区', code: '320404' },
          { name: '新北区', code: '320411' },
          { name: '武进区', code: '320412' },
          { name: '金坛区', code: '320413' },
          { name: '溧阳市', code: '320481' }
        ]
      }
    ]
  },
  {
    name: '上海市',
    code: '31',
    children: [
      {
        name: '上海市',
        code: '3101',
        children: [
          { name: '黄浦区', code: '310101' },
          { name: '徐汇区', code: '310104' },
          { name: '长宁区', code: '310105' },
          { name: '静安区', code: '310106' },
          { name: '普陀区', code: '310107' },
          { name: '虹口区', code: '310109' },
          { name: '杨浦区', code: '310110' },
          { name: '闵行区', code: '310112' },
          { name: '宝山区', code: '310113' },
          { name: '嘉定区', code: '310114' },
          { name: '浦东新区', code: '310115' },
          { name: '金山区', code: '310116' },
          { name: '松江区', code: '310117' },
          { name: '青浦区', code: '310118' },
          { name: '奉贤区', code: '310120' },
          { name: '崇明区', code: '310151' }
        ]
      }
    ]
  },
  {
    name: '北京市',
    code: '11',
    children: [
      {
        name: '北京市',
        code: '1101',
        children: [
          { name: '东城区', code: '110101' },
          { name: '西城区', code: '110102' },
          { name: '朝阳区', code: '110105' },
          { name: '丰台区', code: '110106' },
          { name: '石景山区', code: '110107' },
          { name: '海淀区', code: '110108' },
          { name: '门头沟区', code: '110109' },
          { name: '房山区', code: '110111' },
          { name: '通州区', code: '110112' },
          { name: '顺义区', code: '110113' },
          { name: '昌平区', code: '110114' },
          { name: '大兴区', code: '110115' },
          { name: '怀柔区', code: '110116' },
          { name: '平谷区', code: '110117' },
          { name: '密云区', code: '110118' },
          { name: '延庆区', code: '110119' }
        ]
      }
    ]
  },
  {
    name: '广东省',
    code: '44',
    children: [
      {
        name: '广州市',
        code: '4401',
        children: [
          { name: '荔湾区', code: '440103' },
          { name: '越秀区', code: '440104' },
          { name: '海珠区', code: '440105' },
          { name: '天河区', code: '440106' },
          { name: '白云区', code: '440111' },
          { name: '黄埔区', code: '440112' },
          { name: '番禺区', code: '440113' },
          { name: '花都区', code: '440114' },
          { name: '南沙区', code: '440115' },
          { name: '从化区', code: '440117' },
          { name: '增城区', code: '440118' }
        ]
      },
      {
        name: '深圳市',
        code: '4403',
        children: [
          { name: '罗湖区', code: '440303' },
          { name: '福田区', code: '440304' },
          { name: '南山区', code: '440305' },
          { name: '宝安区', code: '440306' },
          { name: '龙岗区', code: '440307' },
          { name: '盐田区', code: '440308' },
          { name: '龙华区', code: '440309' },
          { name: '坪山区', code: '440310' },
          { name: '光明区', code: '440311' }
        ]
      },
      {
        name: '珠海市',
        code: '4404',
        children: [
          { name: '香洲区', code: '440402' },
          { name: '斗门区', code: '440403' },
          { name: '金湾区', code: '440404' }
        ]
      }
    ]
  },
  {
    name: '浙江省',
    code: '33',
    children: [
      {
        name: '杭州市',
        code: '3301',
        children: [
          { name: '上城区', code: '330102' },
          { name: '下城区', code: '330103' },
          { name: '江干区', code: '330104' },
          { name: '拱墅区', code: '330105' },
          { name: '西湖区', code: '330106' },
          { name: '滨江区', code: '330108' },
          { name: '萧山区', code: '330109' },
          { name: '余杭区', code: '330110' },
          { name: '富阳区', code: '330111' },
          { name: '临安区', code: '330112' },
          { name: '桐庐县', code: '330122' },
          { name: '淳安县', code: '330127' },
          { name: '建德市', code: '330182' }
        ]
      },
      {
        name: '宁波市',
        code: '3302',
        children: [
          { name: '海曙区', code: '330203' },
          { name: '江北区', code: '330205' },
          { name: '北仑区', code: '330206' },
          { name: '镇海区', code: '330211' },
          { name: '鄞州区', code: '330212' },
          { name: '奉化区', code: '330213' },
          { name: '象山县', code: '330225' },
          { name: '宁海县', code: '330226' },
          { name: '余姚市', code: '330281' },
          { name: '慈溪市', code: '330282' }
        ]
      }
    ]
  }
]

/**
 * 根据省市区名称查找完整数据
 * @param {string} provinceName - 省份名称
 * @param {string} cityName - 城市名称
 * @param {string} districtName - 区县名称
 * @returns {Object} 完整的地区数据
 */
export const findRegionByName = (provinceName, cityName, districtName) => {
  const province = regionData.find(p => p.name === provinceName)
  if (!province) return null
  
  const city = province.children.find(c => c.name === cityName)
  if (!city) return { province }
  
  const district = city.children.find(d => d.name === districtName)
  if (!district) return { province, city }
  
  return { province, city, district }
}

/**
 * 根据行政区划代码查找地区
 * @param {string} code - 行政区划代码
 * @returns {Object} 地区信息
 */
export const findRegionByCode = (code) => {
  for (const province of regionData) {
    if (province.code === code) {
      return { province }
    }
    
    for (const city of province.children) {
      if (city.code === code) {
        return { province, city }
      }
      
      for (const district of city.children) {
        if (district.code === code) {
          return { province, city, district }
        }
      }
    }
  }
  
  return null
}

/**
 * 格式化地区文本
 * @param {Object} region - 地区对象
 * @returns {string} 格式化后的地区文本
 */
export const formatRegionText = (region) => {
  if (!region) return ''
  
  let text = ''
  if (region.province) text += region.province.name
  if (region.city) text += ` ${region.city.name}`
  if (region.district) text += ` ${region.district.name}`
  
  return text.trim()
} 