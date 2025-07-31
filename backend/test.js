// 安装依赖
// npm install socket.io-client

import { io } from "socket.io-client";
const socket = io("ws://localhost:3000");

socket.on("connect", () => {
  console.log("connected");
  socket.emit("subscribeAnalysis");
});

socket.on("analysisUpdate", (data) => {
  console.log("分析数据：", data);
});