import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { analyzeResourceUtilization } from '@/lib/ml/resource-optimization';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeframe, provider, resourceType } = await req.json();

    // Fetch resource utilization data
    const resources = await prisma.resourceUtilization.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: new Date(Date.now() - getTimeframeInMs(timeframe)),
        },
        ...(provider !== 'all' && { provider }),
        ...(resourceType !== 'all' && { resourceType }),
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Analyze resource utilization and generate recommendations
    const recommendations = await analyzeResourceUtilization(resources);

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error in recommendations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getTimeframeInMs(timeframe: string): number {
  const now = Date.now();
  switch (timeframe) {
    case '7d':
      return 7 * 24 * 60 * 60 * 1000;
    case '30d':
      return 30 * 24 * 60 * 60 * 1000;
    case '90d':
      return 90 * 24 * 60 * 60 * 1000;
    default:
      return 30 * 24 * 60 * 60 * 1000;
  }
} 