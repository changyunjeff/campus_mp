<script setup>
import { onLaunch } from '@dcloudio/uni-app'
import { useGlobalStore } from '@/pinia/modules/global';
import { useSchoolStore } from '@/pinia/modules/school';

const globalStore = useGlobalStore();

onLaunch(() => {
  const systemInfo = uni.getSystemInfoSync();
  globalStore.setStatusBarHeight(systemInfo.statusBarHeight);
  
  // 检查学校选择状态
  checkSchoolSelection();
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
