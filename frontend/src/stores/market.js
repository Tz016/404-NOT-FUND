// /src/stores/market.js
import { defineStore } from 'pinia'
import axios from 'axios'


const API_BASE = 'https://981c4eefa734.ngrok-free.app'

const CACHE_KEY = 'market_popular_cache_v1'
const CACHE_TTL_MS = 5 * 60 * 1000

const DEFAULT_WINDOW_MS = 15 * 60 * 1000
const MAX_BACK_MS = 120 * 60 * 1000    // ⭐ 保留 120 分钟的原始序列

export const useMarketStore = defineStore('market', {
  state: () => ({
    popular: [],
    loading: false,
    error: '',
    // 原始时间序列缓冲：symbol -> [{ t, p }]
    spark: new Map(),
    lastLoadedAt: 0,
    windowMs: DEFAULT_WINDOW_MS,
    winVersion: 0, // ⭐ 窗口版本号，切换时自增，用于触发 x 轴缩放动画
  }),
  getters: {
    isStale: (s) => Date.now() - s.lastLoadedAt > CACHE_TTL_MS,
  },
  actions: {
    setWindowMs(ms) {
      this.windowMs = ms
      this.winVersion++ // 通知前端做一次 x 轴缩放动画
    },

    _saveCache() {
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({ data: this.popular, lastLoadedAt: this.lastLoadedAt })
        )
      } catch {}
    },
    _restoreCache() {
      try {
        const raw = localStorage.getItem(CACHE_KEY)
        if (!raw) return false
        const { data, lastLoadedAt } = JSON.parse(raw)
        if (Array.isArray(data)) {
          this.popular = data
          this.lastLoadedAt = lastLoadedAt || 0
          return true
        }
      } catch {}
      return false
    },

    async prefetchPopular(n = 50) {
      const hadCache = this._restoreCache()
      if (!hadCache || this.isStale) {
        this.fetchPopular(n, hadCache)
      } else {
        // 用接口价种一个初始点
        const now = Date.now()
        this.popular.forEach(it => {
          if (!this.spark.has(it.symbol)) this.spark.set(it.symbol, [])
          const arr = this.spark.get(it.symbol)
          if (!arr.length && it.regularMarketPrice != null) {
            this.spark.set(it.symbol, [{ t: now, p: it.regularMarketPrice }])
          }
        })
      }
    },

    async fetchPopular(n = 50, silent = false) {
      if (!silent) { this.loading = true; this.error = '' }
      try {

        const { data } = await axios.get(`${API_BASE}/stocks/popular`, { params: { n },
        headers: {
      'ngrok-skip-browser-warning': 'true',
      'Accept': 'application/json'
    
    } })

        const arr = Array.isArray(data) ? data : []
        this.popular = arr
        this.lastLoadedAt = Date.now()
        this._saveCache()
        const now = Date.now()
        arr.forEach(it => {
          if (!this.spark.has(it.symbol)) this.spark.set(it.symbol, [])
          const s = this.spark.get(it.symbol)
          if (!s.length && it.regularMarketPrice != null) {
            this.spark.set(it.symbol, [{ t: now, p: it.regularMarketPrice }])
          }
        })
      } catch (e) {
        this.error = 'Failed to load popular stocks.'
      } finally {
        if (!silent) this.loading = false
      }
    },

    // ⭐ 只按 MAX_BACK_MS 裁剪，保留更多历史，切窗立即生效
    pushTick(symbol, price) {
      if (price == null) return
      const now = Date.now()
      if (!this.spark.has(symbol)) this.spark.set(symbol, [])
      const arr = this.spark.get(symbol)
      arr.push({ t: now, p: price })
      const cutoff = now - MAX_BACK_MS
      while (arr.length && arr[0].t < cutoff) arr.shift()
      this.spark.set(symbol, [...arr])
    },

    // ⭐ 提供给页面/组件的“按当前窗口切片”
    getSeries(symbol) {
      const arr = this.spark.get(symbol) || []
      if (!arr.length) return []
      const cutoff = Date.now() - this.windowMs
      // 返回新数组，避免直接暴露内部引用
      const i = arr.findIndex(d => d.t >= cutoff)
      return i < 0 ? [] : arr.slice(i)
    },
  },
})
