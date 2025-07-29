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
        </div>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>
<script setup>
import BalanceBox from './BalanceBox.vue' 
import AssetList from './AssetList.vue'

import { ref } from 'vue'

const balance = ref(12345.67) // 模拟账户余额，可以是后端数据
</script>
<style scoped>
.demo-panel {
  display: flex;
  height: 100%;
  justify-content: center;
  padding: 0;
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
</style>
