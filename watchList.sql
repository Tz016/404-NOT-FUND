CREATE TABLE WatchList (
    watchlist_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    stock_ticker VARCHAR(20),
    stock_name VARCHAR(255),
    type TINYINT,  -- 0=stock, 1=bond
    add_time DATETIME,
    prev_close DECIMAL(10,2),
    price_open DECIMAL(10,2),
    price_current DECIMAL(10,2),
    FOREIGN KEY (account_id) REFERENCES Account(account_id)
);

INSERT INTO WatchList (
    account_id, stock_ticker, stock_name, type, add_time,
    prev_close, price_open, price_current
) VALUES (
    1, 'AAPL', 'Apple Inc.', 0, NOW(),
    145.00, 146.00, 147.50
);
