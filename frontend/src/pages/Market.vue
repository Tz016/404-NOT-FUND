<template>
    <div class="market-page">
        <!-- 顶部 -->
        <header class="topbar">
            <div class="title">Market</div>

            <!-- 搜索框 -->
            <el-autocomplete class="search" v-model="searchInput" :fetch-suggestions="fetchSuggestions"
                placeholder="Search symbol or name (e.g. AAPL / Apple)…" clearable :debounce="300"
                @select="onSelectSuggestion" @keydown.enter.prevent="onEnter">
                <template #prefix>
                    <el-icon>
                        <Search />
                    </el-icon>
                </template>
                <template #suffix>
                    <el-icon v-if="suggLoading">
                        <Loading />
                    </el-icon>
                </template>

                <template #default="{ item }">
                    <div class="sugg-row">
                        <span class="sugg-symbol">{{ item.symbol }}</span>
                        <span class="sugg-name">{{ item.name }}</span>
                        <span class="sugg-meta">{{ item.typeDisp }} · {{ item.exchDisp }}</span>
                    </div>
                </template>
            </el-autocomplete>
            <div class="winbox">
                <el-radio-group v-model="winKey" size="small" @change="onWindowChange">
                    <el-radio-button label="5m">5m</el-radio-button>
                    <el-radio-button label="15m">15m</el-radio-button>
                    <el-radio-button label="30m">30m</el-radio-button>
                    <el-radio-button label="60m">60m</el-radio-button>
                </el-radio-group>
            </div>
        </header>

        <!-- 内容 -->
        <main class="content">
            <!-- 骨架屏 -->
            <el-skeleton v-if="loading" animated :count="6">
                <template #template>
                    <div class="row">
                        <el-skeleton-item variant="text" style="width: 90px" />
                        <el-skeleton-item variant="text" style="width: 40%" />
                        <el-skeleton-item variant="text" style="width: 150px" />
                        <el-skeleton-item variant="text" style="width: 220px" />
                        <el-skeleton-item variant="text" style="width: 110px" />
                    </div>
                </template>
            </el-skeleton>

            <!-- 错误态 -->
            <el-alert v-else-if="error" :title="error" type="error" show-icon class="error" />

            <!-- 空态 -->
            <el-empty v-else-if="displayList.length === 0" description="No symbols to show." class="empty" />

            <!-- 列表 -->
            <transition-group name="fade" tag="div" class="list" v-else>
                <div v-for="(item, idx) in displayList" :key="item.symbol + '_' + idx" class="row"
                    :data-row-symbol="item.symbol" tabindex="0" @dblclick="openItem(item)"
                    @keyup.enter="openItem(item)">
                    <div class="cell symbol">
                        <div class="sym">{{ item.symbol }}</div>
                        <div class="exch">{{ item.exchange }}</div>
                    </div>

                    <div class="cell name ellipsis" :title="item.longName || item.symbol">
                        {{ item.longName || item.symbol }}
                    </div>

                    <!-- 迷你折线（D3 + Canvas） -->
                    <div class="cell spark">
                        <SparklineCanvas :series="marketStore.getSeries(item.symbol)" :width="400" :height="72"
                            :currency="item.currency || 'USD'" :rescaleKey="marketStore.winVersion" />


                    </div>

                    <div class="cell price">
                        <span class="price-num">
                            {{ formatCurrency(livePriceOf(item.symbol, item.regularMarketPrice), item.currency || 'USD')
                            }}
                        </span>
                        <el-tag size="small" class="cur-tag">{{ (item.currency || 'USD').toUpperCase() }}</el-tag>
                    </div>

                    <div class="cell action">
                        <el-button class="accent-btn" size="medium" @click.stop="openItem(item)">Details</el-button>
                    </div>
                </div>
            </transition-group>
        </main>

        <!-- 详情弹窗 -->
        <Item v-if="activeItem" v-model:visible="dialogVisible" :item="mappedActiveItem" :type="'stock'"
            :is-asset="inAsset" :in-watchlist="false" @close="onDialogClose" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import axios from 'axios'
import Item from '../components/Item.vue'
import SparklineCanvas from '../components/SparklineCanvas.vue'
import { Search, Loading } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

