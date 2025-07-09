
/**
 * @typedef {Object} CommentUser
 * @property {string} id - 用户ID
 * @property {string} nickname - 昵称
 * @property {string} avatar - 头像
 * */

/**
 * @typedef {Object} CommentResponse
 * @property {string} id - 留言ID
 * @property {string} content - 留言内容
 * @property {number} created_at - 创建时间
 * @property {CommentUser} user - 用户
 * */

/**
 * @typedef {Object} CommentListResponse
 * @property {CommentResponse[]} items - 留言列表
 * @property {number} total - 留言总数
 * @property {number} page - 当前页码
 * @property {number} page_size - 每页数量
 * @property {boolean} has_more - 是否还有更多
 * */

/**
 * @typedef {Object} Address
 * @property {string} id
 * @property {number} created_at
 * @property {string} user_name // 收货人
 * @property {string} phone // 手机号
 * @property {string} region // 区域
 * @property {string} address // 详细地址
 * @property {boolean} is_default // 是否默认地址
 * */

/**
 * @typedef {Object} AddressInfo
 * @property {string} user_name // 收货人
 * @property {string} phone // 手机号
 * @property {string} region // 区域
 * @property {string} address // 详细地址
 * */

/**
 * @typedef {Object} OrderDTO
 * @property {string} id // 订单ID
 * @property {string} order_number // 订单号
 * @property {string} goods_id // 商品ID
 * @property {string} goods_title // 商品标题
 * @property {float} goods_price // 商品原价
 * @property {string} buyer_openid // 买家OpenID
 * @property {string} seller_openid // 卖家OpenID
 * @property {string} receiver_name // 收货人姓名
 * @property {string} receiver_phone // 收货人电话
 * @property {string} receiver_region // 收货地区
 * @property {string} receiver_address // 收货详细地址
 * @property {string} order_status // 订单状态
 * @property {string} order_status_text // 订单状态描述
 * @property {number} pay_status // 支付状态
 * @property {string} pay_status_text // 支付状态描述
 * @property {string} pay_amount // 支付金额
 * @property {string} pay_method // 支付方式
 * @property {number} pay_time // 支付时间
 * @property {string} transaction_id //交易号
 * @property {string} express_company // 快递公司
 * @property {string} express_number // 快递单号
 * @property {number} ship_time // 发货时间
 * @property {number} deliver_method    // 配送方式
 * @property {string} deliver_method_text // 配送方式描述
 * @property {number} deliver_status // 配送状态
 * @property {number} receive_time // 收货时间
 * @property {string} buyer_remark // 买家备注
 * @property {string} seller_remark // 卖家备注
 * @property {string} cancel_reason // 取消原因
 * @property {number} create_time // 创建时间
 * @property {number} update_time // 更新时间
 * @property {number} expire_time // 过期时间(仅Redis临时订单)
 * @property {boolean} is_temp // 是否临时订单(仅Redis临时订单)
 * @property {boolean} can_cancel // 是否可以取消订单
 * @property {boolean} can_pay // 是否可以支付订单
 * @property {boolean} can_ship // 是否可以发货
 * @property {boolean} can_receive // 是否可以收货
 * @property {boolean} can_refund // 是否可以退款
 * */

/**
 * @typedef {Object} MerchantPaymentInfo
 * @property {string} id // 配置ID
 * @property {string} merchant_name // 商户名称
 * @property {string} merchant_id // 微信支付商户号
 * @property {string} api_key // 支付密钥（脱敏显示）
 * @property {string} cert_path // 证书路径
 * @property {string} params.cert_object_key 证书的OSS中ObjectKey路径
 * @property {string} bank_account // 银行账户（脱敏显示）
 * @property {string} bank_name // 银行名称
 * @property {string} account_holder // 开户人
 * @property {string} business_license // 营业执照号
 * @property {boolean} is_enabled // 是否启用
 * @property {boolean} is_verified // 是否已验证
 * @property {number} created_at // 创建时间
 * @property {number} updated_at // 更新时间
 * */