<template>
    <el-dialog v-model="innerVisible" :title="name" width="500px" top="8vh" class="item-dialog" append-to-body
        @close="onClose">
        <!-- Header -->
        <div class="header">
            <div class="left">
                <el-tag style="background-color: #ffd04b; border: 0ch; color:white" size="small">
                    {{ isBond ? 'Bond' : 'Stock' }}
                </el-tag>
            </div>

            <el-tooltip :content="watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'">
                <el-button class="star-icon" :loading="watchlistLoading" @click="onToggleWatchlist">
                    <el-icon>
                        <component :is="watchlisted ? StarFilled : Star" />
                    </el-icon>
                </el-button>
            </el-tooltip>

        </div>


        <!-- Summary -->
        <div class="summary">

            <div class="summary-value" v-if="price != null">
                <div class="label">Current Price</div>
                  <div
    class="value"
    :class="[
      priceFlash && priceDirection === 'up' ? 'flash-up' : '',
      priceFlash && priceDirection === 'down' ? 'flash-down' : ''
    ]"
  >
    {{ formattedPrice }}
  </div>
            </div>
            <div class="summary-value" v-if="avgBuyPrice != null">
                <div class="label">Avg Buy Price</div>
                <div class="value">{{ formattedAvgPrice }}</div>
            </div>
            <div class="summary-value">
                <div class="label">Quantity Owned</div>
                <div class="value">{{ holdingsFormatted }}</div>
            </div>
        </div>

        <!-- Details -->
        <el-descriptions :column="1" size="small" class="kv">
            <el-descriptions-item label="Name">{{ name }}</el-descriptions-item>
            <el-descriptions-item label="Currency">{{ currency }}</el-descriptions-item>
            <el-descriptions-item label="Type">{{ isBond ? 'Bond' : 'Stock' }}</el-descriptions-item>
        </el-descriptions>

        <!-- Trade actions -->
        <div class="actions">
            <el-button class="accent-btn" plain @click="openMode('buy')">Buy</el-button>
            <el-button class="sell-btn" :disabled="!props.isAsset || holdings <= 0" @click="openMode('sell')">
                Sell
            </el-button>
        </div>

        <!-- Trade form -->
        <transition name="slide-fade">
            <div v-if="mode !== 'none'" class="trade-panel">
                <div class="trade-panel-title">{{ modeTitle }}</div>

                <el-form class="trade-form" :model="form" :rules="rules" ref="formRef" label-width="130px">
                    <el-form-item label="Quantity" prop="qty">
                        <el-input-number v-model="form.qty" :min="1" :step="1" controls-position="right" />
                    </el-form-item>

                    <el-form-item label="Unit Price (USD)" prop="price">
                        <div class="total">{{ formattedPrice }}</div>
                    </el-form-item>

                    <el-form-item label="Total (USD)">
                        <div class="total">{{ formattedTotalUSD }}</div>
                    </el-form-item>

                    <el-alert v-if="mode === 'sell' && form.qty > holdings" type="warning" :closable="false" show-icon
                        title="Sell quantity exceeds current holdings." class="warn" />

                    <div class="trade-actions">
                        <el-button class="black-btn2" @click="closeMode" :disabled="loading">Cancel</el-button>
                        <el-button class="accent-btn" :loading="loading" :disabled="disableConfirm" @click="onConfirm">
                            Confirm
                        </el-button>
                    </div>

                </el-form>
            </div>
        </transition>

        <!-- Footer -->
        <template #footer>
            <div class="footer">
                <el-button class="black-btn" @click="innerVisible = false">Close</el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { StarFilled, Star } from '@element-plus/icons-vue'
import axios from 'axios'
import { usePortfolioStore } from '../stores/portfolio'


const props = defineProps({
    item: { type: Object, required: true },
    type: { type: String, default: 'stock' },
    isAsset: { type: Boolean, default: false },
    // inWatchlist: { type: Boolean, default: false },
    visible: { type: Boolean, default: false }
})

const emit = defineEmits(['update:visible', 'close', 'watchlist-change', 'trade'])

const innerVisible = ref(props.visible)
watch(() => props.visible, v => (innerVisible.value = v))
watch(innerVisible, v => emit('update:visible', v))
function onClose() { closeMode(); emit('close') }
const isBond = computed(() => props.type === 'bond')
const name = computed(() => (props.item.id ? props.item.id + ' - ' : " ") + (props.item.name || props.item.symbol || '—'))

const quantity = ref(props.item.quantity || props.item.shares || 0)
const currency = computed(() => (props.item?.currency || 'USD').toUpperCase())
// const price = computed(() => props.item?.price ?? null)
const avgBuyPrice = computed(() => props.item?.avgBuyPrice ?? null)
const holdings = computed(() => Number(props.item?.quantity ?? props.item?.shares ?? 0))
const holdingsFormatted = computed(() => new Intl.NumberFormat().format(holdings.value))


