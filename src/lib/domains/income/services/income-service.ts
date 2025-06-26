import { WorkDay, MonthlyData, CreateWorkDay, UpdateWorkDay, calculateDailyEarnings } from '@/lib/db/types';
import { WorkDayRepository, createWorkDayRepository } from '@/lib/domains/work-days/repositories/work-day-repository';

export type IncomeService = {
  createWorkDay: (workDay: CreateWorkDay) => Promise<WorkDay>;
  updateWorkDay: (workDay: UpdateWorkDay) => Promise<WorkDay>;
  deleteWorkDay: (id: string) => Promise<void>;
  getWorkDayById: (id: string) => Promise<WorkDay | null>;
  getWorkDayByDate: (date: string) => Promise<WorkDay | null>;
  getMonthlyData: (month: number, year: number) => Promise<MonthlyData>;
  getWorkDaysByDateRange: (startDate: string, endDate: string) => Promise<WorkDay[]>;
  calculateEarnings: (hours: number, hourlyRate: number) => number;
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const createIncomeService = (
  workDayRepo?: WorkDayRepository
): IncomeService => {
  if (!workDayRepo) {
    throw new Error('WorkDayRepository is required for IncomeService');
  }
  return {
    createWorkDay: async (workDayData: CreateWorkDay): Promise<WorkDay> => {
      // Check if a work day already exists for this date
      const existingWorkDay = await workDayRepo.findByDate(workDayData.date);
      if (existingWorkDay) {
        throw new Error(`Work day already exists for date ${workDayData.date}`);
      }

      return await workDayRepo.create(workDayData);
    },

    updateWorkDay: async (workDayData: UpdateWorkDay): Promise<WorkDay> => {
      return await workDayRepo.update(workDayData);
    },

    deleteWorkDay: async (id: string): Promise<void> => {
      return await workDayRepo.deleteById(id);
    },

    getWorkDayById: async (id: string): Promise<WorkDay | null> => {
      return await workDayRepo.findById(id);
    },

    getWorkDayByDate: async (date: string): Promise<WorkDay | null> => {
      return await workDayRepo.findByDate(date);
    },

    getMonthlyData: async (month: number, year: number): Promise<MonthlyData> => {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const workDays = await workDayRepo.findByMonth(monthKey);

      const totalHours = workDays.reduce((sum, day) => sum + day.hours, 0);
      const totalEarnings = workDays.reduce((sum, day) => sum + calculateDailyEarnings(day.hours, day.hourlyRate), 0);
      const averageHourlyRate = totalHours > 0 ? totalEarnings / totalHours : 0;

      const monthIndex = parseInt(monthKey.split('-')[1]) - 1;

      return {
        month: monthNames[monthIndex],
        year,
        workDays,
        totalHours,
        totalEarnings,
        averageHourlyRate,
        workDaysCount: workDays.length,
      };
    },

    getWorkDaysByDateRange: async (startDate: string, endDate: string): Promise<WorkDay[]> => {
      return await workDayRepo.findByDateRange(startDate, endDate);
    },

    calculateEarnings: (hours: number, hourlyRate: number): number => {
      return calculateDailyEarnings(hours, hourlyRate);
    },
  };
};