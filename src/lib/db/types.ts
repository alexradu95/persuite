import { z } from 'zod';

// Schema-first approach following CLAUDE.md guidelines

// Work Day Schema - matches the database structure
export const WorkDaySchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // ISO 8601 date format
  hours: z.number().positive(),
  hourlyRate: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const CreateWorkDaySchema = WorkDaySchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateWorkDaySchema = CreateWorkDaySchema.partial().extend({
  id: z.string().min(1),
});

// Monthly Data Schema - for aggregated calculations
export const MonthlyDataSchema = z.object({
  month: z.string(),
  year: z.number().int(),
  workDays: z.array(WorkDaySchema),
  totalHours: z.number().min(0),
  totalEarnings: z.number().min(0),
  averageHourlyRate: z.number().min(0),
  workDaysCount: z.number().int().min(0),
});

// Query Schemas
export const WorkDayQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  year: z.number().int().optional(),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});

// Derive types from schemas
export type WorkDay = z.infer<typeof WorkDaySchema>;
export type CreateWorkDay = z.infer<typeof CreateWorkDaySchema>;
export type UpdateWorkDay = z.infer<typeof UpdateWorkDaySchema>;
export type MonthlyData = z.infer<typeof MonthlyDataSchema>;
export type WorkDayQuery = z.infer<typeof WorkDayQuerySchema>;

// Database row types (snake_case from database)
export type WorkDayRow = {
  id: string;
  date: string;
  hours: number;
  hourly_rate: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Utility function to convert database row to domain object
export const workDayRowToDomain = (row: WorkDayRow): WorkDay => {
  return {
    id: row.id,
    date: row.date,
    hours: row.hours,
    hourlyRate: row.hourly_rate,
    notes: row.notes && row.notes.trim() !== '' ? row.notes : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

// Utility function to calculate daily earnings
export const calculateDailyEarnings = (hours: number, hourlyRate: number): number => {
  return hours * hourlyRate;
};