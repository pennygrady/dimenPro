const eventConstant = require("../eventConstant.js");
const CSEvent = eventConstant.CSEvent;


/**
 * 列举所有连接的pocket
 * @param {*} io socketio对象
 * @param {*} socket 单个socket连接
 * @param {*} tables 数据表对象
 * @param {*} dbClient sequelize-orm对象
 * @param {*} data event参数
 */
async function listPocket(io, socket, tables, dbClient, data) {

    socket.emit('message', {
        status: "ok"
    });
    const roomSockets = Array.from(io.sockets.adapter.rooms.get("YourUsername") || []).map(socketId => {
        const socketInfo = io.sockets.sockets.get(socketId);
        return {
            id: socketId,
            username: socketInfo.username || 'Unknown', // 获取用户名
        };
    });
    console.log(`Sockets in room :`, roomSockets);

    // 向请求的用户发送房间信息
    socket.emit(CSEvent.showPocket, roomSockets);
}

module.exports = {
    listPocket
}