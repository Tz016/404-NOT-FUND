import transactionModel from '../models/transactionModel.js';


export const createTransactionHandler = async (req, res) => {
    const {account_id,symbol,shares,last_price,date} = req.body;
    const transactionId = await transactionModel.create({
        account_id,
        symbol,
        shares,
        cost_per_share: last_price,
        date,
        total_cost: last_price * shares,
        market_value: last_price * shares,
    });
    // 需要返回total_cost和market_value
    res.status(200).json({
        success: true,
        message: 'Transaction created successfully',
        transactionId,
        total_cost: last_price * shares,
        market_value: last_price * shares
    });
};

export const getTransactionHandler = async (req, res) => {
    const account_id = req.params.account_id;
    const symbol = req.params.symbol;
    const transaction = await transactionModel.get(account_id, symbol);
    res.json(transaction);
};

export default {
    getTransactionHandler,
    createTransactionHandler
};