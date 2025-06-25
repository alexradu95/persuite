import { z } from 'zod';
import { WorkDayRepository } from '../repositories/work-day-repository';
import { calculateDailyEarnings } from '../db/types';

// Romanian tax calculation schemas
export const RomanianTaxCalculationSchema = z.object({
  grossIncome: z.number().min(0),
  year: z.number().int().min(2020).max(2030),
  deductions: z.object({
    personalDeduction: z.number().min(0).optional(),
    professionalDeductions: z.number().min(0).optional(),
    healthInsuranceDeductions: z.number().min(0).optional(),
    socialInsuranceDeductions: z.number().min(0).optional(),
    voluntaryPensionDeductions: z.number().min(0).optional(),
  }).optional(),
  hasHealthCard: z.boolean().default(true),
  isUrbanArea: z.boolean().default(true),
});

export const TaxCalculationResultSchema = z.object({
  grossIncome: z.number(),
  taxableIncome: z.number(),
  incomeTax: z.number(),
  healthInsurance: z.number(),
  socialInsurance: z.number(),
  totalTaxes: z.number(),
  netIncome: z.number(),
  breakdown: z.object({
    personalDeduction: z.number(),
    professionalDeductions: z.number(),
    healthInsuranceDeductions: z.number(),
    socialInsuranceDeductions: z.number(),
    voluntaryPensionDeductions: z.number(),
    totalDeductions: z.number(),
  }),
  taxRates: z.object({
    incomeTaxRate: z.number(),
    healthInsuranceRate: z.number(),
    socialInsuranceRate: z.number(),
  }),
});

// Derive types from schemas
export type RomanianTaxCalculation = z.infer<typeof RomanianTaxCalculationSchema>;
export type TaxCalculationResult = z.infer<typeof TaxCalculationResultSchema>;

// Romanian tax constants for 2024 (these should be updated annually)
const TAX_CONSTANTS_2024 = {
  INCOME_TAX_RATE: 0.10, // 10% income tax
  HEALTH_INSURANCE_RATE: 0.10, // 10% health insurance (CASS)
  SOCIAL_INSURANCE_RATE: 0.25, // 25% social insurance (CAS)
  PERSONAL_DEDUCTION_ANNUAL: 3000, // 3000 RON annual personal deduction
  MINIMUM_GROSS_SALARY: 3700, // 3700 RON minimum gross salary 2024
  SOCIAL_INSURANCE_CEILING: 132000, // 132000 RON ceiling for social insurance
};

export type RomanianTaxService = {
  calculateYearlyTaxes: (params: RomanianTaxCalculation) => Promise<TaxCalculationResult>;
  calculateTaxesFromWorkDays: (year: number, deductions?: RomanianTaxCalculation['deductions']) => Promise<TaxCalculationResult>;
  getYearlyGrossIncome: (year: number) => Promise<number>;
};

export const createRomanianTaxService = (
  workDayRepo: WorkDayRepository
): RomanianTaxService => {
  const calculateYearlyTaxes = async (params: RomanianTaxCalculation): Promise<TaxCalculationResult> => {
    const validatedParams = RomanianTaxCalculationSchema.parse(params);
    
    const { grossIncome, deductions = {} } = validatedParams;
    
    // Calculate personal deduction (3000 RON for 2024)
    const personalDeduction = deductions.personalDeduction || TAX_CONSTANTS_2024.PERSONAL_DEDUCTION_ANNUAL;
    
    // Calculate total deductions
    const totalDeductions = 
      personalDeduction +
      (deductions.professionalDeductions || 0) +
      (deductions.healthInsuranceDeductions || 0) +
      (deductions.socialInsuranceDeductions || 0) +
      (deductions.voluntaryPensionDeductions || 0);
    
    // Calculate taxable income (gross income - deductions)
    const taxableIncome = Math.max(0, grossIncome - totalDeductions);
    
    // Calculate income tax (10% on taxable income)
    const incomeTax = taxableIncome * TAX_CONSTANTS_2024.INCOME_TAX_RATE;
    
    // Calculate health insurance (10% on gross income)
    const healthInsurance = grossIncome * TAX_CONSTANTS_2024.HEALTH_INSURANCE_RATE;
    
    // Calculate social insurance (25% on gross income, capped at ceiling)
    const socialInsuranceBase = Math.min(grossIncome, TAX_CONSTANTS_2024.SOCIAL_INSURANCE_CEILING);
    const socialInsurance = socialInsuranceBase * TAX_CONSTANTS_2024.SOCIAL_INSURANCE_RATE;
    
    // Calculate total taxes
    const totalTaxes = incomeTax + healthInsurance + socialInsurance;
    
    // Calculate net income
    const netIncome = grossIncome - totalTaxes;
    
    return {
      grossIncome,
      taxableIncome,
      incomeTax,
      healthInsurance,
      socialInsurance,
      totalTaxes,
      netIncome,
      breakdown: {
        personalDeduction,
        professionalDeductions: deductions.professionalDeductions || 0,
        healthInsuranceDeductions: deductions.healthInsuranceDeductions || 0,
        socialInsuranceDeductions: deductions.socialInsuranceDeductions || 0,
        voluntaryPensionDeductions: deductions.voluntaryPensionDeductions || 0,
        totalDeductions,
      },
      taxRates: {
        incomeTaxRate: TAX_CONSTANTS_2024.INCOME_TAX_RATE,
        healthInsuranceRate: TAX_CONSTANTS_2024.HEALTH_INSURANCE_RATE,
        socialInsuranceRate: TAX_CONSTANTS_2024.SOCIAL_INSURANCE_RATE,
      },
    };
  };

  const getYearlyGrossIncome = async (year: number): Promise<number> => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const workDays = await workDayRepo.findByDateRange(startDate, endDate);
    
    return workDays.reduce((total, workDay) => {
      return total + calculateDailyEarnings(workDay.hours, workDay.hourlyRate);
    }, 0);
  };

  const calculateTaxesFromWorkDays = async (year: number, deductions?: RomanianTaxCalculation['deductions']): Promise<TaxCalculationResult> => {
    const grossIncome = await getYearlyGrossIncome(year);
    
    return calculateYearlyTaxes({
      grossIncome,
      year,
      deductions: deductions || {},
      hasHealthCard: true,
      isUrbanArea: true,
    });
  };

  return {
    calculateYearlyTaxes,
    calculateTaxesFromWorkDays,
    getYearlyGrossIncome,
  };
};