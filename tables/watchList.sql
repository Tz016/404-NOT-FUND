CREATE TABLE `watchlist` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `account_id` int(11) NOT NULL COMMENT '关联的账户ID',
  `symbol` varchar(10) NOT NULL COMMENT '股票代码（如AAPL）',
  `status` enum('Active','Sold') NOT NULL DEFAULT 'Active' COMMENT '持仓状态',
  `shares` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '持有股数',
  `last_price` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '最新市场价格',
  `ac_share` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '平均成本价（AC/Share）',
  `total_cost` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '总成本（Shares × AC/Share）',
  `market_value` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '当前市值（Shares × Last Price）',
  `tot_div_income` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '累计股息收入',
  `day_gain_unrl_pct` decimal(10,4) NOT NULL DEFAULT 0 COMMENT '当日未实现盈亏百分比',
  `day_gain_unrl_amt` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '当日未实现盈亏金额',
  `tot_gain_unrl_pct` decimal(10,4) NOT NULL DEFAULT 0 COMMENT '总未实现盈亏百分比',
  `tot_gain_unrl_amt` decimal(15,2) NOT NULL DEFAULT 0 COMMENT '总未实现盈亏金额',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_account_symbol` (`account_id`, `symbol`) COMMENT '同一账户下股票代码唯一',
  KEY `idx_account_status` (`account_id`, `status`) COMMENT '按账户和状态查询优化'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='股票观察列表';

-- INSERT INTO watchlist (
--   account_id, symbol, status, shares,
--   last_price, ac_share, total_cost, market_value,
--   tot_div_income, day_gain_unrl_pct, day_gain_unrl_amt,
--   tot_gain_unrl_pct, tot_gain_unrl_amt,
--   created_at, updated_at
-- ) VALUES
-- -- AAPL: 涨了 $3
-- (100023, 'AAPL', 'Active', 100,
--  195.00, 180.00, 18000.00, 19500.00,
--  0.00, 1.5385, 300.00,
--  8.3333, 1500.00,
--  NOW(), NOW()),

-- -- AMZN: 跌了 $1.5
-- (100023, 'AMZN', 'Active', 200,
--  135.00, 130.00, 26000.00, 27000.00,
--  0.00, -1.1111, -300.00,
--  3.8462, 1000.00,
--  NOW(), NOW()),

-- -- TSLA: 涨了 $10
-- (100023, 'TSLA', 'Active', 50,
--  620.00, 650.00, 32500.00, 31000.00,
--  0.00, 1.6393, 500.00,
--  -4.6154, -1500.00,
--  NOW(), NOW());
