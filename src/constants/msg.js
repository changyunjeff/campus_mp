const MSG_TYPE = {
    Chat : 1,   // 聊天类消息
}

const MSG_METHOD = {
    Redirect : 0x1,   // 转发类消息，服务器会将消息转发给目标客户端
    CheckSensitive : 0x2,   // 敏感词检测类消息，服务器会将消息发送给敏感词检测服务
}

export {
    MSG_TYPE,
    MSG_METHOD,
}