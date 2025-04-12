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

    const workloads = await prisma.workload.findMany({
      include: {
        sourceProvider: true,
        targetProvider: true,
        risks: true,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });

    return NextResponse.json(workloads);
  } catch (error) {
    console.error('Error fetching workloads:', error);
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
    const {
      name,
      type,
      sourceProvider,
      targetProvider,
      compatibilityScore,
      estimatedCost,
      estimatedSavings,
      migrationTime,
      risks,
    } = body;

    if (!name || !type || !sourceProvider || !targetProvider) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const workload = await prisma.workload.create({
      data: {
        name,
        type,
        sourceProvider,
        targetProvider,
        compatibilityScore,
        estimatedCost,
        estimatedSavings,
        migrationTime,
        status: 'ready',
        lastUpdated: new Date(),
        risks: {
          create: risks.map((risk: string) => ({
            description: risk,
          })),
        },
      },
      include: {
        sourceProvider: true,
        targetProvider: true,
        risks: true,
      },
    });

    return NextResponse.json(workload);
  } catch (error) {
    console.error('Error creating workload:', error);
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
    const {
      id,
      name,
      type,
      sourceProvider,
      targetProvider,
      compatibilityScore,
      estimatedCost,
      estimatedSavings,
      migrationTime,
      risks,
    } = body;

    if (!id) {
      return new NextResponse('Missing workload ID', { status: 400 });
    }

    const workload = await prisma.workload.update({
      where: { id },
      data: {
        name,
        type,
        sourceProvider,
        targetProvider,
        compatibilityScore,
        estimatedCost,
        estimatedSavings,
        migrationTime,
        lastUpdated: new Date(),
        risks: {
          deleteMany: {},
          create: risks.map((risk: string) => ({
            description: risk,
          })),
        },
      },
      include: {
        sourceProvider: true,
        targetProvider: true,
        risks: true,
      },
    });

    return NextResponse.json(workload);
  } catch (error) {
    console.error('Error updating workload:', error);
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
      return new NextResponse('Missing workload ID', { status: 400 });
    }

    await prisma.workload.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting workload:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 