<template>
    <div class="video-player">
        <video ref="video" controls @loadedmetadata="setDuration" @timeupdate="updateProgress" @error="handleError">
            <source :src="videoSource" type='video/mp4; codecs="avc1.42E01E, mp4a.40.2"' />
            Your browser does not support the video tag.
        </video>
        <input type="range" v-model="progress" :max="duration" @input="seekVideo" />
        <span>{{ currentTime }} / {{ duration }}</span>
    </div>
</template>

<script>
export default {
    props: {
        videoSource: {
            type: String,
            required: true
        },
        onClose: {
            type: Function,
            required: true
        }
    },
    data() {
        return {
            progress: 0,
            duration: 0,
            currentTime: 0
        };
    },
    methods: {
        setDuration() {
            this.duration = this.$refs.video.duration;
            this.$refs.video.play(); // 自动播放
        },
        updateProgress() {
            this.currentTime = this.$refs.video.currentTime;
            this.progress = this.currentTime;
        },
        seekVideo() {
            this.$refs.video.currentTime = this.progress;
        },
        closePlayer() {
            this.onClose(); // 调用回调函数关闭播放器
        },
        handleError() {
            console.error('视频加载错误');
            alert('视频无法加载，请检查视频源.');
            this.closePlayer(); // 关闭播放器
        }
    },
    mounted() {
        this.$refs.video.addEventListener('ended', this.closePlayer);
    },
    beforeUnmount() {
        this.$refs.video.removeEventListener('ended', this.closePlayer);
    }
}
</script>

<style scoped>
.video-player {
    display: flex;
    flex-direction: column;
    align-items: center;
}
video {
    width: 100%;
    max-width: 600px;
}
input[type="range"] {
    width: 100%;
}
</style>