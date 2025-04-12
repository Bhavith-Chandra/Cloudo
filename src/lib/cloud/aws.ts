import * as AWS from 'aws-sdk'
import { prisma } from '@/lib/db'

interface AWSClientConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
}

interface HealthMetric {
  resourceId: string;
  metricType: string;
  value: number;
  threshold: number;
  status: string;
}

interface MaintenancePrediction {
  resourceId: string;
  resourceType: string;
  prediction: {
    riskScore: number;
    estimatedFailureTime: string;
    factors: string[];
  };
  status: string;
  severity: string;
  confidence: number;
  estimatedImpact: {
    cost: number;
    downtime: number;
  };
  preventiveActions: {
    type: string;
    description: string;
    estimatedTime: string;
    cost: number;
  }[];
}

export class AWSClient {
  private cloudWatch: AWS.CloudWatch
  private ec2: AWS.EC2
  private costExplorer: AWS.CostExplorer
  private lambda: AWS.Lambda
  private securityHub: AWS.SecurityHub
  private cloudTrail: AWS.CloudTrail
  private credentials: AWS.Credentials

  constructor(config: AWSClientConfig) {
    this.credentials = new AWS.Credentials({
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    })

    AWS.config.update({
      credentials: this.credentials,
      region: config.region
    })

    this.cloudWatch = new AWS.CloudWatch()
    this.ec2 = new AWS.EC2()
    this.costExplorer = new AWS.CostExplorer()
    this.lambda = new AWS.Lambda()
    this.securityHub = new AWS.SecurityHub()
    this.cloudTrail = new AWS.CloudTrail()
  }

  async getInstanceMetrics(instanceId: string) {
    const metrics = await this.cloudWatch.getMetricStatistics({
      Namespace: 'AWS/EC2',
      MetricName: 'CPUUtilization',
      Dimensions: [{ Name: 'InstanceId', Value: instanceId }],
      StartTime: new Date(Date.now() - 3600000), // Last hour
      EndTime: new Date(),
      Period: 300, // 5 minutes
      Statistics: ['Average'],
    }).promise()

    return metrics.Datapoints || []
  }

  async getCostData(startDate: Date, endDate: Date) {
    const costData = await this.costExplorer.getCostAndUsage({
      TimePeriod: {
        Start: startDate.toISOString().split('T')[0],
        End: endDate.toISOString().split('T')[0],
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
      ],
    }).promise()

    return costData.ResultsByTime || []
  }

  async resizeInstance(instanceId: string, instanceType: string) {
    const result = await this.ec2.modifyInstanceAttribute({
      InstanceId: instanceId,
      InstanceType: { Value: instanceType },
    }).promise()

    return result
  }

  async getSpotInstanceRecommendations() {
    const spotPrices = await this.ec2.describeSpotPriceHistory({
      StartTime: new Date(),
      ProductDescriptions: ['Linux/UNIX'],
    }).promise()

    return spotPrices.SpotPriceHistory || []
  }

  async getServerlessMetrics(functionName: string) {
    const metrics = await this.cloudWatch.getMetricStatistics({
      Namespace: 'AWS/Lambda',
      MetricName: 'Invocations',
      Dimensions: [{ Name: 'FunctionName', Value: functionName }],
      StartTime: new Date(Date.now() - 3600000),
      EndTime: new Date(),
      Period: 300,
      Statistics: ['Sum'],
    }).promise()

    return metrics.Datapoints || []
  }

  async getSecurityFindings() {
    const findings = await this.securityHub.getFindings({
      MaxResults: 100,
    }).promise()

    return findings.Findings || []
  }

  async getCarbonFootprint() {
    // AWS Carbon Footprint Tool API call would go here
    // This is a placeholder as the actual API is not publicly available
    return {
      emissions: 0,
      timestamp: new Date(),
    }
  }

