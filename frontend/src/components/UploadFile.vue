<template>
    <div>
        <h2>文件上传</h2>
        <input type="file" @change="handleFileUpload" />
        <div v-if="files.length">
            <h3>已选择的文件:</h3>
            <ul>
                <li v-for="(file, index) in files" :key="index">
                    <strong>{{ file.name }}</strong> - {{ file.size }} bytes
                    <button @click="removeFile(index)">删除</button>
                </li>
            </ul>
        </div>
        <div v-if="message">{{ message }}</div>

        <div>
            <input type="text" v-model="inputText" placeholder="请输入信息" />
            <button @click="sendMessage">提交</button>
        </div>
    </div>
</template>

<script>
import { io } from 'socket.io-client';
import RTCConnection from './rtcConnection'; // 引入 rtcConnection.js

export default {
    data() {
        return {
            files: [],
            message: '',
            inputText: '',
            rtcConnection: null, // 新增
            socket: null,
            username: 'YourUsername',
        };
    },
    mounted() {
        this.connectSocket();
    },
    beforeUnmount() {
        this.disconnectSocket();
    },
    methods: {
        handleFileUpload(event) {
            const selectedFile = event.target.files[0];
            if (selectedFile) {
                this.files.push(selectedFile);
                this.message = `${selectedFile.name} 已添加到列表。`;
            }
        },
        removeFile(index) {
            const removedFile = this.files.splice(index, 1)[0];
            this.message = `${removedFile.name} 已从列表中删除。`;
        },
        connectSocket() {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                console.log('Socket连接成功', this.socket.id);
                this.socket.username = this.username;
                console.log('用户名已设置:', this.socket.username);
                this.socket.emit("joinPocket", { username: this.socket.username });
            });

            this.socket.on('startRtcConnection', (data) => {
                console.log('开始建立RTC连接', data);
                this.rtcConnection = new RTCConnection(this.socket, this.username, this.handleMessage);
                this.rtcConnection.initRtcConnection(data.from);
            });
            this.socket.on('removeRtcConnection', (data) => {
                console.log('开始移除RTC连接', data);
                if (this.rtcConnection.peerConnection) {
                    this.rtcConnection.closeConnection();
                }
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
        async setRemoteDescription(data) {
            await this.rtcConnection.setRemoteDescription(data);
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
        sendMessage() {
            if (this.rtcConnection) {
                this.rtcConnection.sendMessage({ data: this.inputText });
                this.inputText = ''; // 清空输入框
            } else {
                console.warn('RTC连接尚未建立');
            }
        },
        disconnectSocket() {
            if (this.socket) {
                this.socket.disconnect();
                console.log('Socket连接已断开');
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