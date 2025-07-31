<template>
  <table>
    <thead>
      <tr><th>Ticker</th><th>Qty</th><th>Price</th><th>Action</th></tr>
    </thead>
    <tbody>
      <tr v-for="item in portfolio" :key="item.id">
        <td>{{ item.stockTicker }}</td>
        <td>{{ item.quantity }}</td>
        <td>{{ item.purchasePrice }}</td>
        <td><button @click="remove(item.id)">Delete</button></td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getPortfolio, deleteAsset } from '../api/portfolio'

const portfolio = ref([])

async function load() {
  const res = await getPortfolio()
  portfolio.value = res.data
}

async function remove(id) {
  await deleteAsset(id)
  load()
}

onMounted(load)
</script>
