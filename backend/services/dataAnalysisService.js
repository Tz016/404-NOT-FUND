import mysql from 'mysql2/promise';
import db from '../config/db.js';

import WatchlistModel from '../models/watchlistModel.js';
// import stockService from './stockService.js';

export const getPieChartData = async () => {

  // const account_id = 100023;
  // // 遍历account_id下的所持仓
  // const watchlists = await WatchlistModel.findByAccountId(account_id);

  // for (const watchlist of watchlists) {
  //   const symbol = watchlist.symbol;
  //   // which_table == 1 为持仓
  //   if (watchlist.which_table == 1) {
  //     // 获取持仓信息shares ac_share total_cost
  //     const shares = watchlist.shares;
  //     const ac_share = watchlist.ac_share;
  //     const total_cost = watchlist.total_cost;
      
  //     const last_price = await stockService.getStockPrice(symbol);
  //   }
  // }
  

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