const formattedPrice = computed(() => formatCurrency(price.value, currency.value))
const formattedAvgPrice = computed(() => formatCurrency(avgBuyPrice.value, currency.value))

const priceFlash = ref(false)
const priceDirection = ref(null) // 'up' | 'down' | null




function formatCurrency(val, cur = 'USD') {
    if (val == null) return '—'
    try {
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val)
    } catch { return String(val) }
}

import { useSocketStore } from '../stores/socket'

const socketStore = useSocketStore()

// 打开时订阅
watch(innerVisible, (visible) => {
  if (visible) {
    socketStore.subscribe(props.item.code)
  } else {
    socketStore.unsubscribe(props.item.code)
  }
})

// 获取实时价格（优先 socketStore 的数据）
const price = computed(() => {
  return socketStore.prices.get(props.item.code) ?? props.item.price ?? null
})
///change!!!
/* Watchlist */




// // 测试用的 price 模拟（临时替换 socket 的 price 计算）
// const fakePrice = ref(100)
// const price = computed(() => fakePrice.value)

// // 每隔 2 秒，随机上涨或下跌
// onMounted(() => {
//   setInterval(() => {
//     const delta = (Math.random() - 0.5) * 5 // [-2.5, +2.5]
//     fakePrice.value = Math.max(0, (fakePrice.value + delta).toFixed(2))
//   }, 2000)
// })


watch(price, (newVal, oldVal) => {
  if (newVal != null && oldVal != null && newVal !== oldVal) {
    priceDirection.value = newVal > oldVal ? 'up' : 'down'
    priceFlash.value = true
    setTimeout(() => {
      priceFlash.value = false
      priceDirection.value = null
    }, 400)
  }
})


const watchlisted = ref(
  props.item.which_table == '0' || props.item.which_table == '2'
)
watch(() => props.item.which_table, (val) => {
  watchlisted.value = val == '0' || val == '2'
})
console.log('props.item', props.item)
console.log('Watchlisted:', watchlisted.value)
const watchlistLoading = ref(false)
async function onToggleWatchlist() {
  if (watchlistLoading.value) return
  watchlistLoading.value = true
  const next = !watchlisted.value

  try {
    let res
    if (next) {
      res = await axios.post('http://localhost:3000/watchlist/add', {
        accountId: 100023,
        which_table: '0',
        symbol: props.item.code
      })
    } else {
      res = await axios.put('http://localhost:3000/watchlist/delete', {
        watchId: props.item.watch_id || props.item.id,
        which_table: '0',
        accountId: 100023,
        symbol: props.item.code
      })
    }

    if (res.data?.success) {
      // 立即本地更新 UI
      watchlisted.value = next

      // 再刷新全局 portfolio
      const portfolioStore = usePortfolioStore()
      await portfolioStore.refreshPortfolio(100023)
    }
  } finally {
    watchlistLoading.value = false
  }
}
/* Trade form */
const mode = ref('none') // 'buy' | 'sell' | 'none'
const modeTitle = computed(() => (mode.value === 'buy' ? `Buy ${name.value}` : `Sell ${name.value}`))
const formRef = ref()
const form = ref({ qty: 1, price: price.value ?? 0 })

watch(price, p => { if (mode.value === 'buy' && !form.value.price) form.value.price = p || 0 })

const rules = {
    qty: [
        { required: true, message: 'Quantity is required', trigger: 'blur' },
        { type: 'number', min: 1, message: 'Must be at least 1', trigger: 'change' }
    ],

}

const total = computed(() => Number(form.value.qty || 0) * Number(form.value.price || 0))
const formattedTotalUSD = computed(() => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(total.value || 0))
const loading = ref(false)

const disableConfirm = computed(() =>
    loading.value ||
    !form.value.qty || form.value.qty <= 0 ||
    form.value.price == null || form.value.price < 0 ||
    (mode.value === 'sell' && form.value.qty > holdings.value)
)

function openMode(m) {
    mode.value = m
    form.value = {
        qty: m === 'sell' ? Math.min(holdings.value || 1, 1) : 1,
        price: Number(price.value || 0)
    }
}
function closeMode() { mode.value = 'none' }

async function onConfirm() {
    if (!formRef.value) return
    await formRef.value.validate()
    loading.value = true

    try {
        const payload = {
            symbol: props.item.code,
            shares: Number(form.value.qty),
            last_price: Number(form.value.price),
            date: new Date().toISOString().split('.')[0],
            account_id: 100023, // single user
        }
        console.log("即将发送交易请求:", payload)
        const res = await axios.put(
            'http://localhost:3000/watchlist/update/addTransaction',
            payload
        )
        console.log("交易请求结果:", res)
        if (res.data?.success) {
            // 刷新 portfolio 数据
            quantity.value = mode.value === 'buy'
                ? (Number(quantity.value) + Number(form.value.qty))
                : Math.max(0, Number(quantity.value) - Number(form.value.qty))
            const portfolioStore = usePortfolioStore()
            await portfolioStore.refreshPortfolio(100023) //single user
            
            closeMode()
        }
    } catch (err) {
        console.error('交易接口出错', err)
    } finally {
        loading.value = false
    }
}


