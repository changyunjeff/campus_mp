import { get, post, put, del } from '@/utils/request'

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
            page_size: params.page_size || 20
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
     * @param {string} replyId 回复I
     * @returns {Promise<Object>} 操作结果
     */
    likeReply: (replyId) => {
        return post(`/replies/${replyId}/like`)
    }
} 