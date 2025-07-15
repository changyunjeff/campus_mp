/**
 * 社区模块类型定义
 * @description 包含帖子、评论、回复、话题、举报等所有社区相关的数据类型
 */

// ==================== 基础用户类型 ====================

/**
 * @typedef {Object} Author
 * @property {string} id - 用户ID（匿名时为anon_开头的ID）
 * @property {string} nickname - 用户昵称（匿名时为生成的匿名昵称）
 * @property {string} avatar - 用户头像（匿名时为默认匿名头像）
 * @property {string} gender - 性别 (male/female/unknown)
 * @property {number} level - 用户等级（匿名时为0）
 * @property {string} grade - 年级（匿名时为空）
 * @property {string} college - 学院（匿名时为空）
 * @property {string} [real_name] - 真实姓名（仅管理员可见）
 * @property {string} [anonymous_nickname] - 匿名昵称（仅管理员视角显示）
 */

/**
 * @typedef {Object} AuthorInfo
 * @property {string} id - 用户ID
 * @property {string} nickname - 用户昵称
 * @property {string} avatar - 用户头像
 * @property {number} level - 用户等级
 * @property {string} gender - 性别
 * @property {boolean} is_anonymous - 是否为匿名信息
 * @property {string} [real_user_id] - 真实用户ID（匿名时存在）
 */

// ==================== 话题相关类型 ====================

/**
 * @typedef {Object} Topic
 * @property {string} id - 话题ID
 * @property {string} name - 话题名称
 * @property {string} description - 话题描述
 * @property {string} category - 话题分类
 * @property {boolean} is_official - 是否官方话题
 * @property {TopicStats} stats - 话题统计信息
 * @property {number} created_at - 创建时间
 * @property {number} updated_at - 更新时间
 */

/**
 * @typedef {Object} TopicStats
 * @property {number} post_count - 帖子数量
 * @property {number} user_count - 参与用户数
 * @property {number} today_posts - 今日帖子数
 * @property {number} weekly_posts - 本周帖子数
 * @property {number} hot_score - 热度评分
 * @property {number} trend_score - 趋势评分
 * @property {number} last_updated - 最后更新时间
 */

/**
 * @typedef {Object} CreateTopicRequest
 * @property {string} name - 话题名称
 * @property {string} description - 话题描述
 * @property {string} category - 话题分类
 * @property {boolean} is_official - 是否官方话题
 */

// ==================== 帖子相关类型 ====================

/**
 * @typedef {Object} Post
 * @property {string} id - 帖子ID
 * @property {Author} author - 作者信息
 * @property {string} content - 帖子内容
 * @property {string[]} images - 图片URL列表
 * @property {string[]} tags - 标签列表
 * @property {Topic[]} topics - 话题列表
 * @property {Location} [location] - 位置信息
 * @property {string} visibility - 可见性 (public/friends/private)
 * @property {PostStats} stats - 统计信息
 * @property {boolean} is_liked - 当前用户是否已点赞
 * @property {boolean} is_favorited - 当前用户是否已收藏
 * @property {boolean} is_followed - 是否已关注作者
 * @property {boolean} is_anonymous - 是否匿名发布
 * @property {number} publish_time - 发布时间
 * @property {number} created_at - 创建时间
 * @property {number} updated_at - 更新时间
 */

/**
 * @typedef {Object} PostStats
 * @property {number} views - 浏览数
 * @property {number} likes - 点赞数
 * @property {number} comments - 评论数
 * @property {number} favorites - 收藏数
 * @property {number} shares - 分享数
 */

/**
 * @typedef {Object} Location
 * @property {string} address - 地址描述
 * @property {number} longitude - 经度
 * @property {number} latitude - 纬度
 */

