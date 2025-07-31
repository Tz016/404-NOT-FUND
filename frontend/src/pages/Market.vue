<template>
  <div class="market-page">
    <!-- 顶部 -->
    <header class="topbar">
      <div class="title">Market</div>

      <!-- 搜索框 -->
      <el-autocomplete
        class="search"
        v-model="searchInput"
        :fetch-suggestions="fetchSuggestions"
        placeholder="Search symbol or name (e.g. AAPL / Apple)…"
        clearable
        :debounce="300"
        @select="onSelectSuggestion"
        @keydown.enter.prevent="onEnter"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #suffix>
          <el-icon v-if="suggLoading"><Loading /></el-icon>
        </template>

        <template #default="{ item }">
          <div class="sugg-row">
            <span class="sugg-symbol">{{ item.symbol }}</span>
            <span class="sugg-name">{{ item.name }}</span>
            <span class="sugg-meta">{{ item.typeDisp }} · {{ item.exchDisp }}</span>
          </div>
        </template>
      </el-autocomplete>
    </header>

    <!-- 内容 -->
    <main class="content">
      <!-- 骨架屏 -->
      <el-skeleton v-if="loading" animated :count="6">
        <template #template>
          <div class="row">
            <el-skeleton-item variant="text" style="width: 90px" />
            <el-skeleton-item variant="text" style="width: 40%" />
            <el-skeleton-item variant="text" style="width: 80px" />
            <el-skeleton-item variant="text" style="width: 110px" />
          </div>
        </template>
      </el-skeleton>

      <!-- 错误态 -->
      <el-alert
        v-else-if="error"
        :title="error"
        type="error"
        show-icon
        class="error"
      />

      <!-- 空态 -->
      <el-empty
        v-else-if="displayList.length === 0"
        description="No symbols to show."
        class="empty"
      />

      <!-- 列表 -->
      <transition-group name="fade" tag="div" class="list" v-else>
        <div
          v-for="(item, idx) in displayList"
          :key="item.symbol + '_' + idx"
          class="row"
          tabindex="0"
          @dblclick="openItem(item)"
          @keyup.enter="openItem(item)"
        >
          <div class="cell symbol">
            <div class="sym">{{ item.symbol }}</div>
            <div class="exch">{{ item.exchange }}</div>
          </div>

          <div class="cell name ellipsis" :title="item.longName || item.symbol">
            {{ item.longName || item.symbol }}
          </div>

          <div class="cell price">
            <span class="price-num">{{ formatCurrency(item.regularMarketPrice, item.currency) }}</span>
            <el-tag size="small" class="cur-tag">{{ (item.currency || 'USD').toUpperCase() }}</el-tag>
          </div>

          <div class="cell action">
            <el-button class="accent-btn" size="medium" @click.stop="openItem(item)">Details</el-button>
          </div>
        </div>
      </transition-group>
    </main>

    <!-- 详情弹窗 -->
    <Item
      v-if="activeItem"
      v-model:visible="dialogVisible"
      :item="mappedActiveItem"
      :type="'stock'"
      :is-asset="inAsset"
      :in-watchlist="inWatchlist"
      @close="onDialogClose"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Item from '../components/Item.vue'
import { Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePortfolioStore } from '../stores/portfolio'
import { storeToRefs } from 'pinia'

const portfolioStore = usePortfolioStore()
const { assets } = storeToRefs(portfolioStore)
const API_BASE = 'http://localhost:3000'
const searchInput = ref('')
const suggLoading = ref(false)

const loading = ref(true)
const error = ref('')
const popularRaw = ref([])

const dialogVisible = ref(false)
const activeItem = ref(null)
const inAsset = ref(false)
async function fetchPopular() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axios.get(`${API_BASE}/stocks/popular?n=50`)
    popularRaw.value = Array.isArray(data) ? data : []
  } catch (e) {
    error.value = 'Failed to load popular stocks.'
  } finally {
    loading.value = false
  }
}

async function fetchSuggestions(queryString, cb) {
  if (!queryString) return cb([])
  suggLoading.value = true
  try {
    const { data } = await axios.get(`${API_BASE}/stocks/search`, { params: { query: queryString } })
    const mapped = (Array.isArray(data) ? data : [])
      .filter(x => x.symbol)
      .slice(0, 12)
      .map(x => ({
        symbol: x.symbol,
        name: x.longname || x.shortname || x.symbol,
        typeDisp: x.typeDisp || x.quoteType || '—',
        exchDisp: x.exchDisp || x.exchange || '—'
      }))
    cb(mapped)
  } catch (e) {
    cb([])
  } finally {
    suggLoading.value = false
  }
}

