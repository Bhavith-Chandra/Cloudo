import { v1 } from '@google-cloud/container';
import Compute from '@google-cloud/compute';
import { MetricServiceClient, protos } from '@google-cloud/monitoring';
import { CloudBillingClient } from '@google-cloud/billing';
import { prisma } from '@/lib/db';

interface GCPClientConfig {
  projectId: string;
  credentials: {
    client_email: string;
    private_key: string;
  };
}

interface GKEPod {
  name: string;
  namespace: string;
  status: string;
  nodeName: string;
  startTime: string;
}

interface TimeSeriesPoint {
  value: {
    doubleValue?: number;
  };
  interval: {
    endTime: {
      seconds: number;
    };
  };
}

interface TimeSeriesResponse {
  timeSeries: protos.google.monitoring.v3.ITimeSeries[];
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

export class GCPClient {
  private projectId: string;
  private client: v1.ClusterManagerClient;
  private compute: Compute;
  private monitoring: MetricServiceClient;
  private billing: CloudBillingClient;

  constructor(config: GCPClientConfig) {
    this.projectId = config.projectId;
    this.client = new v1.ClusterManagerClient({
      credentials: config.credentials,
      projectId: config.projectId,
    });
    this.compute = new Compute({
      credentials: config.credentials,
      projectId: config.projectId,
    });
    this.monitoring = new MetricServiceClient({
      credentials: config.credentials,
      projectId: config.projectId,
    });
    this.billing = new CloudBillingClient({
      credentials: config.credentials,
      projectId: config.projectId,
    });
  }

  async getGKEPods(clusterId: string, location: string): Promise<GKEPod[]> {
    try {
      const [response] = await this.client.listPods({
        parent: `projects/${this.projectId}/locations/${location}/clusters/${clusterId}`,
      });
      return response.pods.map((pod: any) => ({
        name: pod.name,
        namespace: pod.namespace,
        status: pod.status,
        nodeName: pod.nodeName,
        startTime: pod.startTime,
      }));
    } catch (error) {
      console.error('Error fetching GKE pods:', error);
      return [];
    }
  }

  async getGKEClusters(location: string): Promise<any[]> {
    try {
      const [response] = await this.client.listClusters({
        parent: `projects/${this.projectId}/locations/${location}`,
      });
      return response.clusters || [];
    } catch (error) {
      console.error('Error fetching GKE clusters:', error);
      return [];
    }
  }

  async getOptimizationMetrics(): Promise<{
    cost: number;
    performance: number;
    utilization: number;
  }> {
    try {
      // Get cost data
      const [costResponse] = await this.billing.getBillingAccount({
        name: `projects/${this.projectId}/billingAccounts/${this.projectId}`,
      });
      const cost = costResponse.displayName ? 1000 : 0; // Mock cost for now

      // Get performance metrics
      const [performanceResponse] = await this.monitoring.listTimeSeries({
        name: `projects/${this.projectId}`,
        filter: 'metric.type="compute.googleapis.com/instance/cpu/utilization"',
        interval: {
          startTime: {
            seconds: Date.now() / 1000 - 3600,
          },
          endTime: {
            seconds: Date.now() / 1000,
          },
        },
      });

      const performance = performanceResponse.reduce((acc: number, series: any) => {
        const avg = series.points.reduce((sum: number, point: any) => sum + point.value.doubleValue, 0) / series.points.length;
        return acc + avg;
      }, 0) / (performanceResponse.length || 1);

      // Get utilization metrics
      const [utilizationResponse] = await this.monitoring.listTimeSeries({
        name: `projects/${this.projectId}`,
        filter: 'metric.type="compute.googleapis.com/instance/memory/utilization"',
        interval: {
          startTime: {
            seconds: Date.now() / 1000 - 3600,
          },
          endTime: {
            seconds: Date.now() / 1000,
          },
        },
      });

      const utilization = utilizationResponse.reduce((acc: number, series: any) => {
        const avg = series.points.reduce((sum: number, point: any) => sum + point.value.doubleValue, 0) / series.points.length;
        return acc + avg;
      }, 0) / (utilizationResponse.length || 1);

      return {
        cost,
        performance,
        utilization,
      };
    } catch (error) {
      console.error('Error fetching optimization metrics:', error);
      return {
        cost: 0,
        performance: 0,
        utilization: 0,
      };
    }
  }

