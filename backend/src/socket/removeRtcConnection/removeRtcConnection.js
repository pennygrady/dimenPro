


/**
 * 建立webrtc连接
 * @param {*} io socketio对象
 * @param {*} socket 单个socket连接
 * @param {*} tables 数据表对象
 * @param {*} dbClient sequelize-orm对象
 * @param {*} data event参数
 */
async function removeRtcConnection(io, socket, tables, dbClient, data) {
    console.log(`两个 socket 想要断开连接:`, socket.id, data.socketID);

    // 通知两个 socket 断开 RTC 连接

    const foundSocket = io.sockets.sockets.get(data.socketID);
    if (foundSocket) {
        //console.log('找到的 Socket:', foundSocket.id);
        // 通知找到的 Socket 开始 RTC 连接
        foundSocket.emit('removeRtcConnection', { socketID: foundSocket.id, from: data.from});
    } else {
        console.log('未找到 Socket');
        // 可选：处理未找到目标 socket 的情况
        socket.emit('error', '目标 socket 未找到');
    }
}

module.exports = {
    removeRtcConnection
};