/* eslint-disable camelcase */

/**
 * Initial database schema migration
 * Creates contracts, work_day_entries, and work_days tables
 */

exports.up = pgm => {
  // Create contracts table
  pgm.createTable('contracts', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    name: {
      type: 'text',
      notNull: true,
      check: 'length(name) > 0',
    },
    hourly_rate: {
      type: 'decimal(10,2)',
      notNull: true,
      check: 'hourly_rate > 0',
    },
    description: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create work_day_entries table
  pgm.createTable('work_day_entries', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    date: {
      type: 'date',
      notNull: true,
    },
    contract_id: {
      type: 'text',
      notNull: true,
      references: 'contracts(id)',
      onDelete: 'CASCADE',
    },
    hours: {
      type: 'decimal(5,2)',
      notNull: true,
      check: 'hours > 0',
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create work_days table (legacy)
  pgm.createTable('work_days', {
    id: {
      type: 'text',
      primaryKey: true,
    },
    date: {
      type: 'date',
      notNull: true,
      unique: true,
    },
    hours: {
      type: 'decimal(5,2)',
      notNull: true,
      check: 'hours >= 0',
    },
    hourly_rate: {
      type: 'decimal(10,2)',
      notNull: true,
      check: 'hourly_rate >= 0',
    },
    notes: {
      type: 'text',
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  // Create indexes for contracts table
  pgm.createIndex('contracts', 'name');

  // Create indexes for work_day_entries table
  pgm.createIndex('work_day_entries', 'date');
  pgm.createIndex('work_day_entries', 'contract_id');
  pgm.createIndex('work_day_entries', ['date', 'contract_id']);
  pgm.createIndex('work_day_entries', ['date'], {
    name: 'idx_work_day_entries_month',
    where: 'date IS NOT NULL',
  });

  // Create indexes for work_days table (legacy)
  pgm.createIndex('work_days', 'date');
  pgm.createIndex('work_days', ['date'], {
    name: 'idx_work_days_month',
    where: 'date IS NOT NULL',
  });

  // Create triggers to update the updated_at timestamp
  pgm.sql(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  pgm.createTrigger('contracts', 'update_contracts_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });

  pgm.createTrigger('work_day_entries', 'update_work_day_entries_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });

  pgm.createTrigger('work_days', 'update_work_days_updated_at', {
    when: 'BEFORE',
    operation: 'UPDATE',
    function: 'update_updated_at_column',
    level: 'ROW',
  });
};

exports.down = pgm => {
  // Drop triggers
  pgm.dropTrigger('work_days', 'update_work_days_updated_at');
  pgm.dropTrigger('work_day_entries', 'update_work_day_entries_updated_at');
  pgm.dropTrigger('contracts', 'update_contracts_updated_at');
  
  // Drop function
  pgm.sql('DROP FUNCTION IF EXISTS update_updated_at_column()');
  
  // Drop tables in reverse order (to handle foreign keys)
  pgm.dropTable('work_day_entries');
  pgm.dropTable('work_days');
  pgm.dropTable('contracts');
};