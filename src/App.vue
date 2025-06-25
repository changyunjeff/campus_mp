<script setup>
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useGlobalStore } from '@/pinia/modules/global';
import { useSchoolStore } from '@/pinia/modules/school';
import { useConnection } from '@/composables/connection';

const globalStore = useGlobalStore();

onLaunch(() => {
  const systemInfo = uni.getSystemInfoSync();
  globalStore.setStatusBarHeight(systemInfo.statusBarHeight);
  
  // 检查学校选择状态
  checkSchoolSelection();
});

// 应用显示时，确保重连机制启用
onShow(() => {
  console.log('📱 应用显示，检查WebSocket连接状态');
  const connection = useConnection();
  
  // 如果已经有实例，启用重连机制
  if (connection.connected || connection.reconnecting) {
    connection.enableReconnect();
    console.log('🔄 WebSocket重连机制已启用');
  }
});

// 应用隐藏时，停止重连但不断开连接
onHide(() => {
  console.log('📱 应用隐藏，暂停WebSocket重连机制');
  const connection = useConnection();
  
  // 暂时停止重连，但保持连接
  if (connection.stopReconnect) {
    connection.stopReconnect();
    console.log('⏸️ WebSocket重连机制已暂停');
  }
});

// 检查学校选择状态
const checkSchoolSelection = () => {
  const schoolStore = useSchoolStore();
  schoolStore.loadFromStorage();
  
  console.log('🎓 检查学校选择状态:', schoolStore.needsSchoolSelection);
  
  if (schoolStore.needsSchoolSelection) {
    console.log('🏫 未选择学校，跳转到学校选择页面');
    uni.reLaunch({
      url: '/pages/choose-school'
    });
  } else {
    console.log('✅ 已选择学校:', schoolStore.currentSchoolName);
    uni.reLaunch({
      url: '/pages/welcome'
    });
  }
};
</script>

<style lang="scss">
@import "./uni.scss";
/* 引入iconfont CSS */
@import "/static/iconfont/iconfont.css";
/* Global styles */
/* 全局盒模型设置 */
view, scroll-view, input, text, button {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
