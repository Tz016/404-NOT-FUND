<template>
  <!-- <pre>{{ hasAvgCost }} {{ hasLastPrice }} {{ direction }}</pre> -->

  <div
    class="asset-item"
    role="button"
    tabindex="0"
    :aria-label="ariaLabel"
    @click="open"
    @keydown.enter.prevent="open"
    @keydown.space.prevent="open"
  >
    <!-- 顶部行：左 ID+Name，中 Price，右 盈亏 + 角标 -->
    <div class="top-row">
      <div class="left">
        <p class="id">#{{ id }}</p>
        <p class="name">
          <strong>{{ name }}</strong>
          <span v-if="ticker" class="ticker">· {{ ticker }}</span>
        </p>
      </div>

      <div class="mid">
        <p class="label">Last Price</p>
        <p class="price">${{ fmtMoney(lastPrice) }}</p>
      </div>

      <div class="right">
        <div class="pnl" :class="pnlClass">
          <span class="pnl-amt">
            {{ pnlSign }}${{ fmtMoney(Math.abs(pnlAmt)) }}
          </span>
          <span v-if="isFiniteNumber(pnlPct)" class="pnl-pct">
            ({{ pnlSign }}{{ fmtPercent(Math.abs(pnlPct)) }})
          </span>
          <!-- 右上角小三角（相对均价 ac_share） -->
        <span
          v-if="hasAvgCost && hasLastPrice && direction !== 'flat'"
          class="arrow"
          :class="direction"
          aria-hidden="true"
          title="vs avg buy price"
        />
        </div>

        
      </div>
    </div>

    <!-- 底部行：数量与均价 -->
    <div class="bottom-row">
      <p class="kv">
        <span class="k">Quantity</span>
        <span class="v">{{ fmtNumber(quantity) }}</span>
      </p>
      <p class="kv">
        <span class="k">Avg Buy</span>
        <span class="v">${{ fmtMoney(avgCost) }}</span>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
/**
 * 兼容字段的归一化规则：
 * - id: id | bond_id | stock_id
 * - name: bond_name | stock_name | name | symbol
 * - ticker: bond_ticker | stock_ticker | symbol
 * - quantity: shares | quantity
 * - lastPrice: last_price | price
 * - avgCost: ac_share | avgBuyPrice
 * - 也兼容已有的 tot_gain_unrl_amt / pct（若没有就现场计算）
 */

const props = defineProps({
  asset: { type: Object, required: true }
})
const emit = defineEmits(['open'])

function open() {
  emit('open', props.asset)
}

// -------- 取值与兜底 ----------
const id = computed(() =>
  coalesce(props.asset.id, props.asset.bond_id, props.asset.stock_id, '—')
)

const name = computed(() =>
  coalesce(
    props.asset.bond_name,
    props.asset.stock_name,
    props.asset.name,
    props.asset.symbol,
    '—'
  )
)

const ticker = computed(() =>
  coalesce(props.asset.bond_ticker, props.asset.stock_ticker, props.asset.symbol, null)
)

const quantity = computed(() =>
  toNum(coalesce(props.asset.shares, props.asset.quantity, null))
)

const lastPrice = computed(() =>
  toNum(coalesce(props.asset.last_price, props.asset.price, null))
)

const avgCost = computed(() =>
  toNum(coalesce(props.asset.ac_share, props.asset.avgBuyPrice, null))
)

const hasAvgCost = computed(() => isFiniteNumber(avgCost.value))
const hasLastPrice = computed(() => isFiniteNumber(lastPrice.value))

// -------- 盈亏计算（若接口提供则优先使用接口，缺失时计算） --------
const unrlAmtFromApi = computed(() => toNum(props.asset.tot_gain_unrl_amt))
const unrlPctFromApi = computed(() => toNum(props.asset.tot_gain_unrl_pct))

const pnlAmt = computed(() => {
  // 优先使用后端给的未实现盈亏金额，否则计算：(last - avg)*qty
  if (isFiniteNumber(unrlAmtFromApi.value)) return unrlAmtFromApi.value
  if (hasAvgCost.value && hasLastPrice.value && isFiniteNumber(quantity.value)) {
    return (lastPrice.value - avgCost.value) * quantity.value
  }
  return NaN
})

const pnlPct = computed(() => {
  // 优先使用后端给的未实现盈亏百分比，否则计算：(last/avg - 1)*100
  if (isFiniteNumber(unrlPctFromApi.value)) return unrlPctFromApi.value
  if (hasAvgCost.value && hasLastPrice.value && avgCost.value !== 0) {
    return ((lastPrice.value / avgCost.value) - 1) * 100
  }
  return NaN
})

