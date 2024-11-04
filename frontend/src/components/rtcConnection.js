// rtcConnection.js
export default class RTCConnection {
  constructor(socket, username, messageHandler) {
    this.socket = socket;
    this.username = username;
    this.peerConnection = null;
    this.sendChannel = null;
    this.messageHandler = messageHandler; // 新增回调


    this.setupSocketListeners();
  }

  setupSocketListeners() {
    console.log('初始化socketlostener');
    

  }

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
  }

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
      this.handleMessage(event.data);
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
        this.handleMessage(event.data);
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
  }

  createoffer(socketID) {
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
  }

  handleMessage(data) {
    let message;
    try {
      message = JSON.parse(data);
    } catch (error) {
      console.error('解析消息失败:', error);
      return;
    }

    // 调用回调，将消息传递给 Vue 组件
    if (this.messageHandler) {
      this.messageHandler(message);
    }
  }

  sendMessage(message) {
    if (this.sendChannel && this.sendChannel.readyState === 'open') {
      this.sendChannel.send(JSON.stringify(message)); // 发送 JSON 格式的消息
      console.log('发送信息:', message);
    } else {
      console.warn('数据通道未打开', this.sendChannel.readyState);
    }
  }

  // 新增关闭 peerConnection 方法
  closeConnection() {
    console.log('开始移除RTC连接',this.peerConnection);
    if (this.sendChannel) {
      this.sendChannel.close();
      console.log('数据通道已关闭');
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
      console.log('RTCPeerConnection已关闭');
      this.peerConnection = null; // 清除引用
    }
  }

  disconnect() {
    console.log('开始移除RTC连接');
    this.closeConnection(); // 在disconnect中调用closeConnection
  }
}

// 发送命令
//this.rtcConnection.sendMessage({ command: 'list current dir', payload: { /* 相关数据 */ } });

// 发送一般数据
//this.rtcConnection.sendMessage({ data: '一些普通数据' });