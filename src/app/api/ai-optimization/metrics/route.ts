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

    // Fetch metrics from all providers
    const [awsMetrics, azureMetrics, gcpMetrics] = await Promise.all([
      awsClient.getOptimizationMetrics(),
      azureClient.getOptimizationMetrics(),
      gcpClient.getOptimizationMetrics(),
    ]);

    // Combine and aggregate metrics
    const metrics = [
      {
        name: 'cost',
        current: awsMetrics.cost + azureMetrics.cost + gcpMetrics.cost,
        target: (awsMetrics.cost + azureMetrics.cost + gcpMetrics.cost) * 0.8, // 20% reduction target
        unit: 'USD',
        confidence: 99.5,
      },
      {
        name: 'performance',
        current: (awsMetrics.performance + azureMetrics.performance + gcpMetrics.performance) / 3,
        target: 95,
        unit: '%',
        confidence: 99.2,
      },
      {
        name: 'carbon',
        current: awsMetrics.carbon + azureMetrics.carbon + gcpMetrics.carbon,
        target: (awsMetrics.carbon + azureMetrics.carbon + gcpMetrics.carbon) * 0.7, // 30% reduction target
        unit: 'kg CO2',
        confidence: 99.3,
      },
    ];

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching optimization metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization metrics' },
      { status: 500 }
    );
  }
} 