const direction = computed(() => {
  if (!hasAvgCost.value || !hasLastPrice.value) return 'flat'
  if (lastPrice.value > avgCost.value) return 'up'
  if (lastPrice.value < avgCost.value) return 'down'
  return 'flat'
})

const pnlSign = computed(() => {
  if (!isFiniteNumber(pnlAmt.value)) return ''
  return pnlAmt.value > 0 ? '+' : (pnlAmt.value < 0 ? '−' : '')
})

const pnlClass = computed(() => {
  if (!isFiniteNumber(pnlAmt.value)) return 'neutral'
  return pnlAmt.value > 0 ? 'pos' : (pnlAmt.value < 0 ? 'neg' : 'neutral')
})

const ariaLabel = computed(() => {
  const n = name.value || 'asset'
  const p = hasLastPrice.value ? `$${fmtMoney(lastPrice.value)}` : '—'
  return `${n}, last price ${p}`
})

// --------- 工具方法 ----------
function coalesce(...vals) {
  for (const v of vals) if (v !== undefined && v !== null && v !== '') return v
  return undefined
}

function toNum(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : NaN
}

function isFiniteNumber(v) {
  return Number.isFinite(v)
}

function fmtMoney(v) {
  if (!isFiniteNumber(v)) return '—'
  const abs = Math.abs(v)
  // 债券多为接近 100 的票面价格，这里默认保留 2 位；<1 的保留 4 位更清晰
  return abs >= 1 ? v.toFixed(2) : v.toFixed(4)
}

function fmtNumber(v) {
  if (!isFiniteNumber(v)) return '—'
  // 数量可能很大，用千分位
  return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function fmtPercent(v) {
  if (!isFiniteNumber(v)) return '—'
  return v.toFixed(2) + '%'
}
</script>

<style scoped>
:root {
  --accent: #ffd04b;
  --bg: #111111;
  --fg: #ffffff;
  --border: #2a2a2a;
  --green: #16a34a;
  --red: #dc2626;
  --muted: #a3a3a3;
}

.asset-item {
  position: relative;
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  color: var(--fg);
  transition: background-color 0.25s ease, transform 0.05s ease, border-color 0.2s ease;
}

.asset-item:hover {
  background-color: #ffd04b;
  color: #000;
  border-color: #ffd04b;
}

.asset-item:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--accent);
}

.asset-item:active {
  transform: translateY(1px);
}

/* 布局 */
.top-row,
.bottom-row {
  display: grid;
  align-items: center;
}

.top-row {
  grid-template-columns: 1fr auto auto; /* 左 中 右 */
  column-gap: 12px;
}

.bottom-row {
  margin-top: 6px;
  grid-template-columns: repeat(2, max-content);
  column-gap: 18px;
}

/* 左侧：ID + Name */
.left {
  display: flex;
  flex-direction: column;
  min-width: 0; /* 允许文本省略 */
}
.id {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
}
.name {
  margin: 0;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ticker {
  font-weight: 500;
  opacity: 0.85;
}

/* 中间：现价 */
.mid {
  text-align: center;
  min-width: 120px;
}
.mid .label {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}
.mid .price {
  margin: 0;
  font-size: 1.05rem;
  font-variant-numeric: tabular-nums;
}

/* 右侧：盈亏 + 角标 */
.right {
  position: relative;
  min-width: 160px;
  justify-self: end;
  text-align: right;
}
.pnl {
  font-variant-numeric: tabular-nums;
}
.pnl.pos { color: var(--green); }
.pnl.neg { color: var(--red); }
.pnl.neutral { color: var(--muted); }
.pnl-amt { font-weight: 600; }
.pnl-pct { margin-left: 6px; opacity: 0.9; }

/* 右上角箭头 */
.arrow {
  position: absolute;
  top: -40%;
  right: -2px;
  width: 0.5vw; 
  height: 0.5vh;
}
.arrow.up {

  background: red; /* 调试 */
}
.arrow.flat{

  background-color: yellow;
}
.arrow.down {

  background-color: #16a34a;
}

/* 底部：数量与均价 */
.kv {
  display: inline-flex;
  gap: 6px;
  margin: 0;
  font-size: 0.9rem;
}
.kv .k { color: var(--muted); }
.kv .v { font-variant-numeric: tabular-nums; }
</style>