import { usePortfolioStore } from '../stores/portfolio'
import { useMarketStore } from '../stores/market'
import { useSocketStore } from '../stores/socket'
import { storeToRefs } from 'pinia'

const portfolioStore = usePortfolioStore()
const { assets } = storeToRefs(portfolioStore)

const marketStore = useMarketStore()
const socketStore = useSocketStore()


const API_BASE = 'https://981c4eefa734.ngrok-free.app'

const searchInput = ref('')
const suggLoading = ref(false)

const dialogVisible = ref(false)
const activeItem = ref(null)
const inAsset = ref(false)

// 从 store 读状态
const loading = computed(() => marketStore.loading)
const error = computed(() => marketStore.error)
const popular = computed(() => marketStore.popular)
const displayList = computed(() => popular.value)
import { useMockTicker } from '../mock/useMockTicker'
const WIN_STORAGE_KEY = 'market_spark_window_key'
const WINDOW_MAP = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '30m': 30 * 60 * 1000,
    '60m': 60 * 60 * 1000,
}
const DEFAULT_WIN_KEY = '15m'

// 绑定到控件的值
const winKey = ref(DEFAULT_WIN_KEY)

// 初始化：读取本地偏好 -> 同步到 store（会立即裁剪现有序列）
function initWindowPref() {
    const saved = localStorage.getItem(WIN_STORAGE_KEY)
    const key = (saved && WINDOW_MAP[saved]) ? saved : DEFAULT_WIN_KEY
    winKey.value = key
    marketStore.setWindowMs(WINDOW_MAP[key])
}

// 切换事件：更新 store + 持久化
function onWindowChange(val) {
    const ms = WINDOW_MAP[val] ?? WINDOW_MAP[DEFAULT_WIN_KEY]
    marketStore.setWindowMs(ms)
    localStorage.setItem(WIN_STORAGE_KEY, val)
}
const USE_MOCK = true

// 实时价格优先
function livePriceOf(sym, fallback) {
    return socketStore.prices.get(sym) ?? fallback ?? null
}

onMounted(async () => {
    // 命中缓存秒开 + 后台刷新（SWR）
    await marketStore.prefetchPopular(50)
    initWindowPref()
    popular.value.forEach(it => socketStore.subscribe(it.symbol))
})

onBeforeUnmount(() => {
    // 退订
    popular.value.forEach(it => socketStore.unsubscribe(it.symbol))
})

// 将 socket 最新价推进 spark 数据，驱动小折线动画
watch(() => socketStore.prices, (map) => {
    map.forEach((price, symbol) => {
        marketStore.pushTick(symbol, price) // 由 store 内部按 windowMs 裁剪
    })
}, { deep: true })


// ---- 搜索建议 ----
async function fetchSuggestions(queryString, cb) {
    if (!queryString) return cb([])
    suggLoading.value = true
    try {

        const { data } = await axios.get(`${API_BASE}/stocks/search`, { params: { query: queryString } ,
        headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })

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
    const found = popular.value.find(x => x.symbol === sugg.symbol)
    openItem(found || sugg)
}
function onEnter() {
    const q = searchInput.value.trim().toUpperCase()
    if (!q) return
    const hit = popular.value.find(x => x.symbol.toUpperCase() === q)
    if (hit) openItem(hit)
}

function openItem(item) {
    activeItem.value = item
    dialogVisible.value = true
}
function onDialogClose() { }

function formatCurrency(val, cur = 'USD') {
    if (val == null) return '—'
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val)
    } catch {
        return String(val)
    }
}

// 详情映射（保留你的资产合并逻辑）
const mappedActiveItem = computed(() => {
    if (!activeItem.value) return null
    const it = activeItem.value
    const info = assets.value.find(item => item.symbol == it.symbol)
    if (info && info.which_table != '0') inAsset.value = true
    else inAsset.value = false
    const last = livePriceOf(it.symbol, it.regularMarketPrice)
    return {
        code: it.symbol,
        symbol: it.symbol,
        name: it.longName || it.symbol,
        price: last,
        currency: it.currency || 'USD',
        ...it,
        shares: info ? info.shares : null,       // 持仓
        ac_share: info ? info.ac_share : null,   // 均价
        which_table: info ? info.which_table : null,
        total_cost: info ? info.total_cost : null,
        created_at: info ? info.created_at : new Date().toISOString().split('.')[0],
        last_price: last,
        watch_id: info ? info.watch_id || info.id : null,
    }
})


