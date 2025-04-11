import { PrismaClient } from '@prisma/client';
import { calculateVariance } from '@/lib/utils/math';

const prisma = new PrismaClient();

interface SpotAnalysis {
  estimatedSavings: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  recommendedRegions: string[];
  priceHistory: {
    timestamp: Date;
    price: number;
  }[];
}

export async function analyzeSpotInstanceUtilization(
  provider: string,
  instanceType: string,
  region: string
): Promise<SpotAnalysis> {
  try {
    // Fetch historical price data
    const priceHistory = await prisma.spotPrice.findMany({
      where: {
        provider,
        instanceType,
        region,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Calculate price statistics
    const prices = priceHistory.map((p) => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceVariance = calculateVariance(prices);

    // Fetch on-demand price
    const onDemandPrice = await prisma.onDemandPrice.findFirst({
      where: {
        provider,
        instanceType,
        region,
      },
    });

    if (!onDemandPrice) {
      throw new Error('On-demand price not found');
    }

    // Calculate estimated savings
    const estimatedSavings = ((onDemandPrice.price - avgPrice) / onDemandPrice.price) * 100;

    // Determine risk level based on price variance and interruption history
    const interruptionHistory = await prisma.spotInterruption.findMany({
      where: {
        provider,
        instanceType,
        region,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const interruptionRate = interruptionHistory.length / 30; // Interruptions per day
    let riskLevel: 'low' | 'medium' | 'high';

    if (interruptionRate < 0.1 && priceVariance < 0.1) {
      riskLevel = 'low';
    } else if (interruptionRate < 0.3 && priceVariance < 0.3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'high';
    }

    // Calculate confidence score
    const confidence = Math.max(
      0,
      100 - (interruptionRate * 100 + priceVariance * 50)
    );

    // Find recommended regions with lower risk
    const allRegions = await prisma.spotPrice.groupBy({
      by: ['region'],
      where: {
        provider,
        instanceType,
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const regionAnalyses = await Promise.all(
      allRegions.map(async (r) => {
        const regionHistory = await prisma.spotPrice.findMany({
          where: {
            provider,
            instanceType,
            region: r.region,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        const regionInterruptions = await prisma.spotInterruption.findMany({
          where: {
            provider,
            instanceType,
            region: r.region,
            timestamp: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        });

        const regionInterruptionRate = regionInterruptions.length / 30;
        const regionPriceVariance = calculateVariance(
          regionHistory.map((p) => p.price)
        );

        return {
          region: r.region,
          riskScore: regionInterruptionRate * 100 + regionPriceVariance * 50,
        };
      })
    );

    const recommendedRegions = regionAnalyses
      .filter((r) => r.riskScore < 30)
      .map((r) => r.region);

    return {
      estimatedSavings,
      riskLevel,
      confidence,
      recommendedRegions,
      priceHistory: priceHistory.map((p) => ({
        timestamp: p.timestamp,
        price: p.price,
      })),
    };
  } catch (error) {
    console.error('Error analyzing spot instance utilization:', error);
    throw error;
  }
}

export async function simulateSpotInstance(
  provider: string,
  instanceType: string,
  region: string,
  duration: number,
  riskTolerance: number
): Promise<SpotAnalysis> {
  const analysis = await analyzeSpotInstanceUtilization(
    provider,
    instanceType,
    region
  );

  // Adjust risk level based on user's risk tolerance
  if (riskTolerance < 30) {
    analysis.riskLevel = 'low';
  } else if (riskTolerance < 70) {
    analysis.riskLevel = 'medium';
  } else {
    analysis.riskLevel = 'high';
  }

  // Adjust confidence based on duration
  const durationFactor = Math.min(1, duration / 24); // Normalize to 24 hours
  analysis.confidence = analysis.confidence * durationFactor;

  return analysis;
} 