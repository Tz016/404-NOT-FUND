<template>
    <div class="transactions-page">
        <!-- 未登录提示：参考你的 Home 页交互 -->
        <template v-if="!auth.isLoggedIn">
            <div class="login-prompt">
                <h2>Please log in to continue</h2>
                <p>You need to be signed in to view your Transactions.</p>
                <el-button class="big-btn" type="primary" size="large" @click="openLogin"
                    style="background-color:#ffd04b;border-color:#ffd04b;">
                    Login
                </el-button>
            </div>
        </template>

        <template v-else>
            <div>
                <nav class="navbar">
                    <div class="navbar-logo">Detailed Report</div>
                    <div class="navbar-actions">
                        <!-- 可加登录/设置等 -->
                    </div>
                </nav>
                <div class="main-container">
                    <div class="header">
                        <div class="tabs">
                            <button class="tab active">Holdings</button>
                        </div>
                        <button class="add-tickers-btn" @click="openStockSelectModal">Add tickers</button>
                    </div>
                    <HoldingsTable :watchlist="watchlist" @add-share="handleAddShare" />
                    <AddTickerModal :show="showStockSelectModal" :stockOptions="stockOptions" :errorMsg="errorMsg"
                        :isSearching="isSearching" @close="showStockSelectModal = false" @add="handleAddStocks"
                        @search="handleSearch" />
                    <AddShareForm v-if="showAddForm" :symbol="addFormSymbol" :initPrice="addFormInitPrice"
                        @confirm="handleAddShareConfirm" @cancel="showAddForm = false" />
                    <!-- 数据分析图表 -->
                    <AnalysisCharts />
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>

import { ref, reactive, onMounted, watch, watchEffect } from 'vue'
import { useAuthStore } from '../stores/auth'


/** 登录相关，与 Home 页统一：点击 Login 触发全局 emitter 打开登录抽屉 */
const auth = useAuthStore()
function openLogin() {
    window.__PM_EMITTER__?.emit('open-auth-drawer')
}

import HoldingsTable from '../components/HoldingsTable.vue'
import AddTickerModal from '../components/AddTickerModal.vue'
import AddShareForm from '../components/AddShareForm.vue'
import { io } from 'socket.io-client'
import AnalysisCharts from '../components/AnalysisCharts.vue'

// 主业务状态
const watchlist = reactive([])
const showStockSelectModal = ref(false)
const stockOptions = ref([])
const errorMsg = ref('')
const isSearching = ref(false)

// 热门股票缓存
const HOT_KEY = 'hotStocksCache'
const HOT_TTL = 60 * 60 * 1000 // 1小时
function getCachedHotStocks() {
    const cache = localStorage.getItem(HOT_KEY)
    if (!cache) return null
    try {
        const { data, time } = JSON.parse(cache)
        if (Date.now() - time < HOT_TTL) return data
    } catch { }
    return null
}
function setCachedHotStocks(data) {
    localStorage.setItem(HOT_KEY, JSON.stringify({ data, time: Date.now() }))
}

// 打开弹框
const openStockSelectModal = async () => {
    showStockSelectModal.value = true
    errorMsg.value = ''
    // 先用缓存
    const cached = getCachedHotStocks()
    if (cached) stockOptions.value = cached
    else stockOptions.value = []
    // 异步拉取最新
    try {

        const res = await fetch('https://981c4eefa734.ngrok-free.app/stocks/popular?n=5')

        const data = await res.json()
        if (Array.isArray(data) && data.length > 0) {
            stockOptions.value = data
            setCachedHotStocks(data)
        } else if (!cached) {
            errorMsg.value = '暂无可选股票'
        }
    } catch (e) {
        if (!cached) errorMsg.value = '获取股票列表失败'
    }
}

