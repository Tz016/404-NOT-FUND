import express from 'express';
const router = express.Router();

import watchlistController from '../controllers/watchlistController.js'; // Adjust the import based on your file structure

router.post('/add', watchlistController.addWatchlistItem);

router.get('/search',watchlistController.searchWatchlistItem);

router.get('/account/:accountId', watchlistController.getWatchlistByAccount);

router.put('/:watchId', watchlistController.updateWatchlistItem);

router.delete('/:watchId', watchlistController.deleteWatchlistItem);

export default router;
