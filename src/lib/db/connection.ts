import { createClient } from '@libsql/client';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

// In test environment or build time, allow missing environment variables
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isBuildTime = process.env.NODE_ENV === 'production' && !process.env.TURSO_DATABASE_URL;

if (!isTestEnvironment && !isBuildTime) {
  if (!TURSO_DATABASE_URL) {
    throw new Error('TURSO_DATABASE_URL is not set');
  }

  if (!TURSO_AUTH_TOKEN) {
    throw new Error('TURSO_AUTH_TOKEN is not set');
  }
}

// Only create the client if we have the required environment variables
export const db = TURSO_DATABASE_URL && TURSO_AUTH_TOKEN 
  ? createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    })
  : null;

export type DatabaseClient = NonNullable<typeof db>;