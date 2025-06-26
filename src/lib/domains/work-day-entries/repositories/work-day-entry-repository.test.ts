import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorkDayEntryRepository } from './work-day-entry-repository';
import { DatabaseClient } from '@/lib/db/connection';
import { WorkDayEntry, CreateWorkDayEntry, UpdateWorkDayEntry } from '@/lib/db/types';

// Test factory for creating mock work day entry data
const getMockCreateWorkDayEntry = (overrides = {}): CreateWorkDayEntry => {
  return {
    id: 'entry-1',
    date: new Date('2024-12-24'),
    contractId: 'contract-1',
    hours: 4,
    notes: 'Worked on user interface',
    ...overrides,
  };
};

const getMockWorkDayEntry = (overrides = {}): WorkDayEntry => {
  return {
    id: 'entry-1',
    date: new Date('2024-12-24'),
    contractId: 'contract-1',
    hours: 4,
    notes: 'Worked on user interface',
    createdAt: new Date('2024-12-24T10:00:00Z'),
    updatedAt: new Date('2024-12-24T10:00:00Z'),
    ...overrides,
  };
};

describe('WorkDayEntry Repository', () => {
  let mockClient: DatabaseClient;
  let repository: ReturnType<typeof createWorkDayEntryRepository>;

  beforeEach(() => {
    mockClient = {
      execute: vi.fn(),
    } as unknown as DatabaseClient;
    repository = createWorkDayEntryRepository(mockClient);
  });

  describe('create', () => {
    it('should create a new work day entry successfully', async () => {
      const entryData = getMockCreateWorkDayEntry();
      const mockDbResult = {
        rows: [{
          id: 'entry-1',
          date: '2024-12-24',
          contract_id: 'contract-1',
          hours: 4,
          notes: 'Worked on user interface',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.create(entryData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('INSERT INTO work_day_entries'),
        args: [
          'entry-1',
          '2024-12-24',
          'contract-1',
          4,
          'Worked on user interface',
        ],
      });

      expect(result.id).toBe('entry-1');
      expect(result.date).toEqual(new Date('2024-12-24'));
      expect(result.contractId).toBe('contract-1');
      expect(result.hours).toBe(4);
      expect(result.notes).toBe('Worked on user interface');
    });

    it('should handle entry creation without notes', async () => {
      const entryData = getMockCreateWorkDayEntry({ notes: undefined });
      const mockDbResult = {
        rows: [{
          id: 'entry-1',
          date: '2024-12-24',
          contract_id: 'contract-1',
          hours: 4,
          notes: null,
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.create(entryData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('INSERT INTO work_day_entries'),
        args: [
          'entry-1',
          '2024-12-24',
          'contract-1',
          4,
          null,
        ],
      });

      expect(result.notes).toBeUndefined();
    });

    it('should throw error when creation fails', async () => {
      const entryData = getMockCreateWorkDayEntry();
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await expect(repository.create(entryData)).rejects.toThrow('Failed to create work day entry');
    });
  });

  describe('findById', () => {
    it('should find work day entry by id successfully', async () => {
      const mockDbResult = {
        rows: [{
          id: 'entry-1',
          date: '2024-12-24',
          contract_id: 'contract-1',
          hours: 4,
          notes: 'Worked on user interface',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findById('entry-1');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT * FROM work_day_entries WHERE id = ?',
        args: ['entry-1'],
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe('entry-1');
      expect(result!.contractId).toBe('contract-1');
    });

    it('should return null when entry not found', async () => {
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByDate', () => {
    it('should find all entries for a specific date', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'entry-1',
            date: '2024-12-24',
            contract_id: 'contract-1',
            hours: 4,
            notes: 'Frontend work',
            created_at: '2024-12-24T10:00:00Z',
            updated_at: '2024-12-24T10:00:00Z',
          },
          {
            id: 'entry-2',
            date: '2024-12-24',
            contract_id: 'contract-2',
            hours: 3,
            notes: 'Backend work',
            created_at: '2024-12-24T11:00:00Z',
            updated_at: '2024-12-24T11:00:00Z',
          },
        ],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findByDate(new Date('2024-12-24'));

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT * FROM work_day_entries WHERE date = ? ORDER BY created_at ASC',
        args: ['2024-12-24'],
      });

      expect(result).toHaveLength(2);
      expect(result[0].contractId).toBe('contract-1');
      expect(result[1].contractId).toBe('contract-2');
    });
  });

  describe('findByContract', () => {
    it('should find all entries for a specific contract', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'entry-1',
            date: '2024-12-24',
            contract_id: 'contract-1',
            hours: 4,
            notes: 'Day 1 work',
            created_at: '2024-12-24T10:00:00Z',
            updated_at: '2024-12-24T10:00:00Z',
          },
          {
            id: 'entry-2',
            date: '2024-12-25',
            contract_id: 'contract-1',
            hours: 5,
            notes: 'Day 2 work',
            created_at: '2024-12-25T10:00:00Z',
            updated_at: '2024-12-25T10:00:00Z',
          },
        ],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findByContract('contract-1');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT * FROM work_day_entries WHERE contract_id = ? ORDER BY date DESC',
        args: ['contract-1'],
      });

      expect(result).toHaveLength(2);
      expect(result[0].contractId).toBe('contract-1');
      expect(result[1].contractId).toBe('contract-1');
    });
  });

  describe('findByDateRange', () => {
    it('should find entries within date range', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'entry-1',
            date: '2024-12-24',
            contract_id: 'contract-1',
            hours: 4,
            notes: 'Work on 24th',
            created_at: '2024-12-24T10:00:00Z',
            updated_at: '2024-12-24T10:00:00Z',
          },
        ],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findByDateRange(
        new Date('2024-12-20'),
        new Date('2024-12-30')
      );

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT * FROM work_day_entries WHERE date >= ? AND date <= ? ORDER BY date ASC',
        args: ['2024-12-20', '2024-12-30'],
      });

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update work day entry successfully', async () => {
      const updateData: UpdateWorkDayEntry = {
        id: 'entry-1',
        hours: 5,
        notes: 'Updated notes',
      };
      
      const mockDbResult = {
        rows: [{
          id: 'entry-1',
          date: '2024-12-24',
          contract_id: 'contract-1',
          hours: 5,
          notes: 'Updated notes',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T12:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.update(updateData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: `
          UPDATE work_day_entries 
          SET hours = ?, notes = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [5, 'Updated notes', 'entry-1'],
      });

      expect(result.id).toBe('entry-1');
      expect(result.hours).toBe(5);
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateWorkDayEntry = {
        id: 'entry-1',
        hours: 5,
      };
      
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await expect(repository.update(updateData)).rejects.toThrow('Failed to update work day entry');
    });
  });

  describe('deleteById', () => {
    it('should delete work day entry successfully', async () => {
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await repository.deleteById('entry-1');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'DELETE FROM work_day_entries WHERE id = ?',
        args: ['entry-1'],
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when client is null', () => {
      expect(() => createWorkDayEntryRepository(null)).toThrow('Database client is required for WorkDayEntryRepository');
    });

    it('should throw error when client is undefined', () => {
      expect(() => createWorkDayEntryRepository(undefined)).toThrow('Database client is required for WorkDayEntryRepository');
    });
  });
});