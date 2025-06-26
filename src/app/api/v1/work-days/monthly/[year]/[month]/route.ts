import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayRepository } from '@/lib/domains/work-days/repositories/work-day-repository';
import { createIncomeService } from '@/lib/domains/income/services/income-service';

type RouteParams = {
  params: { year: string; month: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const year = parseInt(params.year);
    const month = parseInt(params.month);

    // Validate year and month
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid year or month' }, { status: 400 });
    }

    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const monthlyData = await service.getMonthlyData(month, year);
    
    return NextResponse.json(monthlyData);
  } catch (error) {
    console.error('Failed to get monthly data:', error);
    return NextResponse.json(
      { error: 'Failed to get monthly data' },
      { status: 500 }
    );
  }
}