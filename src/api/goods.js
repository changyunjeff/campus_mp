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
   * @param {Array} data.media_ids - 媒体ID列表
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
  }
};