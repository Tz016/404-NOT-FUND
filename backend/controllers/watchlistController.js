import WatchlistModel from '../models/watchlistModel.js'; // 注意文件扩展名 .js
import transactionModel from '../models/transactionModel.js'; // 注意文件扩展名 .js
import { stocks } from "stock-api";

const addWatchlistItem = async (req, res) => {
    try {
        const { ticker, types, accountId } = req.body;
        // 检查是否已存在相同的股票
        // const existingItem = await Watchlist.findByTickerAndAccount(ticker, Account_id);
        // if (existingItem) {
        //     return res.status(400).json({
        //         success: false,
        //         error: 'This stock is already in your watchlist'
        //     });
        // }

        // 获取实时价格
        const realTimeData = await stocks.tencent.getStock(ticker);
        if (!realTimeData) {
            return res.status(400).json({
                success: false,
                error: 'Invalid ticker symbol or stock not found'
            });
        }

        const watchlistData = {
            Account_id,
            ticker,
            last_price: realTimeData.now,
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

const searchWatchlistItem = async (req, res) => {
    try {
        const { ticker } = req.query;
        if (!ticker) {
            return res.status(400).json({
                success: false,
                error: 'Ticker symbol is required'
            });
        }
        const realTimeData = await stocks.tencent.getStock(ticker);

        // 查询该ticker是否在watchlist中，如果存在，返回标志位1，否则返回0
        const watchlistItem = await WatchlistModel.findById(ticker);
        if (watchlistItem) {
            return res.status(200).json({
                success: true,
                data: {
                    watch_id: watchlistItem.watch_id,
                    exists: 1,
                    last_price: watchlistItem.last_price
                }
            });
        }
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

const deleteWatchlistItem = async (req, res) => {
    try {
        const { watchId } = req.body;
        if (!watchId) {
            return res.status(400).json({
                success: false,
                error: 'Watch ID is required'
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
            data: { watch_id: watchId }
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
    timestamp = req.body.timestamp;
    // 
    const realTimeData = await stocks.tencent.getStock(ticker);

    /* 计算下面指标
    Date
    Status 
    Shares 当前持有股数（支持小数)
    Last Price 股票最新市场价格
    AC/Share 每股平均成本（Average Cost） 总成本 / 总买入股数
    Total Cost ($) 总成本（所有买入支出的总和）
    Market Value ($) 当前持仓市值
    Tot Div Income ($) 累计股息收入（持有期间收到的所有股息）
    Day Gain UNRL (%) 当日股价变动导致的浮动盈亏百分比
    Day Gain UNRL ($)当日股价变动导致的浮动盈亏金额
    Tot Gain UNRL (%)持仓总浮动盈亏百分比（相对于成本价）
    Tot Gain UNRL ($)持仓总浮动盈亏金额
    Realized Gain (%) 已卖出部分的盈亏百分比
    Realized Gain ($)已卖出部分的盈亏金额
     */
    date = new Date(timestamp).toISOString().split('T')[0]; 
    Status = 'Open'; 
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
    transactionModel.create(transactionData);

     return res.status(200).json({
        success: true,
        data: {transactionData}
    });







};


export default {
    addWatchlistItem,
    searchWatchlistItem,
    updateWatchlistItem,
    deleteWatchlistItem
};
