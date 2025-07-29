import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import watchlistRoutes from './routes/watchlistRoutes.js'; 
import stockRoutes from './routes/stockRoutes.js';
import {Server} from 'socket.io';
import {createServer} from 'http';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3002", // 前端地址
    methods: ["GET", "POST"]
  }
});

// Socket.IO 连接逻辑
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
 
  // 监听客户端订阅请求
  socket.on('subscribe', (symbol) => {
    console.log(`Subscribed to ${symbol}`);
    
    // 模拟实时推送（实际替换为你的价格获取逻辑）
    const interval = setInterval(async () => {
      try {
        const price = await getStockPrice(symbol); // 使用之前实现的service
        socket.emit('priceUpdate', { symbol, price });
      } catch (error) {
        socket.emit('error', error.message);
      }
    }, 3000); // 每3秒推送一次
 
    // 取消订阅时清除定时器
    socket.on('unsubscribe', () => {
      clearInterval(interval);
    });
 
    // 断开连接时清理
    socket.on('disconnect', () => {
      clearInterval(interval);
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
});

// Swagger 配置
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '404_not_fund API',
      version: '1.0.0',
      description: 'portfolio API doc',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json()); // 解析 JSON 格式的请求体
app.use(express.urlencoded({ extended: true })); // 解析 URL 编码的请求体

// 路由
app.use('/watchlist', watchlistRoutes);
app.use('/stocks', stockRoutes);

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false,
    error: 'Something broke!' 
  });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on at http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  console.log(`Frontend should connect to http://localhost:3002`);
});