let stopMock = null

onMounted(async () => {
    await marketStore.prefetchPopular(50)

    // 真实环境：正常订阅 socket
    if (!USE_MOCK) {
        popular.value.forEach(it => socketStore.subscribe(it.symbol))
    } else {
        // 本地无后端：用模拟器往 socket/prices 和 spark 里喂数据
        const syms = popular.value.map(it => it.symbol)
        stopMock = useMockTicker({ marketStore, socketStore, symbols: syms, intervalMs: 800 })
    }
})

onBeforeUnmount(() => {
    if (!USE_MOCK) {
        popular.value.forEach(it => socketStore.unsubscribe(it.symbol))
    }
    if (stopMock) stopMock()
})
</script>

<style>
:root {
    --accent: #ffd04b;
    --accent-ink: #111111;
    --bg: #0b0b0c;
    --surface: #121213;
    --surface-2: #17181a;
    --fg: #ffffff;
    --fg-strong: #ffffff;
    --muted: #d2d5db;
    --border: #2a2a2a;
    --el-color-primary: var(--accent);
}
</style>

<style scoped>
/* ========================
 *  Theme tokens
 * ======================== */
:root {
    /* Brand */
    --accent: #ffd04b;
    --accent-ink: #111111;
    /* 主题黄上的文字色 */
    /* Base */
    --bg: #0e0e0f;
    --surface: #151516;
    --surface-2: #1b1c1d;
    --fg: #ffffff;
    --muted: #b4b6bc;
    --border: rgba(255, 255, 255, 0.08);
    --shadow: 0 6px 24px rgba(0, 0, 0, 0.35);

    /* 同步 Element Plus 主色 */
    --el-color-primary: var(--accent);
}

/* ========================
 *  Page
 * ======================== */
.market-page {
    background: var(--bg);
    min-height: 100%;
    padding: 20px;
    color: var(--fg);
    font-weight: 500;
}

/* ========================
 *  Topbar
 * ======================== */
.topbar {
    display: grid;
    grid-template-columns: 160px 1fr auto;
    /* 标题 | 搜索 | 时间窗 */
    gap: 12px;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(255, 208, 75, 0.05) 0%, transparent 60%);
}

.title {
    font-size: 22px;
    font-weight: 900;
    letter-spacing: .2px;
    color: var(--fg);
    text-shadow: 0 0 12px rgba(255, 208, 75, 0.18);
}

.search {
    width: 100%;
    color: var(--fg);
}

/* 搜索输入视觉（Element Plus 覆盖） */
:deep(.el-input__wrapper) {
    background: var(--surface) !important;
    border: 1px solid var(--border) !important;
    box-shadow: none !important;
}

:deep(.el-input__wrapper.is-focus) {
    border: 1px solid var(--accent) !important;
    box-shadow: 0 0 0 3px rgba(255, 208, 75, 0.18) !important;
}

:deep(.el-input__inner) {
    color: var(--fg) !important;
    caret-color: var(--accent) !important;
}

/* 搜索建议行 */
:deep(.el-autocomplete-suggestion li) {
    background: var(--surface-2);
    color: var(--fg);
}

:deep(.el-autocomplete-suggestion li:hover) {
    background: rgba(255, 208, 75, 0.08);
}

.sugg-row {
    display: grid;
    grid-template-columns: 96px 1fr auto;
    gap: 8px;
    align-items: center;
}

.sugg-symbol {
    font-weight: 800;
    color: var(--fg);
}

.sugg-name {
    color: #e6e7ea;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.sugg-meta {
    color: var(--muted);
    font-size: 12px;
}

/* ========================
 *  Time Window segmented control
 * ======================== */
.winbox {
    display: flex;
    justify-content: flex-end;
}

/* group 外容器带底色和圆角，做分段控件的外框 */
.winbox :deep(.el-radio-group) {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px;
    display: inline-flex;
    gap: 0;
    box-shadow: var(--shadow);
}

