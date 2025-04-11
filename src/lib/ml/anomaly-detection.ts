import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';
import { analyzeCostPatterns } from './cost-patterns';

interface AnomalyDetectionConfig {
  userId: string;
  provider?: string;
  service?: string;
  project?: string;
  threshold?: number;
  sensitivity?: 'low' | 'medium' | 'high';
}

interface Anomaly {
  id: string;
  timestamp: Date;
  provider: string;
  service: string;
  project?: string;
  cost: number;
  expectedCost: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCause?: string;
  status: 'active' | 'resolved' | 'ignored';
}

const prisma = new PrismaClient();

export async function detectAnomalies(config: AnomalyDetectionConfig): Promise<Anomaly[]> {
  try {
    // Fetch historical cost data
    const costData = await prisma.costData.findMany({
      where: {
        userId: config.userId,
        ...(config.provider && { provider: config.provider }),
        ...(config.service && { service: config.service }),
        ...(config.project && { tags: { path: ['project'], equals: config.project } }),
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (!costData.length) {
      throw new CustomError('No cost data found for analysis', 'NO_DATA');
    }

    // Analyze cost patterns using AI
    const patterns = await analyzeCostPatterns(costData);
    
    // Detect anomalies based on patterns and thresholds
    const anomalies: Anomaly[] = [];
    const threshold = config.threshold || getDefaultThreshold(config.sensitivity);

    for (const pattern of patterns) {
      const deviation = Math.abs(pattern.actualCost - pattern.expectedCost) / pattern.expectedCost;
      
      if (deviation > threshold) {
        const severity = determineSeverity(deviation);
        const rootCause = await analyzeRootCause(pattern);

        anomalies.push({
          id: pattern.id,
          timestamp: pattern.timestamp,
          provider: pattern.provider,
          service: pattern.service,
          project: pattern.project,
          cost: pattern.actualCost,
          expectedCost: pattern.expectedCost,
          deviation,
          severity,
          rootCause,
          status: 'active',
        });
      }
    }

    // Save detected anomalies
    await saveAnomalies(config.userId, anomalies);

    return anomalies;
  } catch (error) {
    logger.error('Error detecting anomalies', { error, config });
    throw error;
  }
}

function getDefaultThreshold(sensitivity?: string): number {
  switch (sensitivity) {
    case 'low':
      return 0.5; // 50% deviation
    case 'high':
      return 0.2; // 20% deviation
    default:
      return 0.3; // 30% deviation (medium)
  }
}

function determineSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
  if (deviation > 1) return 'critical';
  if (deviation > 0.5) return 'high';
  if (deviation > 0.3) return 'medium';
  return 'low';
}

async function analyzeRootCause(pattern: any): Promise<string> {
  // AI-powered root cause analysis
  const factors = [
    { name: 'untagged_resources', weight: 0.3 },
    { name: 'unusual_usage_patterns', weight: 0.25 },
    { name: 'misconfigured_resources', weight: 0.2 },
    { name: 'price_changes', weight: 0.15 },
    { name: 'data_transfer', weight: 0.1 },
  ];

  // Simulate AI analysis (replace with actual AI model)
  const rootCause = factors.reduce((acc, factor) => {
    const score = Math.random() * factor.weight;
    return score > acc.score ? { name: factor.name, score } : acc;
  }, { name: '', score: 0 });

  return formatRootCause(rootCause.name, pattern);
}

function formatRootCause(cause: string, pattern: any): string {
  switch (cause) {
    case 'untagged_resources':
      return `Cost spike due to untagged ${pattern.service} resources`;
    case 'unusual_usage_patterns':
      return `Unusual usage pattern detected in ${pattern.service}`;
    case 'misconfigured_resources':
      return `Misconfigured ${pattern.service} resources causing increased costs`;
    case 'price_changes':
      return `Recent price changes affecting ${pattern.service} costs`;
    case 'data_transfer':
      return `Increased data transfer costs in ${pattern.service}`;
    default:
      return `Unusual cost pattern detected in ${pattern.service}`;
  }
}

async function saveAnomalies(userId: string, anomalies: Anomaly[]): Promise<void> {
  try {
    await prisma.anomaly.createMany({
      data: anomalies.map(anomaly => ({
        userId,
        timestamp: anomaly.timestamp,
        provider: anomaly.provider,
        service: anomaly.service,
        project: anomaly.project,
        cost: anomaly.cost,
        expectedCost: anomaly.expectedCost,
        deviation: anomaly.deviation,
        severity: anomaly.severity,
        rootCause: anomaly.rootCause,
        status: anomaly.status,
      })),
    });
  } catch (error) {
    logger.error('Error saving anomalies', { error });
    throw error;
  }
} 