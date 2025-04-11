import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { CustomError } from '../error';
import { AWSProvider } from '../cloud/aws';
import { AzureProvider } from '../cloud/azure';
import { GCPProvider } from '../cloud/gcp';

const prisma = new PrismaClient();

interface TaggingRule {
  field: string;
  operator: 'equals' | 'contains' | 'regex' | 'startsWith' | 'endsWith';
  value: string;
  tags: Record<string, string>;
  priority: number;
}

interface TaggingPolicy {
  id: string;
  name: string;
  description?: string;
  rules: TaggingRule[];
  provider: 'aws' | 'azure' | 'gcp';
  isActive: boolean;
}

export class TaggingService {
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

  async createPolicy(userId: string, policy: Omit<TaggingPolicy, 'id'>): Promise<TaggingPolicy> {
    try {
      const createdPolicy = await prisma.taggingPolicy.create({
        data: {
          name: policy.name,
          description: policy.description,
          rules: policy.rules,
          provider: policy.provider,
          isActive: policy.isActive,
          createdBy: userId,
        },
      });

      logger.info('Created new tagging policy', { policyId: createdPolicy.id });
      return createdPolicy;
    } catch (error) {
      logger.error('Failed to create tagging policy', { error });
      throw error;
    }
  }

  async applyPolicy(policyId: string): Promise<void> {
    try {
      const policy = await prisma.taggingPolicy.findUnique({
        where: { id: policyId },
        include: { rules: true },
      });

      if (!policy) {
        throw new CustomError('Policy not found', 'POLICY_NOT_FOUND');
      }

      const provider = await this.getProviderClient(policy.provider);
      const resources = await provider.listResources();

      for (const resource of resources) {
        const matchingRules = policy.rules.filter(rule => this.evaluateRule(rule, resource));
        if (matchingRules.length > 0) {
          const highestPriorityRule = matchingRules.reduce((prev, current) => 
            (prev.priority > current.priority) ? prev : current
          );

          await this.applyTags(policyId, resource.id, highestPriorityRule.tags);
        }
      }
    } catch (error) {
      logger.error('Failed to apply tagging policy', { error, policyId });
      throw error;
    }
  }

  private evaluateRule(rule: TaggingRule, resource: any): boolean {
    const value = resource[rule.field];
    if (!value) return false;

    switch (rule.operator) {
      case 'equals':
        return value === rule.value;
      case 'contains':
        return value.includes(rule.value);
      case 'regex':
        return new RegExp(rule.value).test(value);
      case 'startsWith':
        return value.startsWith(rule.value);
      case 'endsWith':
        return value.endsWith(rule.value);
      default:
        return false;
    }
  }

  private async applyTags(policyId: string, resourceId: string, tags: Record<string, string>): Promise<void> {
    try {
      const audit = await prisma.taggingAudit.create({
        data: {
          policyId,
          resourceId,
          action: 'update',
          newTags: tags,
          status: 'pending',
        },
      });

      // Apply tags through the appropriate provider
      const policy = await prisma.taggingPolicy.findUnique({
        where: { id: policyId },
      });

      if (!policy) {
        throw new CustomError('Policy not found', 'POLICY_NOT_FOUND');
      }

      const provider = await this.getProviderClient(policy.provider);
      await provider.applyTags(resourceId, tags);

      await prisma.taggingAudit.update({
        where: { id: audit.id },
        data: { status: 'success' },
      });
    } catch (error) {
      logger.error('Failed to apply tags', { error, resourceId });
      throw error;
    }
  }

  async generateComplianceReport(userId: string, provider: string, startDate: Date, endDate: Date): Promise<string> {
    try {
      const report = await prisma.complianceReport.create({
        data: {
          userId,
          provider,
          startDate,
          endDate,
          status: 'pending',
          results: {},
        },
      });

      const cloudProvider = await this.getProviderClient(provider);
      const resources = await cloudProvider.listResources();
      const policies = await prisma.taggingPolicy.findMany({
        where: { provider, isActive: true },
        include: { rules: true },
      });

      const complianceResults = resources.map(resource => {
        const resourceTags = resource.tags || {};
        const missingTags = new Set<string>();
        const invalidTags = new Set<string>();

        for (const policy of policies) {
          for (const rule of policy.rules) {
            if (this.evaluateRule(rule, resource)) {
              for (const [key, value] of Object.entries(rule.tags)) {
                if (!resourceTags[key]) {
                  missingTags.add(key);
                } else if (resourceTags[key] !== value) {
                  invalidTags.add(key);
                }
              }
            }
          }
        }

        return {
          resourceId: resource.id,
          resourceType: resource.type,
          missingTags: Array.from(missingTags),
          invalidTags: Array.from(invalidTags),
          complianceScore: 100 - (missingTags.size + invalidTags.size) * 10,
        };
      });

      await prisma.complianceReport.update({
        where: { id: report.id },
        data: {
          status: 'completed',
          results: {
            totalResources: resources.length,
            compliantResources: complianceResults.filter(r => r.complianceScore >= 80).length,
            nonCompliantResources: complianceResults.filter(r => r.complianceScore < 80).length,
            averageComplianceScore: complianceResults.reduce((acc, curr) => acc + curr.complianceScore, 0) / resources.length,
            details: complianceResults,
          },
        },
      });

      return report.id;
    } catch (error) {
      logger.error('Failed to generate compliance report', { error });
      throw error;
    }
  }
} 