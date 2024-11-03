/**
 * 列举所有连接的pocket
 * @param {*} io socketio对象
 * @param {*} socket 单个socket连接
 * @param {*} tables 数据表对象
 * @param {*} dbClient sequelize-orm对象
 * @param {*} data event参数
 */
async function setDescription(io, socket, tables, dbClient, data){
    console.log(data);
    const foundSocket = io.sockets.sockets.get(data.socketID);
    if (foundSocket) {
        // 通知找到的 Socket 开始 RTC 连接
        foundSocket.emit('setDescription', data);
    } else {
        console.log('未找到 Socket',data.socketID);
        // 可选：处理未找到目标 socket 的情况
        socket.emit('error', '目标 socket 未找到');
    }
}

module.exports = {
    setDescription
}