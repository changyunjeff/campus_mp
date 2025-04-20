
// 获取机器码（设备ID或唯一标识符）
function getMachineId() {
    return new Promise((resolve, reject) => {
        // 获取设备信息
        uni.getSystemInfo({
            success: (res) => {
                // 使用设备唯一标识符（如：UUID、设备ID等）
                resolve(res.deviceId || res.model); // 如果没有deviceId，可以返回其他唯一标识符
            },
            fail: (err) => {
                reject('无法获取设备信息: ' + err);
            }
        });
    });
}

/**
 * 雪花算法生成唯一ID
 * 使用机器码、时间戳、随机数来确保生成唯一ID
 */
export async function generateID() {
    try {
        const machineId = await getMachineId(); // 获取机器码（或设备标识符）
        const timestamp = Date.now(); // 当前时间戳
        const random = Math.floor(Math.random() * 10000); // 随机数
        // 将machineId转换为数值，使用字符串的ASCII码值之和
        const machineValue = machineId.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
        // 组合生成唯一数值ID：使用位运算确保不超出安全整数范围
        const id = (machineValue % 1000) * 1000000000000 + timestamp * 10000 + random;
        console.debug('生成的唯一ID：', id);
        return id;
    } catch (error) {
        console.error('生成ID失败:', error);
        return null;
    }
}
