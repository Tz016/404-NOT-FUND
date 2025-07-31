<template>
  <div style="height: 100vh; box-shadow: var(--el-border-color-light) 0px 0px 10px">
    <el-splitter>
      <el-splitter-panel size="40%" min="40%">
        <div class="demo-panel">
          <AssetList :assets="filteredAssets" />
        </div>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <div class="demo-panel right-panel">
          <div class="top-box">
            <BalanceBox :balance="balance" />
            <Chart  :assets="filteredAssets" :balance="balance" />
          </div>
          <WatchList />
        </div>

      </el-splitter-panel>
    </el-splitter>
  </div>
</template>
<script setup>
import BalanceBox from './BalanceBox.vue'
import AssetList from './AssetList.vue'
import WatchList from './WatchList.vue'
import { ref, onMounted ,watch } from 'vue'
import Chart from './Chart.vue'
import axios from 'axios'
import { usePortfolioStore } from '../stores/portfolio'
import { storeToRefs } from 'pinia'
// const balance = ref(0) // 模拟账户余额，可以是后端数据
const filteredAssets = ref([]) // 模拟资产数据，可以是后端数据
const portfolioStore = usePortfolioStore()
const { balance, assets } = storeToRefs(portfolioStore) // 模拟账户余额，可以是后端数据

watch(assets, (newAssets) => {
  filteredAssets.value = newAssets
    .filter(item => item.which_table != '0')
    .map(item => ({
      code: item.symbol,
      name: item.symbol,
      price: item.last_price,
      quantity: item.shares,
      avgBuyPrice: item.ac_share,
      currency: 'USD',
      ...item
    }))
}, { immediate: true })
onMounted(async () => {
  await portfolioStore.fetchAssets(100023)
})
</script>
<style scoped>
body{
  overflow: hidden;
}
.demo-panel {
  display: flex;
  height: 100%;
  align-items: center;
  padding: 0;
  flex-direction: column
}

::v-deep(.el-splitter-bar__dragger-horizontal) {
  background-color: #5b5c5c !important;
  width: 6px !important;
  border-radius: 4px;
  cursor: col-resize;
}

::v-deep(.el-splitter-bar__trigger) {
  background-color: transparent !important;
}

::v-deep(.el-tabs__active-bar) {
  background-color: #ffd04b;
  /* 你想要的颜色 */
}

::v-deep(.el-tabs__item) {
  padding: 5px 5px 5px 5px;
  width: 65px;
  font-size: medium;
  font-weight: bold;
  transition: background-color 0.3s;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

::v-deep(.el-tabs__item:hover) {
  color: #ffd04b;
}

::v-deep(.el-tabs__item.is-active) {
  color: #ffd04b;
  border-radius: 6px 6px 0 0;
}

.right-panel {
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
  /* 整个右边面板还是上下排列 */
}

.top-box {
  display: flex;
  flex-direction: row;
  /* 让 BalanceBox 和 Chart 横着排列 */
  justify-content: space-between;
  /* 两边撑开 */
  align-items: center;
  /* 垂直居中 */
  width: 100%;
  gap: 16px;
  /* 两个组件之间的间距 */
}
</style>
