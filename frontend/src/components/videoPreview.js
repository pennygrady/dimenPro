import { pennylog } from './utils';

export default class VideoStreamOp {
    constructor(rtcConnection) {
        this.rtcConnection = rtcConnection;
        this.localStream = null;
        this.remoteStream = null;
        this.videoElement = null; // 用于显示远端视频流
        this.openPreviewCallback = null;
        this.setPreviewResourceCallback = null;
        this.localStream = null;
        this.videoElement = null;

        // 处理远端流
        //this.rtcConnection.ontrack = (event) => {
        //    this.handleRemoteStream(event.streams[0]);
        //};

        // 创建发送通道
        // this.rtcConnection.onicecandidate = (event) => {
        //    if (event.candidate) {
        // 发送 ICE 候选人到信令服务器
        //        pennylog('新 ICE 候选人:', event.candidate);
        //        this.sendToSignalServer({ type: 'ice', candidate: event.candidate });
        //    }
        //};
    }

    async startLocalVideo(file,socketID) {
        try {
            // 创建视频元素并设置样式
            const videoElement = document.createElement('video');
            videoElement.style.width = '100%'; // 设置视频宽度为100%
            videoElement.style.maxWidth = '600px'; // 最大宽度为600px
            videoElement.controls = true; // 添加控制器
            document.body.appendChild(videoElement); // 将视频元素添加到文档中
    
            // 创建 Blob URL
            const fileURL = URL.createObjectURL(file);
            videoElement.src = fileURL;
    
            // 等待元数据加载
            videoElement.onloadedmetadata = async () => {
                const stream = videoElement.captureStream(); // 捕获视频流
                
    
                // 将视频轨道添加到 RTCPeerConnection
                stream.getTracks().forEach(track => {
                    console.log("添加轨道:", track);
                    this.rtcConnection.peerConnection.addTrack(track, stream);
                });
    
                // 创建并发送 SDP offer
                await this.rtcConnection.createoffer(socketID);
    
                // 播放视频
                videoElement.play();
            };
    
            // 可选：在视频播放结束后释放 Blob URL
            videoElement.onended = () => {
                URL.revokeObjectURL(fileURL); // 释放资源
                console.log('释放 Blob URL:', fileURL);
            };
        } catch (error) {
            console.error('播放视频文件时出错:', error);
        }
    }


    closeConnection() {
        if (this.rtcConnection) {
            this.rtcConnection.close();
            pennylog('RTC 连接已关闭.');
        }
    }
}