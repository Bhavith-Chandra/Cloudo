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

    const plans = await prisma.disasterRecoveryPlan.findMany({
      include: {
        resources: true,
        tests: {
          orderBy: {
            startTime: 'desc',
          },
          take: 1,
        },
      },
    });

    return NextResponse.json(plans);
  } catch (error) {
    console.error('Error fetching disaster recovery plans:', error);
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
      rto,
      rpo,
      sourceProvider,
      targetProvider,
      sourceRegion,
      targetRegion,
      resources,
    } = body;

    // Validate required fields
    if (!name || !rto || !rpo || !sourceProvider || !targetProvider) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create the disaster recovery plan
    const plan = await prisma.disasterRecoveryPlan.create({
      data: {
        name,
        rto,
        rpo,
        sourceProvider,
        targetProvider,
        sourceRegion,
        targetRegion,
        status: 'draft',
        confidence: 0,
        cost: 0,
        resources: {
          create: resources.map((resource: any) => ({
            resourceId: resource.id,
            provider: resource.provider,
            type: resource.type,
            region: resource.region,
          })),
        },
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error creating disaster recovery plan:', error);
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
      rto,
      rpo,
      sourceProvider,
      targetProvider,
      sourceRegion,
      targetRegion,
      status,
      resources,
    } = body;

    // Validate required fields
    if (!id) {
      return new NextResponse('Missing plan ID', { status: 400 });
    }

    // Update the disaster recovery plan
    const plan = await prisma.disasterRecoveryPlan.update({
      where: { id },
      data: {
        name,
        rto,
        rpo,
        sourceProvider,
        targetProvider,
        sourceRegion,
        targetRegion,
        status,
        resources: {
          deleteMany: {},
          create: resources.map((resource: any) => ({
            resourceId: resource.id,
            provider: resource.provider,
            type: resource.type,
            region: resource.region,
          })),
        },
      },
      include: {
        resources: true,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error updating disaster recovery plan:', error);
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
      return new NextResponse('Missing plan ID', { status: 400 });
    }

    // Delete the disaster recovery plan and its associated resources
    await prisma.disasterRecoveryPlan.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting disaster recovery plan:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 