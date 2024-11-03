const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');

const fileRoutes = require('./router'); // 导入路由文件
const socketHandler = require("./src/socket/index"); // 导入 socket handler

const app = express();
const PORT = 3000;

// 使用 CORS
app.use(cors());

// 解析 JSON 请求体
app.use(express.json());

// 使用外部路由文件
app.use(fileRoutes); // 将路由挂载到应用上

// 创建 HTTP 服务器
const server = http.createServer(app);

// Socket.IO 设置
const io = socketIO(server, {
    cors: {
        origin: "*", // CORS 设置
        methods: ["GET", "POST"]
    }
});

// 初始化 Socket.IO 处理逻辑
socketHandler.excute({}, {}, io);

console.log("Socket init done ...");

// 启动服务器
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
});