/* Mock APIs */
function delay(ms) { return new Promise(r => setTimeout(r, ms)) }
async function mockToggleWatchlist(_item, _next) { await delay(400); return { ok: true } }
async function mockBuy(_payload) { await delay(650); return { ok: true } }
async function mockSell(_payload) { await delay(650); return { ok: true } }



</script>

<style scoped>
:root {
    --accent: #ffd04b;
    --bg: #111111;
    --fg: #ffffff;
    --border: #2a2a2a;
}

.item-dialog :deep(.el-dialog) {
    background: var(--bg);
    color: var(--fg);
    border: 1px solid var(--border);
    border-radius: 10px;
}

.item-dialog :deep(.el-dialog__header) {
    color: var(--fg);
    border-bottom: 1px solid var(--border);
}

.item-dialog :deep(.el-dialog__title) {
    color: var(--fg);
}

/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    gap: 8px;
}

/* Tag 统一主题色 */
.item-dialog :deep(.el-tag) {
    background: var(--accent) !important;
    color: #000 !important;
    border: none !important;
}

/* Watchlist icon */

.star-icon {
    font-size: 2rem;
    border: none;
    cursor: pointer;
    color: #ffd04b;
    transition: transform 0.15s ease, color 0.15s ease;
}

.star-icon:hover {
    transform: scale(1.05);
    color: #ffd04b;

}

/* Summary */
.summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 12px 0;
}

.summary-value .label {
    font-size: 12px;
    opacity: 0.7;
}

.summary-value .value {
    font-size: 20px;
    font-weight: 700;
}

/* Details */
.kv {
    margin-top: 6px;
}
.kv ::v-deep(.el-descriptions__label) {
    opacity: 0.6;
}
/* Buttons */

.accent-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.sell-btn {
    background: #fff !important;
    color: #ffd04b !important;
    border: 1px solid #ddd !important;
}
.sell-btn:hover {
    background: #f5f5f5 !important;
}
.sell-btn:hover:not(:disabled) {
    background: rgba(255, 208, 75, 0.15);
}

.sell-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* 按钮统一样式 */
.el-button {
    border-radius: 6px;
    font-weight: 600;
    padding: 8px 16px;
    transition: 0.2s;
}

/* 主题色按钮（Buy / Confirm） */
.accent-btn {
    background: #ffd04b !important;
    color: white !important;
    border: none !important;
}

.accent-btn:hover {
    background: #e6bc43 !important;
}

/* 黑色按钮（Cancel / Close） */
.black-btn {
    background: #000 !important;
    color: #fff !important;
    border: 1px solid #333 !important;
}

.black-btn:hover {
    background: #1a1a1a !important;
}

.black-btn2 {
    background: white !important;
    color: #ffd04b !important;
    border: 1px solid #333 !important;
}

.black-btn2:hover {
    background: #1a1a1a !important;
}

/* 白色按钮（Sell） */
.white-btn {
    background: #fff !important;
    color: #ffd04b !important;
    border: 1px solid #ddd !important;
}

.white-btn:hover {
    background: #f5f5f5 !important;
}


/* Actions container */
.actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
}

/* Trade Panel */
.trade-panel {
    margin-top: 14px;
    padding: 12px;
    background: #0f0f0f;
    border: 1px solid var(--border);
    border-radius: 10px;
}

.trade-panel-title {
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--accent);
}

/* Form */
.trade-form :deep(.el-form-item__label) {
    color: var(--fg);
}

.trade-form :deep(.el-input__inner),
.trade-form :deep(.el-input-number__inner) {
    background: #1b1b1b;
    border: 1px solid var(--border);
    color: var(--fg);
    transition: 0.2s;
}

.trade-form :deep(.el-input__inner:focus),
.trade-form :deep(.el-input-number__inner:focus) {
    border-color: var(--accent);
    box-shadow: 0 0 6px var(--accent);
}

.total {
    font-weight: 700;
    color: var(--accent);
}

/* Confirm 按钮组 */
.trade-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 10px;
}

/* Footer */
.footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}

/* 动画 */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: opacity 200ms ease, transform 200ms ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}
@keyframes flash-up {
  0% {
    background-color: #ffeaea;
    color: #ff4d4f;
    transform: scale(1.05);
    border-radius: 4px;
    padding: 2px 4px;
  }
  100% {
    background-color: transparent;
    color: inherit;
    transform: scale(1);
  }
}

@keyframes flash-down {
  0% {
    background-color: #e6ffed;
    color: #52c41a;
    transform: scale(0.97);
    border-radius: 4px;
    padding: 2px 4px;
  }
  100% {
    background-color: transparent;
    color: inherit;
    transform: scale(1);
  }
}

.flash-up {
  animation: flash-up 0.4s ease;
}

.flash-down {
  animation: flash-down 0.4s ease;
}

</style>
