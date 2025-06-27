import { Pool, type PoolClient, type QueryResult } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

// In test environment or build time, allow missing environment variables
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL;

if (!isTestEnvironment && !isBuildTime) {
  if (!DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
}

// Create the connection pool
const pool = DATABASE_URL 
  ? new Pool({
      connectionString: DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  : null;

export type DatabaseRow = Record<string, unknown>;

export type QueryOptions = {
  params?: unknown[];
};

export type DatabaseClient = {
  query<T extends DatabaseRow = DatabaseRow>(
    sql: string, 
    options?: QueryOptions
  ): Promise<T[]>;
  
  queryOne<T extends DatabaseRow = DatabaseRow>(
    sql: string, 
    options?: QueryOptions
  ): Promise<T | null>;
  
  execute(sql: string, options?: QueryOptions): Promise<void>;
  
  transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T>;
  
  close(): Promise<void>;
};

class PostgreSQLClient implements DatabaseClient {
  private pool: Pool;
  private client?: PoolClient;

  constructor(pool: Pool, client?: PoolClient) {
    this.pool = pool;
    this.client = client;
  }

  async query<T extends DatabaseRow = DatabaseRow>(
    sql: string, 
    options: QueryOptions = {}
  ): Promise<T[]> {
    const client = this.client || this.pool;
    const result: QueryResult<T> = await client.query(sql, options.params);
    return result.rows;
  }

  async queryOne<T extends DatabaseRow = DatabaseRow>(
    sql: string, 
    options: QueryOptions = {}
  ): Promise<T | null> {
    const rows = await this.query<T>(sql, options);
    return rows[0] || null;
  }

  async execute(sql: string, options: QueryOptions = {}): Promise<void> {
    const client = this.client || this.pool;
    await client.query(sql, options.params);
  }

  async transaction<T>(callback: (client: DatabaseClient) => Promise<T>): Promise<T> {
    if (this.client) {
      // Already in a transaction, just use the existing client
      return callback(this);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const transactionClient = new PostgreSQLClient(this.pool, client);
      const result = await callback(transactionClient);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      this.client.release();
    } else {
      await this.pool.end();
    }
  }
}

export const db: DatabaseClient | null = pool ? new PostgreSQLClient(pool) : null;

// Ensure we have a database connection in non-test environments
if (!isTestEnvironment && !isBuildTime && !db) {
  throw new Error('Failed to initialize database connection');
}