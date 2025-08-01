import { createRouter, createWebHistory,createWebHashHistory  } from 'vue-router'
import Home from '../pages/Home.vue'
import Market from '../pages/Market.vue'
import Transactions from '../pages/Transactions.vue'
const routes = [
  { path: '/', component: Home },
  { path: '/market', component: Market },
  { path: '/transactions', component: Transactions }
]

export default createRouter({
  history: createWebHashHistory(),
  routes
})
