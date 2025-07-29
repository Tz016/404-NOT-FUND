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


