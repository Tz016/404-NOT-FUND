<template>
  <div class="add-form-overlay">
    <div class="add-form">
      <h3>Add {{ symbol }}</h3>
      <div class="form-group">
        <label>Shares:</label>
        <input type="number" v-model="shares" min="1" />
      </div>
      <div class="form-group">
        <label>AC_Share:</label>
        <input type="number" v-model="price" min="0" step="0.01" />
      </div>
      <div class="form-actions">
        <button @click="$emit('cancel')" class="cancel-btn">Cancel</button>
        <button @click="onConfirm" class="confirm-btn" :disabled="!shares || !price">Submit</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
const props = defineProps({ symbol: String, initPrice: [String, Number] })
const emit = defineEmits(['confirm', 'cancel'])
const shares = ref('')
const price = ref(props.initPrice !== undefined && props.initPrice !== null ? props.initPrice : '')
watch(() => props.initPrice, (val) => {
  price.value = val !== undefined && val !== null ? val : ''
})
function onConfirm() {
  emit('confirm', shares.value, price.value)
  shares.value = ''
  price.value = ''
}
</script>
<style scoped>
.add-form-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}
.add-form {
  background: #ffffff80;
  padding: 24px;
  border-radius: 12px;
  width: 340px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.15);
}
.add-form h3 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #4a5568;
  font-weight: 500;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  background-color: #f8fafc;
}
.form-group input:focus {
  outline: none;
  border-color: #ffd04b;
  box-shadow: 0 0 0 1px #ffd04b;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}
.cancel-btn {
  padding: 10px 16px;
  background: #edf2f7;
  border: 1px solid #cbd5e0;
  border-radius: 4px;
  cursor: pointer;
  color: #4a5568;
  font-weight: 500;
  transition: all 0.2s;
}
.cancel-btn:hover {
  background: #e2e8f0;
}
.confirm-btn {
  padding: 10px 16px;
  background: #ffd04b;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}
.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.confirm-btn:hover:enabled {
  background: #4b018f;
}
</style>