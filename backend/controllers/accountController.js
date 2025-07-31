import AccountModel from '../models/accountModel.js';

/**
 * 获取账户信息的处理函数
 * @param {object} req - Express请求对象
 * @param {object} res - Express响应对象
 */
export const getAccountHandler = async (req, res) => {
  try {
    const { accountId } = req.params;
    
    // 验证accountId是否为数字
    if (!accountId || isNaN(accountId)) {
      return res.status(400).json({ 
        success: false,
        error: '无效的账户ID' 
      });
        }

    const account = await AccountModel.findById(Number(accountId));
    
    if (!account) {
      return res.status(404).json({
        success: false,
        error: '账户未找到'
      });
    }

    res.json({
      success: true,
      data: account
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: `查询账户信息失败: ${error.message}` || '服务器内部错误' 
    });
  }
};


// 更新账号balance
export const updateAccountBalanceHandler = async (req, res) => {
  const { account_id , total_cost} = req.params;
  
  const account = await AccountModel.findById(Number(account_id));
  if (!account) {
    return res.status(404).json({
      success: false,
      error: '账户未找到'
    });
  }

  // 更新account表的balance
  const updateData = {
    balance: account.balance - total_cost
  };
  const accountId = await AccountModel.update(Number(account_id), updateData);
  res.json({
    success: true,
    data: accountId
  });
};
