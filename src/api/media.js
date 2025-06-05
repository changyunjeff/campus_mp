import { post, del, upload, batch_upload } from "@/utils/request";

/**
 * MediaApi 媒体接口
 */
export const MediaApi = {
  /**
   * 上传笔记媒体（一步法：直接存储到数据库）
   * @param {string} file - 文件路径
   * @param {string} notes_id - 笔记ID
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 上传结果
   */
  uploadNotesMedia: (file, notes_id, onProgress) =>
    upload("/media/upload/notes", file, {
      formData: {
        notes_id: notes_id,
      },
      callback: onProgress,
    }),

  /**
   * 上传笔记媒体到OSS（两步法第一步：仅上传到OSS）
   * @param {string} file - 文件路径
   * @param {string} notes_id - 笔记ID
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Object>} 上传结果 {url, object_key, type}
   */
  uploadNotesMediaToOSS: (file, notes_id, onProgress) =>
    upload("/media/upload/notes/oss", file, {
      formData: {
        notes_id: notes_id,
      },
      callback: onProgress,
    }),

  /**
   * 批量上传笔记媒体到OSS（两步法第一步）
   * 微信小程序适配：使用循环调用单文件上传接口
   * @param {Array<string>} files - 文件路径数组
   * @param {string} notes_id - 笔记ID
   * @param {Function} onProgress - 进度回调
   * @returns {Promise<Array>} 上传结果数组
   */
  batchUploadNotesMediaToOSS: (files, notes_id, onProgress) => {
    return new Promise((resolve, reject) => {
      if (!files || files.length === 0) {
        reject(new Error('文件列表为空'))
        return
      }

      // 用于跟踪每个文件的上传进度
      const progressMap = new Map()
      // 用于存储每个文件上传的Promise
      const uploadPromises = []

      // 计算总体进度并回调
      const updateTotalProgress = () => {
        if (!onProgress) return
        
        let totalProgress = 0
        progressMap.forEach(progress => {
          totalProgress += progress
        })
        
        // 计算平均进度
        const averageProgress = Math.round(totalProgress / files.length)
        onProgress({
          progress: averageProgress,
          detail: Object.fromEntries(progressMap)
        })
      }

      // 为每个文件创建上传任务
      files.forEach((file, index) => {
        // 初始化进度为0
        progressMap.set(index, 0)
        
        // 创建单个文件的上传Promise
        const uploadPromise = upload("/media/upload/notes/oss", file, {
          formData: {
            notes_id: notes_id,
          },
          callback: (progressInfo) => {
            // 更新此文件的进度
            progressMap.set(index, progressInfo.progress)
            // 计算并回调总体进度
            updateTotalProgress()
          }
        })
        .then(result => ({
          index,
          result,
          success: true
        }))
        .catch(error => ({
          index,
          error,
          success: false
        }))
        
        uploadPromises.push(uploadPromise)
      })

      // 等待所有上传完成
      Promise.all(uploadPromises)
        .then(results => {
          // 检查是否有失败的上传
          const failedUploads = results.filter(r => !r.success)
          
          if (failedUploads.length > 0) {
            // 有失败的上传，但仍然返回所有结果
            resolve({
              success: results.filter(r => r.success).map(r => r.result),
              failed: failedUploads.map(f => ({ index: f.index, error: f.error }))
            })
          } else {
            // 所有上传成功
            resolve(results.map(r => r.result))
          }
        })
        .catch(err => {
          reject(err)
        })
    })
  },

  /**
   * 批量上传笔记媒体（一步法：直接存储到数据库）
   * @param {Object} params 上传参数
   * @param {Array<string>} params.files - 文件路径数组
   * @param {string} params.notes_id - 笔记ID
   * @param {Function} params.onProgress - 进度回调
   * @returns {Promise<Array>} 上传结果数组
   */
  batchUploadNotesMedia: ({ files, notes_id, onProgress }) =>
    batch_upload("/media/upload/notes/batch", files, {
      formData: {
        notes_id: notes_id,
      },
      callback: onProgress,
    }),

  /**
   * 创建笔记媒体记录（两步法第二步：存储到数据库）
   * @param {Object} data 媒体数据
   * @param {string} data.notes_id - 笔记ID
   * @param {Array} data.media_list - 媒体列表 [{url, object_key, type}]
   * @returns {Promise<Object>} 创建结果
   */
  createNotesMediaRecords: (data) => post("/media/create/notes/records", data),

  /**
   * 删除笔记媒体
   * @param {string} mediaId 媒体ID
   * @param {string} objectKey 对象键
   * @param {boolean} hardDelete 是否硬删除
   * @returns {Promise<Object>} 删除结果
   */
  deleteNotesMedia: (mediaId, objectKey, hardDelete = false) =>
    post("/media/delete/notes", {
      media_id: mediaId,
      object_key: objectKey,
      hard_delete: hardDelete,
    }),

  /**
   * 删除OSS文件（两步法中删除仅上传到OSS的文件）
   * @param {string} objectKey OSS对象键
   * @returns {Promise<Object>} 删除结果
   */
  deleteOSSFile: (objectKey) =>
    post("/media/delete/notes/oss", {
      object_key: objectKey,
    }),

  /**
   * 批量删除OSS文件
   * @param {Array<string>} objectKeys OSS对象键数组
   * @returns {Promise<Object>} 删除结果
   */
  batchDeleteOSSFiles: (objectKeys) =>
    post("/media/delete/notes/oss/batch", {
      object_keys: objectKeys,
    }),

  /**
   * 上传用户头像
   * @param {Object} params 上传参数
   * @param {string} params.file - 文件路径
   * @param {Function} params.onProgress - 进度回调
   * @returns {Promise<Object>} 上传结果
   */
  uploadUserAvatar: ({ file, onProgress }) =>
    upload("/media/upload/avatar/wxuser", file, {
      callback: onProgress,
    }),

  /**
   * 删除用户头像
   * @param {string} mediaId 媒体ID
   * @param {boolean} hardDelete 是否硬删除
   * @returns {Promise<Object>} 删除结果
   */
  deleteUserAvatar: (mediaId, hardDelete = false) =>
    post("/media/delete/avatar/wxuser", {
      media_id: mediaId,
      hard_delete: hardDelete,
    }),
};
