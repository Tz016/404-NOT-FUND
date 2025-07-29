import { searchStocks,getStockPrice } from '../services/stockService.js';

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
