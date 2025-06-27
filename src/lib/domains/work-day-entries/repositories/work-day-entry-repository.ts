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

const formatDateForDb = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const createWorkDayEntryRepository = (client?: DatabaseClient | null): WorkDayEntryRepository => {
  if (!client) {
    throw new Error('Database client is required for WorkDayEntryRepository');
  }
  
  const repository: WorkDayEntryRepository = {
    create: async (entryData: CreateWorkDayEntry): Promise<WorkDayEntry> => {
      const validatedData = CreateWorkDayEntrySchema.parse(entryData);
      
      const rows = await client.query<WorkDayEntryRow>(
        `INSERT INTO work_day_entries (id, date, contract_id, hours, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        {
          params: [
            validatedData.id,
            formatDateForDb(validatedData.date),
            validatedData.contractId,
            validatedData.hours,
            validatedData.notes || null,
          ],
        }
      );

      if (rows.length === 0) {
        throw new Error('Failed to create work day entry');
      }

      return workDayEntryRowToDomain(rows[0]);
    },

    findById: async (id: string): Promise<WorkDayEntry | null> => {
      const row = await client.queryOne<WorkDayEntryRow>(
        'SELECT * FROM work_day_entries WHERE id = $1',
        { params: [id] }
      );

      return row ? workDayEntryRowToDomain(row) : null;
    },

    findByDate: async (date: Date): Promise<WorkDayEntry[]> => {
      const rows = await client.query<WorkDayEntryRow>(
        'SELECT * FROM work_day_entries WHERE date = $1 ORDER BY created_at ASC',
        { params: [formatDateForDb(date)] }
      );

      return rows.map(workDayEntryRowToDomain);
    },

    findByContract: async (contractId: string): Promise<WorkDayEntry[]> => {
      const rows = await client.query<WorkDayEntryRow>(
        'SELECT * FROM work_day_entries WHERE contract_id = $1 ORDER BY date DESC',
        { params: [contractId] }
      );

      return rows.map(workDayEntryRowToDomain);
    },

    findByDateRange: async (startDate: Date, endDate: Date): Promise<WorkDayEntry[]> => {
      const rows = await client.query<WorkDayEntryRow>(
        'SELECT * FROM work_day_entries WHERE date >= $1 AND date <= $2 ORDER BY date ASC',
        { params: [formatDateForDb(startDate), formatDateForDb(endDate)] }
      );

      return rows.map(workDayEntryRowToDomain);
    },

    findMany: async (query: WorkDayEntryQuery = {}): Promise<WorkDayEntry[]> => {
      const { limit, offset, contractId, startDate, endDate } = query;
      
      let sql = 'SELECT * FROM work_day_entries';
      const params: unknown[] = [];
      const conditions: string[] = [];
      let paramIndex = 1;

      if (contractId) {
        conditions.push(`contract_id = $${paramIndex++}`);
        params.push(contractId);
      }

      if (startDate) {
        conditions.push(`date >= $${paramIndex++}`);
        params.push(formatDateForDb(startDate));
      }

      if (endDate) {
        conditions.push(`date <= $${paramIndex++}`);
        params.push(formatDateForDb(endDate));
      }

      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }

      sql += ' ORDER BY date DESC, created_at DESC';

      if (limit !== undefined) {
        sql += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }

      if (offset !== undefined) {
        sql += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }

      const rows = await client.query<WorkDayEntryRow>(sql, { params });
      return rows.map(workDayEntryRowToDomain);
    },

    update: async (entryData: UpdateWorkDayEntry): Promise<WorkDayEntry> => {
      const validatedData = UpdateWorkDayEntrySchema.parse(entryData);
      
      const fieldsToUpdate: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (validatedData.date !== undefined) {
        fieldsToUpdate.push(`date = $${paramIndex++}`);
        params.push(formatDateForDb(validatedData.date));
      }

      if (validatedData.contractId !== undefined) {
        fieldsToUpdate.push(`contract_id = $${paramIndex++}`);
        params.push(validatedData.contractId);
      }

      if (validatedData.hours !== undefined) {
        fieldsToUpdate.push(`hours = $${paramIndex++}`);
        params.push(validatedData.hours);
      }

      if (validatedData.notes !== undefined) {
        fieldsToUpdate.push(`notes = $${paramIndex++}`);
        params.push(validatedData.notes);
      }

      if (fieldsToUpdate.length === 0) {
        const existing = await repository.findById(validatedData.id);
        if (!existing) {
          throw new Error('Work day entry not found');
        }
        return existing;
      }

      params.push(validatedData.id);

      const rows = await client.query<WorkDayEntryRow>(
        `UPDATE work_day_entries 
         SET ${fieldsToUpdate.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        { params }
      );

      if (rows.length === 0) {
        throw new Error('Failed to update work day entry');
      }

      return workDayEntryRowToDomain(rows[0]);
    },

    deleteById: async (id: string): Promise<void> => {
      await client.execute(
        'DELETE FROM work_day_entries WHERE id = $1',
        { params: [id] }
      );
    },
  };
  
  return repository;
};

export const workDayEntryRepository = db ? createWorkDayEntryRepository(db) : null;