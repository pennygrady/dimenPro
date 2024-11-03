


/**
 * 列举所有连接的pocket
 * @param {*} io socketio对象
 * @param {*} socket 单个socket连接
 * @param {*} tables 数据表对象
 * @param {*} dbClient sequelize-orm对象
 * @param {*} data event参数
 */
async function joinPocket(io, socket, tables, dbClient, data){
    console.log(`joining the room :`, data.username);
    socket.username = data.username;
    socket.join(data.username);
}

module.exports = {
    joinPocket
}