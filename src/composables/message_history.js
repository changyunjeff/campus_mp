let instance;

export function useMessageHisotry() {
    if (instance) return instance;
    const messages = new Map();
    
    // 从本地存储加载历史消息
    const loadFromStorage = () => {
        try {
            const storedMessages = uni.getStorageSync('message_history');
            if (storedMessages) {
                const parsedMessages = JSON.parse(storedMessages);
                Object.entries(parsedMessages).forEach(([userID, msgs]) => {
                    messages.set(userID, msgs);
                });
            }
        } catch (err) {
            console.error('加载历史消息失败:', err);
        }
    };

    // 保存消息到本地存储
    const saveToStorage = () => {
        try {
            const messageObj = {};
            messages.forEach((msgs, userID) => {
                messageObj[userID] = msgs;
            });
            uni.setStorageSync('message_history', JSON.stringify(messageObj));
        } catch (err) {
            console.error('保存历史消息失败:', err);
        }
    };

    // 初始化时加载历史消息
    loadFromStorage();

    /**
     * 添加历史消息
     * @param {string} userID 用户ID
     * @param {Message} message 消息
     */
    const add = (userID, message) => {
        if (!messages.has(userID)) {
            messages.set(userID, []);
        }
        messages.get(userID).push(message);
        console.debug(`添加${userID}的历史消息：${message}`);
        saveToStorage();
    }

    /**
     * 获取历史消息
     * @param {string} userID 用户ID
     * @returns {Message[]} 历史消息
     */
    const get = (userID) => {
        if (!messages.has(userID)) {
            return [];
        }
        return messages.get(userID);
    }

    /**
     * 清除历史消息
     * @param {string} userID 用户ID
     */
    const clear = (userID) => {
        messages.delete(userID);
        saveToStorage();
    }

    instance = {
        add,
        get,
        clear
    };
    return instance;
}
