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
    const workloadId = searchParams.get('workloadId');

    if (!workloadId) {
      return new NextResponse('Missing workload ID', { status: 400 });
    }

    const risks = await prisma.workloadRisk.findMany({
      where: {
        workloadId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(risks);
  } catch (error) {
    console.error('Error fetching workload risks:', error);
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
    const { workloadId, description, severity, impact, mitigation } = body;

    if (!workloadId || !description || !severity || !impact) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const risk = await prisma.workloadRisk.create({
      data: {
        workloadId,
        description,
        severity,
        impact,
        mitigation,
        status: 'active',
        createdAt: new Date(),
      },
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error creating workload risk:', error);
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
    const { id, description, severity, impact, mitigation, status } = body;

    if (!id) {
      return new NextResponse('Missing risk ID', { status: 400 });
    }

    const risk = await prisma.workloadRisk.update({
      where: { id },
      data: {
        description,
        severity,
        impact,
        mitigation,
        status,
      },
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error('Error updating workload risk:', error);
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
      return new NextResponse('Missing risk ID', { status: 400 });
    }

    await prisma.workloadRisk.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting workload risk:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 