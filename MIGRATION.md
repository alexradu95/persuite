# Database Migration Guide

## Prerequisites

Make sure you have your Turso environment variables set up:

```bash
export TURSO_DATABASE_URL="your-turso-database-url"
export TURSO_AUTH_TOKEN="your-turso-auth-token"
```

Or create a `.env.local` file:
```
TURSO_DATABASE_URL=your-turso-database-url
TURSO_AUTH_TOKEN=your-turso-auth-token
```

## Migration Steps

### Option 1: Drop and Recreate (Recommended)

⚠️ **WARNING: This will delete all existing data**

1. **Install tsx if not already installed:**
   ```bash
   npm install -D tsx
   ```

2. **Run the migration:**
   ```bash
   npm run migrate
   ```

### Option 2: Manual Migration via Turso CLI

If you prefer to run the migration manually:

1. **Install Turso CLI** (if not already installed):
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   ```

2. **Login to Turso:**
   ```bash
   turso auth login
   ```

3. **Connect to your database:**
   ```bash
   turso db shell your-database-name
   ```

4. **Copy and paste the SQL from `scripts/migrate-database.sql`** into the Turso shell

### Option 3: Using Turso Dashboard

1. Go to [https://turso.tech/app](https://turso.tech/app)
2. Select your database
3. Go to the SQL Console
4. Copy and paste the contents of `scripts/migrate-database.sql`
5. Execute the SQL

## What the Migration Does

The migration will:

1. **Drop the existing `work_days` table** (⚠️ data loss)
2. **Create the new `contracts` table** for managing contracts with hourly rates
3. **Create the new `work_day_entries` table** for multiple contracts per day
4. **Recreate the `work_days` table** with proper DATE types (for backward compatibility)
5. **Add all necessary indexes** for optimal query performance
6. **Add triggers** for automatic timestamp updates

## After Migration

Once the migration is complete, you'll have:

- ✅ **contracts** table for managing your contracts
- ✅ **work_day_entries** table for tracking multiple contracts per day  
- ✅ **work_days** table (legacy, with updated DATE types)
- ✅ All proper indexes and foreign key constraints
- ✅ Automatic timestamp triggers

## Usage Examples

### Create a Contract
```typescript
import { contractRepository } from '@/lib/domains/contracts/repositories/contract-repository';

const contract = await contractRepository.create({
  id: 'web-dev-proj',
  name: 'Web Development Project',
  hourlyRate: 45,
  description: 'Frontend work for client'
});
```

### Add Work Entries for Multiple Contracts
```typescript
import { workDayEntryRepository } from '@/lib/domains/work-day-entries/repositories/work-day-entry-repository';

// Work 4 hours on Contract A
await workDayEntryRepository.create({
  id: 'entry-1',
  date: new Date('2024-12-24'),
  contractId: 'contract-a',
  hours: 4,
  notes: 'Frontend development'
});

// Work 3 hours on Contract B (same day)
await workDayEntryRepository.create({
  id: 'entry-2',
  date: new Date('2024-12-24'),
  contractId: 'contract-b', 
  hours: 3,
  notes: 'Backend API work'
});
```

### Calculate Daily Income
```typescript
// Get all entries for a specific date
const dayEntries = await workDayEntryRepository.findByDate(new Date('2024-12-24'));

// Calculate total income for the day
let totalIncome = 0;
for (const entry of dayEntries) {
  const contract = await contractRepository.findById(entry.contractId);
  if (contract) {
    totalIncome += entry.hours * contract.hourlyRate;
  }
}
```

## Troubleshooting

If you encounter issues:

1. **Check your environment variables** are properly set
2. **Verify Turso connection** by running: `turso db list`
3. **Check the migration logs** for specific error messages
4. **Ensure tsx is installed**: `npm install -D tsx`

For any issues, check the console output which will show detailed error messages.