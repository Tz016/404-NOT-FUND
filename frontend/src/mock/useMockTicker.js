// /src/mocks/useMockTicker.js
// 用随机游走生成价格；把结果同步到 socketStore.prices 和 marketStore.spark
export function useMockTicker({ marketStore, socketStore, symbols, intervalMs = 800 }) {
  // 高斯随机（Box-Muller）
  function randn() {
    let u = 0, v = 0
    while (u === 0) u = Math.random()
    while (v === 0) v = Math.random()
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
  }

  // 维护最近价表
  const last = new Map()
  // 初始化最近价：来自热门列表的 regularMarketPrice
  marketStore.popular.forEach(it => {
    if (!last.has(it.symbol)) last.set(it.symbol, it.regularMarketPrice || 100)
  })

  // 生成下一个价：随机游走（±0.15% 左右波动）
  function nextPrice(sym) {
    const prev = last.get(sym) ?? 100
    const drift = 0 // 可设为 0.00002 有轻微上行趋势
    const vol = 0.0015 // 0.15%
    const nx = prev * (1 + drift + vol * randn())
    // 限制到 >= 0.01
    const capped = Math.max(0.01, nx)
    last.set(sym, capped)
    return capped
  }

  // 定时器：对传入的 symbols 逐个更新
  const timer = setInterval(() => {
    const list = Array.isArray(symbols) ? symbols : (symbols.value || [])
    list.forEach(sym => {
      const p = nextPrice(sym)
      // 写入“伪 socket”的价格表，UI 就会读到
      if (socketStore?.prices?.set) {
        socketStore.prices.set(sym, p)
      }
      // 推进 spark 数据
      marketStore.pushTick(sym, p)
    })
  }, intervalMs)

  // 提供停止函数
  return () => clearInterval(timer)
}
