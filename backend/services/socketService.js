import { Server } from 'socket.io';
import {getStockPrice} from '../services/stockService.js';
import { calculateStockMetrics } from '../services/watchlistService.js';
import WatchlistModel from '../models/watchlistModel.js'; 
import { getPieChartData, getBarChartData,getRoiData } from '../services/dataAnalysisService.js';


// 封装 Socket.IO 逻辑
/*
前端代码（React/Vue等）
socket.emit('subscribe', { 
  symbol: 'AAPL', 
  fields: 'price,volume,changePercent' // 订阅多个字段
});
*/
export const initSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    const subscriptions = new Map(); // 存储订阅的股票及字段

    // 新增：分析数据定时推送
    const analysisInterval = setInterval(() => {
      pushAnalysisData(socket);
    }, 5000);

    // 订阅指定字段
    socket.on('subscribe', async ({ symbol, fields}) => {
      console.log('收到subscribe', symbol, fields);
      if (!subscriptions.has(symbol)) {
        subscriptions.set(symbol, { fields, interval: null });
      }

      // 更新订阅字段
      const subscription = subscriptions.get(symbol);
      subscription.fields = fields;

      // 如果已有定时器，先清除
      if (subscription.interval) {
        clearInterval(subscription.interval);
      }

      // 立即推送一次
      pushStockData(socket, symbol, fields);

      // 定时推送
      subscription.interval = setInterval(
        () => pushStockData(socket, symbol, fields),
        3000
      );
    });

    // 取消订阅
    socket.on('unsubscribe', (symbol) => {
      if (subscriptions.has(symbol)) {
        clearInterval(subscriptions.get(symbol).interval);
        subscriptions.delete(symbol);
      }
    });

    // 断开连接清理
    socket.on('disconnect', () => {
      subscriptions.forEach((sub) => clearInterval(sub.interval));
      clearInterval(analysisInterval); // 清理分析数据定时器
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
 
  return io;
};

// 统一处理数据获取和推送
async function pushStockData(socket, symbol, fields) {
  try {
    // 获取实时价格
    const getStockData = await getStockPrice(symbol);
    // 根据symbol查询watchlist表的shares
    const account_id = 100023;
    const watchlistData = await WatchlistModel.findBySymbol(symbol,account_id);
    const shares = watchlistData.shares;
    const market_value = getStockData.regularMarketPrice * shares;
    const total_cost = watchlistData.total_cost;
    const realized_gain_dollar = market_value - total_cost;
    const day_gain_unrl_dollar = getStockData.regularMarketPrice - watchlistData.last_price;
    const day_gain_unrl_percent = (day_gain_unrl_dollar / watchlistData.last_price) * 100;
    
    const realTimeData = {
      ...getStockData,
      shares,
      market_value,
      total_cost,
      realized_gain_dollar,
      day_gain_unrl_dollar,
      day_gain_unrl_percent,
    }
    // 只推送需要的字段
    const filteredData = {};
    fields.split(',').forEach(field => {
      if (realTimeData[field] !== undefined) {
        filteredData[field] = realTimeData[field];
      }
    });

    // 日志输出，便于调试
    console.log(`实时推送股票数据: ${symbol}  ${JSON.stringify(filteredData)}`);

    // 推送给前端
    socket.emit('stockUpdate', { symbol, ...filteredData });
  } catch (error) {
    socket.emit('error', error.message);
  }
}


// 推送分析数据
async function pushAnalysisData(socket) {
  try {
    console.log('推送分析数据');
    const [pieData, barData, roiData] = await Promise.all([
      getPieChartData(),
      getBarChartData(),
      getRoiData()  // ✅ 加入 ROI
    ]);
    console.log('推送分析数据：',pieData,barData,roiData);
    socket.emit('analysisUpdate', {
      pieData,
      barData,
      roiData  // ✅ 发送给前端
    });
  } catch (error) {
    socket.emit('error', error.message);
  }
}
