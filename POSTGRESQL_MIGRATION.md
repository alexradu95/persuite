# PostgreSQL Migration

This project has been successfully migrated from Turso/SQLite to PostgreSQL with node-pg and node-pg-migrate.

## What Changed

### Dependencies
- **Removed**: `@libsql/client` (Turso/SQLite)
- **Added**: `pg`, `node-pg-migrate`, `@types/pg`

### Database Connection
- New optimized PostgreSQL client with connection pooling
- Support for transactions, parameterized queries, and proper error handling
- Environment variable changed from `TURSO_DATABASE_URL` to `DATABASE_URL`

### Migration System
- Replaced custom migration scripts with `node-pg-migrate`
- Professional migration management with up/down migrations
- Better rollback support and migration tracking

### Query Format
- Changed from SQLite `?` placeholders to PostgreSQL `$1, $2, ...` format
- Updated all repository methods to use the new API
- Proper type safety maintained throughout

## Setup Instructions

### 1. Environment Variables
Update your `.env` file:
```bash
# Remove old Turso variables
# TURSO_DATABASE_URL=...
# TURSO_AUTH_TOKEN=...

# Add PostgreSQL connection
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

### 2. Database Setup
Create your PostgreSQL database and run migrations:
```bash
# Run all pending migrations
npm run migrate

# Check migration status
npm run migrate:status

# Create a new migration
npm run migrate:create migration-name

# Rollback last migration
npm run migrate:down
```

### 3. Available Commands
```bash
npm run migrate          # Run all pending migrations
npm run migrate:down     # Rollback last migration
npm run migrate:status   # Show migration status
npm run migrate:create   # Create new migration
```

## Database Schema

The migration creates the following tables:

### `contracts`
- Contract information with hourly rates
- Supports multiple contracts per project

### `work_day_entries`
- Individual work entries per contract per day
- Links to contracts with foreign key relationship

### `work_days` (legacy)
- Kept for backward compatibility
- Single work day records

## API Changes

The database client API has been improved:

```typescript
// Old SQLite API
await client.execute({
  sql: 'SELECT * FROM table WHERE id = ?',
  args: [id]
});

// New PostgreSQL API
await client.query('SELECT * FROM table WHERE id = $1', { params: [id] });
await client.queryOne('SELECT * FROM table WHERE id = $1', { params: [id] });
await client.execute('DELETE FROM table WHERE id = $1', { params: [id] });

// Transaction support
await client.transaction(async (tx) => {
  await tx.query('INSERT INTO ...', { params: [...] });
  await tx.query('UPDATE ...', { params: [...] });
});
```

## Benefits

1. **Better Performance**: Connection pooling and optimized queries
2. **Professional Migrations**: Proper migration management with rollback support
3. **Type Safety**: Improved TypeScript integration
4. **Scalability**: PostgreSQL handles larger datasets better
5. **Industry Standard**: PostgreSQL is widely supported and documented

## Testing

All repository tests have been updated and are passing. The migration maintains 100% API compatibility at the domain level.

Run tests with:
```bash
npm test
```