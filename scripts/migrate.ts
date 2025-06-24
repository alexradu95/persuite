#!/usr/bin/env tsx

import { runMigrations, checkMigrationStatus } from '../src/lib/db/migrations';

const main = async () => {
  try {
    console.log('🚀 Starting database migrations...\n');

    // Check current migration status
    console.log('📋 Checking current migration status...');
    const appliedMigrations = await checkMigrationStatus();
    
    if (appliedMigrations.length > 0) {
      console.log('✅ Applied migrations:');
      appliedMigrations.forEach(migration => {
        console.log(`  - ${migration.id}: ${migration.description} (${migration.applied_at})`);
      });
      console.log('');
    } else {
      console.log('ℹ️  No migrations applied yet\n');
    }

    // Run pending migrations
    console.log('🔄 Running pending migrations...');
    await runMigrations();
    
    console.log('\n✅ Database migrations completed successfully!');
    
    // Show final status
    console.log('\n📋 Final migration status:');
    const finalMigrations = await checkMigrationStatus();
    finalMigrations.forEach(migration => {
      console.log(`  ✓ ${migration.id}: ${migration.description}`);
    });

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();