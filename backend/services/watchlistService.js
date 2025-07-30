// 计算单个股票的扩展字段
export const calculateStockMetrics = (stockData) => {
  const {
    lastPrice, avgCost, shares, previousClose, total_cost, market_value, realized_gain_dollar = 0 
  } = stockData;

  // 当日未实现盈亏 ($)
  const dayGainUnrlAmt = (lastPrice - previousClose) * shares;
  // 当日未实现盈亏 (%)
  const dayGainUnrlPct = (dayGainUnrlAmt / (previousClose * shares)) * 100;
  // 总未实现盈亏 ($)
  const totGainUnrlAmt = market_value - total_cost;
  // 总未实现盈亏 (%)
  const totGainUnrlPct = (totGainUnrlAmt / total_cost) * 100;
  // 已实现盈亏 ($)
  const realizedGainDollar = realized_gain_dollar;
  // 已实现盈亏 (%)
  const realizedGainPercent = (realizedGainDollar / total_cost) * 100;

  return {
    dayGainUnrealizedDollar: dayGainUnrlAmt.toFixed(2),
    dayGainUnrealizedPercent: dayGainUnrlPct.toFixed(2),
    totalGainUnrealizedDollar: totGainUnrlAmt.toFixed(2),
    totalGainUnrealizedPercent: totGainUnrlPct.toFixed(2),
    realizedGainDollar: realizedGainDollar.toFixed(2),
    realizedGainPercent: realizedGainPercent.toFixed(2)
  };
};

// 批量处理股票数据（如果需要）
export const processWatchlistData = (stocks) => {
  return stocks.map(stock => ({
    ...stock,
    ...calculateStockMetrics(stock)
  }));
};
