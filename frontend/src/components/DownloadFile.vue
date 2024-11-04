<template>
    <div>
        <h2>文件信息与下载</h2>
        <button @click="emitListPocket">请求文件列表</button>

        <h2>连接的用户</h2>
        <div v-if="sockets.length">
            <ul>
                <li v-for="socket in sockets" :key="socket.id">
                    <strong>{{ socket.username }}</strong>
                    <button @click="buildRtcConnection(socket.id)">进入</button>
                </li>
            </ul>
        </div>
        <div v-else>
            <p>没有其他用户连接。</p>
        </div>

        <div>
            <input type="text" v-model="inputText" placeholder="请输入信息" />
            <button @click="sendMessage">提交</button>
        </div>
        <h3>收到的信息:</h3>
        <p>{{ receivedMessage }}</p>
    </div>
</template>

<script>
import { io } from 'socket.io-client';
import RTCConnection from './rtcConnection'; // 引入 rtcConnection.js

export default {
    name: 'DownloadFile',
    data() {
        return {
            files: [],
            sockets: [],
            socket: null,
            username: 'YourUsername',
            inputText: '',
            rtcConnection: null, // 新增
            receivedMessage: '',
            socketID: null,
        };
    },
    mounted() {
        this.connectSocket();
    },
    beforeUnmount() {
        this.removeCurrentConnection();
        this.disconnectSocket();
    },
    methods: {
        connectSocket() {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                console.log('Socket连接成功', this.socket.id);
                this.socket.username = this.username;
                console.log('用户名已设置:', this.socket.username);
            });

            this.socket.on('showPocket', (sockets) => {
                this.sockets = sockets.filter(socket => socket.id !== this.socket.id);
                console.log('接收到socket信息:', this.sockets);
            });
            this.socket.on('setDescription', async (data) => {
                console.log('接收到信令', data);
                await this.rtcConnection.setRemoteDescription(data);
            });
            this.socket.on('sendCandidate', (data) => {
                console.log('接收到候选者:', data);
                if (this.rtcConnection.peerConnection) {
                    this.rtcConnection.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
                        .then(() => {
                            console.log('成功添加候选者');
                        })
                        .catch(error => {
                            console.error('添加候选者失败:', error);
                        });
                }
            });
        },
        removeCurrentConnection() {
            if (this.socketID) {
                this.socket.emit("removeRtcConnection", { socketID: this.socketID, from: this.socket.id });
                this.socketID = null;
            }
            if (this.rtcConnection.peerConnection) {
                this.rtcConnection.closeConnection();
            }
        },
        buildRtcConnection(socketID) {
            this.socketID = socketID;
            if (this.rtcConnection) {
                this.removeCurrentConnection();
            }
            console.log(`请求与以下socket建立连接: ${socketID}`);
            this.socket.emit("buildRtcConnection", { socketID: socketID, from: this.socket.id });
            this.rtcConnection = new RTCConnection(this.socket, this.username, this.handleMessage);
            this.rtcConnection.initRtcConnection(socketID);
            this.rtcConnection.createoffer(socketID);
        },
        emitListPocket() {
            if (this.socket) {
                this.socket.emit("listPocket", { username: this.socket.username });
            } else {
                console.warn('Socket 尚未连接');
            }
        },
        handleMessage(message) {
            if (message.command) {
                this.handleCommand(message.command, message.payload);
            } else {
                this.receivedMessages.push(message.data || message);
            }
        },
        handleCommand(command, payload) {
            switch (command) {
                case 'list current dir':
                    console.log('处理命令: 列出当前目录', payload);
                    break;
                case 'enter dir':
                    console.log('处理命令: 进入目录', payload);
                    break;
                default:
                    console.warn('未知命令:', command);
            }
        },
        disconnectSocket() {
            if (this.socket) {
                this.socket.disconnect();
                console.log('Socket连接已断开');
            }
        },
        sendMessage() {
            if (this.rtcConnection) {
                this.rtcConnection.sendMessage({ command: 'list current dir', payload: "test files" });
                this.inputText = ''; // 清空输入框
            } else {
                console.warn('RTC连接尚未建立');
            }
        },
    },
};
</script>

<style scoped>
ul {
    list-style-type: none;
    padding: 0;
}

li {
    margin: 10px 0;
}

button {
    margin-left: 10px;
}
</style>