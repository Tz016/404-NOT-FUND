import express from 'express';
import { getAccountHandler, updateAccountBalanceHandler } from '../controllers/accountController.js';

const router = express.Router();

/**
 * @swagger
 * /accounts/{accountId}:
 *   get:
 *     summary: 根据ID获取账户信息
 *     description: 根据账户ID查询账户详细信息
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         description: 账户ID
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: 成功获取账户信息
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
 *                     account_id:
 *                       type: integer
 *                       example: 100023
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     national_ID:
 *                       type: integer
 *                       example: 123456789
 *                     balance:
 *                       type: number
 *                       example: 1000.00
 *                     occupation:
 *                       type: string
 *                       example: Software Engineer
 *                     phone_number:
 *                       type: string
 *                       example: 13022456789
 *                     email:
 *                       type: string
 *                       example: john.doe@gmail.com
 *                     address:
 *                       type: string
 *                       example: 123 Elm Street, Springfield
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: 请求参数错误
 *       404:
 *         description: 账户未找到
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:accountId', getAccountHandler);

router.put('/:accountId', updateAccountBalanceHandler);

export default router;