import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import watchlistRoutes from './routes/watchlistRoutes.js'; 
import stockRoutes from './routes/stockRoutes.js';
import {Server} from 'socket.io';
import {createServer} from 'http';
import {initSocketIO} from './services/socketService.js';
import accountRoutes from './routes/accountRoutes.js';
import transactionRoutes from './routes/transacRoutes.js';
import cors from 'cors';


const app = express();
const httpServer = createServer(app);
app.use(cors());
// 初始化 Socket.IO
const io = initSocketIO(httpServer); // 传入 httpServer

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
app.use('/accounts', accountRoutes);
app.use('/transactions', transactionRoutes);

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

export default app; // 导出 app 以便在其他地方使用