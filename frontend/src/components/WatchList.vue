<template>
  <div class="watchlist">
    <h2 @click="toggleWatchlist" style="cursor: pointer; font-size: 1.2rem;">
      Watchlist
      <span class="arrow" v-if="isCollapsed">▶</span>
      <span class="arrow" v-else>▼</span>
    </h2>

    <transition name="slide-fade">
      <div class="watchlist-content" v-if="!isCollapsed">
        <div class="watchlist-tabs">
          <el-tabs v-model="activeTab">
            <!-- Stock -->
            <el-tab-pane label="Stock" name="stock">
              <transition-group name="list" tag="div">

                <div v-for="item in filteredAssets.stock" :key="'s-' + item.code" class="watch-item"
                  @click="openItemDialog(item, 'stock')" :class="{ active: isActive(item) }">

                  <div class="info">
                    <p><strong>{{ item.code }}</strong></p>
                  </div>

                  <!-- ⭐ 星星图标 -->

                  <el-icon class="star-icon" @click.stop="toggleWatchlistItem(item, 'stock')">
                    <component :is="isInWatchlist(item) ? StarFilled : Star" />
                  </el-icon>
                </div>

                <el-button class="add-btn" type="primary" size="medium" @click="goToMarket" color="#ffd04b">+
                  Add</el-button>

              </transition-group>
            </el-tab-pane>

            <!-- Bond -->
            <el-tab-pane label="Bond" name="bond">
              <transition-group name="list" tag="div">

                <div v-for="item in filteredAssets.bond" :key="'b-' + item.code" class="watch-item"
                  @click="openItemDialog(item, 'bond')" :class="{ active: isActive(item) }">
                  <div class="info">
                    <p><strong>{{ item.code }}</strong> - {{ item.name }}</p>
                  </div>
                  <el-icon class="star-icon" @click.stop="toggleWatchlistItem(item, 'bond')">
                    <component :is="isInWatchlist(item) ? StarFilled : Star" />
                  </el-icon>
                </div>

                <el-button type="primary" size="medium" @click="goToMarket" color="#ffd04b">+ Add</el-button>

              </transition-group>
            </el-tab-pane>

            <!-- 搜索框 -->
            <el-tab-pane name="search" disabled>
              <template #label>

                <el-input v-model="searchQuery" placeholder="Search by code..." size="small" clearable
                  style="width: 180px; margin-left: 20px;" />

              </template>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </transition>


    <Item v-if="selectedItem" v-model:visible="showItem" :item="normalizedSelected" :type="selectedType"
      :is-asset="true" :in-watchlist="true" @watchlist-change="onWatchlistChange" @trade="onTrade"
      @close="clearActive" />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Item from './Item.vue'
import { StarFilled, Star } from '@element-plus/icons-vue'
import { usePortfolioStore } from '../stores/portfolio'
import { storeToRefs } from 'pinia'

const portfolioStore = usePortfolioStore()
const { assets } = storeToRefs(portfolioStore)

const router = useRouter()
const activeTab = ref('stock')
const searchQuery = ref('')
const selectedItem = ref(null)
const selectedType = ref(null)
const selectedKey = ref(null)
const showItem = ref(false)
const isCollapsed = ref(true)

// watchlist 数据
const watchlist = ref({
  stock: [],
  bond: []
})

// 初始化 watchlist 数据
watch(
  assets,
  (newAssets) => {
    watchlist.value.stock = newAssets.filter(item => item.which_table != '1').map((item) => ({
      code: item.symbol,
      name: item.symbol,
      price: item.last_price,
      quantity: item.shares,
      avgBuyPrice: item.ac_share,

      watch_id: item.watch_id || item.id,

      which_table: item.which_table,
      ...item
    }))
  },
  { immediate: true }
)

function toggleWatchlist() {
  isCollapsed.value = !isCollapsed.value
}

function goToMarket() {
  router.push('/market')
}

function clearActive() {
  selectedItem.value = null
  selectedType.value = null
  selectedKey.value = null
}

function openItemDialog(item, type) {
  selectedItem.value = item
  selectedType.value = type
  selectedKey.value = `${type}-${item.code}`
  showItem.value = true
}

function isActive(item) {
  return selectedItem.value?.code === item.code
}

function isInWatchlist(item) {
  // which_table = 0 或 2 表示在 watchlist
  return item.which_table == '0' || item.which_table == '2'
}

/**
 * ⭐ 切换 watchlist（新增/删除）
 */
async function toggleWatchlistItem(item, type) {

  let res;
  try {
    if (isInWatchlist(item)) {
      // 删除
      res = await axios.put('https://981c4eefa734.ngrok-free.app/watchlist/delete', {

        watchId: item.id,
        which_table: '0',
        accountId: 100023,
        symbol: item.code


      },{headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })
    } else {
      // 新增
      res = await axios.post('https://981c4eefa734.ngrok-free.app/watchlist/add', {
        accountId: 100023,
        which_table: '0',
        symbol: item.code
      }, {
        headers: {
          'ngrok-skip-browser-warning': 'true',
          'Accept': 'application/json'
        }
        }

      )
    }
    // 刷新 portfolio 数据
    if (res.data.success) {
      await portfolioStore.refreshPortfolio(100023)

    }
  } catch (error) {
    console.error('更新 watchlist 出错：', error)
  }
}

const filteredAssets = computed(() => ({
  stock: watchlist.value.stock.filter((item) =>
    item.code.toLowerCase().includes(searchQuery.value.toLowerCase())
  ),
  bond: watchlist.value.bond.filter((item) =>
    item.code.toLowerCase().includes(searchQuery.value.toLowerCase())
  )
}))

const normalizedSelected = computed(() => {
  const it = selectedItem.value
  const t = selectedType.value
  if (!it) return null
  return {
    id: it.symbol,
    issuer: t === 'bond' ? it.bond_name : it.stock_name,
    name: t === 'bond' ? it.bond_name : it.stock_name,
    price: it.last_price,
    quantity: it.shares,
    avgBuyPrice: it.ac_share,
    currency: 'USD',
    created_at: it.created_at,
    watch_id: it.watch_id || it.id,
    which_table: it.which_table, // 0: watchlist, 1: asset, 2: both
    ...it
  }
})

onMounted(async () => {
  await portfolioStore.fetchAssets(100023)
})
</script>

<style scoped>
.watchlist {
  position: relative;
  display: block;
  width: 100%;
  padding: 0.5rem;
  color: white;
  margin-top: 8vh;
  margin-left: 12vw;
}

.watchlist-tabs {
  left: 0;
  width: 70%;
}

.watch-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.4rem 0.8rem;
  margin-bottom: 0.4rem;
  background-color: transparent;
  border-radius: 6px;
  transition: background-color 0.3s;
  cursor: pointer;
  width: 100%;
}

.watch-item:hover {
  background-color: #ffd04b;
}


.watch-item:hover .star-icon {
  color: white;
}


.watch-item.active {
  background-color: #ffd04b;
  border-radius: 4px;
  padding: 0.2rem;
  color: #000;
}

.star-icon {
  font-size: 1.5rem;
  margin-right: 3rem;
  cursor: pointer;
  color: #ffd04b;
  transition: transform 0.15s ease, color 0.15s ease;
}

.star-icon:hover {
  transform: scale(1.2);
  color: white;
}


::v-deep(.el-tabs__item) {
  width: auto !important;
  /* 自动宽度 */
  min-width: unset !important;
  /* 取消默认最小宽度 */
  padding: 0 12px;
  /* 自己控制 padding */
  margin-left: 8px;
  ;
}

.arrow:hover {
  font-weight: bolder;
}

</style>
