<template>
  <div>
    <h1>File Uploader</h1>
    <input type="file" @change="onFileChange" />
    <div v-if="fileInfo">
      <p><strong>文件名:</strong> {{ fileInfo.name }}</p>
      <p><strong>文件大小:</strong> {{ fileInfo.size }} bytes</p>
      <p><strong>文件类型:</strong> {{ fileInfo.type }}</p>
      <button @click="uploadFile">上传文件</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      selectedFile: null,
      fileInfo: null,
      rooms: [], // 存储其他用户的房间信息
      socket: null,
      username: 'YourUsername', // 替换为实际用户名
    };
  },
  beforeUnmount() {
        this.disconnectSocket();
    },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0]; // 获取选择的文件
      if (file) {
        this.selectedFile = file;
        this.fileInfo = {
          name: file.name,
          size: file.size,
          type: file.type,
        };
      } else {
        this.fileInfo = null;
      }
    },
    connectSocket() {
            this.socket = io('http://localhost:3000');

            this.socket.on('connect', () => {
                console.log('Socket连接成功');
                this.socket.username = this.username;
                console.log('用户名已设置:', this.socket.username);
                this.socket.emit("joinPocket", { username: this.socket.username });
                console.log('Pocket已加入:', this.socket.username);
            });

            this.socket.on('message', (msg) => {
                console.log('接收到消息:', msg);
            });
        },
    async uploadFile() {
      if (!this.selectedFile) {
        return;
      }

      const formData = new FormData();
      formData.append('file', this.selectedFile);
      connectSocket();
      /*
      try {
        const response = await axios.post('http://localhost:3000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log('Upload response:', response.data);
      } catch (error) {
        console.error('Error uploading file:', error);
      }*/
    },
  },
};
</script>

<style scoped>
/* 添加样式 */
</style>