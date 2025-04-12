import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return new NextResponse('Missing test ID', { status: 400 });
    }

    const steps = await prisma.disasterRecoveryTestStep.findMany({
      where: {
        testId,
      },
      include: {
        test: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(steps);
  } catch (error) {
    console.error('Error fetching disaster recovery test steps:', error);
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
    const { testId, description, expectedOutcome, order } = body;

    if (!testId || !description || !expectedOutcome || order === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const step = await prisma.disasterRecoveryTestStep.create({
      data: {
        testId,
        description,
        expectedOutcome,
        order,
      },
      include: {
        test: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(step);
  } catch (error) {
    console.error('Error creating disaster recovery test step:', error);
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
      return new NextResponse('Missing step ID', { status: 400 });
    }

    await prisma.disasterRecoveryTestStep.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting disaster recovery test step:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 