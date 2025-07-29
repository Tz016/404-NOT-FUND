import db from '../config/db.js'; // Adjust the import based on your file structure

class WatchlistModel {
  static async create(watchlistData) {
    const [result] = await db.query('INSERT INTO watchlist SET ?', watchlistData);
    return result.insertId;
  }

  static async findByAccountId(accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE Account_id = ?', [accountId]);
    return rows;
  }

  static async findById(watchId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE watch_id = ?', [watchId]);
    return rows[0];
  }

  static async update(watchId, updateData) {
    const [result] = await db.query('UPDATE watchlist SET ? WHERE watch_id = ?', [updateData, watchId]);
    return result.affectedRows;
  }

  static async delete(watchId) {
    const [result] = await db.query('DELETE FROM watchlist WHERE watch_id = ?', [watchId]);
    return result.affectedRows;
  }

  static async getStockPrice(ticker) {
    // 这里应该调用你的股票API获取实时价格
    // 模拟实现
    return {
      price: Math.random() * 100 + 50,
      change: (Math.random() - 0.5) * 5
    };
  }
}

export default WatchlistModel;

// const db = require('../config/db');

// class Watchlist {

//   // 获取用户的所有WatchList项
//   static async findByAccountId(accountId) {
//     const [rows] = await db.query(
//         'SELECT * FROM watchlist WHERE Account_id = ?', [accountId]
//     );
//     return rows;
//   }

//   // 添加新的WatchList项
//   static async addTicker(watchItem) {
//     const { Account_id, shares, types, last_price, total_cost, ticker } = watchItem;
//     const [result] = await db.query(
//       'INSERT INTO watchlist (Account_id, shares, types, last_price, total_cost, ticker) VALUES (?, ?, ?, ?, ?, ?)',
//       [Account_id, shares, types, last_price, total_cost, ticker]
//     );
//     return { watch_id: result.insertId, ...watchItem };
//   }

//   // 更新WatchList项
//   static async update(watchId, accountId, updates) {
//     const { shares, types, last_price, total_cost, ticker } = updates;
//     const [result] = await db.query(
//       'UPDATE watchlist SET shares = ?, types = ?, last_price = ?, total_cost = ?, ticker = ? WHERE watch_id = ? AND Account_id = ?',
//       [shares, types, last_price, total_cost, ticker, watchId, accountId]
//     );
//     return result.affectedRows > 0;
//   }
 
//   // 删除WatchList项
//   static async delete(watchId, accountId) {
//     const [result] = await db.query('DELETE FROM watchlist WHERE watch_id = ? AND Account_id = ?', [watchId, accountId]);
//     return result.affectedRows > 0;
//   }
 
//   // 获取单个WatchList项
//   static async findById(watchId, accountId) {
//     const [rows] = await db.query('SELECT * FROM watchlist WHERE watch_id = ? AND Account_id = ?', [watchId, accountId]);
//     return rows[0];
//   }
 
//   // 更新股票实时价格
//   static async updateStockPrice(ticker, newPrice) {
//     const [result] = await db.query('UPDATE watchlist SET last_price = ? WHERE ticker = ?', [newPrice, ticker]);
//     return result.affectedRows > 0;
//   }
// }

// module.exports = Watchlist;



