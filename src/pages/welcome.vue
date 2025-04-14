<template>
  <div class="welcome-page">
    <div class="logo" :class="{'active': showLogo}">
      <img src="../assets/logo.svg" alt="Campus Assistant Logo">
    </div>
    <div class="title" :class="{'active': showTitle}">
      <h1>校园助手</h1>
      <p>您的校园生活好帮手</p>
    </div>
    <button class="enter-btn" :class="{'active': showButton}" @click="handleEnter">
      开始体验 
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const showLogo = ref(false);
const showTitle = ref(false);
const showButton = ref(false);

function handleEnter() {
  // Add your navigation logic here
  console.log('Entering the app');
}

onMounted(() => {
  setTimeout(() => showLogo.value = true, 300);
  setTimeout(() => showTitle.value = true, 800);
  setTimeout(() => showButton.value = true, 1300);
});
</script>

<style scoped>
.welcome-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e9f2 100%);
  padding: 20px;
}

.logo, .title, .enter-btn {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s, transform 0.8s;
}

.active {
  opacity: 1;
  transform: translateY(0);
}

.logo {
  margin-bottom: 40px;
}

.logo img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

.title {
  text-align: center;
  margin-bottom: 60px;
}

.title h1 {
  font-size: 28px;
  color: #333;
  margin-bottom: 8px;
}

.title p {
  font-size: 16px;
  color: #666;
}

.enter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 100px;
  padding: 12px 32px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 122, 255, 0.4);
}
</style>
