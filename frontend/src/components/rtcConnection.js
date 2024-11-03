// rtcConnection.js

export default class RTCConnection {
    constructor(username) {
      this.localConnection = null;
      this.remoteConnection = null;
      this.sendChannel = null;
      this.receiveChannel = null;
      this.username = username;
      this.iceServers = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // STUN 服务器
    }
  
    createConnection() {
      this.localConnection = new RTCPeerConnection(this.iceServers);
      this.iceServers = null;
      this.sendChannel = this.localConnection.createDataChannel('sendDataChannel');
      this.sendChannel.onopen = this.onSendChannelStateChange.bind(this);
      this.sendChannel.onclose = this.onSendChannelStateChange.bind(this);
  
      this.localConnection.onicecandidate = (event) => this.onIceCandidate(event);
  
      this.remoteConnection = new RTCPeerConnection(this.iceServers);
      this.remoteConnection.onicecandidate = (event) => this.onIceCandidate(event);
      this.remoteConnection.ondatachannel = (event) => this.receiveChannelCallback(event);
    }
  
    async createOffer() {
      const offer = await this.localConnection.createOffer();
      await this.localConnection.setLocalDescription(offer);
      await this.remoteConnection.setRemoteDescription(offer);
      const answer = await this.remoteConnection.createAnswer();
      await this.remoteConnection.setLocalDescription(answer);
      await this.localConnection.setRemoteDescription(answer);
    }
  
    onIceCandidate(event) {
      const otherConnection = (event.target === this.localConnection) ? this.remoteConnection : this.localConnection;
      otherConnection.addIceCandidate(event.candidate).then(() => {
        console.log('ICE candidate added successfully');
      }).catch((error) => {
        console.error('Failed to add ICE candidate:', error);
      });
    }
  
    receiveChannelCallback(event) {
      this.receiveChannel = event.channel;
      this.receiveChannel.onmessage = this.onReceiveMessage.bind(this);
      this.receiveChannel.onopen = this.onReceiveChannelStateChange.bind(this);
      this.receiveChannel.onclose = this.onReceiveChannelStateChange.bind(this);
    }
  
    onReceiveMessage(event) {
      console.log('Received message:', event.data);
    }
  
    onSendChannelStateChange() {
      const readyState = this.sendChannel.readyState;
      console.log('Send channel state is:', readyState);
    }
  
    onReceiveChannelStateChange() {
      const readyState = this.receiveChannel.readyState;
      console.log('Receive channel state is:', readyState);
    }
  
    sendMessage(message) {
      if (this.sendChannel && this.sendChannel.readyState === 'open') {
        this.sendChannel.send(message);
        console.log('Sent message:', message);
      } else {
        console.warn('Send channel is not open');
      }
    }
  
    closeConnections() {
      this.sendChannel.close();
      this.receiveChannel.close();
      this.localConnection.close();
      this.remoteConnection.close();
      console.log('Connections closed');
    }
  }