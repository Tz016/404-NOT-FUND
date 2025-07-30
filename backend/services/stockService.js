import yahooFinance from 'yahoo-finance2';

export const searchStocks = async (query) => {
  try {
    const results = await yahooFinance.search(query);
    return results.quotes || [];
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    throw new Error('Failed to fetch stock data');
  }
};

export const getPopularStocks = async (n = 10) => {
  try {
    const popular_stocks = [
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'INTC', 'AMD', 'ADBE',
      'JPM', 'BAC', 'V', 'MA', 'GS', 'WFC', 'UNH', 'JNJ', 'PFE', 'MRK',
      'ABBV', 'GILD', 'WMT', 'TGT', 'HD', 'NKE', 'SBUX', 'MCD', 'COST', 'BA',
      'CAT', 'HON', 'GE', 'XOM', 'CVX', 'COP', 'BP', 'T', 'VZ', 'DIS',
      'NFLX', 'TMUS', 'QCOM', 'AVGO', 'TXN', 'PYPL', 'CRM', 'IBM', 'UBER', 'LYFT',
      'SQ'
  ]
  
    // 根据批量查询股票信息
    const stockDetailsPromises = popular_stocks.map(symbol => yahooFinance.quote(symbol).catch(err => {
      console.warn(`无法获取股票 ${symbol} 的信息:`, err.message);
      return null; // 返回 null 而不是让 Promise 失败
    }));
    const stockDetails = await Promise.all(stockDetailsPromises);

    // 过滤掉无效的结果并将股票信息转换为JSON格式
    const stockDetailsJson = stockDetails
      .filter(quote => quote !== null && quote !== undefined) // 过滤掉 null 和 undefined 值
      .map(quote => ({
        symbol: quote.symbol,
        regularMarketPrice: quote.regularMarketPrice,
        currency: quote.currency,
        longName: quote.longName,
        exchange: quote.fullExchangeName
      }));

    // 根据n返回前n个股票信息
    const stockDetailsJsonSlice = stockDetailsJson.slice(0, n);
    return stockDetailsJsonSlice;

  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    throw new Error('Failed to fetch popular stocks');
  }
   
};


export const getStockPrice = async (symbol) => {
  try {
    const quote = await yahooFinance.quote(symbol);
    return {
      symbol: quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      currency: quote.currency,
      longName: quote.longName,
      exchange: quote.fullExchangeName
    };
  } catch (error) {
    console.error('Yahoo Finance API Error:', error);
    throw new Error(`Failed to fetch price for symbol: ${symbol}`);
  }
};


