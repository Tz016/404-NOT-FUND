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
                <div
                  v-for="item in filteredAssets.stock"
                  :key="'s-' + item.code"
                  class="watch-item"
                >
                  <div
                    class="info"
                    @click="openItemDialog(item, 'stock')"
                    :class="{ active: isActive(item) }"
                  >
                    <p><strong>{{ item.code }}</strong> - {{ item.name }}</p>
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
                <div
                  v-for="item in filteredAssets.bond"
                  :key="'b-' + item.code"
                  class="watch-item"
                >
                  <div
                    class="info"
                    @click="openItemDialog(item, 'bond')"
                    :class="{ active: isActive(item) }"
                  >
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

    <Item
      v-if="selectedItem"
      v-model:visible="showItem"
      :item="normalizedSelected"
      :type="selectedType"
      :is-asset="true"
      :inWatchlist="true"
      @watchlist-change="onWatchlistChange"
      @trade="onTrade"
    />
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
</script>
