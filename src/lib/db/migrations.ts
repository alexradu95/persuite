import { db } from './connection';
import * as fs from 'fs';
import * as path from 'path';

type Migration = {
  id: string;
  description: string;
  sql: string;
  applied_at?: string;
};

export const runMigrations = async (): Promise<void> => {
  if (!db) {
    throw new Error('Database connection not available');
  }

  // Create migrations table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id TEXT PRIMARY KEY,
      description TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  // Get applied migrations
  const appliedMigrationsResult = await db.execute('SELECT id FROM migrations ORDER BY applied_at ASC');
  const appliedMigrations = new Set(appliedMigrationsResult.rows.map(row => row.id as string));

  // Define migrations in order
  const migrations: Omit<Migration, 'applied_at'>[] = [
    {
      id: '001_initial_schema',
      description: 'Create initial income tracking schema',
      sql: '' // We'll execute statements individually
    }
  ];

  // Apply pending migrations
  for (const migration of migrations) {
    if (!appliedMigrations.has(migration.id)) {
      console.log(`Applying migration: ${migration.id} - ${migration.description}`);
      
      try {
        // Execute migration statements individually
        await executeInitialSchema();
        
        // Record migration as applied
        await db.execute({
          sql: 'INSERT INTO migrations (id, description) VALUES (?, ?)',
          args: [migration.id, migration.description]
        });
        
        console.log(`Migration ${migration.id} applied successfully`);
      } catch (error) {
        console.error(`Failed to apply migration ${migration.id}:`, error);
        throw error;
      }
    }
  }
};

const executeInitialSchema = async (): Promise<void> => {
  if (!db) {
    throw new Error('Database connection not available');
  }

  // Execute each statement separately to avoid SQL_MANY_STATEMENTS error
  const statements = [
    // Create work_days table
    `CREATE TABLE work_days (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      hours REAL NOT NULL CHECK (hours >= 0),
      hourly_rate REAL NOT NULL CHECK (hourly_rate >= 0),
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    
    // Create indexes
    `CREATE INDEX idx_work_days_date ON work_days(date)`,
    `CREATE INDEX idx_work_days_month ON work_days(substr(date, 1, 7))`,
    `CREATE UNIQUE INDEX idx_work_days_date_unique ON work_days(date)`,
    
    // Create trigger
    `CREATE TRIGGER update_work_days_updated_at 
      AFTER UPDATE ON work_days
      FOR EACH ROW
    BEGIN
      UPDATE work_days SET updated_at = datetime('now') WHERE id = NEW.id;
    END`
  ];

  for (const statement of statements) {
    await db.execute(statement.trim());
  }
};

const getSchemaSQL = async (): Promise<string> => {
  const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
  return fs.readFileSync(schemaPath, 'utf-8');
};

export const checkMigrationStatus = async (): Promise<Migration[]> => {
  if (!db) {
    throw new Error('Database connection not available');
  }

  try {
    const result = await db.execute('SELECT * FROM migrations ORDER BY applied_at ASC');
    return result.rows.map(row => ({
      id: row.id as string,
      description: row.description as string,
      sql: '', // We don't store the SQL in the migrations table
      applied_at: row.applied_at as string
    }));
  } catch (error) {
    console.log('Migrations table does not exist yet');
    return [];
  }
};