import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { predictFutureCosts } from '@/lib/ml/prediction';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeframe, simulationInput } = await req.json();

    // Fetch historical cost data
    const costData = await prisma.costData.findMany({
      where: {
        userId: session.user.id,
        timestamp: {
          gte: new Date(Date.now() - getTimeframeInMs(timeframe)),
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Generate predictions using ML
    const predictions = await predictFutureCosts(costData, simulationInput);

    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Error in predictions API:', error);
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