  async getOptimizationRecommendations(): Promise<{
    recommendations: Array<{
      type: string;
      description: string;
      impact: string;
      resource: string;
    }>;
  }> {
    try {
      // Get Compute Engine instances
      const [instances] = await this.compute.instances.list({
        project: this.projectId,
        zone: 'us-central1-a', // Default zone
      });

      const recommendations = [];

      // Analyze instances for optimization opportunities
      for (const instance of instances) {
        if (instance.machineType && instance.machineType.includes('n1-standard')) {
          recommendations.push({
            type: 'instance_type',
            description: `Consider upgrading ${instance.name} to a newer machine type for better performance`,
            impact: 'High',
            resource: instance.name || '',
          });
        }

        if (instance.status === 'TERMINATED') {
          recommendations.push({
            type: 'instance_state',
            description: `Instance ${instance.name} is terminated but still incurring costs`,
            impact: 'Medium',
            resource: instance.name || '',
          });
        }
      }

      return { recommendations };
    } catch (error) {
      console.error('Error fetching optimization recommendations:', error);
      return { recommendations: [] };
    }
  }

  async applyOptimization(recommendation: any) {
    try {
      // Extract instance ID from recommendation ID
      const instanceId = recommendation.id.replace('gcp-', '');

      // Stop the instance
      await this.compute.instances.stop({
        project: this.projectId,
        zone: 'us-central1-a', // Example zone
        instance: instanceId,
      });

      // Wait for instance to stop
      await this.compute.instances.get({
        project: this.projectId,
        zone: 'us-central1-a', // Example zone
        instance: instanceId,
      });

      // Resize the instance
      await this.compute.instances.setMachineType({
        project: this.projectId,
        zone: 'us-central1-a', // Example zone
        instance: instanceId,
        requestBody: {
          machineType: `zones/us-central1-a/machineTypes/e2-small`, // Example: downgrade to a smaller machine type
        },
      });

      // Start the instance
      await this.compute.instances.start({
        project: this.projectId,
        zone: 'us-central1-a', // Example zone
        instance: instanceId,
      });

      return {
        message: 'Instance right-sized successfully',
      };
    } catch (error) {
      console.error('Error applying GCP optimization:', error);
      throw error;
    }
  }

