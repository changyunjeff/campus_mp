import { defineStore } from 'pinia'
import { SCHOOL_LIST, getSchoolById } from '@/configs/school.config.js'

export const useSchoolStore = defineStore('school', {
  state: () => ({
    // 当前选择的学校ID
    selectedSchoolId: '',
    // 学校选择历史
    selectionHistory: [],
    // 是否已经选择过学校
    hasSelected: false
  }),

  getters: {
    // 获取当前选择的学校信息
    currentSchool: (state) => {
      if (!state.selectedSchoolId) return null
      return getSchoolById(state.selectedSchoolId)
    },
    
    // 获取当前学校的显示名称
    currentSchoolName: (state) => {
      const school = getSchoolById(state.selectedSchoolId)
      return school ? school.name : ''
    },
    
    // 获取当前学校的短名称
    currentSchoolShortName: (state) => {
      const school = getSchoolById(state.selectedSchoolId)
      return school ? school.shortName : ''
    },
    
    // 获取当前学校的代码（用于请求头）
    currentSchoolCode: (state) => {
      const school = getSchoolById(state.selectedSchoolId)
      return school ? school.code : ''
    },
    
    // 获取可选择的学校列表
    availableSchools: () => SCHOOL_LIST,
    
    // 检查是否需要选择学校
    needsSchoolSelection: (state) => !state.selectedSchoolId || !state.hasSelected
  },

  actions: {
    // 选择学校
    selectSchool(schoolId) {
      if (!schoolId) {
        console.error('学校ID不能为空')
        return false
      }
      
      const school = getSchoolById(schoolId)
      if (!school) {
        console.error('无效的学校ID:', schoolId)
        return false
      }
      
      // 更新选择历史
      this.addToHistory(schoolId)
      
      // 设置当前选择
      this.selectedSchoolId = schoolId
      this.hasSelected = true
      
      // 保存到本地存储
      this.saveToStorage()
      
      console.log('✅ 学校选择成功:', school.name)
      return true
    },
    
    // 清除学校选择
    clearSchoolSelection() {
      this.selectedSchoolId = ''
      this.hasSelected = false
      this.saveToStorage()
      console.log('🗑️ 学校选择已清除')
    },
    
    // 重置所有数据
    resetAll() {
      this.selectedSchoolId = ''
      this.selectionHistory = []
      this.hasSelected = false
      this.clearStorage()
      console.log('🔄 学校数据已重置')
    },
    
    // 添加到选择历史
    addToHistory(schoolId) {
      const school = getSchoolById(schoolId)
      if (!school) return
      
      // 移除已存在的相同记录
      this.selectionHistory = this.selectionHistory.filter(
        item => item.schoolId !== schoolId
      )
      
      // 添加新记录到开头
      this.selectionHistory.unshift({
        schoolId,
        schoolName: school.name,
        selectedAt: Date.now()
      })
      
      // 保持历史记录最多5条
      if (this.selectionHistory.length > 5) {
        this.selectionHistory = this.selectionHistory.slice(0, 5)
      }
    },
    
    // 保存到本地存储
    saveToStorage() {
      try {
        const data = {
          selectedSchoolId: this.selectedSchoolId,
          selectionHistory: this.selectionHistory,
          hasSelected: this.hasSelected,
          savedAt: Date.now()
        }
        uni.setStorageSync('school_selection', JSON.stringify(data))
        console.log('💾 学校选择数据已保存')
      } catch (error) {
        console.error('❌ 保存学校选择数据失败:', error)
      }
    },
    
    // 从本地存储加载
    loadFromStorage() {
      try {
        const stored = uni.getStorageSync('school_selection')
        if (!stored) {
          console.log('📭 没有找到本地学校选择数据')
          return false
        }
        
        const data = JSON.parse(stored)
        
        // 验证数据完整性
        if (data.selectedSchoolId && getSchoolById(data.selectedSchoolId)) {
          this.selectedSchoolId = data.selectedSchoolId
          this.hasSelected = data.hasSelected || false
          this.selectionHistory = data.selectionHistory || []
          
          console.log('📤 学校选择数据加载成功:', data.selectedSchoolId)
          return true
        } else {
          console.warn('⚠️ 本地学校选择数据无效，已清除')
          this.clearStorage()
          return false
        }
      } catch (error) {
        console.error('❌ 加载学校选择数据失败:', error)
        this.clearStorage()
        return false
      }
    },
    
    // 清除本地存储
    clearStorage() {
      try {
        uni.removeStorageSync('school_selection')
        console.log('🧹 学校选择存储数据已清除')
      } catch (error) {
        console.error('❌ 清除学校选择存储数据失败:', error)
      }
    },
    
    // 获取学校选择统计信息
    getSelectionStats() {
      return {
        hasSelected: this.hasSelected,
        currentSchool: this.currentSchool,
        historyCount: this.selectionHistory.length,
        lastSelectedAt: this.selectionHistory[0]?.selectedAt || null
      }
    }
  }
})
