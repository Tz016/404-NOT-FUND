import { watch } from 'vue';
import db from '../config/db.js'; // Adjust the import based on your file structure

class WatchlistModel {
  static async create(watchlistData) {
    const [result] = await db.query('INSERT INTO watchlist SET ?', watchlistData);
    return result.insertId;
  }
  static async updateWhichTable(which_table,id){
    const [result] = await db.execute(
      'UPDATE watchlist SET which_table = ? WHERE id = ?',
      [which_table, id]
    );
    return result.affectedRows;
  }
  static async findByAccountId(accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE account_id = ?', [accountId]);
    return rows;
  }
  static async findBySymbol(symbol,accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE symbol = ? and account_id = ?', [symbol,accountId]);
    return rows.length > 0 ? rows[0] : null;
  }

  static async findByTickerAndId(ticker,accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE ticker = ? and account_id = ?', [ticker,accountId]);
    //返回第一个匹配的结果
    return rows.length > 0 ? rows[0] : null;
  }

  static async update(updateData,watchId) {
      // 用更新后的总和计算 ac_share
      const [result] = await db.query(
          'UPDATE watchlist SET shares = shares + ?, total_cost = total_cost + ?, ac_share = (total_cost + ?) / (shares + ?) WHERE id = ?',
          [updateData.shares, updateData.total_cost, updateData.total_cost, updateData.shares, watchId]
      );
      return result.affectedRows;
  }
  static async destroy(watchId) {
    const [result] = await db.query('DELETE FROM watchlist WHERE id = ?', [watchId]);
    return result.affectedRows;
  }


  static async delete(accountId , symbol ,id , which_table) {
    // 1. 首先获取当前记录的 which_table 值
    const currentItem = await this.findOne(symbol,accountId);
    
    if (!currentItem) {
        return 0; // 记录不存在
    }
 
    const currentWhichTable = currentItem.which_table;
 
    // 2. 根据入参 which_table 和当前记录的 which_table 执行不同操作
    // 取消收藏
    if (which_table === "0") {
        if (currentWhichTable === "0") {
            // 情况1: 删除记录
            return await this.destroy(currentItem.id);
        } else if (currentWhichTable === "1") {
            // 情况2: 不操作
            return 0;
        } else if (currentWhichTable === "2") {
            // 情况3: 更新为 1
            return await this.updateWhichTable(
                '1',
                id
            );
            
        }
    } 
    // 持仓
    else if (which_table === "1") {
        if (currentWhichTable === "1") {
            // 情况1: 删除记录
            return await this.destroy({ where: { id: id } });
           
        } else if (currentWhichTable === "0") {
            // 情况2: 不操作
            return 0;
        } else if (currentWhichTable === "2") {
            // 情况3: 更新为 0
            return await this.update(
                { which_table: "0" },
                { id }
            );
            
        }
    }
 
    // 如果 which_table 是 2 或其他情况（虽然前面已经校验过）
    return 0;
    
  }

  static async findOne(ticker, accountId) {
    const [rows] = await db.query('SELECT * FROM watchlist WHERE symbol = ? AND account_id = ?', [ticker, accountId]);
    return rows.length > 0 ? rows[0] : null;
  }
}

export default WatchlistModel;




