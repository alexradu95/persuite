import { 
  calculateDailyEarnings,
  Contract,
  CreateContract,
  UpdateContract,
  WorkDayEntry,
  CreateWorkDayEntry,
  UpdateWorkDayEntry
} from '@/lib/db/types';
import { ContractRepository } from '@/lib/domains/contracts/repositories/contract-repository';
import { WorkDayEntryRepository } from '@/lib/domains/work-day-entries/repositories/work-day-entry-repository';

export type ModernIncomeService = {
  // Contract operations
  createContract: (contract: CreateContract) => Promise<Contract>;
  updateContract: (contract: UpdateContract) => Promise<Contract>;
  deleteContract: (id: string) => Promise<void>;
  getContractById: (id: string) => Promise<Contract | null>;
  getAllContracts: () => Promise<Contract[]>;
  
  // Work day entry operations
  createWorkDayEntry: (entry: CreateWorkDayEntry) => Promise<WorkDayEntry>;
  updateWorkDayEntry: (entry: UpdateWorkDayEntry) => Promise<WorkDayEntry>;
  deleteWorkDayEntry: (id: string) => Promise<void>;
  getWorkDayEntryById: (id: string) => Promise<WorkDayEntry | null>;
  getWorkDayEntriesByDate: (date: Date) => Promise<WorkDayEntry[]>;
  getWorkDayEntriesByContract: (contractId: string) => Promise<WorkDayEntry[]>;
  getWorkDayEntriesByDateRange: (startDate: Date, endDate: Date) => Promise<WorkDayEntry[]>;
  
  // Income calculations
  getMonthlyData: (month: number, year: number) => Promise<MonthlyData>;
  calculateDailyEarningsFromEntries: (entries: WorkDayEntry[], contracts: Contract[]) => number;
  calculateEarnings: (hours: number, hourlyRate: number) => number;
};

export type MonthlyData = {
  month: string;
  year: number;
  workDayEntries: WorkDayEntry[];
  contracts: Contract[];
  entriesGroupedByDate: { [date: string]: WorkDayEntry[] };
  totalHours: number;
  totalEarnings: number;
  averageHourlyRate: number;
  workDaysCount: number;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const createModernIncomeService = (
  contractRepo?: ContractRepository,
  workDayEntryRepo?: WorkDayEntryRepository
): ModernIncomeService => {
  if (!contractRepo) {
    throw new Error('ContractRepository is required for ModernIncomeService');
  }
  if (!workDayEntryRepo) {
    throw new Error('WorkDayEntryRepository is required for ModernIncomeService');
  }

  const service: ModernIncomeService = {
    // Contract operations
    createContract: async (contractData: CreateContract): Promise<Contract> => {
      return await contractRepo.create(contractData);
    },

    updateContract: async (contractData: UpdateContract): Promise<Contract> => {
      return await contractRepo.update(contractData);
    },

    deleteContract: async (id: string): Promise<void> => {
      return await contractRepo.deleteById(id);
    },

    getContractById: async (id: string): Promise<Contract | null> => {
      return await contractRepo.findById(id);
    },

    getAllContracts: async (): Promise<Contract[]> => {
      return await contractRepo.findMany();
    },

    // Work day entry operations
    createWorkDayEntry: async (entryData: CreateWorkDayEntry): Promise<WorkDayEntry> => {
      return await workDayEntryRepo.create(entryData);
    },

    updateWorkDayEntry: async (entryData: UpdateWorkDayEntry): Promise<WorkDayEntry> => {
      return await workDayEntryRepo.update(entryData);
    },

    deleteWorkDayEntry: async (id: string): Promise<void> => {
      return await workDayEntryRepo.deleteById(id);
    },

    getWorkDayEntryById: async (id: string): Promise<WorkDayEntry | null> => {
      return await workDayEntryRepo.findById(id);
    },

    getWorkDayEntriesByDate: async (date: Date): Promise<WorkDayEntry[]> => {
      return await workDayEntryRepo.findByDate(date);
    },

    getWorkDayEntriesByContract: async (contractId: string): Promise<WorkDayEntry[]> => {
      return await workDayEntryRepo.findByContract(contractId);
    },

    getWorkDayEntriesByDateRange: async (startDate: Date, endDate: Date): Promise<WorkDayEntry[]> => {
      return await workDayEntryRepo.findByDateRange(startDate, endDate);
    },

    // Monthly data calculation
    getMonthlyData: async (month: number, year: number): Promise<MonthlyData> => {
      // Get work day entries for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of the month
      const workDayEntries = await workDayEntryRepo.findByDateRange(startDate, endDate);
      
      // Get all contracts
      const contracts = await contractRepo.findMany();
      
      // Group entries by date
      const entriesGroupedByDate = workDayEntries.reduce((acc, entry) => {
        const dateKey = entry.date.toISOString().split('T')[0];
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
      }, {} as { [date: string]: WorkDayEntry[] });

      // Calculate totals
      const totalHours = workDayEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const totalEarnings = service.calculateDailyEarningsFromEntries(workDayEntries, contracts);
      const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

      const monthIndex = month - 1;
      const workDaysCount = Object.keys(entriesGroupedByDate).length;

      return {
        month: monthNames[monthIndex],
        year,
        workDayEntries,
        contracts,
        entriesGroupedByDate,
        totalHours,
        totalEarnings,
        averageHourlyRate,
        workDaysCount,
      };
    },

    calculateDailyEarningsFromEntries: (entries: WorkDayEntry[], contracts: Contract[]): number => {
      return entries.reduce((totalEarnings, entry) => {
        const contract = contracts.find(c => c.id === entry.contractId);
        if (!contract) {
          console.warn(`Contract not found for entry ${entry.id}`);
          return totalEarnings;
        }
        return totalEarnings + calculateDailyEarnings(entry.hours, contract.hourlyRate);
      }, 0);
    },

    calculateEarnings: (hours: number, hourlyRate: number): number => {
      return calculateDailyEarnings(hours, hourlyRate);
    },
  };
  
  return service;
};