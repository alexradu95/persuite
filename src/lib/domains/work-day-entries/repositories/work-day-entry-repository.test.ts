import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorkDayEntryRepository } from './work-day-entry-repository';
import { DatabaseClient } from '@/lib/db/connection';
import { WorkDayEntry, CreateWorkDayEntry, UpdateWorkDayEntry } from '@/lib/db/types';

const getMockCreateWorkDayEntry = (overrides = {}): CreateWorkDayEntry => {
  return {
    id: 'entry-1',
    date: new Date('2024-12-24'),
    contractId: 'contract-1',
    hours: 8,
    notes: 'Worked on frontend components',
    ...overrides,
  };
};

const getMockWorkDayEntry = (overrides = {}): WorkDayEntry => {
  return {
    id: 'entry-1',
    date: new Date('2024-12-24'),
    contractId: 'contract-1',
    hours: 8,
    notes: 'Worked on frontend components',
    createdAt: new Date('2024-12-24T10:00:00Z'),
    updatedAt: new Date('2024-12-24T10:00:00Z'),
    ...overrides,
  };
};

describe('Work Day Entry Repository', () => {
  let mockClient: DatabaseClient;
  let repository: ReturnType<typeof createWorkDayEntryRepository>;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      queryOne: vi.fn(),
      execute: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
    } as unknown as DatabaseClient;
    repository = createWorkDayEntryRepository(mockClient);
  });

  describe('create', () => {
    it('should create a new work day entry successfully', async () => {
      const entryData = getMockCreateWorkDayEntry();
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.create(entryData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO work_day_entries'),
        {
          params: [
            'entry-1',
            '2024-12-24',
            'contract-1',
            8,
            'Worked on frontend components',
          ],
        }
      );

      expect(result).toEqual({
        id: 'entry-1',
        date: new Date('2024-12-24'),
        contractId: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        createdAt: new Date('2024-12-24T10:00:00Z'),
        updatedAt: new Date('2024-12-24T10:00:00Z'),
      });
    });

    it('should handle null notes correctly', async () => {
      const entryData = getMockCreateWorkDayEntry({ notes: undefined });
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: null,
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.create(entryData);

      expect(result.notes).toBeUndefined();
    });

    it('should throw error when creation fails', async () => {
      const entryData = getMockCreateWorkDayEntry();
      vi.mocked(mockClient.query).mockResolvedValue([]);

      await expect(repository.create(entryData)).rejects.toThrow('Failed to create work day entry');
    });
  });

  describe('findById', () => {
    it('should find work day entry by id successfully', async () => {
      const mockDbRow = {
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      };

      vi.mocked(mockClient.queryOne).mockResolvedValue(mockDbRow);

      const result = await repository.findById('entry-1');

      expect(mockClient.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM work_day_entries WHERE id = $1',
        { params: ['entry-1'] }
      );

      expect(result).toEqual({
        id: 'entry-1',
        date: new Date('2024-12-24'),
        contractId: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        createdAt: new Date('2024-12-24T10:00:00Z'),
        updatedAt: new Date('2024-12-24T10:00:00Z'),
      });
    });

    it('should return null when entry not found', async () => {
      vi.mocked(mockClient.queryOne).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByDate', () => {
    it('should find entries by date successfully', async () => {
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.findByDate(new Date('2024-12-24'));

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM work_day_entries WHERE date = $1 ORDER BY created_at ASC',
        { params: ['2024-12-24'] }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('findByContract', () => {
    it('should find entries by contract successfully', async () => {
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.findByContract('contract-1');

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM work_day_entries WHERE contract_id = $1 ORDER BY date DESC',
        { params: ['contract-1'] }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('findByDateRange', () => {
    it('should find entries by date range successfully', async () => {
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.findByDateRange(
        new Date('2024-12-01'),
        new Date('2024-12-31')
      );

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM work_day_entries WHERE date >= $1 AND date <= $2 ORDER BY date ASC',
        { params: ['2024-12-01', '2024-12-31'] }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('findMany', () => {
    it('should find entries with filters successfully', async () => {
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 8,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.findMany({
        contractId: 'contract-1',
        startDate: new Date('2024-12-01'),
        endDate: new Date('2024-12-31'),
        limit: 10,
        offset: 0,
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE contract_id = $1 AND date >= $2 AND date <= $3'),
        { params: ['contract-1', '2024-12-01', '2024-12-31', 10, 0] }
      );

      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update work day entry successfully', async () => {
      const updateData: UpdateWorkDayEntry = {
        id: 'entry-1',
        hours: 9,
      };
      
      const mockDbRows = [{
        id: 'entry-1',
        date: '2024-12-24',
        contract_id: 'contract-1',
        hours: 9,
        notes: 'Worked on frontend components',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.update(updateData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE work_day_entries'),
        { params: [9, 'entry-1'] }
      );

      expect(result.hours).toBe(9);
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateWorkDayEntry = {
        id: 'entry-1',
        hours: 9,
      };

      vi.mocked(mockClient.query).mockResolvedValue([]);

      await expect(repository.update(updateData)).rejects.toThrow('Failed to update work day entry');
    });
  });

  describe('deleteById', () => {
    it('should delete work day entry successfully', async () => {
      vi.mocked(mockClient.execute).mockResolvedValue(undefined);

      await repository.deleteById('entry-1');

      expect(mockClient.execute).toHaveBeenCalledWith(
        'DELETE FROM work_day_entries WHERE id = $1',
        { params: ['entry-1'] }
      );
    });
  });
});