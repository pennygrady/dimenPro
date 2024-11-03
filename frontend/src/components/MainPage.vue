<template>
    <div>
      <h2>主页面</h2>
      <div class="tabs">
        <button @click="selectTab('userManagement')">用户管理</button>
        <button @click="selectTab('uploadFile')">上传文件</button>
        <button @click="selectTab('downloadFile')">下载文件</button>
      </div>
      <div class="content">
        <component :is="currentComponent"></component>
      </div>
    </div>
  </template>
  
  <script>
  import UserManagement from './UserManagement.vue';
  import UploadFile from './UploadFile.vue';
  import DownloadFile from './DownloadFile.vue';
  
  export default {
    name: 'MainPage',
    components: {
      UserManagement,
      UploadFile,
      DownloadFile,
    },
    data() {
      return {
        currentTab: 'userManagement',
      };
    },
    computed: {
      currentComponent() {
        return {
          userManagement: 'UserManagement',
          uploadFile: 'UploadFile',
          downloadFile: 'DownloadFile',
        }[this.currentTab];
      },
    },
    methods: {
      selectTab(tab) {
        this.currentTab = tab;
      },
    },
  };
  </script>
  
  <style scoped>
  /* 添加样式 */
  .tabs {
    margin-bottom: 20px;
  }
  </style>