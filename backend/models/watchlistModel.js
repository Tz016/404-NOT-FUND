import db from '../config/db.js'; // Adjust the import based on your file structure

class WatchlistModel {
  static async create(watchlistData) {
    const [result] = await db.query('INSERT INTO watchlist SET ?', watchlistData);
    return result.insertId;
  }

  static async findByAccountId(accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE account_id = ?', [accountId]);
    return rows;
  }

  static async findByTickerAndId(ticker,accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE ticker = ? and account_id = ?', [ticker,accountId]);
    //返回第一个匹配的结果
    return rows.length > 0 ? rows[0] : null;
  }

  static async update(watchId, updateData) {
    const [result] = await db.query('UPDATE watchlist SET ? WHERE watch_id = ?', [updateData, watchId]);
    return result.affectedRows;
  }

  static async delete(watchId) {
    const [result] = await db.query('DELETE FROM watchlist WHERE id = ?', [watchId]);
    return result.affectedRows;
  }

  static async findOne(ticker, accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE ticker = ? AND account_id = ?', [ticker, accountId]);
    return rows.length > 0 ? rows[0] : null;
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




