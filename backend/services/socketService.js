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
 
    // 订阅指定字段
    socket.on('subscribe', async ({ symbol, fields ,accountId}) => {
      if (!subscriptions.has(symbol)) {
        subscriptions.set(symbol, { fields,accountId, interval: null  });
      }
 
      // 更新订阅字段
      const subscription = subscriptions.get(symbol);
      subscription.fields = fields; 
      subscription.accountId = accountId; // 更新accountId
 
      // 如果已有定时器，先清除
      if (subscription.interval) {
        clearInterval(subscription.interval);
      }

    // 立即发送一次数据
      pushAnalysisData(socket);
      // 立即发送一次数据（避免等待第一个interval）
      pushStockData(socket, symbol,accountId ,fields);
 
      subscription.interval = setInterval(
        () => pushAnalysisData(socket),
        () => pushStockData(socket, symbol,accountId ,fields),
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
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
 
  return io;
};

// 统一处理数据获取和推送
async function pushStockData(socket, symbol, accountId ,fields) {
  try {
    const realTimeData = await getStockPrice(symbol);
    const rowData = watchlistModel.findByTickerAndId(symbol, accountId); // 检查是否在watchlist中
    
    const { regularMarketPrice } = realTimeData;
    const {shares , ac_share , total_cost } = rowData;
    
    const calculatedData = calculateStockMetrics(regularMarketPrice , shares , ac_share , total_cost); // 使用计算服务
    
    const filteredData = {};
    fields.split(',').forEach(field => {
      if (calculatedData[field] !== undefined) { // 现在可以访问计算字段
        filteredData[field] = calculatedData[field];
      }
    });
 
    socket.emit('stockUpdate', { symbol, ...filteredData });
  } catch (error) {
    socket.emit('error', error.message);
  }
}


// 推送分析数据
async function pushAnalysisData(socket) {
  try {
    const [pieData, barData, roiData] = await Promise.all([
      getPieChartData(),
      getBarChartData(),
      getRoiData()  // ✅ 加入 ROI
    ]);
    
    socket.emit('analysisUpdate', {
      pieData,
      barData,
      roiData  // ✅ 发送给前端
    });
  } catch (error) {
    socket.emit('error', error.message);
  }
}
