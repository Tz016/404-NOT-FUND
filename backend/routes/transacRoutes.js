import express from 'express';
import { getTransactionHandler, createTransactionHandler } from '../controllers/transactionController.js';

const router = express.Router();


router.get('/:account_id/:symbol', getTransactionHandler);
router.post('/addTransaction', createTransactionHandler);

export default router;