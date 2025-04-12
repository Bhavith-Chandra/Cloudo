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

    const results = await prisma.disasterRecoveryTestResult.findMany({
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
        timestamp: 'desc',
      },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching disaster recovery test results:', error);
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
    const { testId, stepId, status, details } = body;

    if (!testId || !stepId || !status) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const result = await prisma.disasterRecoveryTestResult.create({
      data: {
        testId,
        stepId,
        status,
        details,
        timestamp: new Date(),
      },
      include: {
        test: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating disaster recovery test result:', error);
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
      return new NextResponse('Missing result ID', { status: 400 });
    }

    await prisma.disasterRecoveryTestResult.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting disaster recovery test result:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 