const MSG_TYPE = {
    Chat : 1,   // 聊天类消息
    Notification : 2,   // 通知类消息
    System : 3,   // 系统类消息
    CheckOnline : 4,   // 在线状态类消息
    Like : 5,   // 点赞类消息
    Favorite : 6,   // 收藏类消息
    FetchOfflineMessages : 7,   // 拉取离线消息类消息
    Follow : 8,   // 关注类消息
    Comment : 9,   // 评论类消息
    Mention : 10,   // @提及类消息
}

const MSG_METHOD = {
    Redirect : 0x1,   // 转发类消息，服务器会将消息转发给目标客户端
    CheckSensitive : 0x2,   // 敏感词检测类消息，服务器会将消息发送给敏感词检测服务
    NeedFeedback : 0x4,   // 需要反馈类消息，服务器会将消息发送给反馈服务
}

export {
    MSG_TYPE,
    MSG_METHOD,
}