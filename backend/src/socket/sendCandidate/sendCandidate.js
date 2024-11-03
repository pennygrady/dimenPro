


/**
 * 建立webrtc连接
 * @param {*} io socketio对象
 * @param {*} socket 单个socket连接
 * @param {*} tables 数据表对象
 * @param {*} dbClient sequelize-orm对象
 * @param {*} data event参数
 */
async function sendCandidate(io, socket, tables, dbClient, data) {
    console.log(`sendCandidate:`, data);

    // 通知两个 socket 开始 RTC 连接

    const foundSocket = io.sockets.sockets.get(data.socketID);
    if (foundSocket) {
        // sendCandidate
        foundSocket.emit('sendCandidate',data);
    } else {
        console.log('未找到 Socket');
        // 可选：处理未找到目标 socket 的情况
        socket.emit('error', '目标 socket 未找到');
    }
}

module.exports = {
    sendCandidate
};