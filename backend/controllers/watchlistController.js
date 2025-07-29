import Watchlist from '../models/watchlistModel.js'; // 注意文件扩展名 .js
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
            types,
            ticker,
            last_price: realTimeData.now,
        };

        const watchId = await Watchlist.create(watchlistData);
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
        const watchlistItem = await Watchlist.findById(ticker);
        if (watchlistItem) {
            return res.status(200).json({
                success: true,
                data: {
                    watch_id: watchlistItem.watch_id,
                    exists: true,
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

        const affectedRows = await Watchlist.delete(watchId);
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


// const getWatchlistByAccount = async (req, res) => {
//     try {
//         const { accountId } = req.params;
//         const watchlist = await Watchlist.findByAccountId(accountId);

//         // 更新每个项目的实时价格
//         const updatedWatchlist = await Promise.all(watchlist.map(async item => {
//             const stockData = await Watchlist.getStockPrice(item.ticker);
//             return {
//                 ...item,
//                 last_price: stockData.price
//             };
//         }));

//         res.status(200).json({
//             success: true,
//             data: updatedWatchlist
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// };

const updateWatchlistItem = async (req, res) => {
    // 
    shares = req.body.shares;
    

};

// const deleteWatchlistItem = async (req, res) => {
//     try {
//         const { watchId } = req.params;
//         const affectedRows = await Watchlist.delete(watchId);

//         if (affectedRows === 0) {
//             return res.status(404).json({
//                 success: false,
//                 error: 'Watchlist item not found'
//             });
//         }

//         res.status(200).json({
//             success: true,
//             data: { watch_id: watchId }
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// };
export default {
    addWatchlistItem,
    searchWatchlistItem,
    getWatchlistByAccount,
    updateWatchlistItem,
    deleteWatchlistItem
};
