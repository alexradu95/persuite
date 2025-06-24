#!/usr/bin/env tsx

import { checkMigrationStatus } from '../src/lib/db/migrations';

const main = async () => {
  try {
    console.log('📋 Checking migration status...\n');

    const appliedMigrations = await checkMigrationStatus();
    
    if (appliedMigrations.length > 0) {
      console.log('✅ Applied migrations:');
      appliedMigrations.forEach(migration => {
        console.log(`  - ${migration.id}: ${migration.description}`);
        console.log(`    Applied: ${migration.applied_at}\n`);
      });
    } else {
      console.log('ℹ️  No migrations applied yet');
    }

  } catch (error) {
    console.error('❌ Failed to check migration status:', error);
    process.exit(1);
  }
};

main();