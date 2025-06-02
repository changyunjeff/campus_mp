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
        return get(`/api/mp/users/${userId}`)
    },
    
    /**
     * 获取我的资料
     * @returns {Promise<Object>} 我的资料
     */
    getMyProfile: () => {
        return get('/api/mp/profile/me')
    },
    
    /**
     * 更新个人资料
     * @param {Object} data 资料数据
     * @param {string} data.nickname - 昵称
     * @param {string} data.introduction - 简介
     * @param {number} data.gender - 性别
     * @returns {Promise<Object>} 更新结果
     */
    updateProfile: (data) => {
        return put('/api/mp/profile', data)
    },
    
    /**
     * 关注用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    followUser: (userId) => {
        return post(`/api/mp/users/${userId}/follow`)
    },
    
    /**
     * 取消关注用户
     * @param {string} userId 用户ID
     * @returns {Promise<Object>} 操作结果
     */
    unfollowUser: (userId) => {
        return del(`/api/mp/users/${userId}/follow`)
    },
    
    /**
     * 获取用户的关注列表
     * @param {string} userId 用户ID
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 关注列表
     */
    getFollowingList: (userId, params = {}) => {
        return get(`/api/mp/users/${userId}/following`, {
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
        return get(`/api/mp/users/${userId}/followers`, {
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
        return get('/api/mp/my/following', {
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
        return get('/api/mp/my/followers', {
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
        return get('/api/mp/users/friends', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 更新聊天设置
     * @param {string} userId 用户ID
     * @param {Object} data 设置数据
     * @param {boolean} data.set_top - 置顶
     * @param {boolean} data.blocking - 拉黑
     * @returns {Promise<Object>} 更新结果
     */
    updateChatSettings: (userId, data) => {
        return put(`/api/mp/users/${userId}/chat-settings`, data)
    },
    
    /**
     * 添加头像
     * @param {string} mediaId 媒体ID
     * @returns {Promise<Object>} 操作结果
     */
    addAvatar: (mediaId) => {
        return post(`/api/mp/profile/avatar/${mediaId}`)
    },
    
    /**
     * 移除头像
     * @param {string} mediaId 媒体ID
     * @returns {Promise<Object>} 操作结果
     */
    removeAvatar: (mediaId) => {
        return del(`/api/mp/profile/avatar/${mediaId}`)
    }
} 