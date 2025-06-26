import { describe, it, expect, beforeEach } from 'vitest';
import { createIncomeService } from './income-service';
import { WorkDayRepository } from '@/lib/domains/work-days/repositories/work-day-repository';
import { WorkDay, CreateWorkDay, UpdateWorkDay } from '../db/types';

// Mock repository implementation for testing
const createMockWorkDayRepository = (): WorkDayRepository => {
  const workDays: WorkDay[] = [];
  
  return {
    create: async (workDay: CreateWorkDay): Promise<WorkDay> => {
      const existing = workDays.find(wd => wd.date === workDay.date);
      if (existing) {
        throw new Error(`Work day already exists for date ${workDay.date}`);
      }
      
      const newWorkDay: WorkDay = {
        ...workDay,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      workDays.push(newWorkDay);
      return newWorkDay;
    },
    
    findById: async (id: string): Promise<WorkDay | null> => {
      return workDays.find(wd => wd.id === id) || null;
    },
    
    findByDate: async (date: string): Promise<WorkDay | null> => {
      return workDays.find(wd => wd.date === date) || null;
    },
    
    findMany: async (): Promise<WorkDay[]> => {
      return [...workDays];
    },
    
    update: async (workDay: UpdateWorkDay): Promise<WorkDay> => {
      const index = workDays.findIndex(wd => wd.id === workDay.id);
      if (index === -1) {
        throw new Error(`Work day with id ${workDay.id} not found`);
      }
      
      const updatedWorkDay = {
        ...workDays[index],
        ...workDay,
        updatedAt: new Date().toISOString(),
      };
      workDays[index] = updatedWorkDay;
      return updatedWorkDay;
    },
    
    deleteById: async (id: string): Promise<void> => {
      const index = workDays.findIndex(wd => wd.id === id);
      if (index === -1) {
        throw new Error(`Work day with id ${id} not found`);
      }
      workDays.splice(index, 1);
    },
    
    findByMonth: async (month: string): Promise<WorkDay[]> => {
      return workDays.filter(wd => wd.date.startsWith(month));
    },
    
    findByDateRange: async (startDate: string, endDate: string): Promise<WorkDay[]> => {
      return workDays.filter(wd => wd.date >= startDate && wd.date <= endDate);
    },
  };
};

// Test factory for creating mock work day data
const getMockCreateWorkDay = (overrides = {}): CreateWorkDay => {
  return {
    id: '1',
    date: '2024-12-24',
    hours: 8,
    hourlyRate: 37,
    notes: 'Test work day',
    ...overrides,
  };
};

describe('Income Service', () => {
  let mockRepo: WorkDayRepository;
  let service: ReturnType<typeof createIncomeService>;

  beforeEach(() => {
    mockRepo = createMockWorkDayRepository();
    service = createIncomeService(mockRepo);
  });

  describe('createWorkDay', () => {
    it('should create work day successfully', async () => {
      const workDayData = getMockCreateWorkDay();
      const result = await service.createWorkDay(workDayData);
      
      expect(result.id).toBe('1');
      expect(result.date).toBe('2024-12-24');
      expect(result.hours).toBe(8);
      expect(result.hourlyRate).toBe(37);
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
    });

    it('should fail when date already exists', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      await expect(service.createWorkDay(workDayData))
        .rejects
        .toThrow('Work day already exists for date 2024-12-24');
    });

    it('should create work day with optional notes', async () => {
      const workDayData = getMockCreateWorkDay({ notes: undefined });
      const result = await service.createWorkDay(workDayData);
      
      expect(result.notes).toBeUndefined();
    });
  });

  describe('getWorkDayById', () => {
    it('should retrieve work day successfully', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      const result = await service.getWorkDayById('1');
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
      expect(result?.date).toBe('2024-12-24');
    });

    it('should return null when work day not found', async () => {
      const result = await service.getWorkDayById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('getWorkDayByDate', () => {
    it('should retrieve work day by date successfully', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      const result = await service.getWorkDayByDate('2024-12-24');
      expect(result).toBeDefined();
      expect(result?.date).toBe('2024-12-24');
    });

    it('should return null when no work day exists for date', async () => {
      const result = await service.getWorkDayByDate('2024-12-25');
      expect(result).toBeNull();
    });
  });

  describe('updateWorkDay', () => {
    it('should update work day successfully', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      const updateData: UpdateWorkDay = {
        id: '1',
        hours: 6,
        hourlyRate: 40,
      };
      
      const result = await service.updateWorkDay(updateData);
      expect(result.hours).toBe(6);
      expect(result.hourlyRate).toBe(40);
      expect(result.date).toBe('2024-12-24'); // Unchanged
    });

    it('should allow partial updates', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      const updateData: UpdateWorkDay = {
        id: '1',
        hours: 6,
      };
      
      const result = await service.updateWorkDay(updateData);
      expect(result.hours).toBe(6);
      expect(result.hourlyRate).toBe(37); // Unchanged
      expect(result.date).toBe('2024-12-24'); // Unchanged
    });

    it('should fail when work day not found', async () => {
      const updateData: UpdateWorkDay = {
        id: 'nonexistent',
        hours: 6,
      };
      
      await expect(service.updateWorkDay(updateData))
        .rejects
        .toThrow('Work day with id nonexistent not found');
    });
  });

  describe('deleteWorkDay', () => {
    it('should delete work day successfully', async () => {
      const workDayData = getMockCreateWorkDay();
      await service.createWorkDay(workDayData);
      
      await service.deleteWorkDay('1');
      
      const result = await service.getWorkDayById('1');
      expect(result).toBeNull();
    });

    it('should fail when work day not found', async () => {
      await expect(service.deleteWorkDay('nonexistent'))
        .rejects
        .toThrow('Work day with id nonexistent not found');
    });
  });

  describe('getMonthlyData', () => {
    beforeEach(async () => {
      // Create multiple work days for December 2024
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '1', 
        date: '2024-12-01', 
        hours: 8, 
        hourlyRate: 37 
      }));
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '2', 
        date: '2024-12-02', 
        hours: 6, 
        hourlyRate: 40 
      }));
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '3', 
        date: '2024-12-03', 
        hours: 8, 
        hourlyRate: 37 
      }));
    });

    it('should calculate monthly statistics correctly', async () => {
      const monthlyData = await service.getMonthlyData('12', 2024);
      
      expect(monthlyData.month).toBe('December');
      expect(monthlyData.year).toBe(2024);
      expect(monthlyData.workDaysCount).toBe(3);
      expect(monthlyData.totalHours).toBe(22); // 8 + 6 + 8
      expect(monthlyData.totalEarnings).toBe(832); // (8*37) + (6*40) + (8*37) = 296 + 240 + 296
      expect(monthlyData.averageHourlyRate).toBeCloseTo(37.818, 2);
    });

    it('should return empty data for month with no work days', async () => {
      const monthlyData = await service.getMonthlyData('1', 2024);
      
      expect(monthlyData.month).toBe('January');
      expect(monthlyData.year).toBe(2024);
      expect(monthlyData.workDaysCount).toBe(0);
      expect(monthlyData.totalHours).toBe(0);
      expect(monthlyData.totalEarnings).toBe(0);
      expect(monthlyData.averageHourlyRate).toBe(0);
    });

    it('should include work days in monthly data', async () => {
      const monthlyData = await service.getMonthlyData('12', 2024);
      
      expect(monthlyData.workDays).toHaveLength(3);
      expect(monthlyData.workDays[0].date).toBe('2024-12-01');
      expect(monthlyData.workDays[1].date).toBe('2024-12-02');
      expect(monthlyData.workDays[2].date).toBe('2024-12-03');
    });
  });

  describe('getWorkDaysByDateRange', () => {
    beforeEach(async () => {
      // Create work days across different dates
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '1', 
        date: '2024-12-01' 
      }));
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '2', 
        date: '2024-12-15' 
      }));
      await service.createWorkDay(getMockCreateWorkDay({ 
        id: '3', 
        date: '2024-12-31' 
      }));
    });

    it('should filter work days by date range correctly', async () => {
      const workDays = await service.getWorkDaysByDateRange('2024-12-10', '2024-12-20');
      
      expect(workDays).toHaveLength(1);
      expect(workDays[0].id).toBe('2');
      expect(workDays[0].date).toBe('2024-12-15');
    });

    it('should return empty array when no work days in range', async () => {
      const workDays = await service.getWorkDaysByDateRange('2024-11-01', '2024-11-30');
      
      expect(workDays).toHaveLength(0);
    });

    it('should include boundary dates', async () => {
      const workDays = await service.getWorkDaysByDateRange('2024-12-01', '2024-12-31');
      
      expect(workDays).toHaveLength(3);
    });
  });

  describe('calculateEarnings', () => {
    it('should calculate earnings correctly for whole hours', () => {
      const earnings = service.calculateEarnings(8, 37);
      expect(earnings).toBe(296);
    });

    it('should calculate earnings correctly for partial hours', () => {
      const earnings = service.calculateEarnings(4.5, 40);
      expect(earnings).toBe(180);
    });

    it('should handle decimal rates correctly', () => {
      const earnings = service.calculateEarnings(8, 37.5);
      expect(earnings).toBe(300);
    });

    it('should handle zero hours', () => {
      const earnings = service.calculateEarnings(0, 37);
      expect(earnings).toBe(0);
    });

    it('should handle zero rate', () => {
      const earnings = service.calculateEarnings(8, 0);
      expect(earnings).toBe(0);
    });
  });
});