/* 默认按钮样式 */
.winbox :deep(.el-radio-button),
.winbox :deep(.el-radio-button__inner) {
    border: none !important;
    background: transparent !important;
    color: var(--fg) !important;
    font-weight: 700;
    border-radius: 999px !important;
    padding: 6px 14px !important;
    line-height: 1 !important;
}

/* hover */
.winbox :deep(.el-radio-button__inner:hover) {
    background: rgba(255, 208, 75, 0.10) !important;
}

/* 选中态 */
.winbox :deep(.is-active .el-radio-button__inner),
.winbox :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
    background: var(--accent) !important;
    color: var(--accent-ink) !important;
    box-shadow: 0 2px 10px rgba(255, 208, 75, 0.35) inset, 0 2px 10px rgba(255, 208, 75, 0.25);
}

/* 焦点可达性 */
.winbox :deep(.el-radio-button__inner:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    border-radius: 999px;
}

/* 小屏堆叠 */
@media (max-width: 900px) {
    .topbar {
        grid-template-columns: 1fr;
    }

    .title {
        margin-bottom: 6px;
    }

    .winbox {
        justify-content: flex-start;
    }
}

/* ========================
 *  List
 * ======================== */
.list {
    display: flex;
    flex-direction: column;
}

.row {
    display: grid;
    /* symbol | name | spark | price | action */
grid-template-columns:
  minmax(9ch, 12ch)           /* symbol：按字符宽度，保 4~6 字母 + 交易所缩写 */
  1fr                         /* name：吃剩余空间 */
  clamp(12rem, 24vw, 24rem)   /* spark：在 12rem 和 18rem 之间随视口变化 */
  clamp(10rem, 18vw, 16rem)   /* price：给价格+货币标签足够空间 */
  fit-content(clamp(7rem, 10vw, 15rem)); /* action：按钮区域，最多 8rem */

    gap: 14px;
    align-items: center;
    padding: 16px 14px;
    border-bottom: 1px solid var(--border);
    transition: background 0.18s ease, transform 0.08s ease;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.02), rgba(255, 255, 255, 0.012));
}

.row:hover {
    background: linear-gradient(180deg, rgba(255, 208, 75, 0.08), rgba(255, 208, 75, 0.04));
    transform: translateY(-1px);
}

.row:focus-within {
    outline: 2px solid rgba(255, 208, 75, 0.25);
    outline-offset: -2px;
}

/* cells */
.cell.symbol .sym {
    font-weight: 900;
    color: var(--fg);
}

.cell.symbol .exch {
    font-size: 12px;
    color: var(--muted);
}

.cell.name {
    color: #f0f1f4;
}

.ellipsis {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

/* Sparkline 采用主题色（组件用 currentColor 绘制） */
.cell.spark {

    color: var(--accent);
}

/* Price 区 */
.cell.price {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 3vw;
    gap: 10px;
    color: var(--fg);
}

.price-num {
    font-weight: 900;
    letter-spacing: .2px;
}

/* 货币 Tag */
.cur-tag {
    background: rgba(255, 208, 75, 0.14);
    color: var(--accent);
    border: 1px solid rgba(255, 208, 75, 0.38);
    font-weight: 700;
}

/* CTA 按钮统一主题黄 */
.accent-btn {
    background: var(--accent) !important;
    color: var(--accent-ink) !important;
    border-radius: 999px !important;
    font-weight: 800 !important;
    border: none !important;
    margin-left: 5vw;
    padding: 10px 20px !important;
    box-shadow: 0 8px 20px rgba(255, 208, 75, 0.25);
}

.accent-btn:hover {
    filter: brightness(0.96);
    transform: translateY(-1px);
}

.accent-btn:active {
    transform: translateY(0);
    box-shadow: 0 4px 12px rgba(255, 208, 75, 0.2);
}

/* Skeleton / 空态 / 错误统一背景 */
:deep(.el-skeleton) {
    --el-skeleton-color: var(--surface-2);
}

.error {
    background: rgba(255, 71, 87, 0.08);
    border: 1px solid rgba(255, 71, 87, 0.3);
}

.empty {
    --el-text-color-regular: var(--muted);
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
    transition: all 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(6px);
}
</style>