  async getOptimizationMetrics() {
    try {
      // Fetch cost data from Cost Explorer
      const costData = await this.costExplorer.getCostAndUsage({
        TimePeriod: {
          Start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          End: new Date().toISOString().split('T')[0],
        },
        Granularity: 'DAILY',
        Metrics: ['BlendedCost', 'UsageQuantity'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
      }).promise();

      // Calculate total cost
      const totalCost = costData.ResultsByTime?.reduce((acc, time) => {
        return acc + Number(time.Total?.BlendedCost?.Amount || 0);
      }, 0) || 0;

      // Fetch performance metrics from CloudWatch
      const performanceMetrics = await this.cloudWatch.getMetricStatistics({
        Namespace: 'AWS/EC2',
        MetricName: 'CPUUtilization',
        StartTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        EndTime: new Date(),
        Period: 86400, // 1 day
        Statistics: ['Average'],
      }).promise();

      // Calculate average performance
      const averagePerformance = performanceMetrics.Datapoints?.reduce((acc, point) => {
        return acc + (point.Average || 0);
      }, 0) / (performanceMetrics.Datapoints?.length || 1) || 0;

      // Calculate carbon emissions (simplified)
      const carbonEmissions = totalCost * 0.5; // 0.5 kg CO2 per dollar (example)

      return {
        cost: totalCost,
        performance: averagePerformance,
        carbon: carbonEmissions,
      };
    } catch (error) {
      console.error('Error fetching AWS optimization metrics:', error);
      throw error;
    }
  }

  async getOptimizationRecommendations() {
    try {
      // Fetch EC2 instances
      const instances = await this.ec2.describeInstances().promise();

      const recommendations = [];

      // Analyze each instance
      for (const reservation of instances.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          // Check if instance is underutilized
          const metrics = await this.cloudWatch.getMetricStatistics({
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Dimensions: [
              {
                Name: 'InstanceId',
                Value: instance.InstanceId!,
              },
            ],
            StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            EndTime: new Date(),
            Period: 3600, // 1 hour
            Statistics: ['Average'],
          }).promise();

          const averageUtilization = metrics.Datapoints?.reduce((acc, point) => {
            return acc + (point.Average || 0);
          }, 0) / (metrics.Datapoints?.length || 1) || 0;

          if (averageUtilization < 30) {
            recommendations.push({
              id: `aws-${instance.InstanceId}`,
              title: 'Right-size EC2 Instance',
              description: `Instance ${instance.InstanceId} is underutilized (${averageUtilization.toFixed(1)}% CPU utilization)`,
              impact: {
                cost: 100, // Example savings
                performance: 0,
                carbon: 20, // Example carbon reduction
              },
              confidence: 99.5,
              status: 'pending',
              explanation: `Right-sizing this instance could save $100/month and reduce carbon emissions by 20kg CO2.`,
            });
          }
        }
      }

      return recommendations;
    } catch (error) {
      console.error('Error fetching AWS optimization recommendations:', error);
      throw error;
    }
  }

  async applyOptimization(recommendation: any) {
    try {
      // Extract instance ID from recommendation ID
      const instanceId = recommendation.id.replace('aws-', '');

      // Stop the instance
      await this.ec2.stopInstances({
        InstanceIds: [instanceId],
      }).promise();

      // Wait for instance to stop
      await this.ec2.waitFor('instanceStopped', {
        InstanceIds: [instanceId],
      }).promise();

      // Modify instance type
      await this.ec2.modifyInstanceAttribute({
        InstanceId: instanceId,
        InstanceType: {
          Value: 't3.small', // Example: downgrade to a smaller instance type
        },
      }).promise();

      // Start the instance
      await this.ec2.startInstances({
        InstanceIds: [instanceId],
      }).promise();

      return {
        message: 'Instance right-sized successfully',
      };
    } catch (error) {
      console.error('Error applying AWS optimization:', error);
      throw error;
    }
  }

