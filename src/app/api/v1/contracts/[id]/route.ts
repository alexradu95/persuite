import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createContractRepository } from '@/lib/domains/contracts/repositories/contract-repository';
import { UpdateContractSchema } from '@/lib/db/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const repository = createContractRepository(db);
    const contract = await repository.findById(params.id);
    
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to get contract:', error);
    return NextResponse.json(
      { error: 'Failed to get contract' },
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
    const contractData = UpdateContractSchema.parse({
      ...body,
      id: params.id,
    });
    
    const repository = createContractRepository(db);
    const contract = await repository.update(contractData);
    
    return NextResponse.json(contract);
  } catch (error) {
    console.error('Failed to update contract:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update contract' },
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

    const repository = createContractRepository(db);
    await repository.deleteById(params.id);
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract' },
      { status: 500 }
    );
  }
}