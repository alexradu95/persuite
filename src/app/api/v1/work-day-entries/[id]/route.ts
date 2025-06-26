import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createWorkDayEntryRepository } from '@/lib/domains/work-day-entries/repositories/work-day-entry-repository';
import { UpdateWorkDayEntrySchema } from '@/lib/db/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const repository = createWorkDayEntryRepository(db);
    const entry = await repository.findById(params.id);
    
    if (!entry) {
      return NextResponse.json({ error: 'Work day entry not found' }, { status: 404 });
    }
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to get work day entry:', error);
    return NextResponse.json(
      { error: 'Failed to get work day entry' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const entryData = UpdateWorkDayEntrySchema.parse({
      ...body,
      id: params.id,
    });
    
    const repository = createWorkDayEntryRepository(db);
    const entry = await repository.update(entryData);
    
    return NextResponse.json(entry);
  } catch (error) {
    console.error('Failed to update work day entry:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update work day entry' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const repository = createWorkDayEntryRepository(db);
    await repository.deleteById(params.id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete work day entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete work day entry' },
      { status: 500 }
    );
  }
}