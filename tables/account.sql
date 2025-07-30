CREATE TABLE account (
    account_id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    national_ID INT NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL,
    occupation VARCHAR(50) NOT NULL,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP);

INSERT INTO account (account_id, name, national_ID, balance, occupation, phone_number, email, address)
VALUES (100023, 'John Doe', 123456789, 1000.00, 'Software Engineer', 13022456789, 'john.doe@gmail.com', '123 Elm Street, Springfield');