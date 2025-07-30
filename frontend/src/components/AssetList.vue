<template>
  <div class="asset-list">
    <el-tabs v-model="activeTab">
      <el-tab-pane label="Stock" name="stock">
        <AssetItem
            v-for="item in assets.stock"
            :key="item.bond_id || item.stock_id"
            :asset="item"
            @open="openItem(item, 'stock')"
          />
      </el-tab-pane>

      <el-tab-pane label="Bond" name="bond">
          <AssetItem
            v-for="item in assets.bond"
            :key="item.bond_id || item.stock_id"
            :asset="item"
            @open="openItem(item, 'bond')"
          />
      </el-tab-pane>
    </el-tabs>

    <!-- 控制 Item.vue 弹窗 -->
    <Item
      v-if="selectedItem"
      v-model:visible="showItem"
      :item="normalizedSelected"
      :type="selectedType"
      :is-asset="true"
      :inWatchlist="selectedItem.which_table != '1'"
      @trade="onTrade"
    />
  </div>
</template>


<script setup>
import { ref, computed, onUpdated } from 'vue'
import AssetItem from './AssetItem.vue'
import Item from './Item.vue' // 使用你增强后的版本（买/卖/收藏）
import {bonds} from '../data/bond.js' 

const activeTab = ref('stock')

const props = defineProps({
  assets: { type: Array, required: true } // which_table===2
});

const assets = computed(() => ({
  stock: props.assets,
  bond: bonds
}))


const showItem = ref(false)
const selectedItem = ref(null)
const selectedType = ref('stock')
const selectedKey = ref('')


// 点击行，打开弹窗（交给 Item 统一管理）
function openItem(item, type) {
  selectedItem.value = item
  selectedType.value = type
  selectedKey.value = keyOf(item, type)
  showItem.value = true
}

function keyOf(item, type) {
  // stock 用 name 作为 key；bond 用 name（这里是 'US10Y'）。可根据你的真实数据改成 code/ticker/bond_id
  return String(item?.name ?? '')
}

// 将你的简化资产结构映射为 Item.vue 期望的字段
const normalizedSelected = computed(() => {
  const it = selectedItem.value
  const t = selectedType.value
  if (!it) return null
  if (t === 'bond') {
    // bond: 让 name 同时作为 issuer 与 bond_id 的占位
    return {
      id: it.symbol,
      issuer: it.bond_name,
      name: it.bond_name,
      price: it.last_price,
      quantity: it.shares,           // Item.vue 会用 shares / quantity 作为持仓
      avgBuyPrice: it.ac_share,
      currency: 'USD',
      created_at: it.created_at,
    }
  } else {
    // stock
    return {
      code: it.stock_id||it.symbol,                 // 示例中你没有 code/ticker，先用 name 代替
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      avgBuyPrice: it.ac_share||it.avgBuyPrice,
      currency: 'USD'
    }
  }
})


function onTrade({ mode, qty }) {
  // 这里做本地乐观更新（真实项目里可等 API 返回成功后再更新）
  const it = selectedItem.value
  if (!it) return
  const current = Number(it.quantity || 0)
  if (mode === 'buy') it.quantity = current + qty
  if (mode === 'sell') it.quantity = Math.max(0, current - qty)
}
</script>

<style scoped>
.asset-list {
  padding: 1rem; /* 控制 AssetList 到 panel 的边距 */
  width: 90%;
  color: white;
}
</style>
