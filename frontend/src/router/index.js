import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Market from '../pages/Market.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/market', component: Market },
//   { path: '/chart', component: Chart }
]

export default createRouter({
  history: createWebHistory(),
  routes
})
