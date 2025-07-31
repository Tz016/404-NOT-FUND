import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import 'element-plus/dist/index.css'
import mitt from 'mitt'

const emitter = mitt()
window.__PM_EMITTER__ = emitter // 挂到全局

createApp(App).use(router).use(ElementPlus).use(createPinia()).mount('#app')
