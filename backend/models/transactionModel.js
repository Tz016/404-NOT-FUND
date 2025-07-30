import db from '../config/db.js'; // Adjust the import based on your file structure

class transactionModel {
  static async create(transactionData) {
    const [result] = await db.query('INSERT INTO transaction SET ?', transactionData);
    return result.insertId;
  }

  static async get(account_id , symbol) {
    const [result] = await db.query('SELECT * FROM transaction WHERE account_id = ? AND symbol = ?', [account_id, symbol]);
    return result;
  }
}

export default transactionModel;