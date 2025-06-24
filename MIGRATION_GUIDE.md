# Database Migration Guide

## Prerequisites

1. **Set up your Turso environment variables** in `.env.local`:
   ```bash
   TURSO_DATABASE_URL=your_turso_database_url
   TURSO_AUTH_TOKEN=your_turso_auth_token
   ```

## Migration Options

### Option 1: Using the API Endpoint (Easiest)

1. Start your Next.js development server:
   ```bash
   npm run dev
   ```

2. **Check migration status**:
   ```bash
   curl http://localhost:3000/api/migrate
   ```

3. **Run migrations**:
   ```bash
   curl -X POST http://localhost:3000/api/migrate
   ```

### Option 2: Using npm scripts (after building)

1. Build the project first:
   ```bash
   npm run build
   ```

2. Run migrations:
   ```bash
   node scripts/migrate.js
   ```

### Option 3: Manual SQL execution

If you prefer to run the SQL manually, execute this on your Turso database:

```sql
-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create work_days table
CREATE TABLE work_days (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL, -- ISO 8601 date format (YYYY-MM-DD)
    hours REAL NOT NULL CHECK (hours >= 0),
    hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Create indexes
CREATE INDEX idx_work_days_date ON work_days(date);
CREATE INDEX idx_work_days_month ON work_days(substr(date, 1, 7));
CREATE UNIQUE INDEX idx_work_days_date_unique ON work_days(date);

-- Create trigger
CREATE TRIGGER update_work_days_updated_at 
    AFTER UPDATE ON work_days
    FOR EACH ROW
BEGIN
    UPDATE work_days SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Record the migration
INSERT INTO migrations (id, description) VALUES 
    ('001_initial_schema', 'Create initial income tracking schema');
```

### Option 4: Using Turso CLI

If you have the Turso CLI installed:

1. Upload the schema file:
   ```bash
   turso db shell your-database < src/lib/db/schema.sql
   ```

## Verification

After running migrations, verify they worked by checking:

1. **Via API**: `curl http://localhost:3000/api/migrate`
2. **Via Turso CLI**: `turso db shell your-database "SELECT * FROM migrations;"`

## What the Migration Creates

- **`work_days` table**: Stores individual work day records
- **Indexes**: For efficient querying by date and month
- **Triggers**: Auto-update timestamps
- **Migration tracking**: Records which migrations have been applied

## Next Steps

After migration is complete, you can:

1. Start using the new database-backed income functionality
2. Import existing data if you have any
3. The existing React components will work the same way once you update them to use the new service layer

## Troubleshooting

- **Environment variables not set**: Make sure `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are properly configured
- **Permission errors**: Use the API endpoint method instead of direct script execution
- **Migration already applied**: The migration system is idempotent - running it multiple times is safe