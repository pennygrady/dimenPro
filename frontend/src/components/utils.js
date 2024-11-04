function pennylog(level, ...args) {
    const date = new Date();
    const formattedDate = date.toISOString(); // 使用 ISO 格式
    console.log(`[${formattedDate}] [${level}]`, ...args);
}

// 使用示例
//pennylog("INFO", "这是一个测试消息");
//pennylog("ERROR", "发生了一个错误!", { errorCode: 123 });

module.exports = {
    pennylog
}