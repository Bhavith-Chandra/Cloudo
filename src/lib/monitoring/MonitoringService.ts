import { prisma } from '@/lib/db'
import { AWSClient } from '@/lib/cloud/aws'
import { AzureClient } from '@/lib/cloud/azure'
import { GCPClient } from '@/lib/cloud/gcp'
import { sendSlackNotification } from '@/lib/notifications/slack'
import { sendEmailNotification } from '@/lib/notifications/email'

interface MetricThreshold {
  metric: string
  threshold: number
  operator: '>' | '<' | '>=' | '<=' | '=='
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export class MonitoringService {
  private awsClient: AWSClient
  private azureClient: AzureClient
  private gcpClient: GCPClient
  private thresholds: MetricThreshold[] = []

  constructor() {
    this.awsClient = new AWSClient()
    this.azureClient = new AzureClient()
    this.gcpClient = new GCPClient()
    this.loadThresholds()
  }

  async startMonitoring() {
    // Start monitoring loops for each provider
    setInterval(() => this.monitorAWS(), 5 * 60 * 1000) // Every 5 minutes
    setInterval(() => this.monitorAzure(), 5 * 60 * 1000)
    setInterval(() => this.monitorGCP(), 5 * 60 * 1000)
  }

  private async loadThresholds() {
    this.thresholds = await prisma.metricThreshold.findMany()
  }

  private async monitorAWS() {
    try {
      const metrics = await this.awsClient.getMetrics()
      await this.checkThresholds('aws', metrics)
      await this.storeMetrics('aws', metrics)
    } catch (error) {
      console.error('AWS monitoring error:', error)
      await this.sendMonitoringError('aws', error)
    }
  }

  private async monitorAzure() {
    try {
      const metrics = await this.azureClient.getMetrics()
      await this.checkThresholds('azure', metrics)
      await this.storeMetrics('azure', metrics)
    } catch (error) {
      console.error('Azure monitoring error:', error)
      await this.sendMonitoringError('azure', error)
    }
  }

  private async monitorGCP() {
    try {
      const metrics = await this.gcpClient.getMetrics()
      await this.checkThresholds('gcp', metrics)
      await this.storeMetrics('gcp', metrics)
    } catch (error) {
      console.error('GCP monitoring error:', error)
      await this.sendMonitoringError('gcp', error)
    }
  }

  private async checkThresholds(provider: string, metrics: Record<string, number>) {
    for (const threshold of this.thresholds) {
      const value = metrics[threshold.metric]
      if (value === undefined) continue

      let triggered = false
      switch (threshold.operator) {
        case '>':
          triggered = value > threshold.threshold
          break
        case '<':
          triggered = value < threshold.threshold
          break
        case '>=':
          triggered = value >= threshold.threshold
          break
        case '<=':
          triggered = value <= threshold.threshold
          break
        case '==':
          triggered = value === threshold.threshold
          break
      }

      if (triggered) {
        await this.handleThresholdBreach(provider, threshold, value)
      }
    }
  }

  private async handleThresholdBreach(
    provider: string,
    threshold: MetricThreshold,
    value: number
  ) {
    const alert = {
      provider,
      metric: threshold.metric,
      value,
      threshold: threshold.threshold,
      operator: threshold.operator,
      severity: threshold.severity,
      timestamp: new Date(),
    }

    // Store the alert
    await prisma.alert.create({
      data: alert,
    })

    // Send notifications based on severity
    const message = `🚨 ${threshold.severity.toUpperCase()} ALERT:
      Provider: ${provider}
      Metric: ${threshold.metric}
      Value: ${value}
      Threshold: ${threshold.operator} ${threshold.threshold}`

    if (threshold.severity === 'critical' || threshold.severity === 'high') {
      await Promise.all([
        sendSlackNotification(message),
        sendEmailNotification({
          subject: `[${threshold.severity.toUpperCase()}] ${provider} Metric Alert`,
          body: message,
        }),
      ])
    } else {
      await sendSlackNotification(message)
    }
  }

  private async storeMetrics(provider: string, metrics: Record<string, number>) {
    await prisma.metric.createMany({
      data: Object.entries(metrics).map(([metric, value]) => ({
        provider,
        metric,
        value,
        timestamp: new Date(),
      })),
    })
  }

  private async sendMonitoringError(provider: string, error: any) {
    const message = `❌ ${provider.toUpperCase()} Monitoring Error:
      ${error instanceof Error ? error.message : 'Unknown error'}`

    await Promise.all([
      sendSlackNotification(message),
      sendEmailNotification({
        subject: `${provider.toUpperCase()} Monitoring Error`,
        body: message,
      }),
    ])
  }

  async getMetrics(provider: string, metric: string, timeRange: string) {
    return prisma.metric.findMany({
      where: {
        provider,
        metric,
        timestamp: {
          gte: this.getTimeRangeStart(timeRange),
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })
  }

  private getTimeRangeStart(timeRange: string): Date {
    const now = new Date()
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000)
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
    }
  }
} 