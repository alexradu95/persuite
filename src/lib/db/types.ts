import { z } from 'zod';

// Schema-first approach following CLAUDE.md guidelines

// Work Day Schema - matches the database structure
export const WorkDaySchema = z.object({
  id: z.string().min(1),
  date: z.coerce.date(), // Date object, coerced from string input
  hours: z.number().positive(),
  hourlyRate: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
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
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
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
  date: string; // Will be string from database, then converted to Date
  hours: number;
  hourly_rate: number;
  notes: string | null;
  created_at: string; // Will be string from database, then converted to Date
  updated_at: string; // Will be string from database, then converted to Date
};

// Utility function to convert database row to domain object
export const workDayRowToDomain = (row: WorkDayRow): WorkDay => {
  return {
    id: row.id,
    date: new Date(row.date),
    hours: row.hours,
    hourlyRate: row.hourly_rate,
    notes: row.notes && row.notes.trim() !== '' ? row.notes : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

// Contract Schema - for separate contract management
export const ContractSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hourlyRate: z.number().positive(),
  description: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateContractSchema = ContractSchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateContractSchema = CreateContractSchema.partial().extend({
  id: z.string().min(1),
});

// Work Day Entry Schema - for individual contract work entries
export const WorkDayEntrySchema = z.object({
  id: z.string().min(1),
  date: z.coerce.date(), // Date object, coerced from string input
  contractId: z.string().min(1),
  hours: z.number().positive(),
  notes: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateWorkDayEntrySchema = WorkDayEntrySchema.omit({
  createdAt: true,
  updatedAt: true,
});

export const UpdateWorkDayEntrySchema = CreateWorkDayEntrySchema.partial().extend({
  id: z.string().min(1),
});

// Derive new types from schemas
export type Contract = z.infer<typeof ContractSchema>;
export type CreateContract = z.infer<typeof CreateContractSchema>;
export type UpdateContract = z.infer<typeof UpdateContractSchema>;
export type WorkDayEntry = z.infer<typeof WorkDayEntrySchema>;
export type CreateWorkDayEntry = z.infer<typeof CreateWorkDayEntrySchema>;
export type UpdateWorkDayEntry = z.infer<typeof UpdateWorkDayEntrySchema>;

// Database row types for new tables (snake_case from database)
export type ContractRow = {
  id: string;
  name: string;
  hourly_rate: number;
  description: string | null;
  created_at: string; // Will be string from database, then converted to Date
  updated_at: string; // Will be string from database, then converted to Date
};

export type WorkDayEntryRow = {
  id: string;
  date: string; // Will be string from database, then converted to Date
  contract_id: string;
  hours: number;
  notes: string | null;
  created_at: string; // Will be string from database, then converted to Date
  updated_at: string; // Will be string from database, then converted to Date
};

// Utility function to convert contract database row to domain object
export const contractRowToDomain = (row: ContractRow): Contract => {
  return {
    id: row.id,
    name: row.name,
    hourlyRate: row.hourly_rate,
    description: row.description && row.description.trim() !== '' ? row.description : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

// Utility function to convert work day entry database row to domain object
export const workDayEntryRowToDomain = (row: WorkDayEntryRow): WorkDayEntry => {
  return {
    id: row.id,
    date: new Date(row.date),
    contractId: row.contract_id,
    hours: row.hours,
    notes: row.notes && row.notes.trim() !== '' ? row.notes : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
};

// Utility function to calculate daily earnings
export const calculateDailyEarnings = (hours: number, hourlyRate: number): number => {
  return hours * hourlyRate;
};