// 搜索功能（防抖）
let searchTimeout = null
function handleSearch(val) {
    if (!val) {
        // 恢复热门股票
        const cached = getCachedHotStocks()
        stockOptions.value = cached || []
        errorMsg.value = ''
        return
    }
    if (searchTimeout) clearTimeout(searchTimeout)
    searchTimeout = setTimeout(async () => {
        isSearching.value = true
        errorMsg.value = ''
        try {

            const res = await fetch('https://981c4eefa734.ngrok-free.app/stocks/search?query=' + encodeURIComponent(val))

            const data = await res.json()
            if (Array.isArray(data) && data.length > 0) {
                stockOptions.value = data
            } else {
                stockOptions.value = []
                errorMsg.value = '未找到相关股票'
            }
        } catch {
            errorMsg.value = '搜索失败'
            stockOptions.value = []
        }
        isSearching.value = false
    }, 300)
}

// 添加选中股票到watchlist
async function handleAddStocks(stocks) {
    for (const stock of stocks) {
        if (!watchlist.find(item => item.symbol === stock.symbol)) {
            // 先请求后端
            const payload = {
                accountId: 100023, // 或你的实际账号
                which_table: '0',
                symbol: stock.symbol
            }
            try {

                const res = await fetch('https://981c4eefa734.ngrok-free.app/watchlist/add', {

                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                })
                const data = await res.json()
                if (data && data.success) {
                    watchlist.push({
                        symbol: stock.symbol,
                        status: '-',
                        shares: 'Add',
                        lastPrice: stock.regularMarketPrice,
                        acShare: '--',
                        totalCost: '--',
                        marketValue: '--',
                        totDivIncome: '--',
                        dayGainPercent: '--',
                        dayGainAmount: '--',
                        totGainPercent: '--',
                        totGainAmount: '--',
                        realizedGain: '--'
                    })
                } else {
                    alert(data && data.message ? data.message : '添加失败')
                }
            } catch (e) {
                alert('添加失败')
            }
        }
    }
    showStockSelectModal.value = false
}

const showAddForm = ref(false)
const addFormIndex = ref(null)
const addFormSymbol = ref('')
const addFormInitPrice = ref('')

async function handleAddShare(item, index) {
    showAddForm.value = false
    addFormIndex.value = index
    addFormSymbol.value = item.symbol
    addFormInitPrice.value = ''
    try {

        const res = await fetch(`https://981c4eefa734.ngrok-free.app/stocks/price/${item.symbol}`)

        const data = await res.json()
        if (data && data.regularMarketPrice !== undefined && data.regularMarketPrice !== null) {
            addFormInitPrice.value = data.regularMarketPrice
        }
    } catch { }
    showAddForm.value = true
}
function handleAddShareConfirm(shares, price) {
    const item = watchlist[addFormIndex.value]
    item.shares = parseInt(shares)
    item.acShare = parseFloat(price)
    item.totalCost = item.acShare * item.shares
    item.marketValue = item.lastPrice * item.shares
    item.status = 'Open'
    // 计算收益
    const gainAmount = item.marketValue - item.totalCost
    const gainPercent = (gainAmount / item.totalCost * 100).toFixed(2)
    item.totGainPercent = gainPercent > 0 ? `+${gainPercent}%` : `${gainPercent}%`
    item.totGainAmount = gainAmount > 0 ? `+${gainAmount.toFixed(2)}` : gainAmount.toFixed(2)
    showAddForm.value = false
}

// 1. 建立socket连接

const socket = io('https://981c4eefa734.ngrok-free.app')


// 2. 订阅所有已在watchlist中的股票（页面加载时和后续添加）
watchEffect(() => {
    if (watchlist.length > 0) {
        watchlist.forEach(item => {
            console.log('item.symbol', item.symbol);
            socket.emit('subscribe', { symbol: item.symbol, fields: 'regularMarketPrice' });
            console.log('已发送subscribe');
        });
    }
})

