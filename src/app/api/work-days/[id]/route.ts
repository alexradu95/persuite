import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayRepository } from '@/lib/repositories/work-day-repository';
import { createIncomeService } from '@/lib/services/income-service';
import { UpdateWorkDaySchema } from '@/lib/db/types';

type RouteParams = {
  params: { id: string };
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const workDay = await service.getWorkDayById(params.id);
    
    if (!workDay) {
      return NextResponse.json({ error: 'Work day not found' }, { status: 404 });
    }
    
    return NextResponse.json(workDay);
  } catch (error) {
    console.error('Failed to get work day:', error);
    return NextResponse.json(
      { error: 'Failed to get work day' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const workDayData = UpdateWorkDaySchema.parse({ ...body, id: params.id });
    
    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    const workDay = await service.updateWorkDay(workDayData);
    
    return NextResponse.json(workDay);
  } catch (error) {
    console.error('Failed to update work day:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update work day' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const repository = createWorkDayRepository(db);
    const service = createIncomeService(repository);
    
    await service.deleteWorkDay(params.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete work day:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to delete work day' },
      { status: 500 }
    );
  }
}