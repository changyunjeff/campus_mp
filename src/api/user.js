import { get, post, put, del } from '@/utils/request'

/**
 * UserApi 用户接口
 */
export const UserApi = {
    /**
     * 获取用户资料
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 用户资料
     */
    getUserProfile: (userId) => {
        return get(`/users/${userId}`)
    },
    
    /**
     * 获取我的资料
     * @returns {Promise<Object>} 我的资料
     */
    getMyProfile: () => {
        return get('/profile/me')
    },
    
    /**
     * 更新个人资料
     * @param {Object} data 资料数据
     * @param {string} data.nickname - 昵称
     * @param {string} data.introduction - 简介
     * @param {number} data.gender - 性别
     * @param {number} data.grade - 年级
     * @param {string} data.college - 学院
     * @param {string} data.location - 地理位置
     * @param {string} data.email - 邮箱
     * @returns {Promise<Object>} 更新结果
     */
    updateProfile: (data) => {
        return put('/profile', data)
    },
    
    /**
     * 搜索用户
     * @param {Object} params 搜索参数
     * @param {string} params.keyword - 搜索关键词
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @param {number} params.gender - 性别筛选
     * @param {number} params.role - 角色筛选
     * @returns {Promise<Object>} 搜索结果
     */
    searchUsers: (params = {}) => {
        return get('/users/search', {
            keyword: params.keyword || '',
            page: params.page || 1,
            page_size: params.page_size || 20,
            gender: params.gender,
            role: params.role
        })
    },
    
    /**
     * 关注用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    followUser: (userId) => post(`/users/${userId}/follow`),
    
    /**
     * 取消关注用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    unfollowUser: (userId) => del(`/users/${userId}/follow`),
    
    /**
     * 获取用户的关注列表
     * @param {string} userId 用户ID
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 关注列表
     */
    getFollowingList: (userId, params = {}) => {
        return get(`/users/${userId}/following`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 获取用户的粉丝列表
     * @param {string} userId 用户ID
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 粉丝列表
     */
    getFollowerList: (userId, params = {}) => {
        return get(`/users/${userId}/followers`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 获取我的关注列表
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 关注列表
     */
    getMyFollowingList: (params = {}) => {
        return get('/my/following', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 获取我的粉丝列表
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 粉丝列表
     */
    getMyFollowerList: (params = {}) => {
        return get('/my/followers', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 获取好友列表
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 好友列表
     */
    getFriendList: (params = {}) => {
        return get('/users/friends', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 获取用户在线状态
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 在线状态
     */
    getOnlineStatus: (userId) => {
        return get(`/users/${userId}/online-status`)
    },
    
    /**
     * 批量获取在线状态
     * @param {Array<string>} userIds 用户ID列表
     * @returns {Promise<Object>} 在线状态列表
     */
    getBatchOnlineStatus: (userIds) => {
        return post('/online/status/batch', {
            user_ids: userIds
        })
    },
    
    /**
     * 获取在线用户数量
     * @returns {Promise<Object>} 在线用户数量
     */
    getOnlineUserCount: () => {
        return get('/online/count')
    },
    
    /**
     * 获取聊天设置
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 聊天设置
     */
    getChatSettings: (userId) => {
        return get(`/users/${userId}/chat-settings`)
    },
    
    /**
     * 更新聊天设置
     * @param {string} userId 用户ID
     * @param {Object} data 设置数据
     * @param {boolean} data.set_top - 置顶
     * @param {boolean} data.blocking - 拉黑
     * @param {boolean} data.do_not_disturb - 免打扰
     * @returns {Promise<Object>} 更新结果
     */
    updateChatSettings: (userId, data) => {
        return put(`/users/${userId}/chat-settings`, data)
    },

    /**
     * 屏蔽用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    blockUser: (userId) => {
        return post(`/users/${userId}/block`)
    },

    /**
     * 取消屏蔽用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    unblockUser: (userId) => {
        return del(`/users/${userId}/block`)
    },

    /**
     * 获取屏蔽用户列表
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 屏蔽用户列表
     */
    getBlockedUsers: (params = {}) => {
        return get('/users/blocked', {
            page: params.page || 1,
            page_size: params.page_size || 50
        })
    },

    /**
     * 批量取消屏蔽用户
     * @param {Array<string>} userIds 用户ID列表
     * @returns {Promise<Object>} 操作结果
     */
    batchUnblockUsers: (userIds) => {
        return post('/users/batch-unblock', {
            user_ids: userIds
        })
    },
}