function onSelectSuggestion(sugg) {
  if (!sugg) return
  const found = popularRaw.value.find(x => x.symbol === sugg.symbol)
  openItem(found || sugg)
}
function onEnter() {
  const q = searchInput.value.trim().toUpperCase()
  if (!q) return
  const hit = popularRaw.value.find(x => x.symbol.toUpperCase() === q)
  if (hit) openItem(hit)
}

function openItem(item) {
  activeItem.value = item
  dialogVisible.value = true
}
function onDialogClose() {}

const displayList = computed(() => popularRaw.value)
function formatCurrency(val, cur = 'USD') {
  if (val == null) return '—'
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val)
}
const mappedActiveItem = computed(() => {
  if (!activeItem.value) return null
  const it = activeItem.value
  const info=assets.value.find(item =>
    item.symbol == it.symbol
  )
  if (info && info.which_table != '0') {
    inAsset.value = true
  }else{
    inAsset.value = false
  }
  return {
    code: it.symbol,
    symbol: it.symbol,
    name: it.longName || it.symbol,
    price: it.regularMarketPrice,
    currency: it.currency || 'USD',
    ...it,
    shares: info ? info.shares : null, // 从资产中获取持仓
    ac_share: info ? info.ac_share : null, // 平均买入价
    which_table: info ? info.which_table : null ,
    total_cost: info ? info.total_cost : null, // 总成本
    created_at: info ? info.created_at : new Date().toISOString().split('.')[0], // 创建时间
    last_price: it.regularMarketPrice, // 最新价格

  }
})

onMounted(fetchPopular)
</script>

<style scoped>
:root {
  --accent: #ffd04b;
  --bg: #111111;
  --fg: #ffffff;
  --muted: #9aa0a6;
  --border: #262626;
}

/* 整体 */
.market-page {
  background: var(--bg);
  min-height: 100%;
  padding: 20px;
  color: var(--fg);
}

/* 顶部 */
.topbar {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
  background: linear-gradient(to bottom, #181818, transparent);
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border);
}
.title {
  font-size: 22px;
  font-weight: 800;
  color:#ffffff;
  text-shadow: #ffd04b 0px 0px 3px ;
}
.search {
  width: 100%;
  color: white;
}

/* 搜索框聚焦 glow */
:deep(.el-input__wrapper) {
  background: #151515 !important;
  border: 1px solid var(--border) !important;
}
:deep(.el-input__wrapper.is-focus) {
  border: 1px solid var(--accent) !important;
  box-shadow: 0 0 10px rgba(255, 208, 75, 0.3);
}
:deep(.el-input__inner) {
  color: #ffffff !important;       /* 白色文字 */
  caret-color: #ffd04b !important; /* 光标颜色：主题色 */
}

/* 列表样式 */
.list {
  display: flex;
  flex-direction: column;
}
.row {
  display: grid;
  grid-template-columns: 170px 1fr 220px 120px;
  gap: 12px;
  align-items: center;
  padding: 14px 12px;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s ease, transform 0.1s ease;
}
.row:hover {
  background: radial-gradient(circle, rgba(255, 208, 75, 0.05) 0%, #141414 100%);
  transform: translateY(-1px);
}
.cell.symbol .sym {
  font-weight: 800;
  color:#ffffff;
}
.cell.symbol .exch {
  font-size: 12px;
  color: white;

}
.cell.name {
  color: #eaeaea;
}
.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.cell.price {
  display: flex;
  align-items: center;
  gap: 8px;
  color:#ffffff;
}
.price-num {
  font-weight: 800;
}
.cur-tag {
  background: rgba(255, 208, 75, 0.12);
  color: var(--accent);
  border: 1px solid rgba(255, 208, 75, 0.35);
}

/* 按钮 */
.accent-btn {
  background: var(--accent) !important;
  color: #ffffff !important;
  border-radius: 999px !important;
  font-weight: 700 !important;
}
.accent-btn:hover {
  filter: brightness(0.92);
}

/* 过渡动画 */
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
