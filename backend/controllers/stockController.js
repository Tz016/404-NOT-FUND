import { searchStocks, getStockPrice, getPopularStocks } from '../services/stockService.js';

export const getPopularStocksHandler = async (req, res) => {
  try {
    const count = parseInt(req.query.n) || 10;
    
    if (count <= 0 || count > 50) {
      return res.status(400).json({ error: '参数 n 必须在 1 到 50 之间' });
    }
    
    const popularStocks = await getPopularStocks(count);
    res.json(popularStocks);
  } catch (error) {
    res.status(500).json({ error: error.message || '服务器内部错误' });
  }
};

export const searchStocksHandler = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const stocks = await searchStocks(query);
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

export const getStockPriceHandler = async (req, res) => {
  try {
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ error: 'Stock symbol is required' });
    }

    const stockPrice = await getStockPrice(symbol);
    res.json(stockPrice);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
