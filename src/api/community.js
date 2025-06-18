import { get, post, put, del, upload, batch_upload } from '@/utils/request'

/**
 * CommunityApi 社区接口
 */
export const CommunityApi = {
    /**
     * 获取帖子列表
     * @param {Object} params 查询参数
     * @param {string} params.tab - 标签页类型 (recommend/latest/follow)
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 帖子列表
     */
    getPostList: (params = {}) => {
        return get('/posts', {
            tab: params.tab || 'recommend',
            page: params.page || 1,
            page_size: params.page_size || 10
        })
    },
    
    /**
     * 获取帖子详情
     * @param {string} postId 帖子ID
     * @returns {Promise<Object>} 帖子详情
     */
    getPostDetail: (postId) => {
        return get(`/posts/${postId}`)
    },

    /**
     * searchPosts 搜索帖子
     * @param {string} keyword - 搜索关键字
     * @param {number} page - 页码
     * @param {number} page_size - 每页数量
     * @returns {Promise<Object>} 帖子列表
     * */
    searchPosts: (keyword, page, page_size) => get('/posts/search', {
        keyword: keyword,
        page: page,
        page_size: page_size
    }),
    
    /**
     * 创建帖子
     * @param {Object} data 帖子数据
     * @param {string} data.content - 内容
     * @param {Array<string>} data.images - 图片列表
     * @param {string} data.location - 位置
     * @param {string} data.visibility - 可见性 (public/friends/private)
     * @param {Array<string>} data.tags - 标签
     * @returns {Promise<Object>} 创建结果
     */
    createPost: (data) => {
        return post('/posts', data)
    },
    
    /**
     * 点赞帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<Object>} 操作结果
     */
    likePost: (postId) => {
        return post(`/posts/${postId}/like`)
    },
    
    /**
     * 收藏帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<Object>} 操作结果
     */
    favoritePost: (postId) => {
        return post(`/posts/${postId}/favorite`)
    },
    
    /**
     * 分享帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<Object>} 操作结果
     */
    sharePost: (postId) => {
        return post(`/posts/${postId}/share`)
    },
    
    /**
     * 获取帖子评论列表
     * @param {string} postId 帖子ID
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 评论列表
     */
    getComments: (postId, params = {}) => {
        return get(`/posts/${postId}/comments`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 创建评论
     * @param {Object} data 评论数据
     * @param {string} data.post_id - 帖子ID
     * @param {string} data.content - 评论内容
     * @returns {Promise<Object>} 创建结果
     */
    createComment: (data) => {
        return post('/comments', data)
    },
    
    /**
     * 点赞评论
     * @param {string} commentId 评论ID
     * @returns {Promise<Object>} 操作结果
     */
    likeComment: (commentId) => {
        return post(`/comments/${commentId}/like`)
    },
    
    /**
     * 获取评论的回复列表
     * @param {string} commentId 评论ID
     * @param {Object} params 查询参数
     * @param {number} params.page - 页码
     * @param {number} params.page_size - 每页数量
     * @returns {Promise<Object>} 回复列表
     */
    getReplies: (commentId, params = {}) => {
        return get(`/comments/${commentId}/replies`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 创建回复
     * @param {Object} data 回复数据
     * @param {string} data.comment_id - 评论ID
     * @param {string} data.reply_to_id - 回复给谁的ID
     * @param {string} data.content - 回复内容
     * @returns {Promise<Object>} 创建结果
     */
    createReply: (data) => {
        return post('/replies', data)
    },
    
    /**
     * 点赞回复
     * @param {string} replyId 回复ID
     * @returns {Promise<Object>} 操作结果
     */
    likeReply: (replyId) => {
        return post(`/replies/${replyId}/like`)
    },

    // ================== 话题相关接口 ==================

    /**
     * 获取推荐话题（发布页面使用）
     * @returns {Promise<Object>} 推荐话题列表
     */
    getRecommendedTopics: () => {
        return get('/topics/recommended')
    },

    /**
     * 获取热门话题
     * @param {number} limit - 数量限制，默认10，最大50
     * @returns {Promise<Object>} 热门话题列表
     */
    getHotTopics: (limit = 10) => {
        return get('/topics/hot', { limit })
    },

    /**
     * 搜索话题
     * @param {string} keyword - 搜索关键词
     * @param {number} limit - 结果数量限制，默认10，最大20
     * @returns {Promise<Object>} 搜索结果
     */
    searchTopics: (keyword, limit = 10) => {
        return get('/topics/search', { keyword, limit })
    },

    /**
     * 获取话题详情
     * @param {string} topicName - 话题名称
     * @returns {Promise<Object>} 话题详情
     */
    getTopicDetail: (topicName) => {
        return get(`/topics/${encodeURIComponent(topicName)}`)
    },

    /**
     * 获取话题列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.page_size - 每页数量，默认10，最大50
     * @param {string} params.category - 分类筛选
     * @returns {Promise<Object>} 话题列表
     */
    getTopicList: (params = {}) => {
        return get('/topics/list', {
            page: params.page || 1,
            page_size: params.page_size || 10,
            category: params.category
        })
    },

    /**
     * 创建话题
     * @param {Object} data - 话题数据
     * @param {string} data.name - 话题名称
     * @param {string} data.description - 话题描述
     * @param {string} data.category - 话题分类
     * @param {boolean} data.is_official - 是否官方话题
     * @returns {Promise<Object>} 创建结果
     */
    createTopic: (data) => {
        return post('/topics', data)
    },

    /**
     * 获取话题的帖子列表
     * @param {string} topicName - 话题名称
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.page_size - 每页数量，默认20，最大50
     * @returns {Promise<Object>} 帖子列表
     */
    getTopicPosts: (topicName, params = {}) => {
        return get(`/topics/${encodeURIComponent(topicName)}/posts`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    // ================== 举报相关接口 ==================

    /**
     * 获取举报原因列表
     * @returns {Promise<Object>} 举报原因列表
     */
    getReportReasons: () => {
        return get('/reports/reasons')
    },

    /**
     * 创建举报
     * @param {Object} data - 举报数据
     * @param {string} data.type - 举报类型 (post/comment/reply)
     * @param {string} data.target_id - 被举报对象ID
     * @param {string} data.reason_id - 举报原因ID
     * @param {string} data.note - 举报备注 (可选，最多500字)
     * @param {Array<Object>} data.medias - 举报证据媒体 (可选，最多3张)
     * @param {string} data.medias[].url - 媒体URL
     * @param {string} data.medias[].object_key - OSS对象键
     * @param {string} data.medias[].type - 媒体类型 (image/video)
     * @returns {Promise<Object>} 创建结果
     */
    createReport: (data) => {
        return post('/reports', data)
    },

    /**
     * 举报帖子
     * @param {string} postId - 帖子ID
     * @param {Object} data - 举报数据
     * @param {string} data.reason_id - 举报原因ID
     * @param {string} data.note - 举报备注 (可选)
     * @param {Array<Object>} data.medias - 举报证据媒体 (可选)
     * @returns {Promise<Object>} 创建结果
     */
    reportPost: (postId, data) => {
        return post('/reports', {
            type: 'post',
            target_id: postId,
            ...data
        })
    },

    /**
     * 举报评论
     * @param {string} commentId - 评论ID
     * @param {Object} data - 举报数据
     * @param {string} data.reason_id - 举报原因ID
     * @param {string} data.note - 举报备注 (可选)
     * @param {Array<Object>} data.medias - 举报证据媒体 (可选)
     * @returns {Promise<Object>} 创建结果
     */
    reportComment: (commentId, data) => {
        return post('/reports', {
            type: 'comment',
            target_id: commentId,
            ...data
        })
    },

    /**
     * 举报回复
     * @param {string} replyId - 回复ID
     * @param {Object} data - 举报数据
     * @param {string} data.reason_id - 举报原因ID
     * @param {string} data.note - 举报备注 (可选)
     * @param {Array<Object>} data.medias - 举报证据媒体 (可选)
     * @returns {Promise<Object>} 创建结果
     */
    reportReply: (replyId, data) => {
        return post('/reports', {
            type: 'reply',
            target_id: replyId,
            ...data
        })
    },

    /**
     * 上传举报媒体文件
     * @param {File} file - 媒体文件
     * @param {Function} callback - 上传进度回调
     * @returns {Promise<Object>} 上传结果
     */
    uploadReportMedia: (file, callback) => {
        return upload('/media/upload/report/oss', file, {
            callback: callback
        })
    },

    // ================== 用户帖子相关接口 ==================

    /**
     * 获取用户帖子列表
     * @param {string} userId - 用户ID
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.page_size - 每页数量，默认20，最大50
     * @returns {Promise<Object>} 用户帖子列表
     */
    getUserPosts: (userId, params = {}) => {
        return get(`/users/${userId}/posts`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    /**
     * 获取当前用户收藏的帖子列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.page_size - 每页数量，默认20
     * @returns {Promise<Object>} 收藏帖子列表
     */
    getUserFavoritePosts: (params = {}) => {
        return get('/users/me/favorite-posts', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    /**
     * 获取当前用户点赞的帖子列表
     * @param {Object} params - 查询参数
     * @param {number} params.page - 页码，默认1
     * @param {number} params.page_size - 每页数量，默认20
     * @returns {Promise<Object>} 点赞帖子列表
     */
    getUserLikedPosts: (params = {}) => {
        return get('/users/me/liked-posts', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    /**
     * 删除帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<Object>} 删除结果
     */
    deletePost: (postId) => {
        return del(`/posts/${postId}`)
    },
} 