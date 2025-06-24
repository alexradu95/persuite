import { db, DatabaseClient } from '../db/connection';
import {
  WorkDay,
  CreateWorkDay,
  UpdateWorkDay,
  WorkDayQuery,
  WorkDayRow,
  workDayRowToDomain,
  CreateWorkDaySchema,
  UpdateWorkDaySchema,
  WorkDayQuerySchema,
} from '../db/types';

export type WorkDayRepository = {
  create: (workDay: CreateWorkDay) => Promise<WorkDay>;
  findById: (id: string) => Promise<WorkDay | null>;
  findByDate: (date: string) => Promise<WorkDay | null>;
  findMany: (query?: WorkDayQuery) => Promise<WorkDay[]>;
  update: (workDay: UpdateWorkDay) => Promise<WorkDay>;
  deleteById: (id: string) => Promise<void>;
  findByMonth: (month: string) => Promise<WorkDay[]>; // month in YYYY-MM format
  findByDateRange: (startDate: string, endDate: string) => Promise<WorkDay[]>;
};

export const createWorkDayRepository = (client?: DatabaseClient | null): WorkDayRepository => {
  if (!client) {
    throw new Error('Database client is required for WorkDayRepository');
  }
  return {
    create: async (workDayData: CreateWorkDay): Promise<WorkDay> => {
      // Validate input data
      const validatedData = CreateWorkDaySchema.parse(workDayData);
      
      const result = await client.execute({
        sql: `
          INSERT INTO work_days (id, date, hours, hourly_rate, notes)
          VALUES (?, ?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          validatedData.id,
          validatedData.date,
          validatedData.hours,
          validatedData.hourlyRate,
          validatedData.notes || null,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to create work day');
      }

      return workDayRowToDomain(result.rows[0] as WorkDayRow);
    },

    findById: async (id: string): Promise<WorkDay | null> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_days WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return workDayRowToDomain(result.rows[0] as WorkDayRow);
    },

    findByDate: async (date: string): Promise<WorkDay | null> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_days WHERE date = ?',
        args: [date],
      });

      if (result.rows.length === 0) {
        return null;
      }

      return workDayRowToDomain(result.rows[0] as WorkDayRow);
    },

    findMany: async (query: WorkDayQuery = {}): Promise<WorkDay[]> => {
      const validatedQuery = WorkDayQuerySchema.parse(query);
      
      let sql = 'SELECT * FROM work_days WHERE 1=1';
      const args: unknown[] = [];

      if (validatedQuery.startDate) {
        sql += ' AND date >= ?';
        args.push(validatedQuery.startDate);
      }

      if (validatedQuery.endDate) {
        sql += ' AND date <= ?';
        args.push(validatedQuery.endDate);
      }

      if (validatedQuery.month) {
        sql += ' AND substr(date, 1, 7) = ?';
        args.push(validatedQuery.month);
      }

      if (validatedQuery.year) {
        sql += ' AND substr(date, 1, 4) = ?';
        args.push(validatedQuery.year.toString());
      }

      sql += ' ORDER BY date DESC';

      if (validatedQuery.limit) {
        sql += ' LIMIT ?';
        args.push(validatedQuery.limit);

        if (validatedQuery.offset) {
          sql += ' OFFSET ?';
          args.push(validatedQuery.offset);
        }
      }

      const result = await client.execute({ sql, args });
      return result.rows.map(row => workDayRowToDomain(row as WorkDayRow));
    },

    update: async (workDayData: UpdateWorkDay): Promise<WorkDay> => {
      const validatedData = UpdateWorkDaySchema.parse(workDayData);
      
      // Get existing work day to merge with updates
      const existing = await client.execute({
        sql: 'SELECT * FROM work_days WHERE id = ?',
        args: [validatedData.id],
      });

      if (existing.rows.length === 0) {
        throw new Error(`Work day with id ${validatedData.id} not found`);
      }

      const existingWorkDay = workDayRowToDomain(existing.rows[0] as WorkDayRow);
      
      // Merge existing data with updates
      const updatedData = {
        ...existingWorkDay,
        ...validatedData,
      };

      const result = await client.execute({
        sql: `
          UPDATE work_days 
          SET date = ?, hours = ?, hourly_rate = ?, notes = ?, updated_at = datetime('now')
          WHERE id = ?
          RETURNING *
        `,
        args: [
          updatedData.date,
          updatedData.hours,
          updatedData.hourlyRate,
          updatedData.notes || null,
          validatedData.id,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to update work day');
      }

      return workDayRowToDomain(result.rows[0] as WorkDayRow);
    },

    deleteById: async (id: string): Promise<void> => {
      const result = await client.execute({
        sql: 'DELETE FROM work_days WHERE id = ?',
        args: [id],
      });

      if (result.rowsAffected === 0) {
        throw new Error(`Work day with id ${id} not found`);
      }
    },

    findByMonth: async (month: string): Promise<WorkDay[]> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_days WHERE substr(date, 1, 7) = ? ORDER BY date ASC',
        args: [month],
      });

      return result.rows.map(row => workDayRowToDomain(row as WorkDayRow));
    },

    findByDateRange: async (startDate: string, endDate: string): Promise<WorkDay[]> => {
      const result = await client.execute({
        sql: 'SELECT * FROM work_days WHERE date >= ? AND date <= ? ORDER BY date ASC',
        args: [startDate, endDate],
      });

      return result.rows.map(row => workDayRowToDomain(row as WorkDayRow));
    },
  };
};