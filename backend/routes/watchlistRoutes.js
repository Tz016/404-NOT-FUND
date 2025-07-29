import express from 'express';
const router = express.Router();

import watchlistController from '../controllers/watchlistController.js'; // Adjust the import based on your file structure

/**
 * @swagger
 * /api/watchlist:
 *   post:
 *     summary: 添加股票到观察列表
 *     description: 将指定股票添加到用户的观察列表，并获取实时价格
 *     tags:
 *       - 观察列表
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticker
 *               - accountId
 *             properties:
 *               ticker:
 *                 type: string
 *                 description: 股票代码/标识符
 *                 example: "AAPL"
 *               types:
 *                 type: string
 *                 description: 股票类型(可选)
 *                 example: "stock"
 *               accountId:
 *                 type: integer
 *                 description: 关联的账户ID
 *                 example: 12345
 *     responses:
 *       201:
 *         description: 成功添加观察项
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     watch_id:
 *                       type: integer
 *                       description: 观察项ID
 *                       example: 1
 *                     Account_id:
 *                       type: integer
 *                       example: 12345
 *                     ticker:
 *                       type: string
 *                       example: "AAPL"
 *                     last_price:
 *                       type: number
 *                       format: float
 *                       description: 当前价格
 *                       example: 150.25
 *       400:
 *         description: 无效请求或股票已存在/未找到
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Invalid ticker symbol or stock not found"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 */
router.post('/add', watchlistController.addWatchlistItem);

/**
 * @swagger
 * /api/watchlist/search:
 *   get:
 *     summary: 搜索观察列表中的股票
 *     description: 根据股票代码查询是否存在于观察列表中，并返回实时价格信息
 *     tags:
 *       - 观察列表
 *     parameters:
 *       - in: query
 *         name: ticker
 *         schema:
 *           type: string
 *         required: true
 *         description: 要搜索的股票代码
 *         example: "AAPL"
 *     responses:
 *       200:
 *         description: 成功查询股票信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     watch_id:
 *                       type: integer
 *                       description: 观察项ID(如果存在)
 *                       example: 1
 *                     exists:
 *                       type: boolean
 *                       description: 是否存在于观察列表
 *                       example: true
 *                     last_price:
 *                       type: number
 *                       format: float
 *                       description: 最新价格
 *                       example: 150.25
 *       400:
 *         description: 缺少必要参数或无效请求
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Ticker symbol is required"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch stock data"
 */
router.get('/search', watchlistController.searchWatchlistItem);

/**
 * @swagger
 * /api/watchlist:
 *   delete:
 *     summary: 从观察列表中删除股票
 *     description: 根据观察项ID从用户的观察列表中删除指定股票
 *     tags:
 *       - 观察列表
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watchId
 *             properties:
 *               watchId:
 *                 type: integer
 *                 description: 要删除的观察项ID
 *                 example: 123
 *     responses:
 *       200:
 *         description: 成功删除观察项
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: int
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     watch_id:
 *                       type: integer
 *                       description: 被删除的观察项ID
 *                       example: 123
 *       400:
 *         description: 缺少必要参数或无效请求
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Watch ID is required"
 *       404:
 *         description: 观察项未找到
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Watchlist item not found"
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   example: "Database operation failed"
 */
router.put('/delete', watchlistController.deleteWatchlistItem);

router.put('/update/addTransaction', watchlistController.updateWatchlistItem);

export default router;
