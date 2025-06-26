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
      // Validate input data
      const validatedData = CreateContractSchema.parse(contractData);
      
      const result = await client.execute({
        sql: `
          INSERT INTO contracts (id, name, hourly_rate, description)
          VALUES (?, ?, ?, ?)
          RETURNING *
        `,
        args: [
          validatedData.id,
          validatedData.name,
          validatedData.hourlyRate,
          validatedData.description || null,
        ],
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to create contract');
      }

      const row = result.rows[0] as unknown as ContractRow;
      return contractRowToDomain(row);
    },

    findById: async (id: string): Promise<Contract | null> => {
      const result = await client.execute({
        sql: 'SELECT * FROM contracts WHERE id = ?',
        args: [id],
      });

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0] as unknown as ContractRow;
      return contractRowToDomain(row);
    },

    findMany: async (query: ContractQuery = {}): Promise<Contract[]> => {
      const { limit, offset } = query;
      
      let sql = 'SELECT * FROM contracts ORDER BY created_at DESC';
      const args: any[] = [];

      if (limit !== undefined) {
        sql += ' LIMIT ?';
        args.push(limit);
      }

      if (offset !== undefined) {
        sql += ' OFFSET ?';
        args.push(offset);
      }

      const result = await client.execute({
        sql,
        args,
      });

      return result.rows.map((row) => contractRowToDomain(row as unknown as ContractRow));
    },

    update: async (contractData: UpdateContract): Promise<Contract> => {
      // Validate input data
      const validatedData = UpdateContractSchema.parse(contractData);
      
      const fieldsToUpdate: string[] = [];
      const args: any[] = [];

      if (validatedData.name !== undefined) {
        fieldsToUpdate.push('name = ?');
        args.push(validatedData.name);
      }

      if (validatedData.hourlyRate !== undefined) {
        fieldsToUpdate.push('hourly_rate = ?');
        args.push(validatedData.hourlyRate);
      }

      if (validatedData.description !== undefined) {
        fieldsToUpdate.push('description = ?');
        args.push(validatedData.description);
      }

      if (fieldsToUpdate.length === 0) {
        // No fields to update, just return the existing contract
        const existing = await repository.findById(validatedData.id);
        if (!existing) {
          throw new Error('Contract not found');
        }
        return existing;
      }

      // Add the ID to the end of args array
      args.push(validatedData.id);

      const result = await client.execute({
        sql: `
          UPDATE contracts 
          SET ${fieldsToUpdate.join(', ')}
          WHERE id = ?
          RETURNING *
        `,
        args,
      });

      if (result.rows.length === 0) {
        throw new Error('Failed to update contract');
      }

      const row = result.rows[0] as unknown as ContractRow;
      return contractRowToDomain(row);
    },

    deleteById: async (id: string): Promise<void> => {
      await client.execute({
        sql: 'DELETE FROM contracts WHERE id = ?',
        args: [id],
      });
    },
  };
  
  return repository;
};

// Export a default instance using the global database connection
// Only create if we have a valid database connection
export const contractRepository = db ? createContractRepository(db) : null;