import { describe, it, expect } from 'vitest';
import {
  WorkDaySchema,
  CreateWorkDaySchema,
  UpdateWorkDaySchema,
  ContractSchema,
  CreateContractSchema,
  UpdateContractSchema,
  WorkDayEntrySchema,
  CreateWorkDayEntrySchema,
  calculateDailyEarnings,
  workDayRowToDomain,
  contractRowToDomain,
  WorkDayRow,
  ContractRow,
} from './types';

// Test factory for creating mock work day data
const getMockCreateWorkDay = (overrides = {}) => {
  return {
    id: '1',
    date: new Date('2024-12-24'),
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

const getMockContract = (overrides = {}) => {
  return {
    id: 'contract-1',
    name: 'Web Development Project',
    hourlyRate: 45,
    description: 'Frontend development for client portal',
    ...overrides,
  };
};

const getMockContractRow = (overrides = {}): ContractRow => {
  return {
    id: 'contract-1',
    name: 'Web Development Project',
    hourly_rate: 45,
    description: 'Frontend development for client portal',
    created_at: '2024-12-24T10:00:00Z',
    updated_at: '2024-12-24T10:00:00Z',
    ...overrides,
  };
};

const getMockWorkDayEntry = (overrides = {}) => {
  return {
    id: 'entry-1',
    date: new Date('2024-12-24'),
    contractId: 'contract-1',
    hours: 4,
    notes: 'Worked on user interface',
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
      expect(result.date).toEqual(new Date('2024-12-24'));
      expect(result.hours).toBe(8);
      expect(result.hourlyRate).toBe(37);
    });

    it('should reject invalid date format', () => {
      const invalidWorkDay = getMockCreateWorkDay({ date: 'invalid-date' });
      
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
      
      // CreateWorkDaySchema omits createdAt and updatedAt, so they won't be present
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should include all required work day fields', () => {
      const createData = getMockCreateWorkDay();
      const result = CreateWorkDaySchema.parse(createData);
      
      expect(result.id).toBe('1');
      expect(result.date).toEqual(new Date('2024-12-24'));
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

describe('Contract Types and Schemas', () => {
  describe('ContractSchema', () => {
    it('should accept valid contract data', () => {
      const validContract = getMockContract();
      
      const result = ContractSchema.parse(validContract);
      expect(result.id).toBe('contract-1');
      expect(result.name).toBe('Web Development Project');
      expect(result.hourlyRate).toBe(45);
      expect(result.description).toBe('Frontend development for client portal');
    });

    it('should reject empty contract name', () => {
      const invalidContract = getMockContract({ name: '' });
      
      expect(() => ContractSchema.parse(invalidContract)).toThrow();
    });

    it('should reject negative hourly rate', () => {
      const invalidContract = getMockContract({ hourlyRate: -1 });
      
      expect(() => ContractSchema.parse(invalidContract)).toThrow();
    });

    it('should reject zero hourly rate', () => {
      const invalidContract = getMockContract({ hourlyRate: 0 });
      
      expect(() => ContractSchema.parse(invalidContract)).toThrow();
    });

    it('should accept contract without description', () => {
      const contractWithoutDescription = getMockContract({ description: undefined });
      
      const result = ContractSchema.parse(contractWithoutDescription);
      expect(result.description).toBeUndefined();
    });
  });

  describe('CreateContractSchema', () => {
    it('should omit timestamps from input data', () => {
      const createData = getMockContract();
      const result = CreateContractSchema.parse(createData);
      
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should include all required contract fields', () => {
      const createData = getMockContract();
      const result = CreateContractSchema.parse(createData);
      
      expect(result.id).toBe('contract-1');
      expect(result.name).toBe('Web Development Project');
      expect(result.hourlyRate).toBe(45);
    });
  });

  describe('UpdateContractSchema', () => {
    it('should allow partial updates with required id', () => {
      const partialUpdate = {
        id: 'contract-1',
        hourlyRate: 50,
      };
      
      const result = UpdateContractSchema.parse(partialUpdate);
      expect(result.id).toBe('contract-1');
      expect(result.hourlyRate).toBe(50);
      expect(result.name).toBeUndefined();
    });

    it('should require id field', () => {
      const updateWithoutId = {
        hourlyRate: 50,
      };
      
      expect(() => UpdateContractSchema.parse(updateWithoutId)).toThrow();
    });
  });
});

describe('WorkDayEntry Types and Schemas', () => {
  describe('WorkDayEntrySchema', () => {
    it('should accept valid work day entry data', () => {
      const validEntry = getMockWorkDayEntry();
      
      const result = WorkDayEntrySchema.parse(validEntry);
      expect(result.id).toBe('entry-1');
      expect(result.date).toEqual(new Date('2024-12-24'));
      expect(result.contractId).toBe('contract-1');
      expect(result.hours).toBe(4);
      expect(result.notes).toBe('Worked on user interface');
    });

    it('should reject invalid date format', () => {
      const invalidEntry = getMockWorkDayEntry({ date: 'invalid-date' });
      
      expect(() => WorkDayEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('should reject negative hours', () => {
      const invalidEntry = getMockWorkDayEntry({ hours: -1 });
      
      expect(() => WorkDayEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('should reject zero hours', () => {
      const invalidEntry = getMockWorkDayEntry({ hours: 0 });
      
      expect(() => WorkDayEntrySchema.parse(invalidEntry)).toThrow();
    });

    it('should accept entry without notes', () => {
      const entryWithoutNotes = getMockWorkDayEntry({ notes: undefined });
      
      const result = WorkDayEntrySchema.parse(entryWithoutNotes);
      expect(result.notes).toBeUndefined();
    });
  });

  describe('CreateWorkDayEntrySchema', () => {
    it('should omit timestamps from input data', () => {
      const createData = getMockWorkDayEntry();
      const result = CreateWorkDayEntrySchema.parse(createData);
      
      expect('createdAt' in result).toBe(false);
      expect('updatedAt' in result).toBe(false);
    });

    it('should include all required entry fields', () => {
      const createData = getMockWorkDayEntry();
      const result = CreateWorkDayEntrySchema.parse(createData);
      
      expect(result.id).toBe('entry-1');
      expect(result.date).toEqual(new Date('2024-12-24'));
      expect(result.contractId).toBe('contract-1');
      expect(result.hours).toBe(4);
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
      expect(workDay.date).toEqual(new Date('2024-12-24'));
      expect(workDay.hours).toBe(8);
      expect(workDay.hourlyRate).toBe(37);
      expect(workDay.notes).toBe('Test work day');
      expect(workDay.createdAt).toEqual(new Date('2024-12-24T10:00:00Z'));
      expect(workDay.updatedAt).toEqual(new Date('2024-12-24T10:00:00Z'));
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

  describe('contractRowToDomain', () => {
    it('should convert database row to domain object correctly', () => {
      const row = getMockContractRow();
      const contract = contractRowToDomain(row);
      
      expect(contract.id).toBe('contract-1');
      expect(contract.name).toBe('Web Development Project');
      expect(contract.hourlyRate).toBe(45);
      expect(contract.description).toBe('Frontend development for client portal');
      expect(contract.createdAt).toEqual(new Date('2024-12-24T10:00:00Z'));
      expect(contract.updatedAt).toEqual(new Date('2024-12-24T10:00:00Z'));
    });

    it('should handle null description correctly', () => {
      const row = getMockContractRow({ description: null });
      const contract = contractRowToDomain(row);
      
      expect(contract.description).toBeUndefined();
    });

    it('should handle empty string description correctly', () => {
      const row = getMockContractRow({ description: '' });
      const contract = contractRowToDomain(row);
      
      expect(contract.description).toBeUndefined();
    });

    it('should preserve hourly rate accuracy', () => {
      const row = getMockContractRow({ hourly_rate: 42.75 });
      const contract = contractRowToDomain(row);
      
      expect(contract.hourlyRate).toBe(42.75);
    });
  });
});