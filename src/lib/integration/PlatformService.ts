import { prisma } from '@/lib/db'
import { WorkflowExecutor } from '@/lib/workflow/WorkflowExecutor'
import { MonitoringService } from '@/lib/monitoring/MonitoringService'
import { AWSClient } from '@/lib/cloud/aws'
import { AzureClient } from '@/lib/cloud/azure'
import { GCPClient } from '@/lib/cloud/gcp'
import { sendSlackNotification } from '@/lib/notifications/slack'
import { sendEmailNotification } from '@/lib/notifications/email'

export class PlatformService {
  private workflowExecutor: WorkflowExecutor
  private monitoringService: MonitoringService
  private awsClient: AWSClient
  private azureClient: AzureClient
  private gcpClient: GCPClient

  constructor() {
    this.workflowExecutor = new WorkflowExecutor()
    this.monitoringService = new MonitoringService()
    this.awsClient = new AWSClient()
    this.azureClient = new AzureClient()
    this.gcpClient = new GCPClient()
  }

  async initializePlatform(userId: string) {
    try {
      // Start monitoring services
      await this.monitoringService.startMonitoring()

      // Initialize cloud connections
      await this.initializeCloudConnections(userId)

      // Set up default workflows
      await this.setupDefaultWorkflows(userId)

      // Configure default alert settings
      await this.configureDefaultAlerts(userId)

      return { success: true }
    } catch (error) {
      console.error('Failed to initialize platform:', error)
      throw error
    }
  }

  private async initializeCloudConnections(userId: string) {
    const cloudAccounts = await prisma.cloudAccount.findMany({
      where: { userId },
    })

    for (const account of cloudAccounts) {
      switch (account.provider) {
        case 'aws':
          await this.awsClient.initialize(account.credentials)
          break
        case 'azure':
          await this.azureClient.initialize(account.credentials)
          break
        case 'gcp':
          await this.gcpClient.initialize(account.credentials)
          break
      }
    }
  }

  private async setupDefaultWorkflows(userId: string) {
    const defaultWorkflows = [
      {
        name: 'Cost Optimization',
        type: 'optimization',
        schedule: '0 0 * * *', // Daily at midnight
        actions: [
          {
            type: 'resize',
            provider: 'aws',
            parameters: { threshold: 0.7 },
          },
          {
            type: 'commitment',
            provider: 'aws',
            parameters: { savingsThreshold: 0.2 },
          },
        ],
      },
      {
        name: 'Security Compliance',
        type: 'security',
        schedule: '0 */6 * * *', // Every 6 hours
        actions: [
          {
            type: 'security',
            provider: 'aws',
            parameters: { checkType: 'all' },
          },
        ],
      },
    ]

    for (const workflow of defaultWorkflows) {
      await prisma.workflow.create({
        data: {
          ...workflow,
          userId,
          status: 'active',
          actions: {
            create: workflow.actions.map(action => ({
              ...action,
              status: 'pending',
            })),
          },
        },
      })
    }
  }

  private async configureDefaultAlerts(userId: string) {
    const defaultAlerts = [
      {
        metric: 'cost',
        threshold: 1000,
        operator: '>',
        severity: 'high',
      },
      {
        metric: 'cpu_utilization',
        threshold: 80,
        operator: '>',
        severity: 'medium',
      },
    ]

    await prisma.alertSettings.create({
      data: {
        userId,
        channels: {
          slack: true,
          email: true,
        },
        thresholds: defaultAlerts,
        preferences: {
          notifyOnCritical: true,
          notifyOnHigh: true,
          notifyOnMedium: true,
          notifyOnLow: false,
        },
      },
    })
  }

  async getPlatformMetrics(userId: string) {
    const [
      costData,
      resourceUtilization,
      anomalies,
      recommendations,
      commitments,
      spotInstances,
      serverlessMetrics,
      carbonFootprint,
    ] = await Promise.all([
      prisma.costData.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.resourceUtilization.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
      prisma.anomaly.findMany({
        where: { userId, status: 'active' },
        orderBy: { timestamp: 'desc' },
        take: 10,
      }),
      prisma.resourceRecommendation.findMany({
        where: { userId, status: 'pending' },
        orderBy: { estimatedSavings: 'desc' },
        take: 10,
      }),
      prisma.commitment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.spotInstance.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: 10,
      }),
      prisma.serverlessFunction.findMany({
        where: { userId },
        include: { metrics: { orderBy: { timestamp: 'desc' }, take: 1 } },
        take: 10,
      }),
      prisma.carbonFootprint.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 30,
      }),
    ])

    return {
      costData,
      resourceUtilization,
      anomalies,
      recommendations,
      commitments,
      spotInstances,
      serverlessMetrics,
      carbonFootprint,
    }
  }

  async executeWorkflow(workflowId: string) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { actions: true },
    })

    if (!workflow) {
      throw new Error('Workflow not found')
    }

    const results = []
    for (const action of workflow.actions) {
      try {
        const result = await this.workflowExecutor.executeAction(action)
        results.push({ actionId: action.id, success: true, result })
      } catch (error) {
        results.push({ actionId: action.id, success: false, error })
      }
    }

    return results
  }

  async generateFinOpsReport(userId: string, period: string) {
    const now = new Date()
    let startDate: Date
    let endDate = now

    switch (period) {
      case 'monthly':
        startDate = new Date(now.setMonth(now.getMonth() - 1))
        break
      case 'quarterly':
        startDate = new Date(now.setMonth(now.getMonth() - 3))
        break
      case 'yearly':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        throw new Error('Invalid period')
    }

    const [
      costData,
      savings,
      recommendations,
    ] = await Promise.all([
      prisma.costData.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.resourceRecommendation.findMany({
        where: {
          userId,
          status: 'applied',
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.resourceRecommendation.findMany({
        where: {
          userId,
          status: 'pending',
        },
      }),
    ])

    const totalCost = costData.reduce((sum, data) => sum + data.cost, 0)
    const totalSavings = savings.reduce((sum, rec) => sum + rec.estimatedSavings, 0)

    const report = await prisma.finOpsReport.create({
      data: {
        userId,
        period,
        startDate,
        endDate,
        totalCost,
        savings: totalSavings,
        recommendations: recommendations.map(rec => ({
          id: rec.id,
          type: rec.type,
          estimatedSavings: rec.estimatedSavings,
          impact: rec.impact,
        })),
        status: 'completed',
      },
    })

    // Send notification
    const message = `📊 FinOps Report Generated:
      Period: ${period}
      Total Cost: $${totalCost.toFixed(2)}
      Total Savings: $${totalSavings.toFixed(2)}
      Recommendations: ${recommendations.length}`

    await Promise.all([
      sendSlackNotification(message),
      sendEmailNotification({
        subject: `FinOps Report - ${period}`,
        body: message,
      }),
    ])

    return report
  }
} 