import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/connection';
import { createContractRepository } from '@/lib/domains/contracts/repositories/contract-repository';
import { CreateContractSchema } from '@/lib/db/types';

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const body = await request.json();
    const contractData = CreateContractSchema.parse(body);
    
    const repository = createContractRepository(db);
    const contract = await repository.create(contractData);
    
    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error('Failed to create contract:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.message.includes('validation')) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create contract' },
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
    
    const repository = createContractRepository(db);
    
    const query = {
      ...(limit && { limit: parseInt(limit, 10) }),
      ...(offset && { offset: parseInt(offset, 10) }),
    };
    
    const contracts = await repository.findMany(query);
    
    return NextResponse.json(contracts);
  } catch (error) {
    console.error('Failed to get contracts:', error);
    return NextResponse.json(
      { error: 'Failed to get contracts' },
      { status: 500 }
    );
  }
}