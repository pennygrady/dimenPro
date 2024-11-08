<template>
  <div>
    <h2>视频播放示例</h2>
    
    <div>
      <h3>常规播放</h3>
      <video ref="videoPlayer" controls >
        <source :src="videoSrc" type="video/mp4" />
        您的浏览器不支持视频播放。
      </video>
    </div>

    <div>
      <h3>MediaSource 播放</h3>
      <video ref="mediaSourcePlayer" controls></video>
    </div>
  </div>
</template>

<script>
export default {
  name: 'VideoPlayer',
  data() {
    return {
      videoSrc: require('./1.mp4'), // 确保路径正确
      mediaSource: null,
    };
  },
  mounted() {
    this.setupMediaSource();
  },
  methods: {
    setupMediaSource() {
      const videoElement = this.$refs.mediaSourcePlayer;
      this.mediaSource = new MediaSource();
      videoElement.src = URL.createObjectURL(this.mediaSource);

      this.mediaSource.addEventListener('sourceopen', () => {
        const sourceBuffer = this.mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E, mp4a.40.2"');

        // 使用 fetch 获取视频文件的 ArrayBuffer
        fetch(this.videoSrc)
          .then(response => {
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            return response.arrayBuffer(); // 获取 ArrayBuffer
          })
          .then(arrayBuffer => {
            // 确保 sourceBuffer 不在更新状态
            if (!sourceBuffer.updating) {
              sourceBuffer.appendBuffer(new Uint8Array(arrayBuffer));
            }
          })
          .catch(error => {
            console.error('Error fetching video file for MediaSource:', error);
          });

        // 处理 SourceBuffer 更新完成的情况
        sourceBuffer.addEventListener('updateend', () => {
          if (!sourceBuffer.updating) {
            // 可以在这里添加更多数据，如果需要
            console.log('SourceBuffer update complete');
          }
        });
      });
    },
  },
};
</script>

<style scoped>
video {
  width: 100%;
  max-width: 600px;
  margin-top: 20px;
}
</style>