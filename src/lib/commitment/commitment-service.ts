import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';
import { AWSProvider } from '../cloud/aws';
import { AzureProvider } from '../cloud/azure';
import { GCPProvider } from '../cloud/gcp';

const prisma = new PrismaClient();

interface CommitmentRecommendation {
  provider: 'aws' | 'azure' | 'gcp';
  type: 'reserved' | 'savings_plan';
  term: number; // months
  paymentOption: 'all_upfront' | 'partial_upfront' | 'no_upfront';
  resourceType: string;
  quantity: number;
  estimatedSavings: number;
  confidenceScore: number;
  explanation: string;
  historicalAccuracy: number;
  riskFactors: string[];
}

interface CommitmentForecast {
  startDate: Date;
  endDate: Date;
  recommendations: CommitmentRecommendation[];
  totalPotentialSavings: number;
  averageConfidence: number;
  historicalAccuracy: number;
}

export class CommitmentService {
  private async getProviderClient(provider: string) {
    switch (provider.toLowerCase()) {
      case 'aws':
        return new AWSProvider();
      case 'azure':
        return new AzureProvider();
      case 'gcp':
        return new GCPProvider();
      default:
        throw new CustomError(`Unsupported provider: ${provider}`, 'INVALID_PROVIDER');
    }
  }

