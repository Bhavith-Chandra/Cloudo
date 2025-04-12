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

    const tests = await prisma.disasterRecoveryTest.findMany({
      include: {
        plan: true,
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error('Error fetching disaster recovery tests:', error);
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
    const { planId, type, steps } = body;

    // Validate required fields
    if (!planId || !type || !steps) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create the disaster recovery test
    const test = await prisma.disasterRecoveryTest.create({
      data: {
        planId,
        type,
        status: 'pending',
        startTime: new Date(),
        steps: {
          create: steps.map((step: any, index: number) => ({
            description: step.description,
            status: 'pending',
            order: index + 1,
            startTime: new Date(),
          })),
        },
      },
      include: {
        plan: true,
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error creating disaster recovery test:', error);
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
    const { id, status, steps } = body;

    // Validate required fields
    if (!id) {
      return new NextResponse('Missing test ID', { status: 400 });
    }

    // Update the disaster recovery test
    const test = await prisma.disasterRecoveryTest.update({
      where: { id },
      data: {
        status,
        endTime: status === 'completed' || status === 'failed' ? new Date() : undefined,
        steps: {
          updateMany: steps.map((step: any) => ({
            where: { id: step.id },
            data: {
              status: step.status,
              endTime: step.status === 'completed' || step.status === 'failed' ? new Date() : undefined,
            },
          })),
        },
      },
      include: {
        plan: true,
        steps: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.error('Error updating disaster recovery test:', error);
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
      return new NextResponse('Missing test ID', { status: 400 });
    }

    // Delete the disaster recovery test and its associated steps
    await prisma.disasterRecoveryTest.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting disaster recovery test:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 