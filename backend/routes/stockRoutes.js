import express from 'express';
import { searchStocksHandler,getStockPriceHandler } from '../controllers/stockController.js';
 
const router = express.Router();
 
router.get('/search', searchStocksHandler);

router.get('/price/:symbol', getStockPriceHandler);
 
export default router;