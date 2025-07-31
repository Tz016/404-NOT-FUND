// 计算单个股票的扩展字段
export const calculateStockMetrics = (stockData) => {
  const {lastPrice, shares, total_cost} = stockData;

  // market_value 计算
  const market_value = lastPrice * shares;
  // 总未实现盈亏 ($)
  const totGainUnrlAmt = market_value - total_cost;
  // 总未实现盈亏 (%)
  const totGainUnrlPct = (totGainUnrlAmt / total_cost) * 100;
   
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
