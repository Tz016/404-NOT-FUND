import express from 'express';
const watchlistRouter = express.Router();

import watchlistController from '../controllers/watchlistController.js'; // Adjust the import based on your file structure
import { watch } from 'vue';

/**
 * @swagger
 * /watchlist/add:
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
watchlistRouter.post('/add', watchlistController.addWatchlistItem);

watchlistRouter.get('/:accountId', watchlistController.getWatchlistItem);

/**
 * @swagger
 * /watchlist/delete:
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
watchlistRouter.put('/delete', watchlistController.deleteWatchlistItem);


watchlistRouter.put('/update/addTransaction', watchlistController.updateWatchlistItem);



// // 🎯 饼图数据接口：只返回正收益股票
// router.get('/api/pie-data', async (req, res) => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     const [rows] = await connection.execute(`
//       SELECT symbol, tot_gain_unrl_amt 
//       FROM watchlist 
//       WHERE status = 'Active' AND tot_gain_unrl_amt > 0
//     `);

//     const labels = rows.map(row => row.symbol);
//     const values = rows.map(row => row.tot_gain_unrl_amt);

//     await connection.end();

//     res.json({ labels, values });
//   } catch (err) {
//     console.error('❌ Error fetching pie data:', err);
//     res.status(500).json({ error: 'Failed to fetch pie chart data' });
//   }
// });

// // 📊 柱状图数据接口：返回所有 active 持仓股票
// router.get('/api/bar-data', async (req, res) => {
//   try {
//     const connection = await mysql.createConnection(dbConfig);
//     const [rows] = await connection.execute(`
//       SELECT symbol, tot_gain_unrl_amt 
//       FROM watchlist 
//       WHERE status = 'Active'
//     `);

//     const labels = rows.map(row => row.symbol);
//     const values = rows.map(row => row.tot_gain_unrl_amt);

//     await connection.end();

//     res.json({ labels, values });
//   } catch (err) {
//     console.error('❌ Error fetching bar data:', err);
//     res.status(500).json({ error: 'Failed to fetch bar chart data' });
//   }
// });

export default watchlistRouter;
