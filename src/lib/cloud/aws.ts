import * as AWS from 'aws-sdk'
import { prisma } from '@/lib/db'

interface AWSClientConfig {
  accessKeyId: string
  secretAccessKey: string
  region: string
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
} 