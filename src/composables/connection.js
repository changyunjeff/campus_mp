import { socket } from "@/utils/request";
import { ref, watch } from 'vue';
import {useUserStore} from "@/pinia/modules/user";
import {MSG_TYPE} from "@/constants/msg";

let instance = null;
let socketTask = null;

/**
 * 单例模式的WebSocket连接类
 */

export function useConnection() {
  if (instance) {
    return instance;
  }

  const connected = ref(false);
  const handlers = ref({});
  // 重连相关状态
  const reconnecting = ref(false);
  const shouldReconnect = ref(true); // 是否应该重连（用户主动断开时设为false）
  
  // 重连定时器和配置
  let reconnectTimer = null;
  let heartbeatTimer = null;
  const RECONNECT_INTERVAL = 10000; // 10秒重连间隔
  let reconnectAttempts = 0;

  const send = async (data) => {
    // 如果连接未建立，先建立连接
    if (!connected.value) {
      await connect();
    }
    let useBuffer = false
    if (data instanceof ArrayBuffer) {
      useBuffer = true;
    }
    return new Promise((resolve, reject) => {
      uni.sendSocketMessage({
        data: useBuffer ? data : JSON.stringify(data),
        success: (res) => {
          console.debug('发送消息成功', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('发送消息失败', err);
          reject(err);
        }
      });
    })
  }

  const connect = async () => {
    if (connected.value || reconnecting.value) {
      console.log('WebSocket已连接或正在重连中，跳过连接请求');
      return; 
    }

    console.group("===============================》开始建立WebSocket连接")
    reconnecting.value = true;
    
    try {
        socketTask = await socket({
          onOpen: (res) => {
            console.log('WebSocket连接已打开');
            connected.value = true;
            reconnecting.value = false;
            reconnectAttempts = 0; // 重置重连次数
            
            // 清除重连定时器
            if (reconnectTimer) {
              clearTimeout(reconnectTimer);
              reconnectTimer = null;
            }
            
            // 连接建立后，发送心跳包
            heartbeatTimer = setInterval(sendPing, import.meta.env.VITE_PING_INTERVAL);
          },
          onClose: (res) => {
            console.log('WebSocket连接已关闭', res);
            connected.value = false;
            reconnecting.value = false;
            
            // 断开连接后取消心跳包
            if (heartbeatTimer) {
              clearInterval(heartbeatTimer);
              heartbeatTimer = null;
            }
            
            // 如果应该重连且不是用户主动关闭，则启动重连
            if (shouldReconnect.value && res.code !== 1000) {
              startReconnect();
            }
          },
          onError: (err) => {
            console.log('WebSocket连接发生错误', err);
            connected.value = false;
            reconnecting.value = false;
            
            // 连接错误时也启动重连
            if (shouldReconnect.value) {
              startReconnect();
            }
          },
          onMessage: (res) => {
            console.log('收到服务器消息：', res);
            try {
              const data = typeof res.data === 'string'
                ? JSON.parse(res.data)
                : res.data;
              
              // 原有的事件处理机制
              const event = data.type;
              if (event && handlers.value[event]) {
                handlers.value[event](data);
              }
            } catch (error) {
              console.error('解析消息失败', error);
            }
          }
        });
    } catch (error) {
        console.error('WebSocket连接失败', error);
        reconnecting.value = false;
        
        // 连接失败时启动重连
        if (shouldReconnect.value) {
          startReconnect();
        }
    } finally {
      console.groupEnd()
    }
  }

  // 启动重连机制
  const startReconnect = () => {
    if (reconnectTimer || !shouldReconnect.value) {
      return; // 已有重连定时器或不应该重连
    }

    reconnectAttempts++;
    console.log(`WebSocket连接断开，将在${RECONNECT_INTERVAL/1000}秒后进行第${reconnectAttempts}次重连...`);
    
    reconnectTimer = setTimeout(async () => {
      if (!connected.value && shouldReconnect.value) {
        console.log(`开始第${reconnectAttempts}次重连...`);
        try {
          await connect();
        } catch (error) {
          console.error(`第${reconnectAttempts}次重连失败:`, error);
        }
      }
      reconnectTimer = null;
    }, RECONNECT_INTERVAL);
  }

  // 停止重连
  const stopReconnect = () => {
    shouldReconnect.value = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  const disconnect = () => {
    if (!connected.value || !socketTask) {
      return;
    }
    
    // 用户主动断开，停止重连机制
    stopReconnect();
    
    // 关闭WebSocket连接
    socketTask.close({
      code: 1000,
      reason: '用户主动关闭连接',
      success: () => {
        connected.value = false;
        console.log('WebSocket连接已主动关闭');
      },
      fail: (err) => {
        console.error('关闭WebSocket连接失败', err);
      }
    });
  }

  // 重新启用重连机制（用于登录后重新开启）
  const enableReconnect = () => {
    shouldReconnect.value = true;
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

  // 监听WebSocket事件
  watch(handlers, (newValue) => {
    console.log('WebSocket事件处理程序已更新', newValue);
  })

  async function sendPing() {
    try {
      const pingFrame = createPingFrame()
      return send(pingFrame)
    } catch (error) {
      console.error('发送心跳包失败:', error);
      // 心跳包发送失败，可能连接已断开
      if (connected.value) {
        connected.value = false;
        if (shouldReconnect.value) {
          startReconnect();
        }
      }
    }
  }

  /**
   * 创建 ping 帧
   * @returns {ArrayBuffer} ping帧数据
   */
  function createPingFrame() {
    // 创建一个 1 字节的 ArrayBuffer
    // 1字节类型
    const buffer = new ArrayBuffer(1)
    const view = new DataView(buffer)
    
    // 设置类型标识符
    view.setUint8(0, 0x09)

    return buffer
  }

  instance = {
    connected,
    reconnecting,
    handlers,
    connect,
    disconnect,
    enableReconnect,
    stopReconnect,
    registerHandler,
    unregisterHandler,
    send,
  }
  return instance;
} 