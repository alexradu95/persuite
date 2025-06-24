import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayRepository } from '@/lib/repositories/work-day-repository';
import { createIncomeService } from '@/lib/services/income-service';

type RouteParams = {
  params: { date: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(params.date)) {
      return NextResponse.json({ error: 'Invalid date format. Use YYYY-MM-DD' }, { status: 400 });
    }

    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const workDay = await service.getWorkDayByDate(params.date);
    
    return NextResponse.json(workDay);
  } catch (error) {
    console.error('Failed to get work day by date:', error);
    return NextResponse.json(
      { error: 'Failed to get work day by date' },
      { status: 500 }
    );
  }
}