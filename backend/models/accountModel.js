import db from '../config/db.js';

/**
 * Account模型类 - 处理账户表的数据库操作
 */
class AccountModel {
  /**
   * 根据账户ID查询账户信息
   * @param {number} accountId - 账户ID
   * @returns {Promise<Object|null>} - 账户信息对象或null
   */
  static async findById(accountId) {
    try {
      const [rows] = await db.query(
        'SELECT * FROM account WHERE account_id = ?', 
        [accountId]
      );
      
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new Error(`数据库查询失败: ${error.message}`);
    }
  }
  
  /**
   * 创建新账户
   * @param {Object} accountData - 账户数据对象
   * @returns {Promise<number>} - 新创建账户的ID
   */
  static async create(accountData) {
    const [result] = await db.query('INSERT INTO account SET ?', accountData);
    return result.insertId;
  }
  
  /**
   * 更新账户信息
   * @param {number} accountId - 要更新的账户ID
   * @param {Object} updateData - 更新的数据
   * @returns {Promise<number>} - 受影响的行数
   */
  static async update(accountId, updateData) {
    const [result] = await db.query(
      'UPDATE account SET ? WHERE account_id = ?', 
      [updateData, accountId]
    );
    return result.affectedRows;
  }
  
  /**
   * 删除账户
   * @param {number} accountId - 要删除的账户ID
   * @returns {Promise<number>} - 受影响的行数
   */
  static async delete(accountId) {
    const [result] = await db.query(
      'DELETE FROM account WHERE account_id = ?', 
      [accountId]
    );
    return result.affectedRows;
  }
  
  /**
   * 获取所有账户
   * @returns {Promise<Array>} - 账户列表
   */
  static async findAll() {
    const [rows] = await db.query('SELECT * FROM account');
    return rows;
  }
}

export default AccountModel;