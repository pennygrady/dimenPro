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

    </div>
</template>

<script>
import { io } from 'socket.io-client';
import RTCConnection from './rtcConnection'; // 引入 rtcConnection.js
import FileOp from './fileOp'; // 引入 rtcConnection.js
import PreviewOp from './videoPreview';
import { pennylog } from './utils';
export default {
    data() {
        return {
            files: [],
            inputText: '',
            rtcConnection: null, // 新增
            fileOp:null,
            previewOp:null,
            socket: null,
            username: 'YourUsername',
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
        handleFileUpload(event) {
            const selectedFile = event.target.files[0];
            if (selectedFile) {
                selectedFile.id = this.files.length;
                this.files.push(selectedFile);
            }
        },
        removeFile(index) {
            // 从数组中删除文件
            const removedFile = this.files.splice(index, 1)[0];
            this.message = `${removedFile.name} 已从列表中删除。`;

            // 更新剩余文件的 ID
            this.files.forEach((file, idx) => {
                file.id = idx; // 将每个文件的 ID 更新为其当前索引
            });
        },
        connectSocket() {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                console.log('Socket连接成功', this.socket.id);
                this.socket.username = this.username;
                pennylog('用户名已设置:', this.socket.username);
                this.socket.emit("joinPocket", { username: this.socket.username });
            });

            this.socket.on('startRtcConnection', (data) => {
                console.log('开始建立RTC连接', data);
                this.socketID = data.from;
                this.rtcConnection = new RTCConnection(this.socket,this.socketID, this.username, this.handleMessage);
                this.rtcConnection.initRtcConnection(data.from);
            });
            this.socket.on('removeRtcConnection', (data) => {
                console.log('开始移除RTC连接', data);
                if (this.rtcConnection && this.rtcConnection.peerConnection) {
                    this.rtcConnection.closeConnection();
                    this.rtcConnection = null;
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
        removeCurrentConnection() {
            if (this.rtcConnection) {
                this.rtcConnection.closeConnection();
                this.rtcConnection = null;
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
                case 'list current dir': {
                    console.log('处理命令: 列出当前目录', payload);
                    // 在这里创建一个块级作用域
                    const fileList = this.files.map(file => ({
                        id: file.id, // 保留 ID
                        name: file.name,
                        size: file.size,
                    }));
                    this.rtcConnection.sendMessage({ ls: fileList }); // 发送文件列表
                    break;
                }
                case 'download':
                    console.log('下载指定文件', this.files[payload].name);
                    this.fileOp=new FileOp(this.rtcConnection);
                    this.fileOp.uploadFileInChunks(this.files[payload]);
                    break;
                case 'preview': {
                    console.log('预览指定文件', this.files[payload].name);
                    this.previewOp=new PreviewOp(this.rtcConnection);
                    this.previewOp.startLocalVideo(this.files[payload],this.sockeID);
                    /*
                    const videoElement = document.createElement('video');
                    
                    const fileURL = URL.createObjectURL(this.files[payload]);
                    videoElement.src = fileURL;

                    // 等待元数据加载
                    videoElement.onloadedmetadata = async () => {
                        const stream = videoElement.captureStream(); // 捕获视频流

                        // 将视频轨道添加到 RTCPeerConnection
                        stream.getTracks().forEach(track => {
                            console.log("添加轨道:", track);
                            this.rtcConnection.peerConnection.addTrack(track, stream);
                        });
                        this.rtcConnection.createoffer(this.socketID);
                        videoElement.play();
                    };*/
                    break;
                }
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