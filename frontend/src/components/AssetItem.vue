<template>
  <div class="asset-item" @click="openPopup">
    <p><strong>{{ asset.name }}</strong></p>
    <p>Price: ${{ asset.price }}</p>
    <p>Quantity: {{ asset.quantity }}</p>
    <p>Avg Buy Price: ${{ asset.avgBuyPrice }}</p>

    <el-dialog
      v-model="showDialog"
      title="Asset Details"
      width="300px"
      :modal="true"
      :close-on-click-modal="true"
      class="asset-dialog"
    >
      <div class="popup-content">
        <p><strong>{{ asset.name }}</strong></p>
        <p>Quantity: {{ asset.quantity }}</p>
        <p>Avg Buy Price: ${{ asset.avgBuyPrice }}</p>
        <p>Current Value: ${{ (asset.quantity * asset.price).toFixed(2) }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  asset: Object
})

const showDialog = ref(false)

function openPopup() {
  showDialog.value = true
}
</script>

<style scoped>
.asset-item {
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
}

.asset-item:hover {
  background-color: #ffd04b;
  color: #000;
}

.asset-dialog ::v-deep(.el-dialog__wrapper) {
  background-color: rgba(0, 0, 0, 0.3); /* 背景半透明 */
}

.asset-dialog ::v-deep(.el-dialog) {
  background-color: rgba(255, 255, 255, 0.9); /* 内容白底但带透明 */
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.popup-content {
  color: #333;
}
</style>
