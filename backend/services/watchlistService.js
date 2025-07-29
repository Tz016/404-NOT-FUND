// 计算单个股票的扩展字段
export const calculateStockMetrics = (stockData) => {
  const { lastPrice, avgCost, shares } = stockData;
  

  // 计算逻辑
  return {
    marketValue:lastPrice * shares,
    dayGainPercent: ((lastPrice - avgCost) / avgCost * 100).toFixed(2),
    totalGainDollar: (lastPrice - avgCost) * shares,
    
  };
};

// 批量处理股票数据（如果需要）
export const processWatchlistData = (stocks) => {
  return stocks.map(stock => ({
    ...stock,
    ...calculateStockMetrics(stock)
  }));
};
