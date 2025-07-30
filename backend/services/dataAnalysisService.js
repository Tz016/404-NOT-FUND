import mysql from 'mysql2/promise';
import db from '../config/db.js';

export const getPieChartData = async () => {
  const connection = await mysql.createConnection(db);
  const [rows] = await connection.execute(`
    SELECT symbol, tot_gain_unrl_amt 
    FROM watchlist 
    WHERE status = 'Active' AND tot_gain_unrl_amt > 0
  `);
  await connection.end();
  
  return {
    labels: rows.map(row => row.symbol),
    values: rows.map(row => row.tot_gain_unrl_amt)
  };
};

export const getBarChartData = async () => {
  const connection = await mysql.createConnection(db);
  const [rows] = await connection.execute(`
    SELECT symbol, tot_gain_unrl_amt 
    FROM watchlist 
    WHERE status = 'Active'
  `);
  await connection.end();
  
  return {
    labels: rows.map(row => row.symbol),
    values: rows.map(row => row.tot_gain_unrl_amt)
  };
};
