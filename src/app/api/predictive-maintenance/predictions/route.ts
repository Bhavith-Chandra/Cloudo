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

    // Fetch predictions from all providers
    const [awsPredictions, azurePredictions, gcpPredictions] = await Promise.all([
      awsClient.getMaintenancePredictions(),
      azureClient.getMaintenancePredictions(),
      gcpClient.getMaintenancePredictions(),
    ]);

    // Combine and format predictions
    const predictions = [
      ...awsPredictions.map(prediction => ({
        ...prediction,
        provider: 'AWS',
      })),
      ...azurePredictions.map(prediction => ({
        ...prediction,
        provider: 'Azure',
      })),
      ...gcpPredictions.map(prediction => ({
        ...prediction,
        provider: 'GCP',
      })),
    ];

    // Store predictions in database
    await prisma.predictiveMaintenance.createMany({
      data: predictions.map(prediction => ({
        userId: 'system', // Replace with actual user ID
        resourceId: prediction.resourceId,
        provider: prediction.provider,
        resourceType: prediction.resourceType,
        prediction: prediction.prediction,
        status: prediction.status,
        severity: prediction.severity,
        confidence: prediction.confidence,
        estimatedImpact: prediction.estimatedImpact,
        preventiveActions: prediction.preventiveActions,
      })),
    });

    return NextResponse.json(predictions);
  } catch (error) {
    console.error('Error fetching maintenance predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch maintenance predictions' },
      { status: 500 }
    );
  }
} 