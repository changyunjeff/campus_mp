import { get, post, put, del, upload, batch_upload } from '@/utils/request'

/**
 * CommunityApi 社区接口
 * @description 所有类型定义请参考 @/types/community.d.js
 */
export const CommunityApi = {
    /**
     * 获取帖子列表
     * @param {PostListRequest} params 查询参数
     * @returns {Promise<PostListResponse>} 帖子列表
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
     * @returns {Promise<Post>} 帖子详情
     */
    getPostDetail: (postId) => {
        return get(`/posts/${postId}`)
    },

    /**
     * 搜索帖子
     * @param {string} keyword - 搜索关键字
     * @param {number} page - 页码
     * @param {number} page_size - 每页数量
     * @returns {Promise<PostListResponse>} 帖子列表
     * */
    searchPosts: (keyword, page, page_size) => get('/posts/search', {
        keyword: keyword,
        page: page,
        page_size: page_size
    }),
    
    /**
     * 创建帖子（支持匿名发布）
     * @param {CreatePostRequest} data 帖子数据
     * @returns {Promise<Post>} 创建的帖子信息
     * 
     * 匿名发布说明：
     * - 当 is_anonymous 为 true 时，帖子将以匿名方式发布
     * - 匿名帖子的 author 信息会显示为生成的匿名信息（如：大二计算机学院男生）
     * - 管理员仍可查看真实用户信息进行管理
     */
    createPost: (data) => {
        return post('/posts', data)
    },
    
    /**
     * 点赞帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<OperationResponse>} 操作结果
     */
    likePost: (postId) => {
        return post(`/posts/${postId}/like`)
    },
    
    /**
     * 收藏帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<OperationResponse>} 操作结果
     */
    favoritePost: (postId) => {
        return post(`/posts/${postId}/favorite`)
    },
    
    /**
     * 分享帖子
     * @param {string} postId 帖子ID
     * @returns {Promise<OperationResponse>} 操作结果
     */
    sharePost: (postId) => {
        return post(`/posts/${postId}/share`)
    },
    
    /**
     * 获取帖子评论列表
     * @param {string} postId 帖子ID
     * @param {CommentListRequest} params 查询参数
     * @returns {Promise<CommentListResponse>} 评论列表
     */
    getComments: (postId, params = {}) => {
        return get(`/posts/${postId}/comments`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 创建评论（支持匿名评论）
     * @param {CreateCommentRequest} data 评论数据
     * @returns {Promise<Comment>} 创建的评论信息
     * 
     * 匿名评论说明：
     * - 当 is_anonymous 为 true 时，评论将以匿名方式发布
     * - 匿名评论的 author 信息会显示为生成的匿名信息
     * - 管理员仍可查看真实用户信息进行管理
     */
    createComment: (data) => {
        return post('/comments', data)
    },
    
    /**
     * 点赞评论
     * @param {string} commentId 评论ID
     * @returns {Promise<OperationResponse>} 操作结果
     */
    likeComment: (commentId) => {
        return post(`/comments/${commentId}/like`)
    },
    
    /**
     * 获取评论的回复列表
     * @param {string} commentId 评论ID
     * @param {ReplyListRequest} params 查询参数
     * @returns {Promise<ReplyListResponse>} 回复列表
     */
    getReplies: (commentId, params = {}) => {
        return get(`/comments/${commentId}/replies`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },
    
    /**
     * 创建回复（支持匿名回复）
     * @param {CreateReplyRequest} data 回复数据
     * @returns {Promise<Reply>} 创建的回复信息
     * 
     * 匿名回复说明：
     * - 当 is_anonymous 为 true 时，回复将以匿名方式发布
     * - 匿名回复的 author 信息会显示为生成的匿名信息
     * - 管理员仍可查看真实用户信息进行管理
     */
    createReply: (data) => {
        return post('/replies', data)
    },
    
    /**
     * 点赞回复
     * @param {string} replyId 回复ID
     * @returns {Promise<OperationResponse>} 操作结果
     */
    likeReply: (replyId) => {
        return post(`/replies/${replyId}/like`)
    },

    // ================== 话题相关接口 ==================

    /**
     * 获取推荐话题（发布页面使用）
     * @returns {Promise<Topic[]>} 推荐话题列表
     */
    getRecommendedTopics: () => {
        return get('/topics/recommended')
    },

    /**
     * 获取热门话题
     * @param {number} limit - 数量限制，默认10，最大50
     * @returns {Promise<Topic[]>} 热门话题列表
     */
    getHotTopics: (limit = 10) => {
        return get('/topics/hot', { limit })
    },

    /**
     * 搜索话题
     * @param {string} keyword - 搜索关键词
     * @param {number} limit - 结果数量限制，默认10，最大20
     * @returns {Promise<Topic[]>} 搜索结果
     */
    searchTopics: (keyword, limit = 10) => {
        return get('/topics/search', { keyword, limit })
    },

    /**
     * 获取话题详情
     * @param {string} topicName - 话题名称
     * @returns {Promise<Topic>} 话题详情
     */
    getTopicDetail: (topicName) => {
        return get(`/topics/${encodeURIComponent(topicName)}`)
    },

    /**
     * 获取话题列表
     * @param {TopicListRequest} params - 查询参数
     * @returns {Promise<TopicListResponse>} 话题列表
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
     * @param {CreateTopicRequest} data - 话题数据
     * @returns {Promise<Topic>} 创建结果
     */
    createTopic: (data) => {
        return post('/topics', data)
    },

    /**
     * 获取话题的帖子列表
     * @param {string} topicName - 话题名称
     * @param {TopicPostsRequest} params - 查询参数
     * @returns {Promise<PostListResponse>} 帖子列表
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
     * @returns {Promise<ReportReason[]>} 举报原因列表
     */
    getReportReasons: () => {
        return get('/reports/reasons')
    },

    /**
     * 创建举报
     * @param {CreateReportRequest} data - 举报数据
     * @returns {Promise<OperationResponse>} 创建结果
     */
    createReport: (data) => {
        return post('/reports', data)
    },

    /**
     * 举报帖子
     * @param {string} postId - 帖子ID
     * @param {ReportPostRequest} data - 举报数据
     * @returns {Promise<OperationResponse>} 创建结果
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
     * @param {ReportCommentRequest} data - 举报数据
     * @returns {Promise<OperationResponse>} 创建结果
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
     * @param {ReportReplyRequest} data - 举报数据
     * @returns {Promise<OperationResponse>} 创建结果
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
     * @returns {Promise<UploadResponse>} 上传结果
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
     * @param {UserPostsRequest} params - 查询参数
     * @returns {Promise<PostListResponse>} 用户帖子列表
     */
    getUserPosts: (userId, params = {}) => {
        return get(`/users/${userId}/posts`, {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    /**
     * 获取当前用户收藏的帖子列表
     * @param {UserFavoritePostsRequest} params - 查询参数
     * @returns {Promise<PostListResponse>} 收藏帖子列表
     */
    getUserFavoritePosts: (params = {}) => {
        return get('/users/me/favorite-posts', {
            page: params.page || 1,
            page_size: params.page_size || 20
        })
    },

    /**
     * 获取当前用户点赞的帖子列表
     * @param {UserLikedPostsRequest} params - 查询参数
     * @returns {Promise<PostListResponse>} 点赞帖子列表
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
     * @returns {Promise<OperationResponse>} 删除结果
     */
    deletePost: (postId) => {
        return del(`/posts/${postId}`)
    },

    /**
     * 删除评论
     * @param {string} commentId 评论ID
     * @returns {Promise<OperationResponse>} 删除结果
     * */
    deleteComment: (commentId) => {
        return del(`/comments/${commentId}`)
    },

    /**
     * 删除回复
     * @param {string} replyId 回复ID
     * @returns {Promise<OperationResponse>} 删除结果
     * */
    deleteReply: (replyId) => {
        return del(`/replies/${replyId}`)
    },
} 