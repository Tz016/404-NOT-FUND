import { io } from 'socket.io-client'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSocketStore = defineStore('socket', () => {
  // 1. 建立单例 socket 连接

  const socket = io('https://981c4eefa734.ngrok-free.app',
        {headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })

  // 2. 用 map 来存储不同 symbol 的实时价格
  const prices = ref(new Map())

  // 订阅某个股票
  function subscribe(symbol) {
    socket.emit('subscribe', { symbol, fields: 'regularMarketPrice' })
  }

  // 取消订阅
  function unsubscribe(symbol) {
    socket.emit('unsubscribe', { symbol })
    prices.value.delete(symbol)
  }

  // 监听价格更新
  socket.on('stockUpdate', (data) => {
    if (data?.symbol) {
      prices.value.set(data.symbol, data.regularMarketPrice)
    }
  })

  return { prices, subscribe, unsubscribe }
})