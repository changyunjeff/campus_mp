import { get, post, put, del, upload, batch_upload } from '@/utils/request'

/**
 * GoodsApi 商品接口
 */
export const GoodsApi = {
  // ==================== 商品查询相关 ====================
  
  /**
   * 获取商品列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码，默认1
   * @param {number} params.pageSize - 每页数量，默认10
   * @param {string} params.categoryId - 分类ID（可选）
   * @param {string} params.status - 商品状态（可选）
   * @param {string} params.orderBy - 排序字段（可选）
   * @param {string} params.orderDirection - 排序方向（可选）
   * @returns {Promise}
   */
  getGoodsList(params = {}) {
    return get('/goods', params);
  },

  /**
   * 获取商品详情
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  getGoodsDetail(goodsId) {
    return get(`/goods/${goodsId}`);
  },

  /**
   * 搜索商品
   * @param {Object} params - 搜索参数
   * @param {string} params.keyword - 搜索关键词
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.categoryId - 分类ID（可选）
   * @param {number} params.minPrice - 最低价格（可选）
   * @param {number} params.maxPrice - 最高价格（可选）
   * @returns {Promise}
   */
  searchGoods(params) {
    return get('/goods/search', params);
  },

  /**
   * 获取所有分类
   * @returns {Promise}
   */
  getAllCategories() {
    return get('/goods/categories');
  },

  /**
   * 获取子分类
   * @param {string} parentId - 父分类ID
   * @returns {Promise}
   */
  getSubcategories(parentId) {
    return get('/goods/categories/subcategories', { parent_id: parentId });
  },

  /**
   * 获取分类树
   * @returns {Promise}
   */
  getCategoryTree() {
    return get('/goods/categories');
  },

  /**
   * 获取分类规格配置
   * @param {string} categoryId - 分类ID
   * @returns {Promise}
   */
  getCategorySpecs(categoryId) {
    return get(`/goods/categories/${categoryId}/specs`);
  },

  // ==================== 商品交互相关 ====================

  /**
   * 点赞商品
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  likeGoods(goodsId) {
    return post(`/goods/${goodsId}/like`);
  },

  /**
   * 取消点赞商品
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  unlikeGoods(goodsId) {
    return post(`/goods/${goodsId}/unlike`);
  },

  /**
   * 浏览商品（记录浏览量）
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  viewGoods(goodsId) {
    return get(`/goods/${goodsId}`);
  },

  // ==================== 个人商品相关 ====================

  /**
   * 获取我的商品
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.status - 商品状态（可选）
   * @returns {Promise}
   */
  getMyGoods(params = {}) {
    return get('/goods/my', params);
  },

  /**
   * 获取我点赞的商品
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码
   * @param {number} params.pageSize - 每页数量
   * @returns {Promise}
   */
  getLikedGoods(params = {}) {
    return get('/goods/liked', params);
  },

  // ==================== 商品管理相关 ====================

  /**
   * 创建商品
   * @param {Object} data - 商品数据
   * @param {string} data.title - 商品标题
   * @param {string} data.description - 商品描述
   * @param {number} data.price - 商品价格
   * @param {number} data.original_price - 原价
   * @param {string} data.category_id - 分类ID
   * @param {string} data.location - 商品位置
   * @param {string} data.condition - 商品成色
   * @param {boolean} data.is_real - 是否实拍
   * @param {Array} data.media_list - 媒体列表
   * @returns {Promise}
   */
  createGoods(data) {
    return post('/goods', data);
  },

  /**
   * 更新商品
   * @param {string} goodsId - 商品ID
   * @param {Object} data - 更新数据
   * @returns {Promise}
   */
  updateGoods(goodsId, data) {
    return put(`/goods/${goodsId}`, data);
  },

  /**
   * 删除商品
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  deleteGoods(goodsId) {
    return del(`/goods/${goodsId}`);
  },

  // ==================== 媒体文件相关 ====================

  /**
   * 上传商品图片到OSS
   * @param {string} filePath - 图片文件路径
   * @param {string} goodsId - 商品ID
   * @returns {Promise}
   */
  uploadGoodsImageToOSS(filePath, goodsId) {
    return upload('/media/upload/goods/oss', filePath, {
      formData: {
        goods_id: goodsId
      }
    })
  },

  /**
   * 创建商品媒体记录
   * @param {Object} data - 媒体记录数据
   * @returns {Promise}
   */
  createGoodsMediaRecords(data) {
    return post('/media/create/goods/records', data)
  },

  /**
   * 删除商品图片
   * @param {string} mediaId - 媒体ID
   * @param {boolean} hardDelete - 是否硬删除
   * @returns {Promise}
   */
  deleteGoodsMedia(mediaId, hardDelete = false) {
    return post('/media/delete/goods', {
      media_id: mediaId,
      hard_delete: hardDelete
    })
  },

  /**
   * 删除OSS文件
   * @param {string} objectKey - OSS对象键
   * @returns {Promise}
   */
  deleteGoodsMediaFromOSS(objectKey) {
    return post('/media/delete/goods/oss', {
      object_key: objectKey
    })
  },

  /**
   * 批量上传商品图片到OSS
   * @param {Array} filePaths - 图片文件路径数组
   * @param {string} goodsId - 商品ID
   * @param {Function} progressCallback - 进度回调函数
   * @returns {Promise}
   */
  batchUploadGoodsImages(filePaths, goodsId, progressCallback) {
    return batch_upload('/media/upload/goods/oss', filePaths, {
      formData: {
        goods_id: goodsId
      },
      callback: progressCallback
    })
  },

  /**
   * @func createGoodsComment
   * @description 创建商品评论
   * @param {string} id - 商品ID
   * @param {string} content - 评论内容
   * @param {string} parent_id - 父留言ID（用于回复）
   * @param {string} reply_to_id - 回复的留言ID
   * @param {string} reply_to_user - reply_to_user
   * @returns {Promise<CommentResponse>}
   * */
  createGoodsComment: (id, content, parent_id, reply_to_id, reply_to_user)=>post(`/goods/${id}/comments`, {
    content,
    parent_id,
    reply_to_id,
    reply_to_user
  }),

  /**
   * @func getCommentList
   * @description 获取商品评论列表
   * @param {string} id - 商品ID
   * @param {number} page - 页码
   * @param {number} page_size - 每页数量
   * @param {string} order_by - 排序字段 default:(created_at)
   * @param {string} order_direction - 排序方向 default:(desc)
   * @param {boolean} only_parent - 是否只获取一级评论
   * @returns {Promise<CommentListResponse>}
   * */
  getCommentList: (id, page, page_size, order_by, order_direction, only_parent) => get(`/goods/${id}/comments`, {
    page,
    page_size,
    order_by,
    order_direction,
    only_parent
  }),

  /**
   * @func deleteComment
   * @description 删除商品评论
   * @param {string} comment_id - 评论ID
   * @returns {Promise}
   * */
  deleteComment: (comment_id) => del(`/goods/comments/${comment_id}`),

  /**
   * @func createGoodsReply
   * @description 创建商品评论回复
   * @param {string} comment_id - 评论ID
   * @param {string} content - 回复内容
   * @param {string} reply_to_id - 回复的回复ID（用于回复回复）
   * @param {string} reply_to_user - 回复的用户信息
   * @returns {Promise<ReplyResponse>}
   * */
  createGoodsReply: (comment_id, content, reply_to_id, reply_to_user) => post(`/goods/comments/${comment_id}/replies`, {
    content,
    reply_to_id,
    reply_to_user
  }),

  /**
   * @func getGoodsReplyList
   * @description 获取商品评论回复列表
   * @param {string} comment_id - 评论ID
   * @param {number} page - 页码
   * @param {number} page_size - 每页数量
   * @param {string} order_by - 排序字段 default:(created_at)
   * @param {string} order_direction - 排序方向 default:(desc)
   * @returns {Promise<ReplyListResponse>}
   * */
  getGoodsReplyList: (comment_id, page, page_size, order_by, order_direction) => get(`/goods/comments/${comment_id}/replies`, {
    page,
    page_size,
    order_by,
    order_direction
  }),

  /**
   * @func deleteGoodsReply
   * @description 删除商品评论回复
   * @param {string} reply_id - 回复ID
   * @returns {Promise}
   * */
  deleteGoodsReply: (reply_id) => del(`/goods/comments/replies/${reply_id}`),

  /**
   * @func getAddresses
   * @description 分页获取地址列表
   * @param {number} page
   * @param {number} page_size
   * @returns {Promise<{
   *     list: Array<Address>,
   *     page: number,
   *     page_size: number,
   *     total: number
   * }>}
   * */
  getAddresses: (page, page_size) => get('/goods/addresses', {
    page,
    page_size
  }),

  /**
   * @func createAddress
   * @description 创建收货地址
   * @param {string} user_name 收货人姓名
   * @param {string} phone 收货人手机号
   * @param {string} region 收货人区域
   * @param {string} address 收货人详细地址
   * @param {boolean} is_default 是否设置为默认地址
   * @returns {Promise<Address>}
   * */
  createAddress: (user_name, phone, region, address, is_default) => post('/goods/addresses', {
    user_name,
    phone,
    region,
    address,
    is_default
  }),

  /**
   * @func updateAddress
   * @description 更新收货地址
   * @param {string} id 地址ID
   * @param {string} user_name 收货人姓名
   * @param {string} phone 收货人手机号
   * @param {string} region 收货人区域
   * @param {string} address 收货人详细地址
   * @param {boolean} is_default 是否设置为默认地址
   * @returns {Promise<Address>}
   * */
  updateAddress: (id, user_name, phone, region, address, is_default) => put(`/goods/addresses/${id}`, {
    user_name,
    phone,
    region,
    address,
    is_default
  }),

  /**
   * @func deleteAddress
   * @description 删除收货地址
   * @param {string} id 地址ID
   * @returns {Promise}
   * */
  deleteAddress: (id) => del(`/goods/addresses/${id}`),

  /**
   * @func setDefaultAddress
   * @description 设置默认收货地址
   * @param {string} id 地址ID
   * @returns {Promise}
   * */
  setDefaultAddress: (id) => put(`/goods/addresses/${id}/default`),

  /**
   * @func getDefaultAddress
   * @description 获取默认收货地址
   * @returns {Promise<Address>}
   * */
  getDefaultAddress: () => get('/goods/addresses/default'),

  /**
   * @func createOrder
   * @description 创建订单
   * @param {Object} params
   * @param {string} params.goods_id 商品ID
   * @param {string} params.goods_title 商品标题
   * @param {float} params.price 商品价格
   * @param {string} params.seller_id 商家ID
   * @param {number} params.deliver_method 配送方式(0:快递, 1:自提)
   * @param {AddressInfo} params.address_info 收货地址信息
   * @param {string} params.buyer_remark 买家备注
   * @returns {Promise<OrderDTO>}
   * */
  createOrder: (params) => post('/goods/order/create', params),

  /**
   * @func hasOrderUnpaid
   * @description 检查订单是否未支付
   * @param {string} goods_id 商品ID
   * @returns {Promise<OrderDTO>}
   * */
  hasOrderUnpaid: (goods_id) => post('/goods/order/check-unpaid', {goods_id}),

  /**
   * @func getOrderList
   * @description 获取订单列表(已支付的订单)
   * @param {number} page
   * @param {number} page_size
   * @returns {Promise<OrderDTO>}
   * */
  getOrderList: (page, page_size) => get('/goods/order/list'),

  /**
   * @func getOrderDetail
   * @description 获取订单详情
   * @param {string} order_id 订单ID
   * @returns {Promise<OrderDTO>}
   * */
  getOrderDetail: (order_id) => get(`/goods/order/${order_id}`),

  /**
   * @func cancelOrder
   * @description 取消订单
   * @param {Object} params
   * @param {string} params.order_id 订单ID
   * @param {string} params.reason 取消原因
   * @returns {Promise<OrderDTO>}
   * */
  cancelOrder: (params) => post('/goods/order/cancel', params),

  /**
   * @func paymentCallback
   * @description 支付回调
   * @param {Object} params
   * @param {string} params.order_id 订单ID
   * @param {string} params.transaction_id 微信交易号
   * @param {string} params.pay_amount 支付金额
   * @returns {Promise<OrderDTO>}
   * */
  paymentCallback: (params) => post('/goods/payment/callback', params),

  // ==================== 商家支付相关 ====================

  /**
   * @func getMerchantPaymentInfo
   * @description 获取商家支付信息
   * @returns {Promise<MerchantPaymentInfo>}
   * */
  getMerchantPaymentInfo: () => get('/goods/merchant/payment/info'),

  /**
   * @func updateMerchantPaymentInfo
   * @description 更新商家支付信息
   * @param {Object} params
   * @param {string} params.merchant_name 商户名称
   * @param {string} params.merchant_id 微信支付商户号
   * @param {string} params.api_key 支付密钥
   * @param {string} params.cert_path 证书路径（可选）
   * @param {string} params.cert_object_key 证书的OSS中ObjectKey路径
   * @param {string} params.bank_account 银行账户
   * @param {string} params.bank_name 银行名称
   * @param {string} params.account_holder 开户人
   * @param {string} params.business_license 营业执照号
   * @param {boolean} params.is_enabled 是否启用
   * @returns {Promise<MerchantPaymentInfo>}
   * */
  updateMerchantPaymentInfo: (params) => post('/goods/merchant/payment/setup', params),

  /**
   * @func uploadPaymentCert
   * @description 上传支付证书
   * @param {string} filePath 证书文件路径
   * @param {function} callback 上传回调函数
   * @returns {Promise<{
   *     url: string,
   *     object_key: string,
   * }>}
   * */
  uploadPaymentCert: (filePath, callback) => upload('/media/upload/merchant/cert', filePath, {
    callback
  }),

  /**
   * @func deletePaymentCertFromOSS
   * @description 通过ObjectKey删除OSS中的文件
   * @param {string} object_key
   * @returns {Promise}
   * */
  deletePaymentCertFromOSS: (object_key) => del('/media/merchant/delete/oss', {object_key}),

  /**
   * @func verifyMerchantPayment
   * @description 验证商家支付配置
   * @returns {Promise<{is_valid: boolean, message: string}>}
   * */
  verifyMerchantPayment: () => post('/goods/merchant/payment/verify'),

  // ==================== 微信支付相关 ====================

  /**
   * @func getWeChatPayParams
   * @description 获取微信支付参数（统一下单）
   * @param {Object} params
   * @param {string} params.order_id 订单ID
   * @param {string} params.order_number 订单号
   * @param {number} params.total_fee 支付金额（分）
   * @param {string} params.body 商品描述
   * @param {string} params.notify_url 支付结果通知地址（可选，后端可设置默认值）
   * @returns {Promise<{
   *   timeStamp: number,
   *   nonceStr: string,
   *   package: string,
   *   signType: string,
   *   paySign: string,
   *   prepay_id: string
   * }>}
   * */
  getWeChatPayParams: (params) => post('/goods/payment/wechat/prepare', params),

  /**
   * @func queryPaymentStatus
   * @description 查询支付状态
   * @param {Object} params
   * @param {string} params.order_id 订单ID
   * @param {string} params.transaction_id 微信交易号（可选）
   * @returns {Promise<{
   *   trade_state: string,
   *   trade_state_desc: string,
   *   transaction_id: string,
   *   total_fee: number,
   *   time_end: string
   * }>}
   * */
  queryPaymentStatus: (params) => post('/goods/payment/wechat/query', params),

  /**
   * @func syncPaymentResult
   * @description 同步支付结果（主动查询支付状态并更新订单）
   * @param {Object} params
   * @param {string} params.order_id 订单ID
   * @returns {Promise<{
   *   is_paid: boolean,
   *   transaction_id: string,
   *   pay_time: number,
   *   pay_amount: string
   * }>}
   * */
  syncPaymentResult: (params) => post('/goods/payment/wechat/sync', params),
};