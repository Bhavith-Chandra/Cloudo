import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { calculateVariance } from '@/lib/commitment/utils';

const prisma = new PrismaClient();

interface Commitment {
  id: string;
  userId: string;
  provider: string;
  type: string;
  term: number;
  paymentOption: string;
  resourceType: string;
  quantity: number;
  estimatedSavings: number;
  actualSavings: number | null;
  confidenceScore: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, timeRange } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate date range based on timeRange
    const endDate = new Date();
    let startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    // Fetch commitment data
    const commitments = await prisma.commitment.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Process data for analytics
    const labels = commitments.map((c: Commitment) => 
      new Date(c.createdAt).toLocaleDateString()
    );
    
    const actualSavings = commitments.map((c: Commitment) => c.actualSavings || 0);
    const predictedSavings = commitments.map((c: Commitment) => c.estimatedSavings || 0);
    
    // Calculate savings by provider
    const providerSavings = commitments.reduce((acc: Record<string, number>, c: Commitment) => {
      acc[c.provider] = (acc[c.provider] || 0) + (c.actualSavings || 0);
      return acc;
    }, {} as Record<string, number>);

    // Calculate average forecast accuracy
    const accuracyScores = commitments
      .filter((c: Commitment) => c.actualSavings && c.estimatedSavings)
      .map((c: Commitment) => {
        const variance = calculateVariance([c.actualSavings!, c.estimatedSavings!]);
        return 1 - variance;
      });

    const averageAccuracy = accuracyScores.length > 0
      ? accuracyScores.reduce((a: number, b: number) => a + b, 0) / accuracyScores.length
      : 0;

    // Calculate total savings
    const totalSavings = actualSavings.reduce((a: number, b: number) => a + b, 0);

    return NextResponse.json({
      forecastAccuracy: {
        labels,
        actualSavings,
        predictedSavings,
      },
      savingsTrend: {
        labels,
        savings: actualSavings,
      },
      providerBreakdown: {
        labels: Object.keys(providerSavings),
        savings: Object.values(providerSavings),
      },
      averageAccuracy,
      totalSavings,
    });
  } catch (error) {
    console.error('Error fetching commitment analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 