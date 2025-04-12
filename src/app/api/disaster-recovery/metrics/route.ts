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

    const metrics = await prisma.disasterRecoveryTestMetric.findMany({
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

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching disaster recovery test metrics:', error);
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
    const { testId, metricType, value, unit, timestamp } = body;

    if (!testId || !metricType || value === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const metric = await prisma.disasterRecoveryTestMetric.create({
      data: {
        testId,
        metricType,
        value,
        unit,
        timestamp: timestamp || new Date(),
      },
      include: {
        test: {
          include: {
            plan: true,
          },
        },
      },
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Error creating disaster recovery test metric:', error);
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
      return new NextResponse('Missing metric ID', { status: 400 });
    }

    await prisma.disasterRecoveryTestMetric.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting disaster recovery test metric:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 