<template>
  <div class="watchlist-table">
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Symbol</th>
          <th>Status</th>
          <th>Shares</th>
          <th>Last Price</th>
          <th>AC/Share</th>
          <th>Total Cost ($)</th>
          <th>Market Value ($)</th>
          <th>Tot Div Income ($)</th>
          <th>Day Gain (%)</th>
          <th>Day Gain ($)</th>
          <th>Tot Gain (%)</th>
          <th>Tot Gain ($)</th>
          <th>Realized Gain (%)</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(item, index) in watchlist" :key="item.symbol">
          <tr>
            <td>
              <span class="expand-icon" @click="toggleExpand(index)">
                {{ expandedRows.includes(index) ? '▼' : '▶' }}
              </span>
            </td>
            <td>{{ item.symbol }}</td>
            <td>{{ item.status }}</td>
            <td>
              {{item.lots && item.lots.length > 0
                ? item.lots.reduce((sum, lot) => sum + Number(lot.shares || 0), 0)
                : 0
              }}
            </td>
            <td :class="[
              { 'price-up': item.priceTrend === 'up', 'price-down': item.priceTrend === 'down', 'flash-anim': item.priceFlash }
            ]">
              {{ item.lastPrice }}
            </td>
            <td>{{ item.acShare }}</td>
            <td>{{ item.totalCost }}</td>
            <td>{{ item.marketValue }}</td>
            <td>{{ item.totDivIncome }}</td>

            <td
              :class="{ 'gain': item.dayGainPercent && item.dayGainPercent.includes('+'), 'loss': item.dayGainPercent && item.dayGainPercent.includes('-') }">
              {{ item.dayGainPercent }}
            </td>
            <td
              :class="{ 'gain': item.dayGainAmount && item.dayGainAmount.includes('+'), 'loss': item.dayGainAmount && item.dayGainAmount.includes('-') }">
              {{ item.dayGainAmount }}
            </td>
            <td
              :class="{ 'gain': item.totGainPercent && item.totGainPercent.includes('+'), 'loss': item.totGainPercent && item.totGainPercent.includes('-') }">
              {{ item.totGainPercent }}
            </td>
            <td
              :class="{ 'gain': item.totGainAmount && item.totGainAmount.includes('+'), 'loss': item.totGainAmount && item.totGainAmount.includes('-') }">

              {{ item.totGainAmount }}
            </td>
            <td>{{ item.realizedGain }}</td>
          </tr>
          <tr v-if="expandedRows.includes(index)">
            <td></td>
            <td colspan="13" class="lot-cell">
              <div class="lot-table">
                <button class="add-lot-btn" @click="addLot(index)">Add Lot</button>
                <table class="lot-inner-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Shares</th>
                      <th>Cost/Share ($)</th>
                      <th>Total Cost ($)</th>
                      <th>Market Value ($)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="lotLoading[index]">
                      <td colspan="6" style="text-align:center;">加载中...</td>
                    </tr>
                    <tr v-else-if="lotError[index]">
                      <td colspan="6" style="color:red;text-align:center;">{{ lotError[index] }}</td>
                    </tr>
                    <tr v-for="(lot, lotIdx) in item.lots || []" :key="lotIdx">
                      <td>{{ lot.date }}</td>
                      <td>{{ lot.shares }}</td>
                      <td>{{ lot.costShare }}</td>
                      <td>{{ lot.totalCost }}</td>
                      <td>{{ lot.marketValue }}</td>
                      <td></td>
                    </tr>
                    <tr v-if="addingLotIndex === index">
                      <td><input type="date" v-model="newLot.date" /></td>
                      <td><input type="number" v-model="newLot.shares" min="1" /></td>
                      <td><input type="number" v-model="newLot.costShare" min="0" step="0.01" /></td>
                      <td></td>
                      <td></td>
                      <td>
                        <button class="lot-confirm-btn" @click="confirmAddLot(index)">确认</button>
                        <button class="lot-cancel-btn" @click="cancelAddLot">取消</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </td>
          </tr>
        </template>
        <tr>
          <td><span class="expand-icon">▼</span></td>
          <td>Total Cash</td>
          <td colspan="12">0.00</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
const props = defineProps({
  watchlist: {
    type: Array,
    required: true
  }
})
// 展开行索引
const expandedRows = ref([])
// 新增Lot输入状态
const addingLotIndex = ref(null)
const newLot = reactive({ date: '', shares: '', costShare: '' })
const lotLoading = ref({})
const lotError = ref({})

