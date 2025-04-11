import { prisma } from './db';
import { CloudService } from './cloud';
import { logger } from './logger';
import config from './config';

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  timestamp: Date;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: Date;
  version: string;
  environment: string;
}

export class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<HealthCheck>> = new Map();

  private constructor() {
    this.registerDefaultChecks();
  }

  public static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  private registerDefaultChecks(): void {
    this.registerCheck('database', this.checkDatabase);
    this.registerCheck('aws', this.checkAWS);
    this.registerCheck('azure', this.checkAzure);
    this.registerCheck('gcp', this.checkGCP);
  }

  public registerCheck(name: string, check: () => Promise<HealthCheck>): void {
    this.checks.set(name, check);
  }

  public async checkHealth(): Promise<HealthStatus> {
    const checks: HealthCheck[] = [];
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    for (const [name, check] of Array.from(this.checks.entries())) {
      try {
        const result = await check();
        checks.push(result);

        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }
      } catch (error) {
        logger.error(`Health check failed for ${name}`, { error });
        checks.push({
          name,
          status: 'unhealthy',
          message: 'Check failed',
          timestamp: new Date(),
        });
        overallStatus = 'unhealthy';
      }
    }

    return {
      status: overallStatus,
      checks,
      timestamp: new Date(),
      version: config.app.version,
      environment: config.app.environment,
    };
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        name: 'database',
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'unhealthy',
        message: 'Database connection failed',
        timestamp: new Date(),
      };
    }
  }

  private async checkAWS(): Promise<HealthCheck> {
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
      return {
        name: 'aws',
        status: 'degraded',
        message: 'AWS credentials not configured',
        timestamp: new Date(),
      };
    }

    try {
      const cloudService = CloudService.getInstance();
      await cloudService.getCosts('aws', new Date(), new Date());
      return {
        name: 'aws',
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'aws',
        status: 'unhealthy',
        message: 'AWS connection failed',
        timestamp: new Date(),
      };
    }
  }

  private async checkAzure(): Promise<HealthCheck> {
    if (!config.azure.clientId || !config.azure.clientSecret) {
      return {
        name: 'azure',
        status: 'degraded',
        message: 'Azure credentials not configured',
        timestamp: new Date(),
      };
    }

    try {
      const cloudService = CloudService.getInstance();
      await cloudService.getCosts('azure', new Date(), new Date());
      return {
        name: 'azure',
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'azure',
        status: 'unhealthy',
        message: 'Azure connection failed',
        timestamp: new Date(),
      };
    }
  }

  private async checkGCP(): Promise<HealthCheck> {
    if (!config.gcp.projectId || !config.gcp.privateKey) {
      return {
        name: 'gcp',
        status: 'degraded',
        message: 'GCP credentials not configured',
        timestamp: new Date(),
      };
    }

    try {
      const cloudService = CloudService.getInstance();
      await cloudService.getCosts('gcp', new Date(), new Date());
      return {
        name: 'gcp',
        status: 'healthy',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        name: 'gcp',
        status: 'unhealthy',
        message: 'GCP connection failed',
        timestamp: new Date(),
      };
    }
  }
}

export const healthChecker = HealthChecker.getInstance(); 