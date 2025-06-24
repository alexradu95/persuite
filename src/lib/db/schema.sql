-- Income tracking database schema for Turso SQLite
-- This schema supports the existing income functionality with proper normalization

-- Work days table - stores individual work day records
CREATE TABLE work_days (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
    hours REAL NOT NULL CHECK (hours >= 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
    daily_earnings REAL NOT NULL CHECK (daily_earnings >= 0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for common queries
CREATE INDEX idx_work_days_date ON work_days(date);
CREATE INDEX idx_work_days_month ON work_days(substr(date, 1, 7)); -- For YYYY-MM queries
CREATE UNIQUE INDEX idx_work_days_date_unique ON work_days(date);

-- Exchange rates table - for historical currency conversion
CREATE TABLE exchange_rates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    base_currency TEXT NOT NULL, -- e.g., 'EUR'
    target_currency TEXT NOT NULL, -- e.g., 'RON', 'USD'
    rate REAL NOT NULL CHECK (rate > 0),
    effective_date TEXT NOT NULL, -- ISO 8601 date
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(base_currency, target_currency, effective_date)
);

-- Create index for exchange rate lookups
CREATE INDEX idx_exchange_rates_lookup ON exchange_rates(base_currency, target_currency, effective_date);

-- Insert default exchange rates (these can be updated via API later)
INSERT INTO exchange_rates (base_currency, target_currency, rate, effective_date) VALUES
    ('EUR', 'RON', 4.97, date('now')),
    ('EUR', 'USD', 1.07, date('now'));

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_work_days_updated_at 
    AFTER UPDATE ON work_days
    FOR EACH ROW
BEGIN
    UPDATE work_days SET updated_at = datetime('now') WHERE id = NEW.id;
END;