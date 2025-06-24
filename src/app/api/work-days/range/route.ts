import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayRepository } from '@/lib/repositories/work-day-repository';
import { createIncomeService } from '@/lib/services/income-service';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Both start and end date parameters are required' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const workDays = await service.getWorkDaysByDateRange(startDate, endDate);
    
    return NextResponse.json(workDays);
  } catch (error) {
    console.error('Failed to get work days by date range:', error);
    return NextResponse.json(
      { error: 'Failed to get work days by date range' },
      { status: 500 }
    );
  }
}