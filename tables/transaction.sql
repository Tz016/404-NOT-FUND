CREATE TABLE transaction (
    transaction_id INT PRIMARY KEY,
    account_id INT NOT NULL,
    asset_id INT NOT NULL,
    buy_in_price DECIMAL(10, 2),
    selling_price DECIMAL(10, 2),
    quantity INT NOT NULL,
    operation_type ENUM('0', '1') NOT NULL,  -- 0 for buy in, 1 for sell
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (account_id) REFERENCES account(account_id),
    FOREIGN KEY (asset_id) REFERENCES asset(asset_id)
);

INSERT INTO transaction (transaction_id, account_id, asset_id, buy_in_price, selling_price, quantity, operation_type)
VALUES (1, 100023, 1, 50.00, NULL, 10, '0');