<template>
    <div class="watchlist">
        <h2 @click="toggleWatchlist" style="cursor: pointer; font-size: 1.2em;">
            Watchlist
            <span v-if="isCollapsed">▶</span>
            <span v-else>▼</span>
        </h2>

        <transition name="slide-fade">
            <div class="watchlist-content" v-if="!isCollapsed">
                <!-- 右下角操作栏 -->
                <div class="top-bar" :class="{ 'is-removing': removingActive }">
                    <el-button type="primary" size="medium" @click="goToMarket" color="#ffd04b">+ Add</el-button>
                    <el-input v-model="searchQuery" placeholder="Search by code..." size="medium" clearable />
                </div>

                <div class="watchlist-tabs">
                    <el-tabs v-model="activeTab">
                        <!-- Stock -->
                        <el-tab-pane label="Stock" name="stock">
                            <transition-group name="list" tag="div">
                                <div v-for="item in filteredAssets.stock" :key="'s-' + item.code" class="watch-item">
                                    <div class="info" @click="openItemDialog(item, 'stock')"
                                        :class="{ active: isActive(item) }">
                                        <p><strong>{{ item.code }}</strong></p>
                                    </div>
                                    <el-icon class="star-icon" @click.stop="triggerRemove(item, 'stock')">
                                        <component :is="removingSet.has(item.code) ? Star : StarFilled" />
                                    </el-icon>
                                </div>
                            </transition-group>
                        </el-tab-pane>

                        <!-- Bond -->
                        <el-tab-pane label="Bond" name="bond">
                            <transition-group name="list" tag="div">
                                <div v-for="item in filteredAssets.bond" :key="'b-' + item.code" class="watch-item">
                                    <div class="info" @click="openItemDialog(item, 'bond')"
                                        :class="{ active: isActive(item) }">
                                        <p><strong>{{ item.code }}</strong> - {{ item.name }}</p>
                                    </div>
                                    <el-icon class="star-icon" @click.stop="triggerRemove(item, 'bond')">
                                        <component :is="removingSet.has(item.code) ? Star : StarFilled" />
                                    </el-icon>
                                </div>
                            </transition-group>
                        </el-tab-pane>
                    </el-tabs>
                </div>
            </div>
        </transition>

        <Item v-if="selectedItem" v-model:visible="showItem" :item="normalizedSelected" :type="selectedType"
            :is-asset="true" :inWatchlist="true" @watchlist-change="onWatchlistChange" @trade="onTrade" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Item from './Item.vue'
import { StarFilled, Star } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('stock')
const searchQuery = ref('')
const selectedItem = ref(null)
const selectedType = ref(null)
const selectedKey = ref(null)
const showItem = ref(false)
const isCollapsed = ref(true)

// 删除动画用
const STAR_DELAY_MS = 280
const LIST_LEAVE_MS = 300
const CLEAR_BUFFER_MS = 60
const removingSet = reactive(new Set())
const removingActive = computed(() => removingSet.size > 0)

// watchlist 数据结构
const watchlist = ref({
    stock: [],
    bond: []
})

// 挂载时从后端获取数据
onMounted(async () => {
    try {
        const res = await axios.get('http://localhost:3000/watchlist/100023')
        // 接口数据转换成前端需要的数据结构
        const stocks = []
        const bonds = []

        res.data.forEach(item => {
            // 示例逻辑：which_table 为 2 就是 stock，否则 bond
            console.log(item)
            const data = {
                code: item.symbol,
                name: item.symbol,  // 如果接口没有 name，用 symbol 代替
                ...item
            }
            if (item.which_table === '2') {
                stocks.push(data)
            } else {
                bonds.push(data)
            }
        })
        watchlist.value.stock = stocks
        watchlist.value.bond = bonds
    } catch (err) {
        console.error('获取 watchlist 出错:', err)
    }
})

function toggleWatchlist() {
    isCollapsed.value = !isCollapsed.value
}

function goToMarket() {
    router.push('/market')
}

function triggerRemove(item, type) {
    if (removingSet.has(item.code)) return
    removingSet.add(item.code)
    setTimeout(() => {
        watchlist.value[type] = watchlist.value[type].filter(i => i.code !== item.code)
        nextTick(() => {
            setTimeout(() => {
                removingSet.delete(item.code)
            }, LIST_LEAVE_MS + CLEAR_BUFFER_MS)
        })
    }, STAR_DELAY_MS)
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

const filteredAssets = computed(() => ({
    stock: watchlist.value.stock.filter(item =>
        item.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    ),
    bond: watchlist.value.bond.filter(item =>
        item.code.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
}))

const normalizedSelected = computed(() => {
  const it = selectedItem.value
  const t = selectedType.value
  if (!it) return null
  console.log('Normalized item:', it, t)
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
      id: it.symbol,
      issuer: it.stock_name,
      name: it.stock_name,
      price: it.last_price,
      quantity: it.shares,           // Item.vue 会用 shares / quantity 作为持仓
      avgBuyPrice: it.ac_share,
      currency: 'USD',
      created_at: it.created_at,
    }
  }
})
</script>
<style scoped>
.watchlist {
  position: relative;
  display: block;
  width: 90%;
  padding: 0.5rem;
  color: white;
}

/* 包裹内容，给右下角 top-bar 预留空间，避免遮挡 */
.watchlist-content {
  position: relative;
  padding-right: 16rem; /* 右侧留白给 top-bar（根据 UI 可调整） */
  padding-bottom: 6rem; /* 底部留白给 top-bar（根据 UI 可调整） */
}

.top-bar {
  display: flex;
  flex-direction: column;
  align-items: flex-end; /* 靠右对齐 */
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  gap: 0.5rem;
  z-index: 2;

  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease; /* 恢复也会 ease */
}

/* 删除过程中：top-bar 同步变淡并轻微上移 */
.top-bar.is-removing {
  opacity: 0;
  transform: translateY(-4px);
}

.watchlist-tabs {
  left: 0;
  width: 50%;
}

el-button {
  background-color: #ffd04b;
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
}
.watch-item .info {
  padding: 0.2rem;
}
.watch-item .info.active {
  background-color: #ffd04b;
  border-radius: 4px;
  padding: 0.2rem;
  color: #000;
}

/* slide-fade for entire section open/close */
:deep(.slide-fade-enter-active),
:deep(.slide-fade-leave-active) {
  transition: all 0.3s ease;
}
:deep(.slide-fade-enter-from),
:deep(.slide-fade-leave-to) {
  opacity: 0;
}

/* 列表项的进出与位移动画（与 JS 中 LIST_LEAVE_MS 匹配） */
.list-enter-active,
.list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
/* 重要：使剩余元素位置变化也有过渡（FLIP） */
.list-move {
  transition: transform 0.3s ease;
}

.star-icon {
  font-size: 18px;
  cursor: pointer;
  color: #ffd04b;
  transition: transform 0.15s ease, color 0.15s ease;
}
.star-icon:hover {
  transform: scale(1.05);
  color: #ffd04b;
}
</style>