import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { predictFutureCosts } from '@/lib/ml/prediction';
import { analyzeUsagePatterns, generateRecommendations } from '@/lib/ml/optimization';

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

    // Generate predictions with simulation inputs
    const predictions = await predictFutureCosts(costData, simulationInput);

    // Analyze patterns and generate updated recommendations
    const patterns = await analyzeUsagePatterns(costData);
    const recommendations = await generateRecommendations(patterns);

    // Adjust recommendations based on simulation inputs
    const updatedRecommendations = recommendations.map((rec) => {
      let adjustedSavings = rec.estimatedSavings;

      // Adjust savings based on new deployments
      if (simulationInput.newDeployments > 0) {
        adjustedSavings *= 1 + (simulationInput.newDeployments * 0.05); // 5% increase in potential savings
      }

      // Adjust savings based on expected growth
      if (simulationInput.expectedGrowth > 0) {
        adjustedSavings *= 1 + (simulationInput.expectedGrowth / 200); // Half the growth rate affects savings
      }

      return {
        ...rec,
        estimatedSavings: adjustedSavings,
        explanation: `${rec.explanation} Adjusted based on simulation inputs: ${simulationInput.newDeployments} new deployments, ${simulationInput.expectedGrowth}% expected growth.`,
      };
    });

    return NextResponse.json({
      predictions,
      updatedRecommendations,
    });
  } catch (error) {
    console.error('Error in simulation API:', error);
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