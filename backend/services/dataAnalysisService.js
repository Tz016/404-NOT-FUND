import mysql from 'mysql2/promise';
import db from '../config/db.js';

import WatchlistModel from '../models/watchlistModel.js';
import {getStockPrice} from './stockService.js';

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
  // const [rows] = await db.execute(`
  //   SELECT symbol, tot_gain_unrl_amt 
  //   FROM watchlist 
  //   WHERE status = 'Active'
  // `);
  // return {
  //   labels: rows.map(row => row.symbol),
  //   values: rows.map(row => row.tot_gain_unrl_amt)
  // };
  // 因为tot_gain_unrl_amt 是实时指标因此不能直接从数据库中获取
  const account_id = 100023;
  // 遍历account_id下的所持仓
  const watchlists = await WatchlistModel.findByAccountId(account_id);
  const labels = [];
  const values = [];
  for (const watchlist of watchlists) {
    const symbol = watchlist.symbol;
    // which_table == 1 || 2为持仓
    if (watchlist.which_table == 1 || watchlist.which_table == 2) {
      // 获取持仓信息shares ac_share total_cost
      const shares = watchlist.shares;
      const ac_share = watchlist.ac_share;
      const total_cost = watchlist.total_cost;
      
      const realTimeData = await getStockPrice(symbol) ;
      const tot_gain_unrl_amt = realTimeData.regularMarketPrice * ac_share - total_cost ;
      labels.push(symbol);
      values.push(tot_gain_unrl_amt);
    }
  }
  return {
    labels: labels,
    values: values
  };
};

// add roi
export const getRoiData = async () => {
  // const [rows] = await db.execute(`
  //   SELECT symbol, (tot_gain_unrl_amt / total_cost) * 100 AS roi
  //   FROM watchlist 
  //   WHERE status = 'Active' AND total_cost > 0
  // `);
  // return {
  //   labels: rows.map(row => row.symbol),
  //   values: rows.map(row => parseFloat(row.roi.toFixed(2)))  // 保留两位小数
  // };

  const account_id = 100023;
  const watchlists = await WatchlistModel.findByAccountId(account_id);
  const labels = [];
  const values = [];
  for (const watchlist of watchlists) {
    if (watchlist.which_table == 1 || watchlist.which_table == 2) {
      const symbol = watchlist.symbol;
      const ac_share = watchlist.ac_share;
      const total_cost = watchlist.total_cost;
      const realTimeData = await getStockPrice(symbol);
      const tot_gain_unrl_amt = realTimeData.regularMarketPrice * ac_share - total_cost ;
      const roi = (tot_gain_unrl_amt / total_cost) * 100;
      labels.push(symbol);
      values.push(roi);
    }
  }
  return {
    labels: labels,
    values: values
  };
};