import { pennylog } from './utils';

export default class FileOp {
    constructor(rtcConnection) {
        this.rtcConnection = rtcConnection;
        this.receivedChunks = [];
        this.expectedFileName = '';
        this.totalChunks = 0;


        this.videoElement = document.getElementById('remoteVideo');
    }

    uploadFileInChunks(file) {
        const chunkSize = 16384; // 16KB
        const totalChunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;

        console.log(`开始上传文件: ${file.name}, 总大小: ${file.size} bytes, 总块数: ${totalChunks}`);

        // 开始读取第一个块
        this.readNextChunk(file, currentChunk, chunkSize);
    }

    readNextChunk(file, currentChunk, chunkSize) {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const slice = file.slice(start, end);
        const reader = new FileReader();

        reader.onload = (event) => {
            const chunk = new Uint8Array(event.target.result); // 创建 Uint8Array            
            this.sendChunk(Array.from(chunk), currentChunk, Math.ceil(file.size / chunkSize), file.name); // 发送当前块

            currentChunk++; // 递增当前块索引

            // 继续读取下一块
            if (currentChunk < Math.ceil(file.size / chunkSize)) {
                this.readNextChunk(file, currentChunk, chunkSize);
            } else {
                pennylog('所有块已发送.');
            }
        };

        reader.onerror = (error) => {
            console.error(`读取块时出错: ${error}`);
        };

        reader.readAsArrayBuffer(slice); // 读取当前块
    }

    sendChunk(chunk, chunkIndex, totalChunks, fileName) {
        const message = {
            index: chunkIndex,
            total: totalChunks,
            name: fileName,
            data: chunk
        };
        if (this.rtcConnection.sendChannel) {
            this.rtcConnection.sendChannel.send(JSON.stringify(message)); // 发送 JSON 字符串
            pennylog(`块 ${chunkIndex + 1} 发送成功.`);
        } else {
            console.warn('RTC 连接未准备好，无法发送数据.');
        }
    }
    handleReceivedChunk(data) {
        const message = data;
        const { index, total, name, data: chunk } = message;
        if (this.expectedFileName === '') {
            this.expectedFileName = name;
            this.totalChunks = total;
        }

        if (index === this.receivedChunks.length) {
            this.receivedChunks.push(new Uint8Array(chunk)); // 存储接收到的块

            // 检查是否接收到所有块
            if (this.receivedChunks.length === this.totalChunks) {
                this.downloadFile();
            }
        }
    }

    downloadFile() {
        const blob = new Blob(this.receivedChunks);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.expectedFileName; // 设置下载文件名
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log('文件下载成功:', this.expectedFileName);
    }



    //need to be modified what is more, file size is problem
    uploadFileInChunksForPreview(file) {
        const chunkSize = 16384; // 16KB
        const totalChunks = Math.ceil(file.size / chunkSize);
        let currentChunk = 0;

        console.log(`开始上传文件: ${file.name}, 总大小: ${file.size} bytes, 总块数: ${totalChunks}`);

        // 开始读取第一个块
        this.readNextChunkForPreview(file, currentChunk, chunkSize);
    }

    readNextChunkForPreview(file, currentChunk, chunkSize) {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const slice = file.slice(start, end);
        const reader = new FileReader();

        reader.onload = (event) => {
            const chunk = new Uint8Array(event.target.result); // 创建 Uint8Array            
            this.sendChunkForPreview(Array.from(chunk), currentChunk, Math.ceil(file.size / chunkSize)); // 发送当前块

            currentChunk++; // 递增当前块索引

            // 继续读取下一块
            if (currentChunk < Math.ceil(file.size / chunkSize)) {
                this.readNextChunkForPreview(file, currentChunk, chunkSize);
            } else {
                pennylog('所有块已发送.');
            }
        };

        reader.onerror = (error) => {
            console.error(`读取块时出错: ${error}`);
        };

        reader.readAsArrayBuffer(slice); // 读取当前块
    }

    sendChunkForPreview(chunk, chunkIndex, totalChunks) {
        const message = {
            index: chunkIndex,
            total: totalChunks,
            preview: 'yes',
            data: chunk
        };
        if (this.rtcConnection.sendChannel) {
            this.rtcConnection.sendChannel.send(JSON.stringify(message)); // 发送 JSON 字符串
            pennylog(`块 ${chunkIndex + 1} 发送成功.`);
        } else {
            console.warn('RTC 连接未准备好，无法发送数据.');
        }
    }
    handleReceivedChunkForPreview(data) {
        const message = data; // 解析接收到的 JSON 消息
        const { index, total, name, data: chunk } = message;

        if (this.expectedFileName === '') {
            this.expectedFileName = name;
            this.totalChunks = total;
        }

        if (index === this.receivedChunks.length) {
            this.receivedChunks.push(new Uint8Array(chunk)); // 存储接收到的块

            // 播放视频流 这里不应该这么写，应当接收到就开始播
            this.playVideo();
        }
    }

    // 播放视频
    playVideo() {
        const blob = new Blob(this.receivedChunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        this.videoElement.src = url; // 设置视频源
        this.videoElement.load(); // 加载视频
        this.videoElement.play(); // 播放视频
        pennylog('视频播放成功:', this.expectedFileName);
    }
    /*
    关键点
实时播放：通过实时接收视频数据块并将其拼接为 Blob 对象，实现视频的流式播放。
数据结构：确保发送的数据块格式包含索引、总块数、文件名和数据块内容。
自动播放：设置 autoplay 属性使视频在加载后自动播放。
注意事项
视频格式：确保发送的视频数据是有效的 MP4 格式。
流控制：考虑实现流控制机制，以确保流畅播放。
网络延迟：注意网络延迟和数据顺序可能影响播放体验。
资源管理：在播放过程中，适时释放 Blob URL，以减少内存占用。
*/
}