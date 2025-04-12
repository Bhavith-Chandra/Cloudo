import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

export async function GET() {
  try {
    // Get all cloud providers
    const providers = await prisma.cloudProvider.findMany();

    // Initialize cloud clients
    const awsClient = new AWSClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
    });

    const azureClient = new AzureClient({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID!,
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
    });

    const gcpClient = new GCPClient({
      projectId: process.env.GCP_PROJECT_ID!,
      credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
    });

    // Fetch recommendations from all providers
    const [awsRecommendations, azureRecommendations, gcpRecommendations] = await Promise.all([
      awsClient.getOptimizationRecommendations(),
      azureClient.getOptimizationRecommendations(),
      gcpClient.getOptimizationRecommendations(),
    ]);

    // Combine and format recommendations
    const recommendations = [
      ...awsRecommendations.map(rec => ({
        ...rec,
        provider: 'AWS',
      })),
      ...azureRecommendations.map(rec => ({
        ...rec,
        provider: 'Azure',
      })),
      ...gcpRecommendations.map(rec => ({
        ...rec,
        provider: 'GCP',
      })),
    ];

    // Sort by confidence and impact
    recommendations.sort((a, b) => {
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }
      return b.impact.cost - a.impact.cost;
    });

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error fetching optimization recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization recommendations' },
      { status: 500 }
    );
  }
} 