  async analyzeUsagePatterns(userId: string, provider: string, startDate: Date, endDate: Date): Promise<any> {
    try {
      const usageData = await prisma.costData.findMany({
        where: {
          userId,
          provider,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
      });

      // Group usage by resource type and calculate patterns
      const patterns = this.calculateUsagePatterns(usageData);
      return patterns;
    } catch (error) {
      logger.error('Failed to analyze usage patterns', { error, userId, provider });
      throw error;
    }
  }

  private calculateUsagePatterns(usageData: any[]): any {
    const patterns: Record<string, any> = {};

    for (const data of usageData) {
      if (!patterns[data.service]) {
        patterns[data.service] = {
          totalCost: 0,
          averageUtilization: 0,
          peakUtilization: 0,
          usageHours: 0,
          seasonalPatterns: [],
        };
      }

      const pattern = patterns[data.service];
      pattern.totalCost += data.cost;
      pattern.averageUtilization = (pattern.averageUtilization + (data.utilization || 0)) / 2;
      pattern.peakUtilization = Math.max(pattern.peakUtilization, data.utilization || 0);
      pattern.usageHours++;
    }

    return patterns;
  }

  async generateRecommendations(
    userId: string,
    provider: string,
    startDate: Date,
    endDate: Date
  ): Promise<CommitmentForecast> {
    try {
      const usagePatterns = await this.analyzeUsagePatterns(userId, provider, startDate, endDate);
      const recommendations: CommitmentRecommendation[] = [];

      for (const [service, pattern] of Object.entries(usagePatterns)) {
        const recommendation = await this.calculateOptimalCommitment(
          service,
          pattern as any,
          provider
        );
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }

      const totalSavings = recommendations.reduce((sum, rec) => sum + rec.estimatedSavings, 0);
      const averageConfidence = recommendations.reduce((sum, rec) => sum + rec.confidenceScore, 0) / recommendations.length;

      return {
        startDate,
        endDate,
        recommendations,
        totalPotentialSavings: totalSavings,
        averageConfidence,
        historicalAccuracy: this.calculateHistoricalAccuracy(userId, provider),
      };
    } catch (error) {
      logger.error('Failed to generate recommendations', { error, userId, provider });
      throw error;
    }
  }

  private async calculateOptimalCommitment(
    service: string,
    pattern: any,
    provider: string
  ): Promise<CommitmentRecommendation | null> {
    // Calculate optimal commitment based on usage patterns
    const confidenceScore = this.calculateConfidenceScore(pattern);
    if (confidenceScore < 0.7) return null; // Only recommend if confidence is high enough

    const recommendation: CommitmentRecommendation = {
      provider: provider as 'aws' | 'azure' | 'gcp',
      type: this.determineCommitmentType(service, pattern),
      term: this.calculateOptimalTerm(pattern),
      paymentOption: this.calculateOptimalPaymentOption(pattern),
      resourceType: service,
      quantity: this.calculateOptimalQuantity(pattern),
      estimatedSavings: this.calculateEstimatedSavings(pattern),
      confidenceScore,
      explanation: this.generateExplanation(pattern, confidenceScore),
      historicalAccuracy: this.calculateHistoricalAccuracyForService(service),
      riskFactors: this.identifyRiskFactors(pattern),
    };

    return recommendation;
  }

  private calculateConfidenceScore(pattern: any): number {
    // Calculate confidence based on usage consistency, historical data, and seasonal patterns
    const consistencyScore = this.calculateConsistencyScore(pattern);
    const historicalDataScore = this.calculateHistoricalDataScore(pattern);
    const seasonalPatternScore = this.calculateSeasonalPatternScore(pattern);

    return (consistencyScore + historicalDataScore + seasonalPatternScore) / 3;
  }

  private calculateConsistencyScore(pattern: any): number {
    // Calculate how consistent the usage is
    const variance = this.calculateVariance(pattern.utilization);
    return Math.max(0, 1 - variance);
  }

  private calculateHistoricalDataScore(pattern: any): number {
    // Score based on amount of historical data
    const minDataPoints = 30; // Minimum data points for good confidence
    return Math.min(1, pattern.usageHours / minDataPoints);
  }

  private calculateSeasonalPatternScore(pattern: any): number {
    // Score based on how well we understand seasonal patterns
    return pattern.seasonalPatterns.length > 0 ? 0.9 : 0.5;
  }

  private determineCommitmentType(service: string, pattern: any): 'reserved' | 'savings_plan' {
    // Determine whether to recommend Reserved Instances or Savings Plans
    // Based on usage patterns, service type, and provider-specific factors
    return pattern.peakUtilization > 0.8 ? 'reserved' : 'savings_plan';
  }

  private calculateOptimalTerm(pattern: any): number {
    // Calculate optimal term length based on usage patterns and cost analysis
    return pattern.usageHours > 2000 ? 36 : 12; // 1 or 3 years
  }

  private calculateOptimalPaymentOption(pattern: any): 'all_upfront' | 'partial_upfront' | 'no_upfront' {
    // Determine optimal payment option based on usage patterns and cost analysis
    return pattern.usageHours > 2000 ? 'all_upfront' : 'partial_upfront';
  }

  private calculateOptimalQuantity(pattern: any): number {
    // Calculate optimal quantity based on usage patterns and cost analysis
    return Math.ceil(pattern.averageUtilization * pattern.usageHours / 730); // 730 hours in a month
  }

  private calculateEstimatedSavings(pattern: any): number {
    // Calculate estimated savings based on commitment type, term, and usage patterns
    const baseSavings = pattern.totalCost * 0.3; // Base savings estimate
    return baseSavings * (pattern.usageHours / 730); // Scale by usage
  }

  private generateExplanation(pattern: any, confidence: number): string {
    return `Recommendation based on ${Math.round(confidence * 100)}% confidence in usage patterns. ` +
      `Average utilization: ${Math.round(pattern.averageUtilization * 100)}%, ` +
      `Peak utilization: ${Math.round(pattern.peakUtilization * 100)}%.`;
  }

  private calculateHistoricalAccuracy(userId: string, provider: string): number {
    // Calculate historical accuracy of previous recommendations
    // This would typically involve comparing past recommendations with actual savings
    return 0.85; // Placeholder value
  }

  private calculateHistoricalAccuracyForService(service: string): number {
    // Calculate historical accuracy for specific service
    return 0.85; // Placeholder value
  }

  private identifyRiskFactors(pattern: any): string[] {
    const riskFactors: string[] = [];
    
    if (pattern.peakUtilization > 0.9) {
      riskFactors.push('High peak utilization may indicate need for on-demand capacity');
    }
    
    if (pattern.averageUtilization < 0.4) {
      riskFactors.push('Low average utilization may indicate over-provisioning');
    }
    
    if (pattern.seasonalPatterns.length === 0) {
      riskFactors.push('Limited seasonal pattern data may affect forecast accuracy');
    }

    return riskFactors;
  }

  async createCommitment(userId: string, recommendation: CommitmentRecommendation): Promise<void> {
    try {
      // Create commitment record
      await prisma.commitment.create({
        data: {
          userId,
          provider: recommendation.provider,
          type: recommendation.type,
          term: recommendation.term,
          paymentOption: recommendation.paymentOption,
          resourceType: recommendation.resourceType,
          quantity: recommendation.quantity,
          estimatedSavings: recommendation.estimatedSavings,
          confidenceScore: recommendation.confidenceScore,
          status: 'pending_approval',
        },
      });

      // Log the action
      logger.info('Created new commitment recommendation', {
        userId,
        recommendation,
      });
    } catch (error) {
      logger.error('Failed to create commitment', { error, userId, recommendation });
      throw error;
    }
  }

  async approveCommitment(commitmentId: string, userId: string): Promise<void> {
    try {
      const commitment = await prisma.commitment.findUnique({
        where: { id: commitmentId },
      });

      if (!commitment) {
        throw new CustomError('Commitment not found', 'NOT_FOUND');
      }

      if (commitment.userId !== userId) {
        throw new CustomError('Unauthorized', 'UNAUTHORIZED');
      }

      // Update commitment status
      await prisma.commitment.update({
        where: { id: commitmentId },
        data: {
          status: 'approved',
          approvedAt: new Date(),
          approvedBy: userId,
        },
      });

      // Log the action
      logger.info('Approved commitment', {
        commitmentId,
        userId,
      });
    } catch (error) {
      logger.error('Failed to approve commitment', { error, commitmentId, userId });
      throw error;
    }
  }

  async rejectCommitment(commitmentId: string, userId: string, reason: string): Promise<void> {
    try {
      const commitment = await prisma.commitment.findUnique({
        where: { id: commitmentId },
      });

      if (!commitment) {
        throw new CustomError('Commitment not found', 'NOT_FOUND');
      }

      if (commitment.userId !== userId) {
        throw new CustomError('Unauthorized', 'UNAUTHORIZED');
      }

      // Update commitment status
      await prisma.commitment.update({
        where: { id: commitmentId },
        data: {
          status: 'rejected',
          rejectedAt: new Date(),
          rejectedBy: userId,
          rejectionReason: reason,
        },
      });

      // Log the action
      logger.info('Rejected commitment', {
        commitmentId,
        userId,
        reason,
      });
    } catch (error) {
      logger.error('Failed to reject commitment', { error, commitmentId, userId });
      throw error;
    }
  }
} 