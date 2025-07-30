<template>
  <el-dialog
    v-model="innerVisible"
    :title="name"
    width="500px"
    top="8vh"
    class="item-dialog"
    append-to-body
    @close="onClose"
  >
    <!-- Header -->
    <div class="header">
      <div class="left">
        <el-tag style="background-color: #ffd04b; border: 0ch; color:white" size="small">
          {{ isBond ? 'Bond' : 'Stock' }}
        </el-tag>
      </div>

      <el-tooltip :content="watchlisted ? 'Remove from Watchlist' : 'Add to Watchlist'">
        <el-button class="icon-btn" link :loading="watchlistLoading" @click="onToggleWatchlist">
          <component :is="watchlisted ? StarFilled : Star" />
        </el-button>
      </el-tooltip>
    </div>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-value" v-if="price != null">
        <div class="label">Last Price</div>
        <div class="value">{{ formattedPrice }}</div>
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
        <el-button class="white-btn" :disabled="!isAsset || holdings <= 0" @click="openMode('sell')">
            Sell
        </el-button>
    </div>

    <!-- Trade form -->
    <transition name="slide-fade">
      <div v-if="mode !== 'none'" class="trade-panel">
        <div class="trade-panel-title">{{ modeTitle }}</div>

        <el-form
          class="trade-form"
          :model="form"
          :rules="rules"
          ref="formRef"
          label-width="130px"
        >
          <el-form-item label="Quantity" prop="qty">
            <el-input-number
              v-model="form.qty"
              :min="1"
              :step="1"
              controls-position="right"
            />
          </el-form-item>

          <el-form-item label="Unit Price (USD)" prop="price">
            <div class="total">{{ formattedPrice }}</div>
          </el-form-item>

          <el-form-item label="Total (USD)">
            <div class="total">{{ formattedTotalUSD }}</div>
          </el-form-item>

          <el-alert
            v-if="mode === 'sell' && form.qty > holdings"
            type="warning"
            :closable="false"
            show-icon
            title="Sell quantity exceeds current holdings."
            class="warn"
          />

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
import { ref, computed, watch } from 'vue'
import { StarFilled, Star } from '@element-plus/icons-vue'

const props = defineProps({
  item: { type: Object, required: true },
  type: { type: String, default: 'stock' },
  isAsset: { type: Boolean, default: false },
  inWatchlist: { type: Boolean, default: false },
  visible: { type: Boolean, default: false }
})
console.log('Item.vue props:', props)
const emit = defineEmits(['update:visible', 'close', 'watchlist-change', 'trade'])

const innerVisible = ref(props.visible)
watch(() => props.visible, v => (innerVisible.value = v))
watch(innerVisible, v => emit('update:visible', v))
function onClose() { closeMode(); emit('close') }
const isBond = computed(() => props.type === 'bond')
const name= computed(() => props.item.id+' - ' + (props.item.name || props.item.symbol || '—'))


const currency = computed(() => (props.item?.currency || 'USD').toUpperCase())
const price = computed(() => props.item?.price ?? null)
const avgBuyPrice = computed(() => props.item?.avgBuyPrice ?? null)
const holdings = computed(() => Number(props.item?.quantity ?? props.item?.shares ?? 0))
const holdingsFormatted = computed(() => new Intl.NumberFormat().format(holdings.value))


const formattedPrice = computed(() => formatCurrency(price.value, currency.value))
const formattedAvgPrice = computed(() => formatCurrency(avgBuyPrice.value, currency.value))

function formatCurrency(val, cur = 'USD') {
  if (val == null) return '—'
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(val)
  } catch { return String(val) }
}

/* Watchlist */
const watchlisted = ref(!!props.inWatchlist)
const watchlistLoading = ref(false)
async function onToggleWatchlist() {
  if (watchlistLoading.value) return
  watchlistLoading.value = true
  try {
    const next = !watchlisted.value
    await mockToggleWatchlist(props.item, next)
    watchlisted.value = next
    emit('watchlist-change', next)
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
      mode: mode.value,
      qty: Number(form.value.qty),
      price: Number(form.value.price),
      total: total.value,
      item: props.item
    }
    if (mode.value === 'buy') await mockBuy(payload)
    else await mockSell({ ...payload, currentHoldings: holdings.value })

    emit('trade', payload)
    closeMode()
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
.icon-btn {
  color: var(--accent);
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

/* Buttons */

.accent-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.sell-btn {
  background: transparent;
  color: var(--accent);
  border: 1px solid var(--accent);
  transition: 0.2s;
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
</style>
