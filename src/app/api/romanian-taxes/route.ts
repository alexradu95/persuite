import { NextRequest, NextResponse } from 'next/server';
import { createRomanianTaxService } from '@/lib/services/romanian-tax-service';
import { createWorkDayRepository } from '@/lib/repositories/work-day-repository';
import { db } from '@/lib/db/connection';
import { z } from 'zod';

const CalculateTaxesRequestSchema = z.object({
  year: z.number().int().min(2020).max(2030),
  deductions: z.object({
    personalDeduction: z.number().min(0).optional(),
    professionalDeductions: z.number().min(0).optional(),
    healthInsuranceDeductions: z.number().min(0).optional(),
    socialInsuranceDeductions: z.number().min(0).optional(),
    voluntaryPensionDeductions: z.number().min(0).optional(),
  }).optional(),
});

const ManualCalculationRequestSchema = z.object({
  grossIncome: z.number().min(0),
  year: z.number().int().min(2020).max(2030),
  deductions: z.object({
    personalDeduction: z.number().min(0).optional(),
    professionalDeductions: z.number().min(0).optional(),
    healthInsuranceDeductions: z.number().min(0).optional(),
    socialInsuranceDeductions: z.number().min(0).optional(),
    voluntaryPensionDeductions: z.number().min(0).optional(),
  }).optional(),
  hasHealthCard: z.boolean().optional(),
  isUrbanArea: z.boolean().optional(),
});

// GET /api/romanian-taxes?year=2024 - Calculate taxes based on work days for the year
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || '2024');
    
    if (isNaN(year) || year < 2020 || year > 2030) {
      return NextResponse.json(
        { error: 'Invalid year parameter' },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection not available' },
        { status: 500 }
      );
    }
    const workDayRepo = createWorkDayRepository(db);
    const taxService = createRomanianTaxService(workDayRepo);

    const result = await taxService.calculateTaxesFromWorkDays(year);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating taxes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/romanian-taxes - Calculate taxes with custom parameters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if it's a manual calculation (has grossIncome) or work-days based
    const isManualCalculation = 'grossIncome' in body;
    
    if (isManualCalculation) {
      // Manual calculation with provided gross income
      const validatedBody = ManualCalculationRequestSchema.parse(body);
      
      if (!db) {
        return NextResponse.json(
          { error: 'Database connection not available' },
          { status: 500 }
        );
      }
      const workDayRepo = createWorkDayRepository(db);
      const taxService = createRomanianTaxService(workDayRepo);

      const result = await taxService.calculateYearlyTaxes({
        grossIncome: validatedBody.grossIncome,
        year: validatedBody.year,
        deductions: validatedBody.deductions || {},
        hasHealthCard: validatedBody.hasHealthCard ?? true,
        isUrbanArea: validatedBody.isUrbanArea ?? true,
      });

      return NextResponse.json(result);
    } else {
      // Work-days based calculation
      const validatedBody = CalculateTaxesRequestSchema.parse(body);
      
      if (!db) {
        return NextResponse.json(
          { error: 'Database connection not available' },
          { status: 500 }
        );
      }
      const workDayRepo = createWorkDayRepository(db);
      const taxService = createRomanianTaxService(workDayRepo);

      const result = await taxService.calculateTaxesFromWorkDays(
        validatedBody.year,
        validatedBody.deductions
      );

      return NextResponse.json(result);
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error calculating taxes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}