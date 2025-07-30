<template>
  <div class="watchlist">
    <h2 @click="toggleWatchlist" style="cursor: pointer; font-size: 1.2em;">
      Watchlist
      <span v-if="isCollapsed">▶</span>
      <span v-else>▼</span>
    </h2>

    <transition name="slide-fade">
      <div class="watchlist-content" v-if="!isCollapsed">
        <!-- 仍然不放在 el-tabs 里；右下角绝对定位 -->
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

    <Item v-if="selectedItem" :item="selectedItem" :type="selectedType" @close="selectedItem = null" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Item from './Item.vue'
import { StarFilled, Star } from '@element-plus/icons-vue'

const router = useRouter()
const activeTab = ref('stock')
const searchQuery = ref('')
const selectedItem = ref(null)
const selectedType = ref(null)
const isCollapsed = ref(true)

/** 统一的时序常量： */
const STAR_DELAY_MS = 280     // 星星从实心切到空心后，延时再真正删除
const LIST_LEAVE_MS = 300     // <transition-group> 列表项离场动画时长（需与 CSS 一致）
const CLEAR_BUFFER_MS = 60    // 轻微缓冲，避免竞态
const TOTAL_DELAY = STAR_DELAY_MS + LIST_LEAVE_MS + CLEAR_BUFFER_MS

/** 用 reactive(Set) 确保 size 变动可响应；模板里用 computed 读 size */
const removingSet = reactive(new Set())
const removingActive = computed(() => removingSet.size > 0)

function toggleWatchlist() {
  isCollapsed.value = !isCollapsed.value
}

const watchlist = ref({
  stock: [
    { code: 'AAPL', name: 'Apple' },
    { code: 'TSLA', name: 'Tesla' }
  ],
  bond: [
    { code: 'US10Y', name: '10Y Treasury' }
  ]
})

function goToMarket() {
  router.push('/market')
}

function triggerRemove(item, type) {
  if (removingSet.has(item.code)) return

  // 1) 立刻切空心星 & 置顶栏进入“移除中”动画
  removingSet.add(item.code)

  // 2) 等一小段时间（给用户看到“空心星”的反馈）
  setTimeout(() => {
    // 3) 真正删除数据，触发 <transition-group> 的 leave 动画
    watchlist.value[type] = watchlist.value[type].filter(i => i.code !== item.code)

    // 4) 等 DOM 更新并留出列表离场动画时间，再让 top-bar 恢复
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