async function toggleExpand(index) {
  const i = expandedRows.value.indexOf(index)
  if (i === -1) {
    expandedRows.value.push(index)
    // 动态加载Lot数据
    const item = props.watchlist[index]
    if (!item.lots) {
      lotLoading.value[index] = true
      lotError.value[index] = ''
      try {
        const res = await fetch(`http://localhost:3000/transactions/100023/${item.symbol}`)
        const data = await res.json()
        item.lots = (data || []).map(tx => ({
          date: tx.date ? tx.date.slice(0, 10).replace(/-/g, '/') : '',
          shares: tx.shares ? parseFloat(tx.shares) : '',
          costShare: tx.cost_per_share ? parseFloat(tx.cost_per_share) : '',
          totalCost: tx.total_cost ? parseFloat(tx.total_cost) : '',
          marketValue: tx.market_value ? parseFloat(tx.market_value) : ''
        }))
      } catch (e) {
        lotError.value[index] = 'Failed to load lots'
      }
      lotLoading.value[index] = false
    }
  } else {
    expandedRows.value.splice(i, 1)
  }
}
async function addLot(index) {
  addingLotIndex.value = index
  newLot.date = new Date().toISOString().slice(0, 10)
  newLot.shares = ''
  newLot.costShare = ''
  // 获取最新价格
  const symbol = props.watchlist[index].symbol
  try {
    const res = await fetch(`https://981c4eefa734.ngrok-free.app/stocks/price/${symbol}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true',
        'Accept': 'application/json'
      }
    })
    const data = await res.json()
    if (data && data.regularMarketPrice !== undefined && data.regularMarketPrice !== null) {
      newLot.costShare = data.regularMarketPrice
    }
  } catch { }
}

async function confirmAddLot(index) {
  if (!newLot.date || !newLot.shares || !newLot.costShare) return
  const symbol = props.watchlist[index]?.symbol || ''
  if (!symbol) {
    alert('symbol is required')
    return
  }
  const dateStr = newLot.date.length > 10 ? newLot.date.slice(0, 10) : newLot.date
  const payload = {
    account_id: 100023,
    symbol: symbol,
    shares: Number(newLot.shares),
    last_price: Number(newLot.costShare),
    date: dateStr
  }
  const isFirstAdd = !props.watchlist[index].lots || props.watchlist[index].lots.length === 0
  try {
    let res, data
    if (isFirstAdd) {
      res = await fetch('http://localhost:3000/watchlist/update/addTransaction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      data = await res.json()
      if (data && data.success && data.data && data.data.transactionData) {
        if (!props.watchlist[index].lots) props.watchlist[index].lots = []
        props.watchlist[index].lots.splice(0, props.watchlist[index].lots.length, {
          date: data.data.transactionData.date.replace(/-/g, '/').slice(0, 10),
          shares: Number(data.data.transactionData.shares),
          costShare: Number(data.data.transactionData.cost_per_share),
          totalCost: data.data.transactionData.total_cost,
          marketValue: data.data.transactionData.market_value
        })
        addingLotIndex.value = null
      } else {
        alert(data && data.message ? data.message : 'Failed to add lot')
      }
    } else {
      // 走原有Lot添加逻辑
      const res = await fetch('http://localhost:3000/transactions/addTransaction', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data && data.success) {
        if (!props.watchlist[index].lots) props.watchlist[index].lots = []
        props.watchlist[index].lots.push({
          date: newLot.date.replace(/-/g, '/'),
          shares: Number(newLot.shares),
          costShare: Number(newLot.costShare),
          totalCost: data.total_cost !== undefined ? data.total_cost : '--',
          marketValue: data.market_value !== undefined ? data.market_value : '--'
        })
        addingLotIndex.value = null
      } else {
        alert(data && data.message ? data.message : 'Failed to add lot')
      }
    }
  } catch (e) {
    alert('Failed to add lot')
  }
}
function cancelAddLot() {
  addingLotIndex.value = null
}
</script>

<style scoped>
.watchlist-table {
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

table {
  width: 100%;
  border-collapse: collapse;
}


th,
td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

th {
  background-color: #edf2f7;
  font-weight: 500;
  color: #2c3e50;
}

.expand-icon {
  cursor: pointer;
  color: #666;
  font-size: 18px;
  user-select: none;
}

.gain {
  color: #38a169;
  font-weight: 500;
}

.loss {
  color: #e53e3e;
  font-weight: 500;
}

.add-share-btn {
  background: #ffd04b;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 4px 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}


.add-share-btn:hover {
  background: #4b018f;
}


.lot-cell {
  background: #f5f6fa;
  padding: 0;
  border-left: 4px solid #e0e3e8;
  /* 额外缩进 */
  position: relative;
}

.lot-table {
  margin-left: 8px;
  padding: 16px 0 0 0;
}

.add-lot-btn {
  background: none;
  border: 1px solid #ffd04b;
  color: #ffd04b;
  border-radius: 20px;
  padding: 4px 16px;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 8px;
  margin-left: 8px;
  transition: background 0.2s, color 0.2s;
}

.add-lot-btn:hover {
  background: #ffd04b;
  color: #fff;
}

.lot-inner-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
}


.lot-inner-table th,
.lot-inner-table td {

  padding: 8px 10px;
  border-bottom: 1px solid #e0e3e8;
  font-size: 14px;
}


.lot-confirm-btn,
.lot-cancel-btn {

  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  margin-right: 4px;
  font-size: 13px;
  cursor: pointer;
}

.lot-confirm-btn {
  background: #ffd04b;
  color: #fff;
}

.lot-cancel-btn {
  background: #eee;
  color: #333;
}


.lot-confirm-btn:hover {
  background: #4b018f;
}

.lot-cancel-btn:hover {
  background: #ccc;
}


.price-up {
  color: #e53e3e;
  font-weight: bold;
}

.price-down {
  color: #38a169;
  font-weight: bold;
}


.flash-anim {
  animation: flash-bg 0.6s;
}

@keyframes flash-bg {
  0% {
    background: #ffe066;
  }

  60% {
    background: #ffe066;
  }

  100% {
    background: transparent;
  }

}
</style>