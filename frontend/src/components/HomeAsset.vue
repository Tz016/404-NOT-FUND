<template>
  <div
    style="height: 100vh; box-shadow: var(--el-border-color-light) 0px 0px 10px"
  >
    <el-splitter>
      <el-splitter-panel size="30%">
        <div class="demo-panel">
          <AssetList />
        </div>
      </el-splitter-panel>
      <el-splitter-panel :min="200">
        <div class="demo-panel">
          <BalanceBox :balance="balance" />
          <WatchList />
        </div>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>
<script setup>
import BalanceBox from './BalanceBox.vue' 
import AssetList from './AssetList.vue'
import WatchList from './WatchList.vue'
import { ref } from 'vue'

const balance = ref(12345.67) // 模拟账户余额，可以是后端数据
</script>
<style scoped>
.demo-panel {
  display: flex;
  height: 100%;
  align-items: center;
  padding: 0;
  flex-direction: column
}
::v-deep(.el-splitter-bar__dragger-horizontal) {
  background-color: #5b5c5c !important;
  width: 6px !important;
  border-radius: 4px;
  cursor: col-resize;
}

::v-deep(.el-splitter-bar__trigger) {
  background-color: transparent !important;
}
::v-deep(.el-tabs__active-bar) {
  background-color: #ffd04b; /* 你想要的颜色 */
}
::v-deep(.el-tabs__item) {
  padding: 5px 5px 5px 5px;
  width:65px;
  font-size: medium;
  font-weight: bold;
  transition: background-color 0.3s;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}
::v-deep(.el-tabs__item:hover) {
  color: #ffd04b;
}
::v-deep(.el-tabs__item.is-active) {
  color: #ffd04b;
  border-radius: 6px 6px 0 0;
}
</style>
