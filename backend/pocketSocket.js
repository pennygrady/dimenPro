const http = require('http'); // http
const https = require('https');
const socketIO = require('socket.io');
const fs = require('fs');

const socket = require("./src/socket/index") //socket handler


async function start() {
    // Socket连接监听
    let io = null;
    const server =http.createServer();

    io = socketIO(server, {
        cors: {
            origin: "*", // CORS 设置
            methods: ["GET", "POST"]
        }
    });

    socket.excute({}, {}, io);

    console.log("socket init done ...");

    server.listen(7898, () => {
        console.log("Socket server is listening on port 7898");
    });
}


start();