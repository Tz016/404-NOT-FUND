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
      const res = await axios.get(`https://981c4eefa734.ngrok-free.app/accounts/100023`,
        {headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })
      if (res.data?.success) {
        this.account = res.data.data
        this.balance = Number(res.data.data.balance)
      }
    },

    async fetchAssets(accountId) {
      const res = await axios.get(`https://981c4eefa734.ngrok-free.app/watchlist/100023`,
        {headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    }
    })
      this.assets = res.data || []
    },
    

    async refreshPortfolio(accountId) {
      // 同时刷新账户和资产
      await Promise.all([this.fetchAccount(accountId), this.fetchAssets(accountId)])
    }
  }
})
