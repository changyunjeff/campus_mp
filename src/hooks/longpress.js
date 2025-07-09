/**
 * 长按指令
 * 使用方式：@longpress="callback"
 * @example @longpress="handleLongPress"
 */

export default {
    name: 'longpress',

      mounted(el, binding) {
    if (typeof binding.value !== 'function') {
      console.warn('[longpress] 提供的表达式必须是一个函数');
      return;
    }
    
    // 定义变量
    let pressTimer = null;
    let start = false;
    
    // 创建计时器（ 500毫秒后执行函数 ）
    const startFn = (e) => {
      if (e.type === 'click') return;
      
      if (pressTimer === null) {
        start = true;
        pressTimer = setTimeout(() => {
          // 执行函数
          binding.value(e);
        }, 500);
      }
    };
    
    // 取消计时器
    const cancelFn = (e) => {
      if (pressTimer !== null) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      start = false;
    };
    
    // 存储事件处理器到元素上，便于之后移除
    el._onTouchStart = startFn;
    el._onTouchEnd = cancelFn;
    el._onTouchCancel = cancelFn;
    el._onMouseDown = startFn;
    el._onMouseUp = cancelFn;
    el._onMouseLeave = cancelFn;
    
    // 添加事件监听器
    el.addEventListener('touchstart', el._onTouchStart);
    el.addEventListener('touchend', el._onTouchEnd);
    el.addEventListener('touchcancel', el._onTouchCancel);
    
    // 在PC端也能使用
    el.addEventListener('mousedown', el._onMouseDown);
    el.addEventListener('mouseup', el._onMouseUp);
    el.addEventListener('mouseleave', el._onMouseLeave);
  },
    
    beforeUnmount(el) {
      // 移除事件监听器
      el.removeEventListener('touchstart', el._onTouchStart);
      el.removeEventListener('touchend', el._onTouchEnd);
      el.removeEventListener('touchcancel', el._onTouchCancel);
      el.removeEventListener('mousedown', el._onMouseDown);
      el.removeEventListener('mouseup', el._onMouseUp);
      el.removeEventListener('mouseleave', el._onMouseLeave);
    }
  };