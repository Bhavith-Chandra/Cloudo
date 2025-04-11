import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';

interface ResourceMetrics {
  timestamp: Date;
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  networkUtilization: number;
  cost: number;
  provider: string;
  resourceType: string;
}

interface ResourceGroup {
  resourceId: string;
  metrics: ResourceMetrics[];
}

interface OptimizationRecommendation {
  type: string;
  title: string;
  description: string;
  resourceId: string;
  provider: string;
  service: string;
  currentCost: number;
  estimatedSavings: number;
  confidenceScore: number;
  impact: 'low' | 'medium' | 'high';
  implementationComplexity: 'low' | 'medium' | 'high';
  explanation: string;
  metrics: ResourceMetrics;
}

const prisma = new PrismaClient();

export async function analyzeResourceUtilization(
  userId: string,
  provider: string,
  resourceType: string,
  startTime: Date,
  endTime: Date
): Promise<OptimizationRecommendation[]> {
  try {
    // Fetch resource utilization data
    const utilizationData = await prisma.resourceUtilization.findMany({
      where: {
        userId,
        provider,
        resourceType,
        timestamp: {
          gte: startTime,
          lte: endTime
        }
      }
    });

    if (!utilizationData.length) {
      throw new CustomError('No utilization data found', 'NO_DATA');
    }

    // Group resources by ID
    const resourceGroups = groupResources(utilizationData);

    // Generate recommendations
    const recommendations: OptimizationRecommendation[] = [];
    for (const group of resourceGroups) {
      const avgMetrics = calculateAverageMetrics(group.metrics);
      const recommendation = await generateRecommendation(
        group.resourceId,
        avgMetrics,
        group.metrics[0].cost
      );
      recommendations.push(recommendation);
    }

    // Save recommendations to database
    await saveRecommendations(userId, recommendations);

    return recommendations;
  } catch (error) {
    logger.error('Error analyzing resource utilization', { error });
    throw error;
  }
}

function groupResources(data: any[]): ResourceGroup[] {
  const groups: Record<string, ResourceGroup> = {};

  data.forEach((item) => {
    if (!groups[item.resourceId]) {
      groups[item.resourceId] = {
        resourceId: item.resourceId,
        metrics: []
      };
    }
    groups[item.resourceId].metrics.push({
      timestamp: item.timestamp,
      cpuUtilization: item.cpuUtilization,
      memoryUtilization: item.memoryUtilization,
      storageUtilization: item.storageUtilization,
      networkUtilization: item.networkUtilization,
      cost: item.cost,
      provider: item.provider,
      resourceType: item.resourceType
    });
  });

  return Object.values(groups);
}

function calculateAverageMetrics(metrics: ResourceMetrics[]): ResourceMetrics {
  const sum = metrics.reduce(
    (acc, curr) => ({
      timestamp: curr.timestamp,
      cpuUtilization: acc.cpuUtilization + curr.cpuUtilization,
      memoryUtilization: acc.memoryUtilization + curr.memoryUtilization,
      storageUtilization: acc.storageUtilization + curr.storageUtilization,
      networkUtilization: acc.networkUtilization + curr.networkUtilization,
      cost: acc.cost + curr.cost,
      provider: curr.provider,
      resourceType: curr.resourceType
    }),
    {
      timestamp: new Date(),
      cpuUtilization: 0,
      memoryUtilization: 0,
      storageUtilization: 0,
      networkUtilization: 0,
      cost: 0,
      provider: '',
      resourceType: ''
    }
  );

  const count = metrics.length;
  return {
    timestamp: sum.timestamp,
    cpuUtilization: sum.cpuUtilization / count,
    memoryUtilization: sum.memoryUtilization / count,
    storageUtilization: sum.storageUtilization / count,
    networkUtilization: sum.networkUtilization / count,
    cost: sum.cost / count,
    provider: sum.provider,
    resourceType: sum.resourceType
  };
}

async function generateRecommendation(
  resourceId: string,
  metrics: ResourceMetrics,
  cost: number
): Promise<OptimizationRecommendation> {
  const recommendation: OptimizationRecommendation = {
    type: '',
    title: '',
    description: '',
    resourceId,
    provider: metrics.provider,
    service: metrics.resourceType,
    currentCost: cost,
    estimatedSavings: 0,
    confidenceScore: 0,
    impact: 'low',
    implementationComplexity: 'low',
    explanation: '',
    metrics
  };

  // Calculate potential savings based on utilization
  const currentCost = cost;
  let estimatedSavings = 0;

  // Check for underutilized resources
  if (metrics.cpuUtilization < 20 && metrics.memoryUtilization < 20) {
    estimatedSavings = currentCost * 0.5; // Estimate 50% savings for rightsizing
    recommendation.type = 'rightsizing';
    recommendation.title = 'Underutilized Resource';
    recommendation.description = `Resource ${resourceId} is significantly underutilized`;
    recommendation.confidenceScore = 85;
    recommendation.impact = 'high';
    recommendation.explanation = `CPU utilization is ${metrics.cpuUtilization}% and memory utilization is ${metrics.memoryUtilization}%`;
  }

  // Check for idle resources
  else if (metrics.cpuUtilization < 5 && metrics.memoryUtilization < 5) {
    estimatedSavings = currentCost; // Full cost savings for termination
    recommendation.type = 'termination';
    recommendation.title = 'Idle Resource';
    recommendation.description = `Resource ${resourceId} appears to be idle`;
    recommendation.confidenceScore = 90;
    recommendation.impact = 'high';
    recommendation.explanation = `CPU utilization is ${metrics.cpuUtilization}% and memory utilization is ${metrics.memoryUtilization}%`;
  }

  // Check for storage optimization
  else if (metrics.storageUtilization < 30) {
    estimatedSavings = currentCost * 0.3; // Estimate 30% savings for storage optimization
    recommendation.type = 'storage_optimization';
    recommendation.title = 'Storage Optimization';
    recommendation.description = `Resource ${resourceId} has low storage utilization`;
    recommendation.confidenceScore = 75;
    recommendation.impact = 'medium';
    recommendation.explanation = `Storage utilization is ${metrics.storageUtilization}%`;
  }

  recommendation.estimatedSavings = estimatedSavings;
  return recommendation;
}

async function saveRecommendations(
  userId: string,
  recommendations: OptimizationRecommendation[]
): Promise<void> {
  try {
    await prisma.resourceRecommendation.createMany({
      data: recommendations.map((rec) => ({
        userId,
        type: rec.type,
        title: rec.title,
        description: rec.description,
        resourceId: rec.resourceId,
        provider: rec.provider,
        service: rec.service,
        currentCost: rec.currentCost,
        estimatedSavings: rec.estimatedSavings,
        confidenceScore: rec.confidenceScore,
        impact: rec.impact,
        implementationComplexity: rec.implementationComplexity,
        explanation: rec.explanation,
        metrics: rec.metrics
      }))
    });
  } catch (error) {
    logger.error('Error saving recommendations', { error });
    throw error;
  }
} 