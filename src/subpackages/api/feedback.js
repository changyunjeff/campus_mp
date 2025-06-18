import {get, del, post, upload, batch_upload} from "@/utils/request";

/**
 * @typedef Media
 * @property {string} url
 * @property {string} object_key
 * @property {string} type
 * */

export const FeedbackApi = {
    /**
     * @function uploadMedia 上传媒体文件到OSS
     * @param {string} file_path
     * @param {function} callback
     * @returns {Promise<Media>}
     * */
    uploadMedia: (file_path, callback) => upload('/media/upload/feedback/oss', file_path, {
        callback
    }),

    /**
     * @function deleteMedia 删除OSS中的媒体文件
     * @param {string} object_key
     * @returns {Promise<Object>}
     * */
    deleteMedia: (object_key) => del('/media/delete/feedback/oss', { object_key }),

    /**
     * @function submitFeedback 提交反馈与建议
     * @param {Object} form
     * @returns {Promise<Object>}
     * */
    submitFeedback: (form) => post('/feedback/submit', form),

    /**
     * @function getUserFeedbackList 获取用户反馈列表
     * @param {Object} params 查询参数
     * @returns {Promise<Object>}
     * */
    getUserFeedbackList: (params) => get('/feedback/user/list', params),

    /**
     * @function getFeedbackDetail 获取反馈详情
     * @param {string} id 反馈ID
     * @returns {Promise<Object>}
     * */
    getFeedbackDetail: (id) => get(`/feedback/detail/${id}`),

    /**
     * @function deleteFeedbackMedia 删除反馈媒体文件
     * @param {string} id 媒体ID
     * @returns {Promise<Object>}
     * */
    deleteFeedbackMedia: (id) => del(`/media/feedback/${id}`)
}