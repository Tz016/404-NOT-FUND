<template>
  <div class="balance-box" @click="handleClick" :class="{ active: isActive }">
    <p class="label">Account Balance</p>
    <p class="amount">${{ formattedBalance }}</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
const props = defineProps({
  balance: {
    type: Number,
    required: true
  }
})

const isActive = ref(false)

function handleClick() {
  isActive.value = !isActive.value
}

const formattedBalance = computed(() => {
  return props.balance.toFixed(2)
})
</script>

<style scoped>
.balance-box {
  background-color: transparent; 
  height: 15vh;
  width: 60%;
  margin-top: 5vh;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  color: #fff;
  transition: background 0.3s, color 0.3s, box-shadow 0.3s;
}

.balance-box:hover {
  background: radial-gradient(circle, rgba(255, 208, 75, 0.3) 0%, rgba(255, 208, 75, 0.05) 80%);
  box-shadow: 0 0 20px rgba(255, 208, 75, 0.3);
}


.label {
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.amount {
  font-size: 1.5rem;
  font-weight: bold;
}
</style>
