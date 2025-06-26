import { NextRequest, NextResponse } from 'next/server';
import { createRomanianTaxService } from '@/lib/domains/taxes/services/romanian-tax-service';
import { createWorkDayRepository } from '@/lib/domains/work-days/repositories/work-day-repository';
import { db } from '@/lib/db/connection';

// GET /api/romanian-taxes/yearly-income?year=2024 - Get total gross income for the year
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

    const grossIncome = await taxService.getYearlyGrossIncome(year);

    return NextResponse.json({
      year,
      grossIncome,
      currency: 'RON'
    });
  } catch (error) {
    console.error('Error getting yearly income:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}