/**
 * @typedef {Object} CreatePostRequest
 * @property {string} content - 帖子内容
 * @property {string[]} [images] - 图片URL列表
 * @property {string} [location] - 位置信息
 * @property {string} [visibility] - 可见性 (public/friends/private)
 * @property {string[]} [tags] - 标签列表
 * @property {string[]} [topic_names] - 话题名称列表
 * @property {boolean} [is_anonymous] - 是否匿名发布，默认false
 */

/**
 * @typedef {Object} PostListRequest
 * @property {string} [tab] - 标签页类型 (recommend/latest/follow)
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认10
 */

/**
 * @typedef {Object} PostListResponse
 * @property {Post[]} posts - 帖子列表
 * @property {number} total - 总数
 * @property {number} page - 当前页码
 * @property {number} page_size - 每页数量
 * @property {boolean} has_more - 是否还有更多
 */

/**
 * @typedef {Object} SearchPostsRequest
 * @property {string} keyword - 搜索关键字
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认10
 */

// ==================== 评论相关类型 ====================

/**
 * @typedef {Object} Comment
 * @property {string} id - 评论ID
 * @property {Author} author - 评论作者
 * @property {string} content - 评论内容
 * @property {number} likes - 点赞数
 * @property {boolean} is_liked - 当前用户是否已点赞
 * @property {number} reply_count - 回复数量
 * @property {Reply[]} [hot_replies] - 热门回复列表（最多2条）
 * @property {boolean} is_anonymous - 是否匿名评论
 * @property {number} publish_time - 发布时间
 * @property {number} created_at - 创建时间
 * @property {number} updated_at - 更新时间
 */

/**
 * @typedef {Object} CreateCommentRequest
 * @property {string} post_id - 帖子ID
 * @property {string} content - 评论内容
 * @property {boolean} [is_anonymous] - 是否匿名评论，默认false
 */

/**
 * @typedef {Object} CommentListRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20
 */

/**
 * @typedef {Object} CommentListResponse
 * @property {Comment[]} comments - 评论列表
 * @property {number} total - 总数
 * @property {number} page - 当前页码
 * @property {number} page_size - 每页数量
 * @property {boolean} has_more - 是否还有更多
 */

// ==================== 回复相关类型 ====================

/**
 * @typedef {Object} Reply
 * @property {string} id - 回复ID
 * @property {Author} author - 回复作者
 * @property {ReplyToInfo} [reply_to] - 回复目标信息
 * @property {string} content - 回复内容
 * @property {number} likes - 点赞数
 * @property {boolean} is_liked - 当前用户是否已点赞
 * @property {boolean} is_anonymous - 是否匿名回复
 * @property {number} publish_time - 发布时间
 * @property {number} created_at - 创建时间
 * @property {number} updated_at - 更新时间
 */

/**
 * @typedef {Object} ReplyToInfo
 * @property {string} id - 被回复对象ID
 * @property {string} nickname - 被回复者昵称
 * @property {boolean} is_anonymous - 被回复者是否匿名
 */

/**
 * @typedef {Object} CreateReplyRequest
 * @property {string} comment_id - 评论ID
 * @property {string} [reply_to_id] - 回复目标ID（回复回复时使用）
 * @property {string} content - 回复内容
 * @property {boolean} [is_anonymous] - 是否匿名回复，默认false
 */

/**
 * @typedef {Object} ReplyListRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20
 */

/**
 * @typedef {Object} ReplyListResponse
 * @property {Reply[]} replies - 回复列表
 * @property {number} total - 总数
 * @property {number} page - 当前页码
 * @property {number} page_size - 每页数量
 * @property {boolean} has_more - 是否还有更多
 */

// ==================== 话题API相关类型 ====================

/**
 * @typedef {Object} HotTopicsRequest
 * @property {number} [limit] - 数量限制，默认10，最大50
 */

/**
 * @typedef {Object} SearchTopicsRequest
 * @property {string} keyword - 搜索关键词
 * @property {number} [limit] - 结果数量限制，默认10，最大20
 */