  async getHealthMetrics(): Promise<HealthMetric[]> {
    try {
      const metrics: HealthMetric[] = [];

      // Get EC2 instance metrics
      const instances = await this.ec2.describeInstances().promise();
      for (const reservation of instances.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const cpuMetrics = await this.cloudWatch.getMetricStatistics({
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Dimensions: [{ Name: 'InstanceId', Value: instance.InstanceId! }],
            StartTime: new Date(Date.now() - 3600000),
            EndTime: new Date(),
            Period: 300,
            Statistics: ['Average'],
          }).promise();

          const avgCpu = cpuMetrics.Datapoints?.reduce((acc, point) => acc + (point.Average || 0), 0) / (cpuMetrics.Datapoints?.length || 1) || 0;

          metrics.push({
            resourceId: instance.InstanceId!,
            metricType: 'CPUUtilization',
            value: avgCpu,
            threshold: 80,
            status: avgCpu > 80 ? 'critical' : avgCpu > 60 ? 'warning' : 'healthy',
          });
        }
      }

      // Get EBS volume metrics
      const volumes = await this.ec2.describeVolumes().promise();
      for (const volume of volumes.Volumes || []) {
        const volumeMetrics = await this.cloudWatch.getMetricStatistics({
          Namespace: 'AWS/EBS',
          MetricName: 'VolumeQueueLength',
          Dimensions: [{ Name: 'VolumeId', Value: volume.VolumeId! }],
          StartTime: new Date(Date.now() - 3600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Average'],
        }).promise();

        const avgQueueLength = volumeMetrics.Datapoints?.reduce((acc, point) => acc + (point.Average || 0), 0) / (volumeMetrics.Datapoints?.length || 1) || 0;

        metrics.push({
          resourceId: volume.VolumeId!,
          metricType: 'VolumeQueueLength',
          value: avgQueueLength,
          threshold: 10,
          status: avgQueueLength > 10 ? 'critical' : avgQueueLength > 5 ? 'warning' : 'healthy',
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching AWS health metrics:', error);
      return [];
    }
  }

  async getMaintenancePredictions(): Promise<MaintenancePrediction[]> {
    try {
      const predictions: MaintenancePrediction[] = [];

      // Get EC2 instance predictions
      const instances = await this.ec2.describeInstances().promise();
      for (const reservation of instances.Reservations || []) {
        for (const instance of reservation.Instances || []) {
          const metrics = await this.cloudWatch.getMetricStatistics({
            Namespace: 'AWS/EC2',
            MetricName: 'CPUUtilization',
            Dimensions: [{ Name: 'InstanceId', Value: instance.InstanceId! }],
            StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            EndTime: new Date(),
            Period: 3600,
            Statistics: ['Average'],
          }).promise();

          const avgCpu = metrics.Datapoints?.reduce((acc, point) => acc + (point.Average || 0), 0) / (metrics.Datapoints?.length || 1) || 0;
          const trend = this.calculateTrend(metrics.Datapoints || []);

          if (trend > 0.1) { // Increasing trend
            predictions.push({
              resourceId: instance.InstanceId!,
              resourceType: 'EC2',
              prediction: {
                riskScore: Math.min(100, avgCpu + trend * 100),
                estimatedFailureTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                factors: ['High CPU utilization', 'Increasing trend'],
              },
              status: 'active',
              severity: avgCpu > 80 ? 'critical' : 'warning',
              confidence: 0.98,
              estimatedImpact: {
                cost: 1000,
                downtime: 2,
              },
              preventiveActions: [
                {
                  type: 'resize',
                  description: 'Resize instance to handle increased load',
                  estimatedTime: '30 minutes',
                  cost: 50,
                },
                {
                  type: 'migrate',
                  description: 'Migrate workload to a larger instance type',
                  estimatedTime: '1 hour',
                  cost: 100,
                },
              ],
            });
          }
        }
      }

      // Get EBS volume predictions
      const volumes = await this.ec2.describeVolumes().promise();
      for (const volume of volumes.Volumes || []) {
        const metrics = await this.cloudWatch.getMetricStatistics({
          Namespace: 'AWS/EBS',
          MetricName: 'VolumeQueueLength',
          Dimensions: [{ Name: 'VolumeId', Value: volume.VolumeId! }],
          StartTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          EndTime: new Date(),
          Period: 3600,
          Statistics: ['Average'],
        }).promise();

        const avgQueueLength = metrics.Datapoints?.reduce((acc, point) => acc + (point.Average || 0), 0) / (metrics.Datapoints?.length || 1) || 0;
        const trend = this.calculateTrend(metrics.Datapoints || []);

        if (avgQueueLength > 5 && trend > 0.05) {
          predictions.push({
            resourceId: volume.VolumeId!,
            resourceType: 'EBS',
            prediction: {
              riskScore: Math.min(100, avgQueueLength * 10 + trend * 100),
              estimatedFailureTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
              factors: ['High queue length', 'Increasing trend'],
            },
            status: 'active',
            severity: avgQueueLength > 10 ? 'critical' : 'warning',
            confidence: 0.95,
            estimatedImpact: {
              cost: 2000,
              downtime: 4,
            },
            preventiveActions: [
              {
                type: 'resize',
                description: 'Increase volume size and IOPS',
                estimatedTime: '1 hour',
                cost: 100,
              },
              {
                type: 'migrate',
                description: 'Migrate to a higher performance volume type',
                estimatedTime: '2 hours',
                cost: 200,
              },
            ],
          });
        }
      }

      return predictions;
    } catch (error) {
      console.error('Error fetching AWS maintenance predictions:', error);
      return [];
    }
  }

  async executeMaintenanceAction(resourceId: string, action: any): Promise<any> {
    try {
      switch (action.type) {
        case 'resize':
          if (resourceId.startsWith('i-')) {
            // EC2 instance resize
            await this.ec2.modifyInstanceAttribute({
              InstanceId: resourceId,
              InstanceType: { Value: action.newType },
            }).promise();
          } else if (resourceId.startsWith('vol-')) {
            // EBS volume resize
            await this.ec2.modifyVolume({
              VolumeId: resourceId,
              Size: action.newSize,
              Iops: action.newIops,
            }).promise();
          }
          break;

        case 'migrate':
          if (resourceId.startsWith('i-')) {
            // EC2 instance migration
            const instance = await this.ec2.describeInstances({
              InstanceIds: [resourceId],
            }).promise();

            const newInstance = await this.ec2.runInstances({
              ImageId: instance.Reservations?.[0].Instances?.[0].ImageId!,
              InstanceType: action.newType,
              MinCount: 1,
              MaxCount: 1,
            }).promise();

            // Wait for new instance to be running
            await this.ec2.waitFor('instanceRunning', {
              InstanceIds: [newInstance.Instances?.[0].InstanceId!],
            }).promise();

            // Stop old instance
            await this.ec2.stopInstances({
              InstanceIds: [resourceId],
            }).promise();
          }
          break;

        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error executing AWS maintenance action:', error);
      throw error;
    }
  }

  private calculateTrend(datapoints: any[]): number {
    if (datapoints.length < 2) return 0;

    const values = datapoints.map(point => point.Average || 0);
    const timestamps = datapoints.map(point => point.Timestamp.getTime());

    const n = values.length;
    const sumX = timestamps.reduce((acc, x) => acc + x, 0);
    const sumY = values.reduce((acc, y) => acc + y, 0);
    const sumXY = timestamps.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumX2 = timestamps.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
} 