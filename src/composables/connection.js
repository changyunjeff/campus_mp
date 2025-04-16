import { useRequest } from "./request";
import { ref, watch } from 'vue';

let instance = null;
let socketTask = null;

/**
 * 单例模式的WebSocket连接类
 */

export function useConnection() {
  if (instance) {
    return instance;
  }

  const { socket } = useRequest();

  const connected = ref(false);
  const handlers = ref({});

  const connect = async () => {
    if (connected.value) {
      return; 
    }
    try {
        socketTask = await socket({
          onOpen: (res) => {
            console.log('WebSocket连接已打开');
            connected.value = true;
          },
          onClose: (res) => {
            console.log('WebSocket连接已关闭');
            connected.value = false;
          },
          onError: (err) => {
            console.log('WebSocket连接发生错误', err);
            connected.value = false;
          },
          onMessage: (res) => {
            console.log('收到服务器消息：', res.data);
            try {
              const data = JSON.parse(res.data);
              const event = data.event;
              if (handlers.value[event]) {
                handlers.value[event](data);
              }
            } catch (error) {
              console.error('解析消息失败', error);
            }
          }
        });
    } catch (error) {
        console.error('WebSocket连接失败', error);
        return;
    }
    console.log('WebSocket连接成功');
  }

  const disconnect = () => {
    if (!connected.value || !socketTask) {
      return;
    }
    // 关闭WebSocket连接
    socketTask.close({
      code: 1000,
      reason: '用户主动关闭连接',
      success: () => {
        console.log('WebSocket连接已关闭');
        connected.value = false;
      },
      fail: (err) => {
        console.error('关闭WebSocket连接失败', err);
      }
    });
  }

  // 注册事件处理程序
  const registerHandler = (event, handler) => {
    if (handlers.value[event]) {
      delete handlers.value[event];
    }
    handlers.value[event] = handler;
  }

  // 注销事件处理程序
  const unregisterHandler = (event) => {
    if (handlers.value[event]) {
      delete handlers.value[event];
    }
  }

  // 监听连接状态变化
  watch(connected, (newValue) => {
    if (newValue) {
      console.log('WebSocket连接已建立');
    } else {
      console.log('WebSocket连接已断开');
    }
  })

  // 监听WebSocket事件
  watch(handlers, (newValue) => {
    console.log('WebSocket事件处理程序已更新', newValue);
  })

  instance = {
    connected,
    handlers,
    connect,
    disconnect,
    registerHandler,
    unregisterHandler,
  }
  return instance;
}
