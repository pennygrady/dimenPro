import { pennylog } from './utils';

export default class FileOp {
    constructor(rtcConnection) {
        this.rtcConnection = rtcConnection;
        this.receivedChunks = [];
        this.expectedFileName = '';
        this.totalChunks = 0;
        this.chunkSize = 16384; // 16KB
        this.fileTotalChunks,
        this.transferfileName,
        this.sendingQueue = []; // 发送队列
        this.isSending = false; // 标记是否正在发送
        this.updateProgressCallback = null; // 进度回调
        this.hideProgressCallback = null; // 进度回调
        this.videoElement = document.getElementById('remoteVideo');
    }

    uploadFileInChunks(file) {
        this.fileTotalChunks = Math.ceil(file.size / this.chunkSize);
        let currentChunk = 0;
        this.transferfileName=file.name;
        console.log(`开始上传文件: ${file.name}, 总大小: ${file.size} bytes, 总块数: ${this.fileTotalChunks}`);

        // 开始读取第一个块
        this.readNextChunk(file, currentChunk);
    }

    readNextChunk(file, currentChunk) {
        const start = currentChunk * this.chunkSize;
        const end = Math.min(start + this.chunkSize, file.size);
        const slice = file.slice(start, end);
        const reader = new FileReader();

        reader.onload = (event) => {
            const chunk = new Uint8Array(event.target.result); // 创建 Uint8Array
            this.sendingQueue.push({ chunk: Array.from(chunk), index: currentChunk }); // 将块添加到发送队列
            this.processSendingQueue(); // 尝试处理发送队列

            currentChunk++; // 递增当前块索引

            // 继续读取下一块
            if (currentChunk < Math.ceil(file.size / this.chunkSize)) {
                this.readNextChunk(file, currentChunk);
            } else {
                console.log('所有块已读取.');
            }
        };

        reader.onerror = (error) => {
            console.error(`读取块时出错: ${error}`);
        };

        reader.readAsArrayBuffer(slice); // 读取当前块
    }

    processSendingQueue() {
        if (this.isSending || this.sendingQueue.length === 0) {
            return; // 如果正在发送或队列为空，返回
        }

        this.isSending = true; // 设置正在发送标记
        const { chunk, index } = this.sendingQueue.shift(); // 从队列中取出下一个块

        this.sendChunk(chunk, index)
            .then(() => {
                this.isSending = false; // 发送完成，重置标记
                this.processSendingQueue(); // 继续处理队列
            })
            .catch((error) => {
                console.error(`发送块时出错: ${error}`);
                this.isSending = false; // 发送失败，重置标记
                // 可以选择在这里重试或记录错误
            });
    }

    sendChunk(chunk, chunkIndex) {
        return new Promise((resolve, reject) => {
            const message = {
                index: chunkIndex,
                total: this.fileTotalChunks,
                name: this.transferfileName,
                data: chunk
            };
            if (this.rtcConnection.sendChannel) {
                this.rtcConnection.sendChannel.send(JSON.stringify(message)); // 发送 JSON 字符串
                //console.log(`块 ${chunkIndex + 1} 发送成功.`);
                resolve(); // 确认发送成功
            } else {
                console.warn('RTC 连接未准备好，无法发送数据.');
                reject('连接未准备好');
            }
        });
    }

    
    handleReceivedChunk(data) {
        const message = data;
        const { index, total, name, data: chunk } = message;
        if (this.expectedFileName === '') {
            this.expectedFileName = name;
            this.totalChunks = total;
        }

        if (index === this.receivedChunks.length) {
            pennylog('接收到块:', index);
            this.receivedChunks.push(new Uint8Array(chunk)); // 存储接收到的块
            if (this.updateProgressCallback) {
                const progress = Math.floor(((index + 1) / this.totalChunks) * 100);
                this.updateProgressCallback(progress); // 调用回调更新进度
            }
            // 检查是否接收到所有块
            if (this.receivedChunks.length === this.totalChunks) {
                this.downloadFile();
                if (this.hideProgressCallback) {
                    this.hideProgressCallback(); // 调用回调更新进度
                }
            }
        }
    }

    downloadFile() {
        console.log('文件下载中:', this.expectedFileName);
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
}