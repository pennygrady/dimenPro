const connect = require("./connect");
const eventConstant = require("./eventConstant");
const CSEvent = eventConstant.CSEvent

/**
 * socket事件初始化入口
 * @param {*} tables 
 * @param {*} dbClient 
 * @param {*} io 
 * @returns 
 */
async function excute(tables, dbClient, io) {
    if (io === undefined || io === null) {
        console.error("init socket error ");
        return;
    }

    io.sockets.on(CSEvent.connection, function (socket) {
        console.log('用户连接:', socket.id); // 获取用户名
        connect(io, socket, tables, dbClient)
    });
}

module.exports = {
    excute
}