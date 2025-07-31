import WatchlistModel from '../models/watchlistModel.js'; // 注意文件扩展名 .js
import transactionModel from '../models/transactionModel.js'; // 注意文件扩展名 .js
import yahooFinance from 'yahoo-finance2';

import {getStockPrice} from '../services/stockService.js';


const addWatchlistItem = async (req, res) => {
    try {
        const { symbol,  accountId ,which_table} = req.body;

        // 检查股票是否已存在于watchlist中
        const existingItem = await WatchlistModel.findOne( symbol, accountId );
        if (existingItem != null && existingItem.which_table === which_table) {
            return res.status(400).json({
                success: false,
                error: 'Stock already exists in '+ 'table:'+ existingItem.which_table,
            });
        }

        // 根据symbol获取实时价格
        const quote = await yahooFinance.quote(symbol);
        console.log(`${symbol} last_price: ${quote.regularMarketPrice}`);
        

        const watchlistData = {
            account_id: accountId,
            symbol,
            which_table,
            last_price: quote.regularMarketPrice,
        };

        const watchId = await WatchlistModel.create(watchlistData);
        res.status(201).json({
            success: true,
            data: { watch_id: watchId, ...watchlistData }
        }); 

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// 根据accountId获取watchlist项
const getWatchlistItem = async (req, res) => {
  try {
    const { accountId } = req.params;
    const items = await WatchlistModel.findByAccountId( accountId );
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

// 根据watchId删除watchlist项
const deleteWatchlistItem = async (req, res) => {
    try {
        const { accountId , symbol ,watchId , which_table } = req.body;
        if (!watchId) {
            return res.status(400).json({
                success: false,
                error: 'watchId is required'
            });
        }

        // 确保 which_table 是有效的值（0, 1 或 2）
        if (which_table !== "0" && which_table !== "1" && which_table !== "2") {
            return res.status(400).json({
                success: false,
                error: 'which_table must be 0, 1, or 2'
            });
        }
        const affectedRows = await WatchlistModel.delete(accountId , symbol ,watchId , which_table);
       
        if (affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Watchlist item not found'
            });
        }

        res.status(200).json({
            success: true,
            data: { watchId}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};


const updateWatchlistItem = async (req, res) => {
    // 入参
    const symbol = req.body.symbol;
    const shares = req.body.shares;
    const date = req.body.date;
    const last_price = req.body.last_price;
    
    
    /* 
    Status 
    Shares 当前持有股数（支持小数)
    Last Price 股票最新市场价格
    AC/Share 每股平均成本（Average Cost） 总成本 / 总买入股数
    Total Cost ($) 总成本（所有买入支出的总和）总投资成本（Shares × AC/Share）
    Market Value ($) 当前持仓市值 Shares × Last Price
    Tot Div Income ($) 累计股息收入 
    Day Gain UNRL (%) 当日股价变动导致的浮动盈亏百分比 (Last Price - 昨日收盘价) / 昨日收盘价 × 100%
    Day Gain UNRL ($)当日股价变动导致的浮动盈亏金额 (Last Price - 昨日收盘价) × Shares
    Tot Gain UNRL (%)持仓总浮动盈亏百分比（相对于成本价）(Market Value - Total Cost) / Total Cost × 100%
    Tot Gain UNRL ($)持仓总浮动盈亏金额  (Market Value - Total Cost)
    Realized Gain (%) 已卖出部分的盈亏百分比 
    Realized Gain ($)已卖出部分的盈亏金额   
     */

    const Status = 'Active'; 
    const ac_share = last_price / shares; 
    const total_cost = last_price * ac_share;
    const market_value = last_price * shares;



    const transactionData = {
        date,                  // 对应数据库的 date 字段
        symbol,        // 数据库字段是 symbol
        shares,               
        cost_per_share: last_price,  // 数据库字段是 cost_per_share，而你代码里用 last_price
        total_cost,           
        market_value,         
    };
    // 创建交易记录
    transactionModel.create(transactionData);

     return res.status(200).json({
        success: true,
        data: {transactionData}
    });

};


export default {
    addWatchlistItem,
    getWatchlistItem,
    updateWatchlistItem,
    deleteWatchlistItem
};
