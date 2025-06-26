-- Migration script to drop existing tables and recreate with new schema
-- This will delete all existing data

-- Drop existing tables
DROP TABLE IF EXISTS work_days;

-- Create new schema from updated schema.sql
-- Income tracking database schema for Turso SQLite
-- This schema supports work day tracking with multiple contracts per day

-- Contracts table - stores contract information with hourly rates
CREATE TABLE contracts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL CHECK (length(name) > 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate > 0),
    description TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Work day entries table - stores individual work entries per contract per day
CREATE TABLE work_day_entries (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL, -- Date field stored as DATE type
    contract_id TEXT NOT NULL,
    hours REAL NOT NULL CHECK (hours > 0),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
);

-- Work days table - stores individual work day records (legacy table, kept for backward compatibility)
CREATE TABLE work_days (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL, -- Date field stored as DATE type
    hours REAL NOT NULL CHECK (hours >= 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
    notes TEXT,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes for contracts table
CREATE INDEX idx_contracts_name ON contracts(name);

-- Create indexes for work_day_entries table
CREATE INDEX idx_work_day_entries_date ON work_day_entries(date);
CREATE INDEX idx_work_day_entries_contract_id ON work_day_entries(contract_id);
CREATE INDEX idx_work_day_entries_date_contract ON work_day_entries(date, contract_id);
CREATE INDEX idx_work_day_entries_month ON work_day_entries(substr(date, 1, 7)); -- For YYYY-MM queries

-- Create indexes for work_days table (legacy)
CREATE INDEX idx_work_days_date ON work_days(date);
CREATE INDEX idx_work_days_month ON work_days(substr(date, 1, 7)); -- For YYYY-MM queries
CREATE UNIQUE INDEX idx_work_days_date_unique ON work_days(date);

-- Create triggers to update the updated_at timestamp
CREATE TRIGGER update_contracts_updated_at 
    AFTER UPDATE ON contracts
    FOR EACH ROW
BEGIN
    UPDATE contracts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_work_day_entries_updated_at 
    AFTER UPDATE ON work_day_entries
    FOR EACH ROW
BEGIN
    UPDATE work_day_entries SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER update_work_days_updated_at 
    AFTER UPDATE ON work_days
    FOR EACH ROW
BEGIN
    UPDATE work_days SET updated_at = datetime('now') WHERE id = NEW.id;
END;