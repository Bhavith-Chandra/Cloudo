import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const migrations = await prisma.migration.findMany({
      include: {
        workload: true,
        logs: true,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(migrations);
  } catch (error) {
    console.error('Error fetching migrations:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { workloadId } = body;

    if (!workloadId) {
      return new NextResponse('Missing workload ID', { status: 400 });
    }

    const workload = await prisma.workload.findUnique({
      where: { id: workloadId },
    });

    if (!workload) {
      return new NextResponse('Workload not found', { status: 404 });
    }

    const migration = await prisma.migration.create({
      data: {
        workloadId,
        status: 'in_progress',
        progress: 0,
        startTime: new Date(),
        cost: 0,
        savings: workload.estimatedSavings,
        logs: {
          create: {
            message: 'Migration started',
            timestamp: new Date(),
          },
        },
      },
      include: {
        workload: true,
        logs: true,
      },
    });

    // Start the migration process in the background
    startMigrationProcess(migration.id, workload);

    return NextResponse.json(migration);
  } catch (error) {
    console.error('Error creating migration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { id, status, progress, cost, logs } = body;

    if (!id) {
      return new NextResponse('Missing migration ID', { status: 400 });
    }

    const migration = await prisma.migration.update({
      where: { id },
      data: {
        status,
        progress,
        cost,
        endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
        logs: {
          create: logs.map((log: string) => ({
            message: log,
            timestamp: new Date(),
          })),
        },
      },
      include: {
        workload: true,
        logs: true,
      },
    });

    return NextResponse.json(migration);
  } catch (error) {
    console.error('Error updating migration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing migration ID', { status: 400 });
    }

    await prisma.migration.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting migration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function startMigrationProcess(migrationId: string, workload: any) {
  try {
    // Simulate migration progress
    const steps = [
      { progress: 20, message: 'Analyzing workload dependencies' },
      { progress: 40, message: 'Preparing target environment' },
      { progress: 60, message: 'Migrating data and configurations' },
      { progress: 80, message: 'Validating migrated resources' },
      { progress: 100, message: 'Migration completed successfully' },
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate work
      
      await prisma.migration.update({
        where: { id: migrationId },
        data: {
          progress: step.progress,
          logs: {
            create: {
              message: step.message,
              timestamp: new Date(),
            },
          },
        },
      });
    }

    await prisma.migration.update({
      where: { id: migrationId },
      data: {
        status: 'completed',
        endTime: new Date(),
      },
    });
  } catch (error) {
    console.error('Error in migration process:', error);
    
    await prisma.migration.update({
      where: { id: migrationId },
      data: {
        status: 'failed',
        endTime: new Date(),
        logs: {
          create: {
            message: `Migration failed: ${error.message}`,
            timestamp: new Date(),
          },
        },
      },
    });
  }
} 