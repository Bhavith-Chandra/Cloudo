import { CostData } from '@prisma/client';

interface UsagePattern {
  resourceId: string;
  provider: string;
  service: string;
  averageUtilization: number;
  peakUtilization: number;
  costPerUnit: number;
  seasonalPatterns: {
    daily: number[];
    weekly: number[];
  };
}

interface Recommendation {
  id: string;
  type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'storage_optimization';
  title: string;
  description: string;
  estimatedSavings: number;
  confidenceScore: number;
  impact: 'high' | 'medium' | 'low';
  affectedResources: string[];
  implementationComplexity: 'easy' | 'medium' | 'hard';
  explanation: string;
}

export async function analyzeUsagePatterns(
  costData: CostData[]
): Promise<UsagePattern[]> {
  // Group data by resource
  const resourceGroups = costData.reduce((acc, data) => {
    const key = `${data.provider}-${data.resourceId}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(data);
    return acc;
  }, {} as Record<string, CostData[]>);

  // Analyze patterns for each resource
  const patterns: UsagePattern[] = [];

  for (const [key, data] of Object.entries(resourceGroups)) {
    const [provider, resourceId] = key.split('-');
    const service = data[0].service;

    // Calculate utilization metrics
    const utilizations = data.map((d) => d.utilization || 0);
    const averageUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;
    const peakUtilization = Math.max(...utilizations);

    // Calculate cost per unit
    const totalCost = data.reduce((sum, d) => sum + d.cost, 0);
    const costPerUnit = totalCost / data.length;

    // Analyze daily and weekly patterns
    const dailyPatterns = analyzeDailyPatterns(data);
    const weeklyPatterns = analyzeWeeklyPatterns(data);

    patterns.push({
      resourceId,
      provider,
      service,
      averageUtilization,
      peakUtilization,
      costPerUnit,
      seasonalPatterns: {
        daily: dailyPatterns,
        weekly: weeklyPatterns,
      },
    });
  }

  return patterns;
}

export async function generateRecommendations(
  patterns: UsagePattern[]
): Promise<Recommendation[]> {
  const recommendations: Recommendation[] = [];

  for (const pattern of patterns) {
    // Generate rightsizing recommendations
    if (pattern.averageUtilization < 40) {
      recommendations.push({
        id: `rightsizing-${pattern.resourceId}`,
        type: 'rightsizing',
        title: `Right-size ${pattern.service} instance`,
        description: `Instance is underutilized with average utilization of ${pattern.averageUtilization.toFixed(1)}%`,
        estimatedSavings: calculateRightsizingSavings(pattern),
        confidenceScore: calculateConfidenceScore(pattern),
        impact: 'high',
        affectedResources: [pattern.resourceId],
        implementationComplexity: 'medium',
        explanation: `Based on ${pattern.seasonalPatterns.daily.length} days of usage data, this instance is consistently underutilized.`,
      });
    }

    // Generate reserved instances recommendations
    if (pattern.seasonalPatterns.weekly.every((p) => p > 0.8)) {
      recommendations.push({
        id: `reserved-${pattern.resourceId}`,
        type: 'reserved_instances',
        title: `Purchase Reserved Instance for ${pattern.service}`,
        description: 'Consistent usage pattern suggests Reserved Instance would be cost-effective',
        estimatedSavings: calculateReservedInstanceSavings(pattern),
        confidenceScore: calculateConfidenceScore(pattern),
        impact: 'high',
        affectedResources: [pattern.resourceId],
        implementationComplexity: 'easy',
        explanation: 'Weekly usage patterns show consistent high utilization, making Reserved Instances a cost-effective option.',
      });
    }

    // Generate spot instances recommendations
    if (pattern.seasonalPatterns.daily.some((p) => p < 0.3)) {
      recommendations.push({
        id: `spot-${pattern.resourceId}`,
        type: 'spot_instances',
        title: `Use Spot Instances for ${pattern.service}`,
        description: 'Intermittent usage pattern suggests Spot Instances could reduce costs',
        estimatedSavings: calculateSpotInstanceSavings(pattern),
        confidenceScore: calculateConfidenceScore(pattern),
        impact: 'medium',
        affectedResources: [pattern.resourceId],
        implementationComplexity: 'hard',
        explanation: 'Daily usage patterns show periods of low utilization where Spot Instances could be used.',
      });
    }
  }

  // Sort recommendations by estimated savings
  return recommendations.sort((a, b) => b.estimatedSavings - a.estimatedSavings);
}

function analyzeDailyPatterns(data: CostData[]): number[] {
  // Group data by hour of day
  const hourlyPatterns = new Array(24).fill(0);
  const hourlyCounts = new Array(24).fill(0);

  data.forEach((d) => {
    const hour = new Date(d.timestamp).getHours();
    hourlyPatterns[hour] += d.utilization || 0;
    hourlyCounts[hour]++;
  });

  return hourlyPatterns.map((sum, i) => sum / (hourlyCounts[i] || 1));
}

function analyzeWeeklyPatterns(data: CostData[]): number[] {
  // Group data by day of week
  const dailyPatterns = new Array(7).fill(0);
  const dailyCounts = new Array(7).fill(0);

  data.forEach((d) => {
    const day = new Date(d.timestamp).getDay();
    dailyPatterns[day] += d.utilization || 0;
    dailyCounts[day]++;
  });

  return dailyPatterns.map((sum, i) => sum / (dailyCounts[i] || 1));
}

function calculateRightsizingSavings(pattern: UsagePattern): number {
  const currentCost = pattern.costPerUnit;
  const optimalSize = Math.ceil(pattern.peakUtilization / 0.8); // Target 80% utilization
  const optimalCost = (currentCost * optimalSize) / 100;
  return currentCost - optimalCost;
}

function calculateReservedInstanceSavings(pattern: UsagePattern): number {
  const currentCost = pattern.costPerUnit;
  const reservedDiscount = 0.4; // 40% discount for reserved instances
  return currentCost * reservedDiscount;
}

function calculateSpotInstanceSavings(pattern: UsagePattern): number {
  const currentCost = pattern.costPerUnit;
  const spotDiscount = 0.7; // 70% discount for spot instances
  const utilizationFactor = pattern.averageUtilization / 100;
  return currentCost * spotDiscount * utilizationFactor;
}

function calculateConfidenceScore(pattern: UsagePattern): number {
  const dataPoints = pattern.seasonalPatterns.daily.length;
  const utilizationStability = 1 - (pattern.peakUtilization - pattern.averageUtilization) / 100;
  const patternConsistency = calculatePatternConsistency(pattern.seasonalPatterns);

  return Math.min(100, Math.round(
    (dataPoints / 30) * 30 + // Up to 30% based on data points
    utilizationStability * 40 + // Up to 40% based on utilization stability
    patternConsistency * 30 // Up to 30% based on pattern consistency
  ));
}

function calculatePatternConsistency(patterns: { daily: number[]; weekly: number[] }): number {
  const dailyVariance = calculateVariance(patterns.daily);
  const weeklyVariance = calculateVariance(patterns.weekly);
  return 1 - (dailyVariance + weeklyVariance) / 2;
}

function calculateVariance(numbers: number[]): number {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDifferences = numbers.map((n) => Math.pow(n - mean, 2));
  return squaredDifferences.reduce((a, b) => a + b, 0) / numbers.length;
} 