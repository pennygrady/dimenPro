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
            <button @click="sendCommand('list current dir', 'current dir')">获取文件列表</button>
        </div>

        <h2>文件列表</h2>
        <ul v-if="files.length">
            <li v-for="(file, index) in files" :key="index">
                <strong>{{ file.name }}</strong> - {{ file.size }} bytes
                <button @click="downloadFromPocket(file)">下载</button>
                <button v-if="isMp4(file.name)" @click="previewFromPocket(file)">预览</button>
            </li>
        </ul>
        <video id="remoteVideo" controls autoplay></video>
    </div>
</template>

<script>
import { io } from 'socket.io-client';
import RTCConnection from './rtcConnection'; // 引入 rtcConnection.js
import { pennylog } from './utils'; // 引入 rtcConnection.js

export default {
    name: 'DownloadFile',
    data() {
        return {
            files: [],
            sockets: [],
            socket: null,
            username: 'YourUsername',
            rtcConnection: null, // 新增
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
                pennylog('Socket连接成功', this.socket.id);
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
            if (this.rtcConnection) {
                this.rtcConnection.closeConnection();
                this.rtcConnection = null;
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
            if (message.ls) {
                // 当接收到文件列表时，更新 files 数组
                this.files = message.ls.map(file => ({
                    id: file.id,    // 保留 ID
                    name: file.name,
                    size: file.size,
                    type: file.type  // 可选，包含文件类型
                }));
                pennylog('接收到文件列表:', this.files); // 记录接收到的文件列表
            } else if (message.data) {
                this.handleData(message.data);
            } else {
                pennylog(message);
            }
        },
        handleData(data) {
            pennylog(data);
        },

        disconnectSocket() {
            if (this.socket) {
                this.socket.disconnect();
                console.log('Socket连接已断开');
            }
        },
        sendCommand(command, payload) {
            if (this.rtcConnection) {
                this.rtcConnection.sendMessage({ command: command, payload: payload });
            } else {
                console.warn('RTC连接尚未建立');
            }
        },
        downloadFromPocket(file) {
            pennylog('not implemented yet ', file.name);
            this.sendCommand('download', file.id);
        },
        previewFromPocket(file) {
            pennylog('not implemented yet ', file.name);
            this.sendCommand('preview', file.id);
            const remoteVideo = document.getElementById('remoteVideo');

            // 接收远程流
            this.rtcConnection.peerConnection.ontrack = event => {
                console.log("接收到轨道:", event.track);
                const remoteStream = event.streams[0]
                remoteVideo.srcObject = remoteStream; // 设置远程视频流
            };
        },
        isMp4(fileName) {
            // 检查文件名后缀是否为 .mp4
            return fileName.toLowerCase().endsWith('.mp4');
        }
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