import { db, DatabaseClient } from '@/lib/db/connection';
import {
  Contract,
  CreateContract,
  UpdateContract,
  ContractRow,
  contractRowToDomain,
  CreateContractSchema,
  UpdateContractSchema,
} from '@/lib/db/types';

export type ContractQuery = {
  limit?: number;
  offset?: number;
};

export type ContractRepository = {
  create: (contract: CreateContract) => Promise<Contract>;
  findById: (id: string) => Promise<Contract | null>;
  findMany: (query?: ContractQuery) => Promise<Contract[]>;
  update: (contract: UpdateContract) => Promise<Contract>;
  deleteById: (id: string) => Promise<void>;
};

export const createContractRepository = (client?: DatabaseClient | null): ContractRepository => {
  if (!client) {
    throw new Error('Database client is required for ContractRepository');
  }
  
  const repository: ContractRepository = {
    create: async (contractData: CreateContract): Promise<Contract> => {
      const validatedData = CreateContractSchema.parse(contractData);
      
      const rows = await client.query<ContractRow>(
        `INSERT INTO contracts (id, name, hourly_rate, description)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        {
          params: [
            validatedData.id,
            validatedData.name,
            validatedData.hourlyRate,
            validatedData.description || null,
          ],
        }
      );

      if (rows.length === 0) {
        throw new Error('Failed to create contract');
      }

      return contractRowToDomain(rows[0]);
    },

    findById: async (id: string): Promise<Contract | null> => {
      const row = await client.queryOne<ContractRow>(
        'SELECT * FROM contracts WHERE id = $1',
        { params: [id] }
      );

      return row ? contractRowToDomain(row) : null;
    },

    findMany: async (query: ContractQuery = {}): Promise<Contract[]> => {
      const { limit, offset } = query;
      
      let sql = 'SELECT * FROM contracts ORDER BY created_at DESC';
      const params: unknown[] = [];
      let paramIndex = 1;

      if (limit !== undefined) {
        sql += ` LIMIT $${paramIndex++}`;
        params.push(limit);
      }

      if (offset !== undefined) {
        sql += ` OFFSET $${paramIndex++}`;
        params.push(offset);
      }

      const rows = await client.query<ContractRow>(sql, { params });
      return rows.map(contractRowToDomain);
    },

    update: async (contractData: UpdateContract): Promise<Contract> => {
      const validatedData = UpdateContractSchema.parse(contractData);
      
      const fieldsToUpdate: string[] = [];
      const params: unknown[] = [];
      let paramIndex = 1;

      if (validatedData.name !== undefined) {
        fieldsToUpdate.push(`name = $${paramIndex++}`);
        params.push(validatedData.name);
      }

      if (validatedData.hourlyRate !== undefined) {
        fieldsToUpdate.push(`hourly_rate = $${paramIndex++}`);
        params.push(validatedData.hourlyRate);
      }

      if (validatedData.description !== undefined) {
        fieldsToUpdate.push(`description = $${paramIndex++}`);
        params.push(validatedData.description);
      }

      if (fieldsToUpdate.length === 0) {
        const existing = await repository.findById(validatedData.id);
        if (!existing) {
          throw new Error('Contract not found');
        }
        return existing;
      }

      params.push(validatedData.id);

      const rows = await client.query<ContractRow>(
        `UPDATE contracts 
         SET ${fieldsToUpdate.join(', ')}
         WHERE id = $${paramIndex}
         RETURNING *`,
        { params }
      );

      if (rows.length === 0) {
        throw new Error('Failed to update contract');
      }

      return contractRowToDomain(rows[0]);
    },

    deleteById: async (id: string): Promise<void> => {
      await client.execute(
        'DELETE FROM contracts WHERE id = $1',
        { params: [id] }
      );
    },
  };
  
  return repository;
};

export const contractRepository = db ? createContractRepository(db) : null;