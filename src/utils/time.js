import dayjs from 'dayjs';
// 可选：加载日历中文语言包，启用中文显示（根据需求取消注释）
// import 'dayjs/locale/zh-cn';
// dayjs.locale('zh-cn');

// formatTime 格式化时间
export function formatTime(timestamp) {
    const target = dayjs(timestamp);
    if (!target.isValid()) return '';
    const now = dayjs();
    const diffMinutes = now.diff(target, 'minute');
    const diffHours = now.diff(target, 'hour');
    const diffDays = now.diff(target, 'day');
    const isSameYear = now.year() === target.year();
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 1) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    
    // 不同年份显示完整年份，否则显示月日
    if (!isSameYear) {
        return target.format('YYYY-MM');
    }
    return target.format('MM-DD');
}

// formatDate 格式化日期
export function formatDate(timestamp, template = "MM-DD HH:mm:ss") {
    if (!timestamp) return '时间未定'
    const target = dayjs(timestamp)
    return target.format(template)
}


// parseDuration 以 "01月04日 17:55:00-18:05:10"格式输出持续时间，如果不属于同一天则以 "01月05日 17:55:00-01月06日 02:21:41"格式输出
export function parseDuration(startTimestamp, endTimestamp) {
    const start = dayjs(startTimestamp);
    const end = dayjs(endTimestamp);

    if (start.isSame(end, 'day')) {
        return `${start.format('MM-DD HH:mm:ss')}-${end.format('HH:mm:ss')}`;
    } else {
        return `${start.format('MM-DD HH:mm:ss')}-${end.format('MM-DD HH:mm:ss')}`;
    }
}

/**
 * 延迟执行函数
 * @param {number} ms 延迟的毫秒数
 * @returns {Promise<void>} 返回Promise对象
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}