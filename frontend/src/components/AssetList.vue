<template>
  <div class="asset-list">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Stock" name="stock">
        <AssetItem
          v-for="(item, index) in assets.stock"
          :key="'stock-' + index"
          :asset="item"
        />
      </el-tab-pane>
      <el-tab-pane label="Bond" name="bond">
        <AssetItem
          v-for="(item, index) in assets.bond"
          :key="'bond-' + index"
          :asset="item"
        />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AssetItem from './AssetItem.vue'

const activeTab = ref('stock')

const assets = {
  stock: [
    { name: 'AAPL', price: 189.23, quantity: 10, avgBuyPrice: 180.0 },
    { name: 'TSLA', price: 254.11, quantity: 5, avgBuyPrice: 240.0 }
  ],
  bond: [
    { name: 'US10Y', price: 99.5, quantity: 20, avgBuyPrice: 98.0 }
  ]
}
</script>

<style scoped>
.asset-list {
  padding: 1rem; /* 控制 AssetList 到 panel 的边距 */
  width:90%;
  color:white;
}
::v-deep(.el-tabs__item) {
  padding: 5px 5px 5px 5px;
  width:65px;
  font-size: large;
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
  background-color: #ffd04b;
  color: #000;
  border-radius: 6px 6px 0 0;
}

</style>
