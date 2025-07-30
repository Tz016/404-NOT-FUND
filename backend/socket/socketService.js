// backend/socket/socketService.js
import { Server } from 'socket.io';
import {getStockPrice} from '../services/stockService.js';
import { calculateStockMetrics } from '../services/watchlistService.js';
import watchlistModel from '../models/watchlistModel.js';
import { getPieChartData, getBarChartData } from '../services/dataAnalysisService.js';
import { getRoiData } from '../services/roiService.js';

export const initSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3002",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);
    const subscriptions = new Map();

    socket.on('subscribe', async ({ symbol, fields, accountId }) => {
      if (!subscriptions.has(symbol)) {
        subscriptions.set(symbol, { fields, accountId, interval: null });
      }

      const subscription = subscriptions.get(symbol);
      subscription.fields = fields;
      subscription.accountId = accountId;

      if (subscription.interval) {
        clearInterval(subscription.interval);
      }

      pushAnalysisData(socket);
      pushStockData(socket, symbol, accountId, fields);

      subscription.interval = setInterval(() => {
        pushAnalysisData(socket);
        pushStockData(socket, symbol, accountId, fields);
      }, 5000);
    });

    socket.on('unsubscribe', (symbol) => {
      if (subscriptions.has(symbol)) {
        clearInterval(subscriptions.get(symbol).interval);
        subscriptions.delete(symbol);
      }
    });

    socket.on('disconnect', () => {
      subscriptions.forEach(sub => clearInterval(sub.interval));
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

async function pushStockData(socket, symbol, accountId, fields) {
  try {
    const realTimeData = await getStockPrice(symbol);
    const rowData = await watchlistModel.findByTickerAndId(symbol, accountId);
    const { regularMarketPrice } = realTimeData;
    const { shares, ac_share, total_cost } = rowData;
    const calculatedData = calculateStockMetrics(regularMarketPrice, shares, ac_share, total_cost);

    const filteredData = {};
    fields.split(',').forEach(field => {
      if (calculatedData[field] !== undefined) {
        filteredData[field] = calculatedData[field];
      }
    });

    socket.emit('stockUpdate', { symbol, ...filteredData });
  } catch (err) {
    socket.emit('error', err.message);
  }
}

async function pushAnalysisData(socket) {
  try {
    const [pieData, barData, roiData] = await Promise.all([
      getPieChartData(),
      getBarChartData(),
      getRoiData(),
    ]);

    socket.emit('analysisUpdate', {
      pieData,
      barData,
      roiData,
    });
  } catch (err) {
    socket.emit('error', err.message);
  }
}
