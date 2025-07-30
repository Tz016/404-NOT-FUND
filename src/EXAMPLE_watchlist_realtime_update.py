# pip install pymysql yfinance decima
import pymysql
import yfinance as yf
import decimal # Import decimal for precise calculations

# Database connection configuration
db_config = {
    'host': '172.22.24.169',
    'port': 3306,
    'user': 'root',
    'password': '123456',
    'database': '404_not_fund',
    'charset': 'utf8mb4'
}

# Safe division function (prevents division by zero)
def safe_divide(numerator, denominator):
    try:
        # Use Decimal for precision to match schema
        if decimal.Decimal(denominator) == 0:
            return decimal.Decimal('0.0000')
        return (decimal.Decimal(numerator) / decimal.Decimal(denominator)).quantize(decimal.Decimal('0.0000'))
    except decimal.InvalidOperation: # Handles cases where numerator/denominator might be non-numeric
        return decimal.Decimal('0.0000')

# Establish database connection
connection = None
cursor = None
try:
    connection = pymysql.connect(**db_config)
    cursor = connection.cursor(pymysql.cursors.DictCursor)

    # Define initial stock holdings for account_id 100023
    account_id = 100023
    initial_holdings = {
        'AAPL': {'shares': 100, 'ac_share': 180.00},
        'AMZN': {'shares': 200, 'ac_share': 130.00},
        'TSLA': {'shares': 50, 'ac_share': 650.00}
    }

    # Delete existing holdings for the account and symbols to avoid duplicates
    # Changed 'user_id' to 'account_id'
    symbols_to_delete = list(initial_holdings.keys())
    # Constructing the IN clause dynamically
    placeholders = ', '.join(['%s'] * len(symbols_to_delete))
    delete_sql = f"DELETE FROM watchlist WHERE account_id = %s AND symbol IN ({placeholders})"
    cursor.execute(delete_sql, (account_id, *symbols_to_delete))
    connection.commit()
    print(f"Deleted existing holdings for account {account_id} and symbols: {', '.join(symbols_to_delete)}")

    # Insert new holdings with realistic initial data
    insert_sql = """
        INSERT INTO watchlist (account_id, symbol, shares, ac_share, total_cost, status, which_table, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, '2', NOW(), NOW())
    """
    for symbol, data in initial_holdings.items():
        shares = decimal.Decimal(data['shares'])
        ac_share = decimal.Decimal(data['ac_share'])
        total_cost = (shares * ac_share).quantize(decimal.Decimal('0.00')) # Calculate total_cost based on shares * ac_share
        cursor.execute(insert_sql, (account_id, symbol, shares, ac_share, total_cost, 'Active'))
    connection.commit()
    print(f"Initial holdings for account {account_id} created/re-created.")

    # Query all 'Active' holdings to update prices and profit/loss
    cursor.execute("SELECT id, symbol, shares, ac_share, total_cost FROM watchlist WHERE status = 'Active'")
    rows = cursor.fetchall()

    for row in rows:
        watchlist_id = row['id']
        symbol = row['symbol']
        shares = decimal.Decimal(row['shares'])
        ac_share = decimal.Decimal(row['ac_share'])
        total_cost = decimal.Decimal(row['total_cost'])

        try:
            # Fetch real-time stock price using yfinance
            ticker = yf.Ticker(symbol)
            info = ticker.info
            current_price = decimal.Decimal(info.get('currentPrice', '0.00'))
            previous_close = decimal.Decimal(info.get('previousClose', '0.00'))

            # Calculate relevant fields, ensuring Decimal types for precision
            market_value = (shares * current_price).quantize(decimal.Decimal('0.00'))
            tot_gain_unrl_amt = (market_value - total_cost).quantize(decimal.Decimal('0.00'))
            tot_gain_unrl_pct = safe_divide(tot_gain_unrl_amt, total_cost)

            day_gain_unrl_amt = ((current_price - previous_close) * shares).quantize(decimal.Decimal('0.00'))
            day_gain_unrl_pct = safe_divide(day_gain_unrl_amt, (previous_close * shares).quantize(decimal.Decimal('0.00')))

            # Update database fields
            update_sql = """
                UPDATE watchlist
                SET last_price = %s,
                    market_value = %s,
                    tot_gain_unrl_amt = %s,
                    tot_gain_unrl_pct = %s,
                    day_gain_unrl_amt = %s,
                    day_gain_unrl_pct = %s,
                    updated_at = NOW()
                WHERE id = %s
            """
            cursor.execute(update_sql, (
                current_price,
                market_value,
                tot_gain_unrl_amt,
                tot_gain_unrl_pct,
                day_gain_unrl_amt,
                day_gain_unrl_pct,
                watchlist_id
            ))
            connection.commit()

            print(f"✅ Updated {symbol} | Price: {current_price} | Day gain: {day_gain_unrl_amt} | Total gain: {tot_gain_unrl_amt}")

        except Exception as e:
            print(f"❌ Error updating {symbol} (ID: {watchlist_id}): {e}")
            # Consider rolling back if an error occurs for a specific update,
            # though current approach commits per update.

except pymysql.Error as e:
    print(f"Database error: {e}")
    if connection:
        connection.rollback() # Rollback any changes in case of a connection-level error
finally:
    # Ensure resources are closed
    if cursor:
        cursor.close()
    if connection:
        connection.close()
    print("🎉 数据更新完成！")