import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { analyzeSpotInstanceUtilization } from '@/lib/spot/analysis';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch current on-demand instances
    const instances = await prisma.instance.findMany({
      where: {
        userId: session.user.id,
        type: 'on-demand',
      },
    });

    // Analyze spot instance opportunities
    const recommendations = await Promise.all(
      instances.map(async (instance) => {
        const analysis = await analyzeSpotInstanceUtilization(
          instance.provider,
          instance.type,
          instance.region
        );

        return {
          id: instance.id,
          provider: instance.provider,
          instanceType: instance.type,
          region: instance.region,
          currentType: 'on-demand',
          savings: analysis.estimatedSavings,
          riskLevel: analysis.riskLevel,
          confidence: analysis.confidence,
          status: 'pending',
        };
      })
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching spot recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = await req.json();
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update recommendation status
    await prisma.spotRecommendation.update({
      where: { id },
      data: { status: action },
    });

    // If approved, apply the recommendation
    if (action === 'approved') {
      const recommendation = await prisma.spotRecommendation.findUnique({
        where: { id },
      });

      if (recommendation) {
        // TODO: Implement spot instance creation logic
        // This would involve calling the respective cloud provider's API
        // to create the spot instance and set up fallback mechanisms
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing spot recommendation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 