import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createRomanianTaxService, RomanianTaxService } from './romanian-tax-service';
import { WorkDayRepository } from '@/lib/domains/work-days/repositories/work-day-repository';
import { WorkDay } from '@/lib/db/types';

// Mock work day data
const getMockWorkDay = (overrides?: Partial<WorkDay>): WorkDay => {
  return {
    id: 'test-id',
    date: '2024-01-01',
    hours: 8,
    hourlyRate: 50,
    notes: 'Test work day',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
};

describe('RomanianTaxService', () => {
  let mockWorkDayRepo: WorkDayRepository;
  let taxService: RomanianTaxService;

  beforeEach(() => {
    mockWorkDayRepo = {
      create: vi.fn(),
      update: vi.fn(),
      deleteById: vi.fn(),
      findById: vi.fn(),
      findByDate: vi.fn(),
      findByDateRange: vi.fn(),
      findByMonth: vi.fn(),
      findMany: vi.fn(),
    };

    taxService = createRomanianTaxService(mockWorkDayRepo);
  });

  describe('calculateYearlyTaxes', () => {
    it('should calculate taxes correctly for basic income without deductions', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 100000, // 100,000 RON
        year: 2024,
        deductions: {},
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.grossIncome).toBe(100000);
      expect(result.taxableIncome).toBe(97000); // 100,000 - 3,000 personal deduction
      expect(result.incomeTax).toBe(9700); // 10% of taxable income
      expect(result.healthInsurance).toBe(10000); // 10% of gross income
      expect(result.socialInsurance).toBe(25000); // 25% of gross income
      expect(result.totalTaxes).toBe(44700); // 9,700 + 10,000 + 25,000
      expect(result.netIncome).toBe(55300); // 100,000 - 44,700
    });

    it('should apply personal deduction correctly', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 50000,
        year: 2024,
        deductions: {
          personalDeduction: 5000, // Custom personal deduction
        },
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.taxableIncome).toBe(45000); // 50,000 - 5,000
      expect(result.incomeTax).toBe(4500); // 10% of 45,000
      expect(result.breakdown.personalDeduction).toBe(5000);
      expect(result.breakdown.totalDeductions).toBe(5000);
    });

    it('should handle professional deductions', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 80000,
        year: 2024,
        deductions: {
          professionalDeductions: 10000,
        },
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.taxableIncome).toBe(67000); // 80,000 - 3,000 - 10,000
      expect(result.incomeTax).toBe(6700); // 10% of 67,000
      expect(result.breakdown.professionalDeductions).toBe(10000);
      expect(result.breakdown.totalDeductions).toBe(13000); // 3,000 + 10,000
    });

    it('should cap social insurance at ceiling', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 200000, // Above social insurance ceiling
        year: 2024,
        deductions: {},
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.socialInsurance).toBe(33000); // 25% of 132,000 (ceiling)
      expect(result.healthInsurance).toBe(20000); // 10% of full 200,000
    });

    it('should handle zero taxable income', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 2000, // Less than personal deduction
        year: 2024,
        deductions: {},
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.taxableIncome).toBe(0); // Max(0, 2000 - 3000)
      expect(result.incomeTax).toBe(0);
      expect(result.healthInsurance).toBe(200); // Still 10% of gross
      expect(result.socialInsurance).toBe(500); // Still 25% of gross
    });

    it('should include all deduction types in breakdown', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 120000,
        year: 2024,
        deductions: {
          personalDeduction: 3000,
          professionalDeductions: 15000,
          healthInsuranceDeductions: 2000,
          socialInsuranceDeductions: 5000,
          voluntaryPensionDeductions: 3000,
        },
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.breakdown.totalDeductions).toBe(28000);
      expect(result.taxableIncome).toBe(92000); // 120,000 - 28,000
      expect(result.breakdown.personalDeduction).toBe(3000);
      expect(result.breakdown.professionalDeductions).toBe(15000);
      expect(result.breakdown.healthInsuranceDeductions).toBe(2000);
      expect(result.breakdown.socialInsuranceDeductions).toBe(5000);
      expect(result.breakdown.voluntaryPensionDeductions).toBe(3000);
    });
  });

  describe('getYearlyGrossIncome', () => {
    it('should calculate total income from work days', async () => {
      const mockWorkDays = [
        getMockWorkDay({ hours: 8, hourlyRate: 50, date: '2024-01-01' }), // 400 RON
        getMockWorkDay({ hours: 6, hourlyRate: 60, date: '2024-01-15' }), // 360 RON
        getMockWorkDay({ hours: 10, hourlyRate: 45, date: '2024-02-01' }), // 450 RON
      ];

      vi.mocked(mockWorkDayRepo.findByDateRange).mockResolvedValue(mockWorkDays);

      const result = await taxService.getYearlyGrossIncome(2024);

      expect(mockWorkDayRepo.findByDateRange).toHaveBeenCalledWith('2024-01-01', '2024-12-31');
      expect(result).toBe(1210); // 400 + 360 + 450
    });

    it('should return zero for no work days', async () => {
      vi.mocked(mockWorkDayRepo.findByDateRange).mockResolvedValue([]);

      const result = await taxService.getYearlyGrossIncome(2024);

      expect(result).toBe(0);
    });
  });

  describe('calculateTaxesFromWorkDays', () => {
    it('should calculate taxes based on work days data', async () => {
      const mockWorkDays = [
        getMockWorkDay({ hours: 8, hourlyRate: 100, date: '2024-01-01' }), // 800 RON
        getMockWorkDay({ hours: 8, hourlyRate: 100, date: '2024-01-02' }), // 800 RON
      ];

      vi.mocked(mockWorkDayRepo.findByDateRange).mockResolvedValue(mockWorkDays);

      const result = await taxService.calculateTaxesFromWorkDays(2024);

      expect(result.grossIncome).toBe(1600); // 800 + 800
      expect(result.taxableIncome).toBe(0); // 1600 - 3000 = 0 (max with 0)
      expect(result.incomeTax).toBe(0);
      expect(result.healthInsurance).toBe(160); // 10% of 1600
      expect(result.socialInsurance).toBe(400); // 25% of 1600
    });

    it('should apply custom deductions when calculating from work days', async () => {
      // Mock multiple days to get significant income
      const yearlyWorkDays = Array.from({ length: 200 }, (_, index) =>
        getMockWorkDay({
          hours: 8,
          hourlyRate: 200,
          date: `2024-${String(Math.floor(index / 30) + 1).padStart(2, '0')}-${String((index % 30) + 1).padStart(2, '0')}`,
        })
      );

      vi.mocked(mockWorkDayRepo.findByDateRange).mockResolvedValue(yearlyWorkDays);

      const result = await taxService.calculateTaxesFromWorkDays(2024, {
        professionalDeductions: 50000,
      });

      expect(result.grossIncome).toBe(320000); // 200 days * 1600 RON
      expect(result.breakdown.professionalDeductions).toBe(50000);
      expect(result.breakdown.totalDeductions).toBe(53000); // 3000 + 50000
    });
  });

  describe('tax rates validation', () => {
    it('should return correct tax rates in result', async () => {
      const result = await taxService.calculateYearlyTaxes({
        grossIncome: 50000,
        year: 2024,
        deductions: {},
        hasHealthCard: true,
        isUrbanArea: true,
      });

      expect(result.taxRates.incomeTaxRate).toBe(0.10);
      expect(result.taxRates.healthInsuranceRate).toBe(0.10);
      expect(result.taxRates.socialInsuranceRate).toBe(0.25);
    });
  });
});