import express from 'express';
import { searchStocksHandler, getStockPriceHandler, getPopularStocksHandler } from '../controllers/stockController.js';
 
const router = express.Router();

router.get('/popular', getPopularStocksHandler);
 
router.get('/search', searchStocksHandler);

router.get('/price/:symbol', getStockPriceHandler);
 
export default router;