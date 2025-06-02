import {defineStore} from 'pinia'
import { ref, reactive, computed } from 'vue'

const STATUS = {
    pending: 1,
    completed: 2,
    rejected: 3
}

export const useRegisterStore = defineStore('register', () => {
    // 注册流程阶段（0-3）
    const stage = ref(0)
    
    // 是否完成注册
    const isCompleted = ref(false)
    
    // 选择的角色
    const selectedRole = ref(null)
    
    // 注册流程ID
    const processId = ref('')
    
    // 媒体文件信息
    const mediaFiles = reactive({
        frontMedia: null,  // 正面照片
        backMedia: null    // 反面照片
    })
    
    // 用户信息
    const userInfo = reactive({
        phone: '',
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
            id: 1,
            name: '学生',
            type: 'student',
            icon: 'user',
            desc: '您是本校在校学生，需要学生证进行验证'
        },
        {
            id: 2,
            name: '教师',
            type: 'teacher',
            icon: 'star',
            desc: '您是本校教职工，需要工作证进行验证'
        },
        {
            id: 3,
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
        if (status === STATUS.rejected && reason) {
            rejectReason.value = reason
        }
        
        if (status === STATUS.completed) {
            isCompleted.value = true
            completedAt.value = new Date().toISOString()
        }
    }
    
    // 更新用户信息
    function updateUserInfo(info) {
        Object.assign(userInfo, info)
    }
    
    // 根据角色ID获取角色对象
    function getRoleById(roleId) {
        return roles.find(role => role.id === roleId) || null
    }

    // 设置流程ID
    function setProcessId(id) {
        processId.value = id.toString()
    }
    
    // 从检查响应更新状态
    function updateFromCheck(response) {
        console.log('更新注册状态，收到数据:', response)
        
        // 更新流程ID
        if (response.id) {
            processId.value = response.id.toString()
        }
        
        // 更新完成状态
        if (response.status === STATUS.completed || response.has_completed) {
            isCompleted.value = true
            verifyStatus.value = 'success'
        } else if (response.status === STATUS.rejected) {
            isCompleted.value = false
            verifyStatus.value = 'rejected'
        } else {
            isCompleted.value = false
            verifyStatus.value = 'pending'
        }
        
        // 更新当前步骤（后端字段名是step，不是stage）
        if (response.step !== undefined) {
            stage.value = response.step
        }
        
        // 更新选择的角色（后端返回角色ID，需要转换为角色对象）
        if (response.role) {
            const roleObj = getRoleById(response.role)
            if (roleObj) {
                selectedRole.value = roleObj
            }
        }
        
        // 更新拒绝原因
        if (response.reject_msg) {
            rejectReason.value = response.reject_msg
        }
        
        // 更新用户信息（处理字段名映射）
        const userInfoUpdate = {}
        if (response.phone) {
            userInfoUpdate.phone = response.phone
        }
        if (response.email_address) {  // 后端字段名是email_address
            userInfoUpdate.email = response.email_address
        }
        if (response.nick_name) {  // 后端字段名是nick_name
            userInfoUpdate.nickname = response.nick_name
        }
        if (response.code) {  // 后端字段名是code（学号）
            userInfoUpdate.idNumber = response.code
        }
        if (response.real_name) {  // 后端字段名是real_name
            userInfoUpdate.realName = response.real_name
        }
        
        // 只有当有数据更新时才调用updateUserInfo
        if (Object.keys(userInfoUpdate).length > 0) {
            updateUserInfo(userInfoUpdate)
        }
        
        // 更新媒体文件信息
        if (response.front_media) {
            mediaFiles.frontMedia = response.front_media
        }
        if (response.back_media) {
            mediaFiles.backMedia = response.back_media
        }
        
        console.log('更新后的状态:', {
            stage: stage.value,
            isCompleted: isCompleted.value,
            selectedRole: selectedRole.value,
            processId: processId.value,
            userInfo: userInfo,
            mediaFiles: mediaFiles.value
        })
    }
    
    // 重置整个注册流程
    function resetProcess() {
        stage.value = 0
        isCompleted.value = false
        selectedRole.value = null
        verifyStatus.value = 'pending'
        rejectReason.value = ''
        processId.value = ''
        completedAt.value = new Date().toISOString()
        
        // 重置媒体文件
        mediaFiles.frontMedia = null
        mediaFiles.backMedia = null
        
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
        mediaFiles,
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
        resetProcess,
        getRoleById,
        setProcessId,
    }
})