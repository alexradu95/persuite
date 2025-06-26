import { db, DatabaseClient } from '@/lib/db/connection';
import {
  WorkDayEntry,
  CreateWorkDayEntry,
  UpdateWorkDayEntry,
  WorkDayEntryRow,
  workDayEntryRowToDomain,
  CreateWorkDayEntrySchema,
  UpdateWorkDayEntrySchema,
} from '@/lib/db/types';

export type WorkDayEntryQuery = {
  limit?: number;
  offset?: number;
  contractId?: string;
  startDate?: Date;
  endDate?: Date;
};

export type WorkDayEntryRepository = {
  create: (entry: CreateWorkDayEntry) => Promise<WorkDayEntry>;
  findById: (id: string) => Promise<WorkDayEntry | null>;
  findByDate: (date: Date) => Promise<WorkDayEntry[]>;
  findByContract: (contractId: string) => Promise<WorkDayEntry[]>;
  findByDateRange: (startDate: Date, endDate: Date) => Promise<WorkDayEntry[]>;
  findMany: (query?: WorkDayEntryQuery) => Promise<WorkDayEntry[]>;
  update: (entry: UpdateWorkDayEntry) => Promise<WorkDayEntry>;
  deleteById: (id: string) => Promise<void>;
};

// Helper function to format date for database
const formatDateForDb = (date: Date): string => {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
};

export const createWorkDayEntryRepository = (client?: DatabaseClient | null): WorkDayEntryRepository => {
  if (!client) {
    throw new Error('Database client is required for WorkDayEntryRepository');
  }
  
  const repository: WorkDayEntryRepository = {
    create: async (entryData: CreateWorkDayEntry): Promise<WorkDayEntry> => {
      // Validate input data
      const validatedData = CreateWorkDayEntrySchema.parse(entryData);
      
      const result = await client.execute({
        sql: `
          INSERT INTO work_day_entries (id, date, contract_id, hours, notes)
          VALUES (?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          validatedData.id,
          formatDateForDb(validatedData.date),
          validatedData.contractId,
          validatedData.hours,
          validatedData.notes || null,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to create work day entry');
      }

      const row = result.rows[0] as unknown as WorkDayEntryRow;
      return workDayEntryRowToDomain(row);
    },

    findById: async (id: string): Promise<WorkDayEntry | null> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_day_entries WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as unknown as WorkDayEntryRow;
      return workDayEntryRowToDomain(row);
    },

    findByDate: async (date: Date): Promise<WorkDayEntry[]> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_day_entries WHERE date = ? ORDER BY created_at ASC',
        args: [formatDateForDb(date)],
      });

      return result.rows.map((row) => workDayEntryRowToDomain(row as unknown as WorkDayEntryRow));
    },

    findByContract: async (contractId: string): Promise<WorkDayEntry[]> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_day_entries WHERE contract_id = ? ORDER BY date DESC',
        args: [contractId],
      });

      return result.rows.map((row) => workDayEntryRowToDomain(row as unknown as WorkDayEntryRow));
    },

    findByDateRange: async (startDate: Date, endDate: Date): Promise<WorkDayEntry[]> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_day_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
        args: [formatDateForDb(startDate), formatDateForDb(endDate)],
      });

      return result.rows.map((row) => workDayEntryRowToDomain(row as unknown as WorkDayEntryRow));
    },

    findMany: async (query: WorkDayEntryQuery = {}): Promise<WorkDayEntry[]> => {
      const { limit, offset, contractId, startDate, endDate } = query;
      
      let sql = 'SELECT * FROM work_day_entries';
      const args: any[] = [];
      const conditions: string[] = [];

      if (contractId) {
        conditions.push('contract_id = ?');
        args.push(contractId);
      }

      if (startDate) {
        conditions.push('date >= ?');
        args.push(formatDateForDb(startDate));
      }

      if (endDate) {
        conditions.push('date <= ?');
        args.push(formatDateForDb(endDate));
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY date DESC, created_at DESC';

      if (limit !== undefined) {
        sql += ' LIMIT ?';
        args.push(limit);
      }

      if (offset !== undefined) {
        sql += ' OFFSET ?';
        args.push(offset);
      }

      const result = await client.execute({
        sql,
        args,
      });

      return result.rows.map((row) => workDayEntryRowToDomain(row as unknown as WorkDayEntryRow));
    },

    update: async (entryData: UpdateWorkDayEntry): Promise<WorkDayEntry> => {
      // Validate input data
      const validatedData = UpdateWorkDayEntrySchema.parse(entryData);
      
      const fieldsToUpdate: string[] = [];
      const args: any[] = [];

      if (validatedData.date !== undefined) {
        fieldsToUpdate.push('date = ?');
        args.push(formatDateForDb(validatedData.date));
      }

      if (validatedData.contractId !== undefined) {
        fieldsToUpdate.push('contract_id = ?');
        args.push(validatedData.contractId);
      }

      if (validatedData.hours !== undefined) {
        fieldsToUpdate.push('hours = ?');
        args.push(validatedData.hours);
      }

      if (validatedData.notes !== undefined) {
        fieldsToUpdate.push('notes = ?');
        args.push(validatedData.notes);
      }

      if (fieldsToUpdate.length === 0) {
        // No fields to update, just return the existing entry
        const existing = await repository.findById(validatedData.id);
        if (!existing) {
          throw new Error('Work day entry not found');
        }
        return existing;
      }

      // Add the ID to the end of args array
      args.push(validatedData.id);

      const result = await client.execute({
        sql: `
          UPDATE work_day_entries 
          SET ${fieldsToUpdate.join(', ')}
          WHERE id = ?
          RETURNING *
        `,
        args,
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to update work day entry');
      }

      const row = result.rows[0] as unknown as WorkDayEntryRow;
      return workDayEntryRowToDomain(row);
    },

    deleteById: async (id: string): Promise<void> => {
      await client.execute({
        sql: 'DELETE FROM work_day_entries WHERE id = ?',
        args: [id],
      });
    },
  };
  
  return repository;
};

// Export a default instance using the global database connection
// Only create if we have a valid database connection
export const workDayEntryRepository = db ? createWorkDayEntryRepository(db) : null;