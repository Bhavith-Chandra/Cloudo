import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

export class AIOptimizationService {
  private awsClient: AWSClient;
  private azureClient: AzureClient;
  private gcpClient: GCPClient;

  constructor() {
    this.awsClient = new AWSClient({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      region: process.env.AWS_REGION!,
    });

    this.azureClient = new AzureClient({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID!,
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
    });

    this.gcpClient = new GCPClient({
      projectId: process.env.GCP_PROJECT_ID!,
      credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
    });
  }

  async getOptimizationMetrics() {
    // Fetch metrics from all providers
    const [awsMetrics, azureMetrics, gcpMetrics] = await Promise.all([
      this.awsClient.getOptimizationMetrics(),
      this.azureClient.getOptimizationMetrics(),
      this.gcpClient.getOptimizationMetrics(),
    ]);

    // Combine and aggregate metrics
    return [
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
  }

  async getOptimizationRecommendations() {
    // Fetch recommendations from all providers
    const [awsRecommendations, azureRecommendations, gcpRecommendations] = await Promise.all([
      this.awsClient.getOptimizationRecommendations(),
      this.azureClient.getOptimizationRecommendations(),
      this.gcpClient.getOptimizationRecommendations(),
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

    return recommendations;
  }

  async getPredictions() {
    // Get historical predictions from the database
    const predictions = await prisma.aIPrediction.findMany({
      orderBy: {
        timestamp: 'desc',
      },
      take: 30, // Last 30 days
    });

    // Format predictions for the frontend
    return predictions.map(prediction => ({
      timestamp: prediction.timestamp.toISOString(),
      predicted: prediction.predictedValue,
      actual: prediction.actualValue,
      accuracy: prediction.accuracy,
    }));
  }

  async applyRecommendation(recommendationId: string) {
    // Get the recommendation from the database
    const recommendation = await prisma.optimizationRecommendation.findUnique({
      where: { id: recommendationId },
      include: {
        provider: true,
      },
    });

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Initialize the appropriate cloud client
    let client;
    switch (recommendation.provider.name) {
      case 'AWS':
        client = this.awsClient;
        break;
      case 'Azure':
        client = this.azureClient;
        break;
      case 'GCP':
        client = this.gcpClient;
        break;
      default:
        throw new Error('Unsupported cloud provider');
    }

    // Apply the recommendation
    await client.applyOptimization(recommendation);

    // Update the recommendation status
    await prisma.optimizationRecommendation.update({
      where: { id: recommendationId },
      data: {
        status: 'applied',
        appliedAt: new Date(),
      },
    });

    return {
      message: 'Recommendation applied successfully',
    };
  }
} 