/**
 * @typedef {Object} TopicListRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认10，最大50
 * @property {string} [category] - 分类筛选
 */

/**
 * @typedef {Object} TopicListResponse
 * @property {Topic[]} topics - 话题列表
 * @property {number} total - 总数
 * @property {number} page - 当前页码
 * @property {number} page_size - 每页数量
 * @property {boolean} has_more - 是否还有更多
 */

/**
 * @typedef {Object} TopicPostsRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20，最大50
 */

// ==================== 举报相关类型 ====================

/**
 * @typedef {Object} ReportReason
 * @property {string} id - 举报原因ID
 * @property {string} name - 举报原因名称
 * @property {string} description - 举报原因描述
 * @property {number} sort_order - 排序权重
 */

/**
 * @typedef {Object} ReportMedia
 * @property {string} url - 媒体URL
 * @property {string} object_key - OSS对象键
 * @property {string} type - 媒体类型 (image/video)
 */

/**
 * @typedef {Object} CreateReportRequest
 * @property {string} type - 举报类型 (post/comment/reply)
 * @property {string} target_id - 被举报对象ID
 * @property {string} reason_id - 举报原因ID
 * @property {string} [note] - 举报备注（可选，最多500字）
 * @property {ReportMedia[]} [medias] - 举报证据媒体（可选，最多3张）
 */

/**
 * @typedef {Object} ReportPostRequest
 * @property {string} reason_id - 举报原因ID
 * @property {string} [note] - 举报备注
 * @property {ReportMedia[]} [medias] - 举报证据媒体
 */

/**
 * @typedef {Object} ReportCommentRequest
 * @property {string} reason_id - 举报原因ID
 * @property {string} [note] - 举报备注
 * @property {ReportMedia[]} [medias] - 举报证据媒体
 */

/**
 * @typedef {Object} ReportReplyRequest
 * @property {string} reason_id - 举报原因ID
 * @property {string} [note] - 举报备注
 * @property {ReportMedia[]} [medias] - 举报证据媒体
 */

// ==================== 用户相关类型 ====================

/**
 * @typedef {Object} UserPostsRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20，最大50
 */

/**
 * @typedef {Object} UserFavoritePostsRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20
 */

/**
 * @typedef {Object} UserLikedPostsRequest
 * @property {number} [page] - 页码，默认1
 * @property {number} [page_size] - 每页数量，默认20
 */

// ==================== 通用响应类型 ====================

/**
 * @typedef {Object} ApiResponse
 * @property {number} code - 响应码
 * @property {string} message - 响应消息
 * @property {*} data - 响应数据
 */

/**
 * @typedef {Object} OperationResponse
 * @property {boolean} success - 操作是否成功
 * @property {string} [message] - 响应消息
 */

/**
 * @typedef {Object} UploadResponse
 * @property {string} url - 上传后的文件URL
 * @property {string} object_key - OSS对象键
 * @property {number} size - 文件大小
 * @property {string} type - 文件类型
 */

// ==================== 匿名功能专用类型 ====================

/**
 * @typedef {Object} AnonymousDisplayInfo
 * @property {string} anonymous_id - 匿名ID (anon_开头)
 * @property {string} anonymous_nickname - 匿名昵称
 * @property {string} anonymous_avatar - 匿名头像
 * @property {string} real_user_id - 真实用户ID（后端内部使用）
 */

/**
 * @typedef {Object} AdminViewAuthor
 * @property {string} id - 真实用户ID
 * @property {string} nickname - 显示格式：真实昵称（匿名：匿名昵称）
 * @property {string} avatar - 真实头像
 * @property {string} real_name - 真实姓名
 * @property {string} anonymous_nickname - 匿名昵称
 * @property {boolean} is_anonymous - 是否匿名发布
 * @property {string} gender - 性别
 * @property {number} level - 真实等级
 * @property {string} grade - 真实年级
 * @property {string} college - 真实学院
 */
