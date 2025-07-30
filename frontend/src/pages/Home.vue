<template>
  <div class="home">
    <template v-if="!auth.isLoggedIn">
      <div class="login-prompt">
        <h2>Please log in to continue</h2>
        <p>You need to be signed in to view your personalized Home.</p>
        <el-button class="big-btn" type="primary" size="large" @click="openLogin" style="background-color: #ffd04b; border-color: #ffd04b;">Login</el-button>
      </div>
    </template>
    <template v-else>
      
      <div class="home-container">
        <!-- 💰 Balance -->
        <!-- <BalanceBox :balance="balance" /> -->

        <!-- 📑 Asset Tabs -->
        <HomeAsset :assets="assets" />

        <!-- <PieChart :chartData="chartData" />

    <WatchlistTable :watchlist="watchlist" /> -->
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import HomeAsset from '../components/HomeAsset.vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const assets = ref([])
const balance = ref(0)
const chartData = ref([])
const watchlist = ref([])

import mitt from 'mitt'
const emitter = mitt()
window.__PM_EMITTER__ = window.__PM_EMITTER__ || emitter

function openLogin() {
  // 触发一个事件，让 App.vue 打开 Drawer
  window.__PM_EMITTER__?.emit('open-auth-drawer')
}
async function load() {
  // const res = await getPortfolio()

  // assets.value = res.data
  //   balance.value = res.data
  //     .filter(a => a.type === 'cash')
  //     .reduce((sum, a) => sum + (a.quantity || 0), 0)

  //   const pie = await getPieData()
  //   chartData.value = pie.data

  //   const wl = await getWatchlist()
  //   watchlist.value = wl.data
}

onMounted(load)
</script>

<style scoped>
.home-container {
  padding: 20px;
}
.login-prompt {
  text-align: center;
  padding: 80px 20px;
  background: rgba(255,255,255,0.20);
  color:#111111;
  border-radius: 12px;
}

.big-btn {
  background-color: #ffd04b;
  border-color: #ffd04b;
  margin-top:10px;
  padding: 20px 32px;    /* 按钮高度 & 宽度 */
  font-size: 1.3rem;       /* 字体更大 */
  border-radius: 8px;    /* 圆角可调 */
}

</style>
