import db from '../config/db.js'; // Adjust the import based on your file structure

class transactionModel {
  static async create(transactionData) {
    const [result] = await db.query('INSERT INTO transactions SET ?', transactionData);
    return result.insertId;
  }

}

export default transactionModel;