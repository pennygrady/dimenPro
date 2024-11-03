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

export default {
    data() {
        return {
            files: [],
            message: '',
            inputText: '',
            peerConnection: null,
            sendChannel: null,
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
                this.initRtcConnection(data);
            });

            this.socket.on('setDescription', async (data) => {
                console.log('接收到信令', data);
                await this.setRemoteDescription(data);
            });
            this.socket.on('sendCandidate', (data) => {
                console.log('接收到候选者:', data);
                if (this.peerConnection) {
                    this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate))
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
            if (data.type === 'answer') {
                let temp = new RTCSessionDescription(data.answer);
                await this.peerConnection.setRemoteDescription(temp);
                console.log('设置远端描述成功');
            } else if (data.type === 'offer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await this.peerConnection.createAnswer();
                await this.peerConnection.setLocalDescription(answer);
                this.socket.emit('setDescription', {
                    type: 'answer',
                    answer: this.peerConnection.localDescription,
                    socketID: data.from,
                    from: this.socket.id,
                });
                console.log('发送应答成功');
            }
        },
        initRtcConnection(data) {
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' } // STUN 服务器
                ]
            };
            this.peerConnection = new RTCPeerConnection(configuration);
            this.sendChannel = this.peerConnection.createDataChannel('sendDataChannel');

            this.sendChannel.onopen = () => {
                console.log('数据通道打开');
            };

            this.sendChannel.onmessage = (event) => {
                console.log('接收到数据:', event.data);
                this.receivedMessage = event.data; // 处理接收到的消息
            };

            this.sendChannel.onclose = () => {
                console.log('数据通道关闭');
            };
            this.peerConnection.ondatachannel = (event) => {
                const dataChannel = event.channel; // 获取接收到的数据通道

                dataChannel.onopen = () => {
                    console.log('接收到数据通道，已打开');
                };

                dataChannel.onmessage = (event) => {
                    console.log('收到消息:', event.data);
                };

                dataChannel.onclose = () => {
                    console.log('数据通道已关闭');
                };
            };
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    this.socket.emit('sendCandidate', {
                        candidate: event.candidate,
                        socketID: data.from,
                        from: this.socket.id,
                    });
                }
            };
            console.log('完成建立RTC连接');
        },
        sendMessage() {
            if (this.sendChannel && this.sendChannel.readyState === 'open') {
                this.sendChannel.send(this.inputText);
                console.log('发送信息:', this.inputText);
                this.inputText = ''; // 清空输入框
            } else {
                console.warn('数据通道未打开', this.sendChannel.readyState);
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