import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createContractRepository } from './contract-repository';
import { DatabaseClient } from '@/lib/db/connection';
import { Contract, CreateContract, UpdateContract } from '@/lib/db/types';

const getMockCreateContract = (overrides = {}): CreateContract => {
  return {
    id: 'contract-1',
    name: 'Web Development Project',
    hourlyRate: 45,
    description: 'Frontend development for client portal',
    ...overrides,
  };
};

const getMockContract = (overrides = {}): Contract => {
  return {
    id: 'contract-1',
    name: 'Web Development Project',
    hourlyRate: 45,
    description: 'Frontend development for client portal',
    createdAt: new Date('2024-12-24T10:00:00Z'),
    updatedAt: new Date('2024-12-24T10:00:00Z'),
    ...overrides,
  };
};

describe('Contract Repository', () => {
  let mockClient: DatabaseClient;
  let repository: ReturnType<typeof createContractRepository>;

  beforeEach(() => {
    mockClient = {
      query: vi.fn(),
      queryOne: vi.fn(),
      execute: vi.fn(),
      transaction: vi.fn(),
      close: vi.fn(),
    } as unknown as DatabaseClient;
    repository = createContractRepository(mockClient);
  });

  describe('create', () => {
    it('should create a new contract successfully', async () => {
      const contractData = getMockCreateContract();
      const mockDbRows = [{
        id: 'contract-1',
        name: 'Web Development Project',
        hourly_rate: 45,
        description: 'Frontend development for client portal',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.create(contractData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO contracts'),
        {
          params: [
            'contract-1',
            'Web Development Project',
            45,
            'Frontend development for client portal',
          ],
        }
      );

      expect(result).toEqual({
        id: 'contract-1',
        name: 'Web Development Project',
        hourlyRate: 45,
        description: 'Frontend development for client portal',
        createdAt: new Date('2024-12-24T10:00:00Z'),
        updatedAt: new Date('2024-12-24T10:00:00Z'),
      });
    });

    it('should handle null description correctly', async () => {
      const contractData = getMockCreateContract({ description: undefined });
      const mockDbRows = [{
        id: 'contract-1',
        name: 'Web Development Project',
        hourly_rate: 45,
        description: null,
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.create(contractData);

      expect(result.description).toBeUndefined();
    });

    it('should throw error when creation fails', async () => {
      const contractData = getMockCreateContract();
      vi.mocked(mockClient.query).mockResolvedValue([]);

      await expect(repository.create(contractData)).rejects.toThrow('Failed to create contract');
    });
  });

  describe('findById', () => {
    it('should find contract by id successfully', async () => {
      const mockDbRow = {
        id: 'contract-1',
        name: 'Web Development Project',
        hourly_rate: 45,
        description: 'Frontend development for client portal',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      };

      vi.mocked(mockClient.queryOne).mockResolvedValue(mockDbRow);

      const result = await repository.findById('contract-1');

      expect(mockClient.queryOne).toHaveBeenCalledWith(
        'SELECT * FROM contracts WHERE id = $1',
        { params: ['contract-1'] }
      );

      expect(result).toEqual({
        id: 'contract-1',
        name: 'Web Development Project',
        hourlyRate: 45,
        description: 'Frontend development for client portal',
        createdAt: new Date('2024-12-24T10:00:00Z'),
        updatedAt: new Date('2024-12-24T10:00:00Z'),
      });
    });

    it('should return null when contract not found', async () => {
      vi.mocked(mockClient.queryOne).mockResolvedValue(null);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find contracts with default query', async () => {
      const mockDbRows = [
        {
          id: 'contract-1',
          name: 'Web Development Project',
          hourly_rate: 45,
          description: 'Frontend development for client portal',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        },
        {
          id: 'contract-2',
          name: 'Backend API Development',
          hourly_rate: 50,
          description: null,
          created_at: '2024-12-23T09:00:00Z',
          updated_at: '2024-12-23T09:00:00Z',
        },
      ];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.findMany();

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM contracts ORDER BY created_at DESC',
        { params: [] }
      );

      expect(result).toHaveLength(2);
      expect(result[1].description).toBeUndefined();
    });

    it('should return empty array when no contracts found', async () => {
      vi.mocked(mockClient.query).mockResolvedValue([]);

      const result = await repository.findMany();

      expect(result).toEqual([]);
    });

    it('should handle limit and offset correctly', async () => {
      vi.mocked(mockClient.query).mockResolvedValue([]);

      await repository.findMany({ limit: 10, offset: 20 });

      expect(mockClient.query).toHaveBeenCalledWith(
        'SELECT * FROM contracts ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        { params: [10, 20] }
      );
    });
  });

  describe('update', () => {
    it('should update contract successfully', async () => {
      const updateData: UpdateContract = {
        id: 'contract-1',
        name: 'Updated Web Development Project',
      };
      
      const mockDbRows = [{
        id: 'contract-1',
        name: 'Updated Web Development Project',
        hourly_rate: 45,
        description: 'Frontend development for client portal',
        created_at: '2024-12-24T10:00:00Z',
        updated_at: '2024-12-24T10:00:00Z',
      }];

      vi.mocked(mockClient.query).mockResolvedValue(mockDbRows);

      const result = await repository.update(updateData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE contracts'),
        { params: ['Updated Web Development Project', 'contract-1'] }
      );

      expect(result.name).toBe('Updated Web Development Project');
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateContract = {
        id: 'contract-1',
        name: 'Updated Name',
      };

      vi.mocked(mockClient.query).mockResolvedValue([]);

      await expect(repository.update(updateData)).rejects.toThrow('Failed to update contract');
    });
  });

  describe('deleteById', () => {
    it('should delete contract successfully', async () => {
      vi.mocked(mockClient.execute).mockResolvedValue(undefined);

      await repository.deleteById('contract-1');

      expect(mockClient.execute).toHaveBeenCalledWith(
        'DELETE FROM contracts WHERE id = $1',
        { params: ['contract-1'] }
      );
    });
  });
});