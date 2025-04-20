import mitt from 'mitt'

const emitter = mitt()

// 包装原始的 on 和 off 方法
const originalOn = emitter.on
const originalOff = emitter.off

// 添加事件处理函数的映射表
const handlersMap = new Map()

// 重写 on 方法
emitter.on = function(type, handler) {
  // 保存处理函数的引用
  if (!handlersMap.has(type)) {
    handlersMap.set(type, new Set())
  }
  handlersMap.get(type).add(handler)
  
  originalOn.call(this, type, handler)
  console.log('🎯 添加事件监听:', type)
  console.log('📋 当前所有事件:', Array.from(this.all.keys()))
}

// 重写 off 方法
emitter.off = function(type, handler) {
  // 从映射表中移除处理函数
  if (handlersMap.has(type)) {
    handlersMap.get(type).delete(handler)
    if (handlersMap.get(type).size === 0) {
      handlersMap.delete(type)
      // 如果没有处理函数了，从 all 中删除该事件
      this.all.delete(type)
    }
  }
  
  originalOff.call(this, type, handler)
  console.log('🎯 移除事件监听:', type)
  console.log('📋 当前所有事件:', Array.from(this.all.keys()))
}

/**
 * @function
 * @param {string} type
 * @return {boolean}
 * */
emitter.has = function (type) {
  console.log(`判断事件中心是否有名称为 ${type} 的事件: ${handlersMap.has(type)}`)
  return handlersMap.has(type)
}

export default emitter