<template>
  <div class="home-container">
    <!-- 💰 Balance -->
    <!-- <BalanceBox :balance="balance" /> -->

    <!-- 📑 Asset Tabs -->
    <HomeAsset :assets="assets"/>

    <!-- <PieChart :chartData="chartData" />

    <WatchlistTable :watchlist="watchlist" /> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import HomeAsset from '../components/HomeAsset.vue'
// import BalanceBox from '../components/BalanceBox.vue'
// import Tabs from '../components/Tabs.vue'
// import PieChart from '../components/PieChart.vue'
// import WatchlistTable from '../components/WatchlistTable.vue'

// import { getPortfolio, getPieData, getWatchlist } from '../api/portfolio'

const assets = ref([])
const balance = ref(0)
const chartData = ref([])
const watchlist = ref([])

async function load() {
  const res = await getPortfolio()

  assets.value = res.data
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
.home-container{
  padding: 20px;
}
</style>
