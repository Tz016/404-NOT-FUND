CREATE TABLE Asset (
    asset_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT,
    operation_type ENUM('0','1') NOT NULL, 
    create_time DATETIME,
    update_time DATETIME,
    price DECIMAL(10,2),
    quantity INT,
    stock_ticker VARCHAR(20),
    stock_name VARCHAR(255),
    FOREIGN KEY (account_id) REFERENCES account(account_id)
);

INSERT INTO Asset (account_id, type, create_time, update_time, price, quantity, stock_ticker, stock_name)
VALUES (1, 0, NOW(), NOW(), 100.50, 20, 'AAPL', 'Apple Inc.');
