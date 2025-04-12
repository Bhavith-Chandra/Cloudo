import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get the recommendation from the database
    const recommendation = await prisma.optimizationRecommendation.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });

    if (!recommendation) {
      return NextResponse.json(
        { error: 'Recommendation not found' },
        { status: 404 }
      );
    }

    // Initialize the appropriate cloud client
    let client;
    switch (recommendation.provider.name) {
      case 'AWS':
        client = new AWSClient({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION!,
        });
        break;
      case 'Azure':
        client = new AzureClient({
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          tenantId: process.env.AZURE_TENANT_ID!,
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
        });
        break;
      case 'GCP':
        client = new GCPClient({
          projectId: process.env.GCP_PROJECT_ID!,
          credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported cloud provider' },
          { status: 400 }
        );
    }

    // Apply the recommendation
    await client.applyOptimization(recommendation);

    // Update the recommendation status
    await prisma.optimizationRecommendation.update({
      where: { id },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Recommendation applied successfully',
    });
  } catch (error) {
    console.error('Error applying optimization recommendation:', error);
    return NextResponse.json(
      { error: 'Failed to apply optimization recommendation' },
      { status: 500 }
    );
  }
} 