import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'


const routes = [
  { path: '/', component: Home },
//   { path: '/add', component: Add },
//   { path: '/chart', component: Chart }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
