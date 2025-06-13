import { socket } from "@/utils/request";
import { ref, watch } from 'vue';
import { useMessageHisotry } from './message_history';
import { MSG_TYPE } from '@/constants/msg';

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
    if (connected.value) {
      return; 
    }
    let timer;
    try {
        socketTask = await socket({
          onOpen: (res) => {
            console.log('WebSocket连接已打开');
            connected.value = true;
            
            // 连接建立后，发送心跳包
            timer = setInterval(sendPing, import.meta.env.VITE_PING_INTERVAL);
            
            // 拉取离线消息
            fetchOfflineMessages();
          },
          onClose: (res) => {
            console.log('WebSocket连接已关闭');
            connected.value = false;
            // 断开连接后取消心跳包
            clearInterval(timer)
          },
          onError: (err) => {
            console.log('WebSocket连接发生错误', err);
            connected.value = false;
          },
          onMessage: (res) => {
            console.log('收到服务器消息：', res);
            try {
              const data = typeof res.data === 'string'
                ? JSON.parse(res.data)
                : res.data;
              
              // 消息路由处理
              handleIncomingMessage(data);
              
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
    }
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

  // 监听WebSocket事件
  watch(handlers, (newValue) => {
    console.log('WebSocket事件处理程序已更新', newValue);
  })

  async function sendPing() {
    const pingFrame = createPingFrame()
    return send(pingFrame)
  }

  // 处理接收到的消息
  const handleIncomingMessage = (data) => {
    console.log('处理消息:', data.type, data);
    
    switch (data.type) {
      case MSG_TYPE.Chat:
        // 私聊消息处理
        handleChatMessage(data);
        break;
        
      case MSG_TYPE.NOTICE:
        // 系统通知处理
        handleNotificationMessage(data);
        break;
        
      case MSG_TYPE.SYSTEM:
        // 系统消息处理
        handleSystemMessage(data);
        break;
        
      default:
        console.log('未知消息类型:', data.type);
    }
  };
  
  // 处理私聊消息
  const handleChatMessage = (data) => {
    console.log('处理私聊消息:', data);
    
    // 保存到消息历史
    const messageHistory = useMessageHisotry();
    messageHistory.add(data.from, data);
    
    // 通过事件总线通知UI更新
    uni.$emit('newChatMessage', data);
    
    // 如果有振动权限，可以添加振动提醒
    if (uni.getSystemInfoSync().platform !== 'devtools') {
      uni.vibrateShort();
    }
  };
  
  // 处理系统通知
  const handleNotificationMessage = (data) => {
    console.log('处理系统通知:', data);
    uni.$emit('newSystemNotification', data);
    
    // 显示系统通知
    if (data.showToast) {
      uni.showToast({
        title: data.title || '新消息',
        icon: 'none'
      });
    }
  };
  
  // 处理系统消息
  const handleSystemMessage = (data) => {
    console.log('处理系统消息:', data);
    uni.$emit('newSystemMessage', data);
  };
  
  // 拉取离线消息
  const fetchOfflineMessages = async () => {
    try {
      console.log('开始拉取离线消息...');
      
      // 发送拉取离线消息的请求
      const request = {
        type: 'fetch_offline_messages',
        timestamp: Date.now()
      };
      
      await send(request);
      console.log('离线消息拉取请求已发送');
      
    } catch (error) {
      console.error('拉取离线消息失败:', error);
    }
  };

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
    handlers,
    connect,
    disconnect,
    registerHandler,
    unregisterHandler,
    send,
  }
  return instance;
}
