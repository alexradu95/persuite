#!/usr/bin/env tsx

/**
 * Database migration script for Turso
 * This script will drop all existing tables and recreate them with the new schema
 * WARNING: This will delete all existing data
 */

import { createClient } from '@libsql/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables are required');
  process.exit(1);
}

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  const client = createClient({
    url: TURSO_DATABASE_URL!,
    authToken: TURSO_AUTH_TOKEN!,
  });

  try {
    // Read the migration SQL file
    const migrationSql = readFileSync(join(__dirname, 'migrate-database.sql'), 'utf-8');
    
    // Split the SQL into individual statements
    const statements = migrationSql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    console.log(`📝 Executing ${statements.length} SQL statements...`);

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`⚡ Executing: ${statement.substring(0, 50)}...`);
        await client.execute(statement);
      }
    }

    console.log('✅ Database migration completed successfully!');
    console.log('');
    console.log('🎉 Your database now has:');
    console.log('   • contracts table (for managing contracts with hourly rates)');
    console.log('   • work_day_entries table (for multiple contracts per day)');
    console.log('   • work_days table (legacy, updated with DATE types)');
    console.log('   • All proper indexes and triggers');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

// Run the migration
migrate().catch(console.error);