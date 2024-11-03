import { createApp } from 'vue';
import App from './App.vue';
import { createRouter, createWebHistory } from 'vue-router';

import UserLogin from './components/UserLogin.vue';
import MainPage from './components/MainPage.vue'; // 引入新的 MainPage 组件

const routes = [
  { path: '/', component: UserLogin },
  {
    path: '/main',
    component: MainPage, // 使用 MainPage 组件
    /*
    beforeEnter(to, from, next) {
      const isLoggedIn = !!localStorage.getItem('user');
      if (isLoggedIn) {
        next();
      } else {
        next('/');
      }
    },*/
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const app = createApp(App);
app.use(router);
app.mount('#app');