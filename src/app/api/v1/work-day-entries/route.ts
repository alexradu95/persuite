import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayEntryRepository } from '@/lib/domains/work-day-entries/repositories/work-day-entry-repository';
import { CreateWorkDayEntrySchema } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const entryData = CreateWorkDayEntrySchema.parse(body);
    
    const repository = createWorkDayEntryRepository(db);
    const entry = await repository.create(entryData);
    
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('Failed to create work day entry:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create work day entry' },
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
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const contractId = searchParams.get('contractId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const date = searchParams.get('date');
    
    const repository = createWorkDayEntryRepository(db);
    
    // Handle specific date query
    if (date) {
      const entries = await repository.findByDate(new Date(date));
      return NextResponse.json(entries);
    }
    
    // Handle contract-specific query
    if (contractId && !startDate && !endDate) {
      const entries = await repository.findByContract(contractId);
      return NextResponse.json(entries);
    }
    
    // Handle date range query
    if (startDate && endDate) {
      const entries = await repository.findByDateRange(new Date(startDate), new Date(endDate));
      return NextResponse.json(entries);
    }
    
    // Handle general query with filters
    const query = {
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(offset && { offset: parseInt(offset, 10) }),
      ...(contractId && { contractId }),
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };
    
    const entries = await repository.findMany(query);
    
    return NextResponse.json(entries);
  } catch (error) {
    console.error('Failed to get work day entries:', error);
    return NextResponse.json(
      { error: 'Failed to get work day entries' },
      { status: 500 }
    );
  }
}