const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// ✅ 数据库配置
const dbConfig = {
  host: '172.22.30.219',
  user: 'root',
  password: '123456',
  database: 'portfolio_db'
};

// 🎯 饼图数据接口：只返回正收益股票
router.get('/api/pie-data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT symbol, tot_gain_unrl_amt 
      FROM watchlist 
      WHERE status = 'Active' AND tot_gain_unrl_amt > 0
    `);

    const labels = rows.map(row => row.symbol);
    const values = rows.map(row => row.tot_gain_unrl_amt);

    await connection.end();

    res.json({ labels, values });
  } catch (err) {
    console.error('❌ Error fetching pie data:', err);
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
});

// 📊 柱状图数据接口：返回所有 active 持仓股票
router.get('/api/bar-data', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`
      SELECT symbol, tot_gain_unrl_amt 
      FROM watchlist 
      WHERE status = 'Active'
    `);

    const labels = rows.map(row => row.symbol);
    const values = rows.map(row => row.tot_gain_unrl_amt);

    await connection.end();

    res.json({ labels, values });
  } catch (err) {
    console.error('❌ Error fetching bar data:', err);
    res.status(500).json({ error: 'Failed to fetch bar chart data' });
  }
});

module.exports = router;
