import {get, post, put, del, upload} from "@/utils/request"

// ActivityApi 活动相关的api
export const ActivityApi = {
    /**
     * createActivity 创建活动（草稿状态）
     * @param {Object} activityData 活动数据
     * @returns {Promise<Object>} 创建的活动信息
     */
    createActivity: (activityData) => post('/activity', activityData),

    /**
     * updateActivity 更新活动信息
     * @param {String} id 活动ID
     * @param {Object} activityData 活动数据
     * @returns {Promise<Object>} 更新后的活动信息
     */
    updateActivity: (id, activityData) => put(`/activity/${id}`, activityData),

    /**
     * deleteActivity 删除活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 删除结果
     */
    deleteActivity: (id) => del(`/activity/${id}`),

    /**
     * publishActivity 发布活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 发布后的活动信息
     */
    publishActivity: (id) => post(`/activity/${id}/publish`),

    /**
     * cancelActivity 取消活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 取消结果
     */
    cancelActivity: (id) => post(`/activity/${id}/cancel`),

    /**
     * endActivity 结束活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 结束结果
     */
    endActivity: (id) => post(`/activity/${id}/end`),

    /**
     * getActivityDetail 获取活动详情
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 活动详情
     */
    getActivityDetail: (id) => get(`/activity/${id}`),

    /**
     * getActivityByRoomNumber 通过房间号获取活动详情
     * @param {String} roomNumber 房间号
     * @returns {Promise<Object>} 活动详情
     */
    getActivityByRoomNumber: (roomNumber) => get('/activity/room', {
        room_number: roomNumber
    }),

    /**
     * getActivityList 获取活动列表
     * @param {Object} params 查询参数
     * @param {Number} params.page 页码
     * @param {Number} params.page_size 每页数量
     * @param {String} params.keyword 搜索关键词
     * @param {String} params.room_number 房间号
     * @param {String} params.status 状态筛选
     * @param {String} params.type 类型筛选
     * @param {String} params.gender_limit 性别限制筛选
     * @param {String} params.time_range 时间范围
     * @returns {Promise<Object>} 活动列表
     */
    getActivityList: (params = {}) => get('/activity/list', params),

    /**
     * getMyActivities 获取我的活动列表
     * @param {Object} params 查询参数
     * @param {String} params.type 活动类型 organized|joined
     * @param {String} params.status 状态筛选
     * @param {Number} params.page 页码
     * @param {Number} params.page_size 每页数量
     * @returns {Promise<Object>} 我的活动列表
     */
    getMyActivities: (params) => get('/activity/my', params),

    /**
     * getOtherActivities 获取其他活动列表
     * @param {Object} params 查询参数
     * @param {String} params.user_id 用户ID
     * @param {Number} params.page 页码
     * @param {Number} params.page_size 每页数量
     * @returns {Promise<Object>} 其他活动列表
     */
    getOtherActivities: (params) => get('/activity/other', params),

    /**
     * getActivityStats 获取活动统计信息
     * @returns {Promise<Object>} 活动统计
     */
    getActivityStats: () => get('/activity/stats'),

    /**
     * joinActivity 参与活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 参与结果
     */
    joinActivity: (id) => post(`/activity/${id}/join`),

    /**
     * leaveActivity 取消参与活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 取消参与结果
     */
    leaveActivity: (id) => post(`/activity/${id}/leave`),

    /**
     * getParticipants 获取活动参与者列表
     * @param {String} id 活动ID
     * @param {Number} page 页码
     * @param {Number} page_size 每页数量
     * @returns {Promise<Object>} 参与者列表
     */
    getParticipants: (id, page = 1, page_size = 20) => get(`/activity/${id}/participants`, {
        page: page,
        page_size: page_size
    }),

    /**
     * shareActivity 分享活动
     * @param {String} id 活动ID
     * @returns {Promise<Object>} 分享结果
     */
    shareActivity: (id) => post(`/activity/${id}/share`)
}