// 4. 监听推送，更新lastPrice
socket.on('stockUpdate', (data) => {
    console.log('收到后端推送的股票数据', data);
    const item = watchlist.find(i => i.symbol === data.symbol)
    if (item && data.regularMarketPrice !== undefined) {
        const prev = item.lastPrice
        item.lastPricePrev = prev
        item.lastPrice = data.regularMarketPrice
        if (prev === undefined || prev === '--') {
            item.priceTrend = 'none'
        } else if (data.regularMarketPrice > prev) {
            item.priceTrend = 'up'
        } else if (data.regularMarketPrice < prev) {
            item.priceTrend = 'down'
        } else {
            item.priceTrend = 'none'
        }
        // 触发闪烁动画
        if (prev !== undefined && prev !== '--' && data.regularMarketPrice !== prev) {
            item.priceFlash = false
            setTimeout(() => { item.priceFlash = true }, 0)
            setTimeout(() => { item.priceFlash = false }, 600)
        }
    }
})

onMounted(async () => {
    try {

        const res = await fetch('https://981c4eefa734.ngrok-free.app/watchlist/100023',
        {headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })

        const data = await res.json()
        watchlist.splice(0, watchlist.length, ...data.map(item => ({
            symbol: item.symbol,
            status: item.status || '-',
            shares: item.shares ? parseFloat(item.shares) : 'Add',
            lastPrice: item.last_price ? parseFloat(item.last_price) : '--',
            acShare: item.ac_share ? parseFloat(item.ac_share) : '--',
            totalCost: item.total_cost ? parseFloat(item.total_cost) : '--',
            marketValue: item.market_value ? parseFloat(item.market_value) : '--',
            totDivIncome: '--',
            dayGainPercent: item.day_gain_unrl_pct
                ? (parseFloat(item.day_gain_unrl_pct) * 100).toFixed(2) + '%'
                : '--',
            dayGainAmount: item.day_gain_unrl_amt
                ? (parseFloat(item.day_gain_unrl_amt) >= 0 ? '+' : '') + parseFloat(item.day_gain_unrl_amt).toFixed(2)
                : '--',
            totGainPercent: item.tot_gain_unrl_pct
                ? (parseFloat(item.tot_gain_unrl_pct) * 100).toFixed(2) + '%'
                : '--',
            totGainAmount: item.tot_gain_unrl_amt
                ? (parseFloat(item.tot_gain_unrl_amt) >= 0 ? '+' : '') + parseFloat(item.tot_gain_unrl_amt).toFixed(2)
                : '--',
            realizedGain: '--'
        })))
    } catch (e) {
        console.error('拉取持仓失败', e)
    }
})
</script>

<style scoped>
.navbar {
    width: 100%;
    height: 56px;
    background: #1d2228;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 32px;
    font-size: 1.2rem;
    font-weight: bold;
    letter-spacing: 1px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.navbar-logo {
    font-family: 'Arial Black', Arial, sans-serif;
    font-size: 1.3rem;
    letter-spacing: 2px;
}

.main-container {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    margin: 32px auto 0 auto;
    max-width: 1100px;
    padding: 32px 32px 24px 32px;
    min-height: 600px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.tabs {
    display: flex;
    gap: 10px;
}

.tab,
.tab-add {
    padding: 8px 16px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    color: #555;
}

.tab.active {
    border-bottom: 2px solid #ffd04b;
    color: #ffd04b;
    font-weight: bold;
}

.add-tickers-btn {
    padding: 8px 16px;
    border: 1px solid #ccc;
    border-radius: 20px;
    background: #ffd04b;
    color: #fff;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(96, 1, 210, 0.08);
}

.add-tickers-btn:hover {
    background: #f8bd1c;
}

.login-prompt {
    text-align: center;
    padding: 80px 20px;
    background: rgba(255, 255, 255, 0.20);
    color: #111111;
    border-radius: 12px;
}

.big-btn {
    background-color: #ffd04b;
    border-color: #ffd04b;
    margin-top: 10px;
    padding: 20px 32px;
    font-size: 1.3rem;
    border-radius: 8px;
}
</style>
