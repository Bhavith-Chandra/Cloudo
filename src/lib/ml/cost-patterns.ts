import { CostData } from '@prisma/client';

interface CostPattern {
  id: string;
  timestamp: Date;
  provider: string;
  service: string;
  project?: string;
  actualCost: number;
  expectedCost: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: {
    period: 'daily' | 'weekly' | 'monthly';
    amplitude: number;
  };
}

export async function analyzeCostPatterns(costData: CostData[]): Promise<CostPattern[]> {
  // Group data by provider, service, and project
  const groupedData = groupCostData(costData);
  
  const patterns: CostPattern[] = [];
  
  for (const [key, data] of Object.entries(groupedData)) {
    const [provider, service, project] = key.split(':');
    
    // Calculate moving average for expected cost
    const expectedCost = calculateMovingAverage(data.map(d => d.cost));
    
    // Analyze trend
    const trend = analyzeTrend(data.map(d => d.cost));
    
    // Detect seasonality
    const seasonality = detectSeasonality(data);
    
    patterns.push({
      id: data[0].id,
      timestamp: data[data.length - 1].timestamp,
      provider,
      service,
      project,
      actualCost: data[data.length - 1].cost,
      expectedCost,
      trend,
      seasonality,
    });
  }
  
  return patterns;
}

function groupCostData(costData: CostData[]): Record<string, CostData[]> {
  return costData.reduce((groups, data) => {
    const key = `${data.provider}:${data.service}:${data.tags?.project || 'default'}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(data);
    return groups;
  }, {} as Record<string, CostData[]>);
}

function calculateMovingAverage(costs: number[], windowSize: number = 7): number {
  if (costs.length < windowSize) {
    return costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
  }
  
  const window = costs.slice(-windowSize);
  return window.reduce((sum, cost) => sum + cost, 0) / windowSize;
}

function analyzeTrend(costs: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (costs.length < 2) return 'stable';
  
  const firstHalf = costs.slice(0, Math.floor(costs.length / 2));
  const secondHalf = costs.slice(Math.floor(costs.length / 2));
  
  const avgFirst = firstHalf.reduce((sum, cost) => sum + cost, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((sum, cost) => sum + cost, 0) / secondHalf.length;
  
  const change = (avgSecond - avgFirst) / avgFirst;
  
  if (Math.abs(change) < 0.1) return 'stable';
  return change > 0 ? 'increasing' : 'decreasing';
}

function detectSeasonality(data: CostData[]): { period: 'daily' | 'weekly' | 'monthly'; amplitude: number } | undefined {
  if (data.length < 30) return undefined;
  
  // Simple seasonality detection based on variance
  const dailyCosts = data.reduce((acc, d) => {
    const day = d.timestamp.getDay();
    if (!acc[day]) acc[day] = [];
    acc[day].push(d.cost);
    return acc;
  }, {} as Record<number, number[]>);
  
  const dailyVariances = Object.entries(dailyCosts).map(([day, costs]) => {
    const avg = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
    const variance = costs.reduce((sum, cost) => sum + Math.pow(cost - avg, 2), 0) / costs.length;
    return { day: parseInt(day), variance };
  });
  
  const maxVariance = Math.max(...dailyVariances.map(d => d.variance));
  const avgVariance = dailyVariances.reduce((sum, d) => sum + d.variance, 0) / dailyVariances.length;
  
  if (maxVariance > avgVariance * 2) {
    return {
      period: 'daily',
      amplitude: maxVariance / avgVariance,
    };
  }
  
  return undefined;
} 