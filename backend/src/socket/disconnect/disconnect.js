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
async function disconnect(io, socket, tables, dbClient, data){
    socket.leave("temp");
    console.log(`A client disconnect`);
}

module.exports = {
    disconnect
}