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

export default {
    name: 'DownloadFile',
    data() {
        return {
            files: [],
            sockets: [],
            socket: null,
            username: 'YourUsername',
            inputText: '',
            sendChannel: null,
            peerConnection: null,
            receivedMessage: ''
        };
    },
    mounted() {
        this.connectSocket();
    },
    beforeUnmount() {
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
                console.log('接收到了信令', data);
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
        buildRtcConnection(socketID) {
            console.log(`请求与以下socket建立连接: ${socketID}`);
            this.socket.emit("buildRtcConnection", { socketID: socketID, from: this.socket.id });
            this.initRtcConnection(socketID);
        },
        initRtcConnection(socketID) {
            const configuration = {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }, // STUN 服务器
                    {
                        urls: 'turn:your.turn.server:3478', // TURN 服务器
                        username: 'your_username',
                        credential: 'your_password'
                    }
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
                        socketID: socketID,
                        from: this.socket.id,
                    });
                }
            };

            // 创建 offer
            this.peerConnection.createOffer().then((offer) => {
                return this.peerConnection.setLocalDescription(offer);
            }).then(() => {
                this.socket.emit('setDescription', {
                    type: 'offer',
                    offer: this.peerConnection.localDescription,
                    socketID: socketID,
                    from: this.socket.id,
                });
                console.log('发送offer成功');
            }).catch(error => {
                console.error('发送offer失败:', error);
            });
        },
        async setRemoteDescription(data) {
            if (data.type === 'answer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
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
        emitListPocket() {
            if (this.socket) {
                this.socket.emit("listPocket", { username: this.socket.username });
            } else {
                console.warn('Socket 尚未连接');
            }
        },
        disconnectSocket() {
            if (this.socket) {
                this.socket.disconnect();
                console.log('Socket连接已断开');
            }
        },
        sendMessage() {
            console.log(this.sendChannel.readyState);
            if (this.sendChannel && this.sendChannel.readyState === 'open') {
                this.sendChannel.send(this.inputText);
                console.log('发送信息:', this.inputText);
                this.inputText = ''; // 清空输入框
            } else {
                console.warn('数据通道未打开', this.sendChannel.readyState);
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