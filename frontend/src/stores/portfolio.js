// stores/portfolio.js
import { defineStore } from 'pinia'
import axios from 'axios'


export const usePortfolioStore = defineStore('portfolio', {
    
  state: () => ({
    account: null,   // 账户信息
    balance: 0,      // 账户余额
    assets: [],      // watchlist 资产列表
  }),

  actions: {
    
    async fetchAccount(accountId) {
      const res = await axios.get(`http://localhost:3000/accounts/100023`)
      if (res.data?.success) {
        this.account = res.data.data
        this.balance = Number(res.data.data.balance)
      }
    },

    async fetchAssets(accountId) {
      const res = await axios.get(`http://localhost:3000/watchlist/100023`)
      this.assets = res.data || []
    },
    

    async refreshPortfolio(accountId) {
      // 同时刷新账户和资产
      await Promise.all([this.fetchAccount(accountId), this.fetchAssets(accountId)])
    }
  }
})
