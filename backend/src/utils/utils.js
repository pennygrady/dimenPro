

function pennylog(level, ...args) {
    const date = new Date();
    const formattedDate = date.toISOString(); // 使用 ISO 格式
    console.log(`[${formattedDate}] [${level}]`, ...args);
}
// 使用示例
//pennylog("INFO", "这是一个测试消息");
//pennylog("ERROR", "发生了一个错误!", { errorCode: 123 });

function generateUniqueId() {
    const timestamp = Date.now().toString(36); // 当前时间戳转换为基数 36 字符串
    const randomNum = Math.random().toString(36).substring(2, 8); // 随机数转换为基数 36 字符串，并截取一定长度
    return `${timestamp}-${randomNum}`; // 组合时间戳和随机数
}

// 示例用法
//const uniqueId = generateUniqueId();
//console.log(uniqueId); // 输出类似 "kqz8g-5g7xke" 的唯一 ID

module.exports = {
    pennylog,
    generateUniqueId
}