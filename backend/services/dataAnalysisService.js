import mysql from 'mysql2/promise';
import db from '../config/db.js';

export const getPieChartData = async () => {
  const [rows] = await db.execute(`
    SELECT symbol, tot_gain_unrl_amt 
    FROM watchlist 
    WHERE status = 'Active' AND tot_gain_unrl_amt > 0
  `);
  return {
    labels: rows.map(row => row.symbol),
    values: rows.map(row => row.tot_gain_unrl_amt)
  };
};

export const getBarChartData = async () => {
  const [rows] = await db.execute(`
    SELECT symbol, tot_gain_unrl_amt 
    FROM watchlist 
    WHERE status = 'Active'
  `);
  return {
    labels: rows.map(row => row.symbol),
    values: rows.map(row => row.tot_gain_unrl_amt)
  };
};

// add roi
export const getRoiData = async () => {
  const [rows] = await db.execute(`
    SELECT symbol, (tot_gain_unrl_amt / total_cost) * 100 AS roi
    FROM watchlist 
    WHERE status = 'Active' AND total_cost > 0
  `);
  return {
    labels: rows.map(row => row.symbol),
    values: rows.map(row => parseFloat(row.roi.toFixed(2)))  // 保留两位小数
  };
};