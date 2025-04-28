<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useGlobalStore } from '@/pinia/modules/global';

const globalStore = useGlobalStore();

onLaunch(() => {
  const systemInfo = uni.getSystemInfoSync();
  globalStore.setStatusBarHeight(systemInfo.statusBarHeight);
});
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
