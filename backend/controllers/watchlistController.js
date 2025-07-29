import WatchlistModel from '../models/watchlistModel.js'; // 注意文件扩展名 .js
import transactionModel from '../models/transactionModel.js'; // 注意文件扩展名 .js
import yahooFinance from 'yahoo-finance2';

// 添加股票到watchlist
const addWatchlistItem = async (req, res) => {
    try {
        const { ticker, types, accountId } = req.body;

        // 检查股票是否已存在于watchlist中
        const existingItem = await WatchlistModel.findOne( ticker, accountId );
        if (existingItem) {
            return res.status(400).json({
                success: false,
                error: 'Stock already exists in the watchlist'
            });
        }

        // 根据ticker获取实时价格
        const quote = await yahooFinance.quote(ticker);
        console.log(`${ticker} last_price: ${quote.regularMarketPrice}`);
        

        const watchlistData = {
            account_id: accountId,
            ticker,
            symbol: ticker,
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
        const { watchId } = req.body;
        if (!watchId) {
            return res.status(400).json({
                success: false,
                error: 'watchId is required'
            });
        }

        const affectedRows = await WatchlistModel.delete(watchId);
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
    // 
    ticker = req.body.ticker;
    shares = req.body.shares;
    date = req.body.date;
    
    
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

    Status = 'Active'; 
    last_price = realTimeData.now; 
    ac_share = realTimeData.now / shares; 


    transactionData = {
        date,
        Status,
        ticker,
        shares,
        timestamp,
        last_price,
        ac_share,

    }
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
