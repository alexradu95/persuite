import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayRepository } from '@/lib/repositories/work-day-repository';
import { createIncomeService } from '@/lib/services/income-service';
import { CreateWorkDaySchema } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const workDayData = CreateWorkDaySchema.parse(body);
    
    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const workDay = await service.createWorkDay(workDayData);
    
    return NextResponse.json(workDay, { status: 201 });
  } catch (error) {
    console.error('Failed to create work day:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create work day' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    
    const repository = createWorkDayRepository(db);
    
    let workDays;
    if (month && year) {
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      workDays = await repository.findByMonth(monthKey);
    } else if (startDate && endDate) {
      workDays = await repository.findByDateRange(startDate, endDate);
    } else {
      workDays = await repository.findMany();
    }
    
    return NextResponse.json(workDays);
  } catch (error) {
    console.error('Failed to get work days:', error);
    return NextResponse.json(
      { error: 'Failed to get work days' },
      { status: 500 }
    );
  }
}