  async getHealthMetrics(): Promise<HealthMetric[]> {
    try {
      const metrics: HealthMetric[] = [];

      // Get VM metrics
      const [vms] = await this.compute.instances.list({
        project: this.projectId,
        zone: 'us-central1-a',
      });

      for (const vm of vms || []) {
        const [cpuMetrics] = await this.monitoring.listTimeSeries({
          name: `projects/${this.projectId}`,
          filter: `metric.type="compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id="${vm.id}"`,
          interval: {
            startTime: {
              seconds: Math.floor(Date.now() / 1000) - 3600,
            },
            endTime: {
              seconds: Math.floor(Date.now() / 1000),
            },
          },
          aggregation: {
            alignmentPeriod: {
              seconds: 300,
            },
            perSeriesAligner: 'ALIGN_MEAN',
          },
        });

        const timeSeries = cpuMetrics?.[0] || [];
        const avgCpu = timeSeries.points?.reduce(
          (acc: number, point: TimeSeriesPoint) => acc + (point.value?.doubleValue || 0),
          0
        ) / (timeSeries.points?.length || 1) || 0;

        metrics.push({
          resourceId: vm.id!,
          metricType: 'CPUUtilization',
          value: avgCpu * 100,
          threshold: 80,
          status: avgCpu > 0.8 ? 'critical' : avgCpu > 0.6 ? 'warning' : 'healthy',
        });
      }

      // Get disk metrics
      const [disks] = await this.compute.disks.list({
        project: this.projectId,
        zone: 'us-central1-a',
      });

      for (const disk of disks || []) {
        const [diskMetrics] = await this.monitoring.listTimeSeries({
          name: `projects/${this.projectId}`,
          filter: `metric.type="compute.googleapis.com/instance/disk/read_bytes_count" AND resource.labels.disk_name="${disk.name}"`,
          interval: {
            startTime: {
              seconds: Math.floor(Date.now() / 1000) - 3600,
            },
            endTime: {
              seconds: Math.floor(Date.now() / 1000),
            },
          },
          aggregation: {
            alignmentPeriod: {
              seconds: 300,
            },
            perSeriesAligner: 'ALIGN_RATE',
          },
        });

        const timeSeries = diskMetrics?.[0] || [];
        const avgReadRate = timeSeries.points?.reduce(
          (acc: number, point: TimeSeriesPoint) => acc + (point.value?.doubleValue || 0),
          0
        ) / (timeSeries.points?.length || 1) || 0;

        metrics.push({
          resourceId: disk.id!,
          metricType: 'DiskReadRate',
          value: avgReadRate,
          threshold: 1000000, // 1 MB/s
          status: avgReadRate > 1000000 ? 'critical' : avgReadRate > 500000 ? 'warning' : 'healthy',
        });
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching GCP health metrics:', error);
      return [];
    }
  }

  async getMaintenancePredictions(): Promise<MaintenancePrediction[]> {
    try {
      const predictions: MaintenancePrediction[] = [];

      // Get VM predictions
      const [vms] = await this.compute.instances.list({
        project: this.projectId,
        zone: 'us-central1-a',
      });

      for (const vm of vms || []) {
        const [metrics] = await this.monitoring.listTimeSeries({
          name: `projects/${this.projectId}`,
          filter: `metric.type="compute.googleapis.com/instance/cpu/utilization" AND resource.labels.instance_id="${vm.id}"`,
          interval: {
            startTime: {
              seconds: Math.floor(Date.now() / 1000) - 7 * 24 * 3600,
            },
            endTime: {
              seconds: Math.floor(Date.now() / 1000),
            },
          },
          aggregation: {
            alignmentPeriod: {
              seconds: 3600,
            },
            perSeriesAligner: 'ALIGN_MEAN',
          },
        });

        const timeSeries = metrics?.[0] || [];
        const data = timeSeries.points || [];
        const avgCpu = data.reduce(
          (acc: number, point: TimeSeriesPoint) => acc + (point.value?.doubleValue || 0),
          0
        ) / data.length || 0;
        const trend = this.calculateTrend(data);

        if (trend > 0.1) {
          predictions.push({
            resourceId: vm.id!,
            resourceType: 'Instance',
            prediction: {
              riskScore: Math.min(100, avgCpu * 100 + trend * 100),
              estimatedFailureTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              factors: ['High CPU utilization', 'Increasing trend'],
            },
            status: 'active',
            severity: avgCpu > 0.8 ? 'critical' : 'warning',
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

      // Get disk predictions
      const [disks] = await this.compute.disks.list({
        project: this.projectId,
        zone: 'us-central1-a',
      });

      for (const disk of disks || []) {
        const [metrics] = await this.monitoring.listTimeSeries({
          name: `projects/${this.projectId}`,
          filter: `metric.type="compute.googleapis.com/instance/disk/read_bytes_count" AND resource.labels.disk_name="${disk.name}"`,
          interval: {
            startTime: {
              seconds: Math.floor(Date.now() / 1000) - 7 * 24 * 3600,
            },
            endTime: {
              seconds: Math.floor(Date.now() / 1000),
            },
          },
          aggregation: {
            alignmentPeriod: {
              seconds: 3600,
            },
            perSeriesAligner: 'ALIGN_RATE',
          },
        });

        const timeSeries = metrics?.[0] || [];
        const data = timeSeries.points || [];
        const avgReadRate = data.reduce(
          (acc: number, point: TimeSeriesPoint) => acc + (point.value?.doubleValue || 0),
          0
        ) / data.length || 0;
        const trend = this.calculateTrend(data);

        if (avgReadRate > 500000 && trend > 0.05) {
          predictions.push({
            resourceId: disk.id!,
            resourceType: 'Disk',
            prediction: {
              riskScore: Math.min(100, avgReadRate / 10000 + trend * 100),
              estimatedFailureTime: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
              factors: ['High read rate', 'Increasing trend'],
            },
            status: 'active',
            severity: avgReadRate > 1000000 ? 'critical' : 'warning',
            confidence: 0.95,
            estimatedImpact: {
              cost: 2000,
              downtime: 4,
            },
            preventiveActions: [
              {
                type: 'resize',
                description: 'Increase disk size and IOPS',
                estimatedTime: '1 hour',
                cost: 100,
              },
              {
                type: 'migrate',
                description: 'Migrate to a higher performance disk type',
                estimatedTime: '2 hours',
                cost: 200,
              },
            ],
          });
        }
      }

      return predictions;
    } catch (error) {
      console.error('Error fetching GCP maintenance predictions:', error);
      return [];
    }
  }

  async executeMaintenanceAction(resourceId: string, action: any): Promise<any> {
    try {
      switch (action.type) {
        case 'resize':
          if (resourceId.includes('/instances/')) {
            // Instance resize
            const [instance] = await this.compute.instances.get({
              project: this.projectId,
              zone: 'us-central1-a',
              instance: resourceId.split('/instances/')[1],
            });

            await this.compute.instances.setMachineType({
              project: this.projectId,
              zone: 'us-central1-a',
              instance: resourceId.split('/instances/')[1],
              requestBody: {
                machineType: `zones/us-central1-a/machineTypes/${action.newType}`,
              },
            });
          } else if (resourceId.includes('/disks/')) {
            // Disk resize
            const [disk] = await this.compute.disks.get({
              project: this.projectId,
              zone: 'us-central1-a',
              disk: resourceId.split('/disks/')[1],
            });

            await this.compute.disks.resize({
              project: this.projectId,
              zone: 'us-central1-a',
              disk: resourceId.split('/disks/')[1],
              requestBody: {
                sizeGb: action.newSize,
              },
            });
          }
          break;

        case 'migrate':
          if (resourceId.includes('/instances/')) {
            // Instance migration
            const [instance] = await this.compute.instances.get({
              project: this.projectId,
              zone: 'us-central1-a',
              instance: resourceId.split('/instances/')[1],
            });

            // Create new instance
            await this.compute.instances.insert({
              project: this.projectId,
              zone: 'us-central1-a',
              requestBody: {
                ...instance,
                name: `${instance.name}-migrated`,
                machineType: `zones/us-central1-a/machineTypes/${action.newType}`,
              },
            });

            // Stop old instance
            await this.compute.instances.stop({
              project: this.projectId,
              zone: 'us-central1-a',
              instance: resourceId.split('/instances/')[1],
            });
          }
          break;

        default:
          throw new Error(`Unsupported action type: ${action.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Error executing GCP maintenance action:', error);
      throw error;
    }
  }

  private calculateTrend(data: TimeSeriesPoint[]): number {
    if (data.length < 2) return 0;

    const values = data.map(point => point.value?.doubleValue || 0);
    const timestamps = data.map(point => new Date(point.interval.endTime.seconds * 1000).getTime());

    const n = values.length;
    const sumX = timestamps.reduce((acc, x) => acc + x, 0);
    const sumY = values.reduce((acc, y) => acc + y, 0);
    const sumXY = timestamps.reduce((acc, x, i) => acc + x * values[i], 0);
    const sumX2 = timestamps.reduce((acc, x) => acc + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return slope;
  }
} 
} 