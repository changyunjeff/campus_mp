import {defineStore} from 'pinia'
import { ref, reactive, computed } from 'vue'

export const useRegisterStore = defineStore('register', () => {
    // 注册流程阶段（0-3）
    const stage = ref(0)
    
    // 是否完成注册
    const isCompleted = ref(false)
    
    // 选择的角色
    const selectedRole = ref(null)
    
    // 注册流程ID
    const processId = ref('mock-process-id-' + Date.now())
    
    // 用户信息
    const userInfo = reactive({
        phone: '13800138000',
        email: '',
        nickname: '',
        idNumber: '',
        realName: ''
    })
    
    // 验证状态 ('success', 'rejected', 'pending')
    const verifyStatus = ref('pending')
    
    // 驳回原因
    const rejectReason = ref('')
    
    // 完成时间
    const completedAt = ref(new Date().toISOString())
    
    // 可选角色列表
    const roles = reactive([
        {
            id: 'student',
            name: '学生',
            type: 'student',
            icon: 'user',
            desc: '您是本校在校学生，需要学生证进行验证'
        },
        {
            id: 'teacher',
            name: '教师',
            type: 'teacher',
            icon: 'star',
            desc: '您是本校教职工，需要工作证进行验证'
        },
        {
            id: 'alumni',
            name: '校友',
            type: 'alumni',
            icon: 'team',
            desc: '您是本校毕业生，需要相关证明进行验证'
        }
    ])
    
    // 设置当前阶段
    function setStage(newStage) {
        stage.value = newStage
    }
    
    // 设置选择的角色
    function setSelectedRole(role) {
        selectedRole.value = role
    }
    
    // 设置验证状态
    function setVerifyStatus(status, reason = '') {
        verifyStatus.value = status
        if (status === 'rejected' && reason) {
            rejectReason.value = reason
        }
        
        if (status === 'success') {
            isCompleted.value = true
            completedAt.value = new Date().toISOString()
        }
    }
    
    // 更新用户信息
    function updateUserInfo(info) {
        Object.assign(userInfo, info)
    }
    
    // 从检查响应更新状态
    function updateFromCheck(response) {
        if (response.status === 'completed') {
            isCompleted.value = true
            verifyStatus.value = response.verifyStatus || 'pending'
        }
        
        if (response.stage !== undefined) {
            stage.value = response.stage
        }
        
        if (response.selectedRole) {
            selectedRole.value = response.selectedRole
        }
        
        if (response.rejectReason) {
            rejectReason.value = response.rejectReason
        }
        
        if (response.userInfo) {
            updateUserInfo(response.userInfo)
        }
    }
    
    // 重置整个注册流程
    function resetProcess() {
        stage.value = 0
        isCompleted.value = false
        selectedRole.value = null
        verifyStatus.value = 'pending'
        rejectReason.value = ''
        processId.value = 'mock-process-id-' + Date.now()
        completedAt.value = new Date().toISOString()
        
        // 重置用户信息
        Object.assign(userInfo, {
            phone: '',
            email: '',
            nickname: '',
            idNumber: '',
            realName: ''
        })
    }
    
    // 返回需要在组件中使用的状态和方法
    return {
        stage,
        isCompleted,
        selectedRole,
        processId,
        verifyStatus,
        rejectReason,
        completedAt,
        roles,
        phone: computed(() => userInfo.phone),
        email: computed(() => userInfo.email),
        nickname: computed(() => userInfo.nickname),
        idNumber: computed(() => userInfo.idNumber),
        realName: computed(() => userInfo.realName),
        setStage,
        setSelectedRole,
        setVerifyStatus,
        updateUserInfo,
        updateFromCheck,
        resetProcess
    }
})