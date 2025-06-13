<template>
    <view class="cache-debug-page">
      <view class="header">
        <text class="title">聊天设置缓存调试</text>
      </view>
      
      <view class="stats-section">
        <text class="section-title">缓存统计</text>
        <view class="stats-grid">
          <view class="stat-item">
            <text class="stat-label">内存缓存</text>
            <text class="stat-value">{{ stats.memoryCache }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">本地存储</text>
            <text class="stat-value">{{ stats.total }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">有效缓存</text>
            <text class="stat-value">{{ stats.valid }}</text>
          </view>
          <view class="stat-item">
            <text class="stat-label">过期缓存</text>
            <text class="stat-value">{{ stats.expired }}</text>
          </view>
        </view>
      </view>
      
      <view class="test-section">
        <text class="section-title">缓存测试</text>
        
        <view class="input-group">
          <text class="input-label">用户ID:</text>
          <input 
            v-model="testUserId" 
            class="input-field" 
            placeholder="输入用户ID进行测试"
          />
        </view>
        
        <view class="button-group">
          <button @click="testGetSettings" class="test-btn">获取设置</button>
          <button @click="testUpdateSettings" class="test-btn">更新设置</button>
          <button @click="testClearCache" class="test-btn">清理缓存</button>
        </view>
        
        <view class="result-section" v-if="testResult">
          <text class="result-title">测试结果:</text>
          <text class="result-content">{{ testResult }}</text>
        </view>
      </view>
      
      <view class="performance-section">
        <text class="section-title">性能测试</text>
        
        <view class="button-group">
          <button @click="performanceTest" class="test-btn">批量测试</button>
          <button @click="cleanExpiredCache" class="test-btn">清理过期</button>
          <button @click="refreshStats" class="test-btn">刷新统计</button>
        </view>
        
        <view class="performance-result" v-if="performanceResult">
          <text class="result-title">性能结果:</text>
          <text class="result-content">{{ performanceResult }}</text>
        </view>
      </view>
    </view>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import { useChatSettings } from '@/composables/chat-settings'
  
  const chatSettings = useChatSettings()
  
  // 响应式数据
  const stats = ref({
    memoryCache: 0,
    total: 0,
    valid: 0,
    expired: 0,
    maxSize: 500
  })
  
  const testUserId = ref('test_user_001')
  const testResult = ref('')
  const performanceResult = ref('')
  
  // 刷新统计信息
  const refreshStats = () => {
    stats.value = chatSettings.getStats()
  }
  
  // 测试获取设置
  const testGetSettings = async () => {
    if (!testUserId.value) {
      testResult.value = '请输入用户ID'
      return
    }
    
    const startTime = Date.now()
    try {
      const settings = await chatSettings.getSettings(testUserId.value)
      const endTime = Date.now()
      
      testResult.value = `获取成功 (${endTime - startTime}ms):\n${JSON.stringify(settings, null, 2)}`
      refreshStats()
    } catch (error) {
      testResult.value = `获取失败: ${error.message}`
    }
  }
  
  // 测试更新设置
  const testUpdateSettings = async () => {
    if (!testUserId.value) {
      testResult.value = '请输入用户ID'
      return
    }
    
    const newSettings = {
      isPinned: Math.random() > 0.5,
      isMuted: Math.random() > 0.5,
      isBlocked: Math.random() > 0.5
    }
    
    const startTime = Date.now()
    try {
      const success = chatSettings.updateSettings(testUserId.value, newSettings)
      const endTime = Date.now()
      
      testResult.value = `更新${success ? '成功' : '失败'} (${endTime - startTime}ms):\n${JSON.stringify(newSettings, null, 2)}`
      refreshStats()
    } catch (error) {
      testResult.value = `更新失败: ${error.message}`
    }
  }
  
  // 测试清理缓存
  const testClearCache = () => {
    if (testUserId.value) {
      chatSettings.clearCache(testUserId.value)
      testResult.value = `已清理用户 ${testUserId.value} 的缓存`
    } else {
      chatSettings.clearCache()
      testResult.value = '已清理所有缓存'
    }
    refreshStats()
  }
  
  // 性能测试
  const performanceTest = async () => {
    const testUserIds = Array.from({ length: 20 }, (_, i) => `test_user_${String(i + 1).padStart(3, '0')}`)
    
    performanceResult.value = '正在进行性能测试...'
    
    const startTime = Date.now()
    
    try {
      // 批量预加载测试
      const results = await chatSettings.batchPreloadSettings(testUserIds)
      const endTime = Date.now()
      
      const totalTime = endTime - startTime
      const avgTime = totalTime / testUserIds.length
      
      performanceResult.value = `批量加载完成:
  - 总用户数: ${testUserIds.length}
  - 总耗时: ${totalTime}ms
  - 平均耗时: ${avgTime.toFixed(2)}ms/用户
  - 成功加载: ${results.size}个`
      
      refreshStats()
    } catch (error) {
      performanceResult.value = `性能测试失败: ${error.message}`
    }
  }
  
  // 清理过期缓存
  const cleanExpiredCache = () => {
    const cleaned = chatSettings.cleanExpiredCache()
    performanceResult.value = `清理过期缓存${cleaned ? '成功' : '无需清理'}`
    refreshStats()
  }
  
  // 页面加载时刷新统计
  onMounted(() => {
    refreshStats()
  })
  </script>
  
  <style lang="scss" scoped>
  .cache-debug-page {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100vh;
  }
  
  .header {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .title {
    font-size: 24px;
    font-weight: bold;
    color: #333;
  }
  
  .section-title {
    font-size: 18px;
    font-weight: bold;
    color: #333;
    margin-bottom: 15px;
    display: block;
  }
  
  .stats-section {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }
  
  .stat-item {
    text-align: center;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .stat-label {
    display: block;
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
  }
  
  .stat-value {
    display: block;
    font-size: 20px;
    font-weight: bold;
    color: #007aff;
  }
  
  .test-section, .performance-section {
    background: white;
    padding: 20px;
    border-radius: 10px;
    margin-bottom: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }
  
  .input-group {
    margin-bottom: 15px;
  }
  
  .input-label {
    display: block;
    font-size: 14px;
    color: #333;
    margin-bottom: 5px;
  }
  
  .input-field {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
  }
  
  .button-group {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }
  
  .test-btn {
    flex: 1;
    min-width: 80px;
    padding: 12px 16px;
    background: #007aff;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
  }
  
  .test-btn:active {
    background: #0056cc;
  }
  
  .result-section, .performance-result {
    margin-top: 15px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 6px;
    border-left: 4px solid #007aff;
  }
  
  .result-title {
    display: block;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }
  
  .result-content {
    display: block;
    font-family: monospace;
    font-size: 12px;
    color: #666;
    white-space: pre-wrap;
    word-break: break-all;
  }
  </style>