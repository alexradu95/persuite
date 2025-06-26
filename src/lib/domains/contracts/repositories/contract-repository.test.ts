import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createContractRepository } from './contract-repository';
import { DatabaseClient } from '@/lib/db/connection';
import { Contract, CreateContract, UpdateContract } from '@/lib/db/types';

// Test factory for creating mock contract data
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
      execute: vi.fn(),
    } as unknown as DatabaseClient;
    repository = createContractRepository(mockClient);
  });

  describe('create', () => {
    it('should create a new contract successfully', async () => {
      const contractData = getMockCreateContract();
      const mockDbResult = {
        rows: [{
          id: 'contract-1',
          name: 'Web Development Project',
          hourly_rate: 45,
          description: 'Frontend development for client portal',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.create(contractData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('INSERT INTO contracts'),
        args: [
          'contract-1',
          'Web Development Project',
          45,
          'Frontend development for client portal',
        ],
      });

      expect(result.id).toBe('contract-1');
      expect(result.name).toBe('Web Development Project');
      expect(result.hourlyRate).toBe(45);
      expect(result.description).toBe('Frontend development for client portal');
    });

    it('should handle contract creation without description', async () => {
      const contractData = getMockCreateContract({ description: undefined });
      const mockDbResult = {
        rows: [{
          id: 'contract-1',
          name: 'Web Development Project',
          hourly_rate: 45,
          description: null,
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.create(contractData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('INSERT INTO contracts'),
        args: [
          'contract-1',
          'Web Development Project',
          45,
          null,
        ],
      });

      expect(result.description).toBeUndefined();
    });

    it('should throw error when creation fails', async () => {
      const contractData = getMockCreateContract();
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await expect(repository.create(contractData)).rejects.toThrow('Failed to create contract');
    });
  });

  describe('findById', () => {
    it('should find contract by id successfully', async () => {
      const mockDbResult = {
        rows: [{
          id: 'contract-1',
          name: 'Web Development Project',
          hourly_rate: 45,
          description: 'Frontend development for client portal',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T10:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findById('contract-1');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM contracts WHERE id = ?'),
        args: ['contract-1'],
      });

      expect(result).not.toBeNull();
      expect(result!.id).toBe('contract-1');
      expect(result!.name).toBe('Web Development Project');
    });

    it('should return null when contract not found', async () => {
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find all contracts when no query provided', async () => {
      const mockDbResult = {
        rows: [
          {
            id: 'contract-1',
            name: 'Web Development Project',
            hourly_rate: 45,
            description: 'Frontend development',
            created_at: '2024-12-24T10:00:00Z',
            updated_at: '2024-12-24T10:00:00Z',
          },
          {
            id: 'contract-2',
            name: 'Backend API Project',
            hourly_rate: 50,
            description: null,
            created_at: '2024-12-24T11:00:00Z',
            updated_at: '2024-12-24T11:00:00Z',
          },
        ],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.findMany();

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('SELECT * FROM contracts ORDER BY created_at DESC'),
        args: [],
      });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('contract-1');
      expect(result[1].id).toBe('contract-2');
      expect(result[1].description).toBeUndefined();
    });

    it('should handle limit and offset in query', async () => {
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await repository.findMany({ limit: 10, offset: 5 });

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: 'SELECT * FROM contracts ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [10, 5],
      });
    });
  });

  describe('update', () => {
    it('should update contract successfully', async () => {
      const updateData: UpdateContract = {
        id: 'contract-1',
        hourlyRate: 55,
        description: 'Updated description',
      };
      
      const mockDbResult = {
        rows: [{
          id: 'contract-1',
          name: 'Web Development Project',
          hourly_rate: 55,
          description: 'Updated description',
          created_at: '2024-12-24T10:00:00Z',
          updated_at: '2024-12-24T12:00:00Z',
        }],
      };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      const result = await repository.update(updateData);

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: `
          UPDATE contracts 
          SET hourly_rate = ?, description = ?
          WHERE id = ?
          RETURNING *
        `,
        args: [55, 'Updated description', 'contract-1'],
      });

      expect(result.id).toBe('contract-1');
      expect(result.hourlyRate).toBe(55);
      expect(result.description).toBe('Updated description');
    });

    it('should throw error when update fails', async () => {
      const updateData: UpdateContract = {
        id: 'contract-1',
        hourlyRate: 55,
      };
      
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await expect(repository.update(updateData)).rejects.toThrow('Failed to update contract');
    });
  });

  describe('deleteById', () => {
    it('should delete contract successfully', async () => {
      const mockDbResult = { rows: [] };

      vi.mocked(mockClient.execute).mockResolvedValue(mockDbResult);

      await repository.deleteById('contract-1');

      expect(mockClient.execute).toHaveBeenCalledWith({
        sql: expect.stringContaining('DELETE FROM contracts WHERE id = ?'),
        args: ['contract-1'],
      });
    });
  });

  describe('error handling', () => {
    it('should throw error when client is null', () => {
      expect(() => createContractRepository(null)).toThrow('Database client is required for ContractRepository');
    });

    it('should throw error when client is undefined', () => {
      expect(() => createContractRepository(undefined)).toThrow('Database client is required for ContractRepository');
    });
  });
});