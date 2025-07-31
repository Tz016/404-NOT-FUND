<template>
  <div v-if="show" class="modal-overlay">
    <div class="modal-content">
      <div class="modal-header">
        <h2>Select Tickers to Add</h2>
        <div class="subtitle">Adding to My Watchlist</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input v-model="searchQuery" placeholder="Quote Lookup" />
      </div>
      <div class="tabs">
        <button v-for="tab in tabs"
                :key="tab"
                :class="{active: activeTab === tab}"
                @click="activeTab = tab">{{ tab }}</button>
      </div>
      <div v-if="errorMsg" style="color: red; margin-bottom: 10px;">{{ errorMsg }}</div>
      <div class="stock-list">
        <div v-for="stock in filteredStocks" :key="stock.symbol"
             :class="['stock-item', {selected: selectedStocks.some(s => s.symbol === stock.symbol)}]">
          <input type="checkbox"
                 :checked="selectedStocks.some(s => s.symbol === stock.symbol)"
                 @change="toggleSelect(stock)" />
          <span class="symbol">{{ stock.symbol }}</span>
          <span class="name">{{ stock.longName || stock.symbol }}</span>
          <span class="market">{{ stock.exchange }}</span>
          <span class="type">Equity</span>
        </div>
        <div v-if="isSearching" style="padding: 10px; color: #888;">搜索中...</div>
      </div>
      <div class="trending-link">
        <a href="#" style="color:#2c3e50;text-decoration:underline;">View All Trending Tickers →</a>
      </div>
      <button class="add-btn" :disabled="selectedStocks.length === 0" @click="addSelected">
        Add ticker
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
const props = defineProps({
  show: Boolean,
  stockOptions: Array,
  errorMsg: String,
  isSearching: Boolean,
  tabs: {
    type: Array,
    default: () => ['All', 'Stocks', "ETF's", 'Funds', 'Others']
  }
})
const emit = defineEmits(['close', 'add', 'search', 'tab'])
const searchQuery = ref('')
const activeTab = ref('All')
const selectedStocks = ref([])

watch(() => props.show, (val) => {
  if (val) {
    selectedStocks.value = []
    searchQuery.value = ''
    activeTab.value = 'All'
  }
})

watch(searchQuery, (val) => {
  emit('search', val)
})
watch(activeTab, (val) => {
  emit('tab', val)
})

const filteredStocks = computed(() => {
  if (activeTab.value === 'All') return props.stockOptions
  if (activeTab.value === 'Stocks') return props.stockOptions.filter(s => s.type === 'Equity' || !s.type)
  if (activeTab.value === "ETF's") return props.stockOptions.filter(s => s.type === 'ETF')
  if (activeTab.value === 'Funds') return props.stockOptions.filter(s => s.type === 'Fund')
  if (activeTab.value === 'Others') return props.stockOptions.filter(s => s.type && !['Equity','ETF','Fund'].includes(s.type))
  return props.stockOptions
})

function toggleSelect(stock) {
  const idx = selectedStocks.value.findIndex(s => s.symbol === stock.symbol)
  if (idx === -1) selectedStocks.value.push(stock)
  else selectedStocks.value.splice(idx, 1)
}
function addSelected() {
  emit('add', selectedStocks.value)
  selectedStocks.value = []
}
</script>

<style scoped>
/* 复用原有弹框样式 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.modal-content {
  background: #fff;
  border-radius: 12px;
  width: 420px;
  max-width: 95vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  padding: 0 0 20px 0;
  position: relative;
}
.modal-header {
  padding: 24px 24px 0 24px;
  position: relative;
}
.modal-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: bold;
}
.subtitle {
  color: #888;
  font-size: 1rem;
  margin-top: 4px;
  margin-bottom: 12px;
}
.close-btn {
  position: absolute;
  right: 18px;
  top: 18px;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #888;
  cursor: pointer;
}
.search-bar {
  display: flex;
  align-items: center;
  background: #f5f6fa;
  border-radius: 8px;
  margin: 0 24px 12px 24px;
  padding: 0 12px;
  height: 40px;
}
.search-bar .search-icon {
  font-size: 1.1rem;
  color: #aaa;
  margin-right: 8px;
}
.search-bar input {
  border: none;
  background: transparent;
  outline: none;
  font-size: 1rem;
  width: 100%;
  padding: 8px 0;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 0 24px 8px 24px;
}
.tabs button {
  background: none;
  border: none;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 1rem;
  color: #888;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.tabs button.active {
  background: #2c3e50;
  color: #fff;
  font-weight: bold;
}
.stock-list {
  max-height: 260px;
  overflow-y: auto;
  margin: 0 24px;
  border-bottom: 1px solid #eee;
}
.stock-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f2f2f2;
  cursor: pointer;
  transition: background 0.2s;
}
.stock-item:last-child {
  border-bottom: none;
}
.stock-item.selected {
  background: #f0f6ff;
}
.stock-item:hover {
  background: #f5faff;
}
.stock-item input[type="checkbox"] {
  margin-right: 12px;
}
.symbol {
  font-weight: bold;
  margin-right: 8px;
  min-width: 60px;
}
.name {
  flex: 1;
  color: #333;
  margin-right: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.market {
  color: #888;
  font-size: 0.95em;
  margin-right: 8px;
  min-width: 80px;
}
.type {
  color: #888;
  font-size: 0.95em;
  min-width: 60px;
}
.trending-link {
  margin: 12px 24px 0 24px;
  text-align: left;
}
.add-btn {
  width: calc(100% - 48px);
  margin: 18px 24px 0 24px;
  padding: 12px 0;
  background: #888;
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.add-btn:enabled {
  background: #2c3e50;
}
.add-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>