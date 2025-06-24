-- Income tracking database schema for Turso SQLite
-- This schema supports work day tracking with calculated earnings

-- Work days table - stores individual work day records
CREATE TABLE work_days (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
    hours REAL NOT NULL CHECK (hours >= 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for common queries
CREATE INDEX idx_work_days_date ON work_days(date);
CREATE INDEX idx_work_days_month ON work_days(substr(date, 1, 7)); -- For YYYY-MM queries
CREATE UNIQUE INDEX idx_work_days_date_unique ON work_days(date);

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER update_work_days_updated_at 
    AFTER UPDATE ON work_days
    FOR EACH ROW
BEGIN
    UPDATE work_days SET updated_at = datetime('now') WHERE id = NEW.id;
END;