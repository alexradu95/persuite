import { NextRequest, NextResponse } from 'next/server';
import { runMigrations, checkMigrationStatus } from '@/lib/db/migrations';

export async function POST(request: NextRequest) {
  try {
    // Security check - only allow in development or with proper authorization
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization');
      if (!authHeader || authHeader !== `Bearer ${process.env.MIGRATION_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('🚀 Starting database migrations...');

    // Check current migration status
    const appliedMigrations = await checkMigrationStatus();
    
    // Run pending migrations
    await runMigrations();
    
    // Get final status
    const finalMigrations = await checkMigrationStatus();

    return NextResponse.json({
      success: true,
      message: 'Database migrations completed successfully',
      appliedMigrations: finalMigrations,
    });

  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const appliedMigrations = await checkMigrationStatus();
    
    return NextResponse.json({
      success: true,
      migrations: appliedMigrations,
    });

  } catch (error) {
    console.error('Failed to check migration status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check migration status', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}