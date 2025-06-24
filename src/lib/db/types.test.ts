import { describe, it, expect } from 'vitest';
import {
  WorkDaySchema,
  CreateWorkDaySchema,
  UpdateWorkDaySchema,
  calculateDailyEarnings,
  workDayRowToDomain,
  WorkDayRow,
} from './types';

// Test factory for creating mock work day data
const getMockCreateWorkDay = (overrides = {}) => {
  return {
    id: '1',
    date: '2024-12-24',
    hours: 8,
    hourlyRate: 37,
    notes: 'Test work day',
    ...overrides,
  };
};

const getMockWorkDayRow = (overrides = {}): WorkDayRow => {
  return {
    id: '1',
    date: '2024-12-24',
    hours: 8,
    hourly_rate: 37,
    notes: 'Test work day',
    created_at: '2024-12-24T10:00:00Z',
    updated_at: '2024-12-24T10:00:00Z',
    ...overrides,
  };
};

describe('WorkDay Types and Schemas', () => {
  describe('WorkDaySchema', () => {
    it('should accept valid work day data', () => {
      const validWorkDay = {
        id: '1',
        date: '2024-12-24',
        hours: 8,
        hourlyRate: 37,
        notes: 'Test work day',
      };
      
      const result = WorkDaySchema.parse(validWorkDay);
      expect(result.id).toBe('1');
      expect(result.date).toBe('2024-12-24');
      expect(result.hours).toBe(8);
      expect(result.hourlyRate).toBe(37);
    });

    it('should reject invalid date format', () => {
      const invalidWorkDay = getMockCreateWorkDay({ date: '24-12-2024' });
      
      expect(() => WorkDaySchema.parse(invalidWorkDay)).toThrow();
    });

    it('should reject negative hours', () => {
      const invalidWorkDay = getMockCreateWorkDay({ hours: -1 });
      
      expect(() => WorkDaySchema.parse(invalidWorkDay)).toThrow();
    });

    it('should reject zero hours', () => {
      const invalidWorkDay = getMockCreateWorkDay({ hours: 0 });
      
      expect(() => WorkDaySchema.parse(invalidWorkDay)).toThrow();
    });

    it('should reject negative hourly rate', () => {
      const invalidWorkDay = getMockCreateWorkDay({ hourlyRate: -1 });
      
      expect(() => WorkDaySchema.parse(invalidWorkDay)).toThrow();
    });

    it('should reject zero hourly rate', () => {
      const invalidWorkDay = getMockCreateWorkDay({ hourlyRate: 0 });
      
      expect(() => WorkDaySchema.parse(invalidWorkDay)).toThrow();
    });

    it('should accept work day without notes', () => {
      const workDayWithoutNotes = getMockCreateWorkDay({ notes: undefined });
      
      const result = WorkDaySchema.parse(workDayWithoutNotes);
      expect(result.notes).toBeUndefined();
    });
  });

  describe('CreateWorkDaySchema', () => {
    it('should omit timestamps from input data', () => {
      const createData = getMockCreateWorkDay();
      const result = CreateWorkDaySchema.parse(createData);
      
      expect(result.createdAt).toBeUndefined();
      expect(result.updatedAt).toBeUndefined();
    });

    it('should include all required work day fields', () => {
      const createData = getMockCreateWorkDay();
      const result = CreateWorkDaySchema.parse(createData);
      
      expect(result.id).toBe('1');
      expect(result.date).toBe('2024-12-24');
      expect(result.hours).toBe(8);
      expect(result.hourlyRate).toBe(37);
      expect(result.notes).toBe('Test work day');
    });
  });

  describe('UpdateWorkDaySchema', () => {
    it('should allow partial updates with required id', () => {
      const partialUpdate = {
        id: '1',
        hours: 6,
      };
      
      const result = UpdateWorkDaySchema.parse(partialUpdate);
      expect(result.id).toBe('1');
      expect(result.hours).toBe(6);
      expect(result.date).toBeUndefined();
      expect(result.hourlyRate).toBeUndefined();
    });

    it('should require id field', () => {
      const updateWithoutId = {
        hours: 6,
      };
      
      expect(() => UpdateWorkDaySchema.parse(updateWithoutId)).toThrow();
    });

    it('should validate partial field types correctly', () => {
      const invalidUpdate = {
        id: '1',
        hours: 'not a number',
      };
      
      expect(() => UpdateWorkDaySchema.parse(invalidUpdate)).toThrow();
    });
  });
});

describe('Utility Functions', () => {
  describe('calculateDailyEarnings', () => {
    it('should calculate earnings correctly for whole hours', () => {
      const earnings = calculateDailyEarnings(8, 37);
      expect(earnings).toBe(296);
    });

    it('should calculate earnings correctly for partial hours', () => {
      const earnings = calculateDailyEarnings(4.5, 40);
      expect(earnings).toBe(180);
    });

    it('should handle decimal rates correctly', () => {
      const earnings = calculateDailyEarnings(8, 37.5);
      expect(earnings).toBe(300);
    });

    it('should handle zero hours', () => {
      const earnings = calculateDailyEarnings(0, 37);
      expect(earnings).toBe(0);
    });

    it('should handle zero rate', () => {
      const earnings = calculateDailyEarnings(8, 0);
      expect(earnings).toBe(0);
    });
  });

  describe('workDayRowToDomain', () => {
    it('should convert database row to domain object correctly', () => {
      const row = getMockWorkDayRow();
      const workDay = workDayRowToDomain(row);
      
      expect(workDay.id).toBe('1');
      expect(workDay.date).toBe('2024-12-24');
      expect(workDay.hours).toBe(8);
      expect(workDay.hourlyRate).toBe(37);
      expect(workDay.notes).toBe('Test work day');
      expect(workDay.createdAt).toBe('2024-12-24T10:00:00Z');
      expect(workDay.updatedAt).toBe('2024-12-24T10:00:00Z');
    });

    it('should handle null notes correctly', () => {
      const row = getMockWorkDayRow({ notes: null });
      const workDay = workDayRowToDomain(row);
      
      expect(workDay.notes).toBeUndefined();
    });

    it('should handle empty string notes correctly', () => {
      const row = getMockWorkDayRow({ notes: '' });
      const workDay = workDayRowToDomain(row);
      
      expect(workDay.notes).toBeUndefined();
    });

    it('should preserve all numeric values accurately', () => {
      const row = getMockWorkDayRow({ 
        hours: 7.5, 
        hourly_rate: 42.33 
      });
      const workDay = workDayRowToDomain(row);
      
      expect(workDay.hours).toBe(7.5);
      expect(workDay.hourlyRate).toBe(42.33);
    });
  });
});