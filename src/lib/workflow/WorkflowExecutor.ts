import { prisma } from '@/lib/db'
import { AWSClient } from '@/lib/cloud/aws'
import { AzureClient } from '@/lib/cloud/azure'
import { GCPClient } from '@/lib/cloud/gcp'
import { sendSlackNotification } from '@/lib/notifications/slack'
import { sendEmailNotification } from '@/lib/notifications/email'

export interface WorkflowAction {
  id: string
  type: 'resize' | 'commitment' | 'cleanup' | 'security'
  provider: 'aws' | 'azure' | 'gcp'
  resourceId: string
  parameters: Record<string, any>
  requiresApproval: boolean
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  error?: string
}

export class WorkflowExecutor {
  private awsClient: AWSClient
  private azureClient: AzureClient
  private gcpClient: GCPClient

  constructor() {
    this.awsClient = new AWSClient()
    this.azureClient = new AzureClient()
    this.gcpClient = new GCPClient()
  }

  async executeAction(action: WorkflowAction) {
    try {
      // Log the start of the action
      await prisma.workflowLog.create({
        data: {
          actionId: action.id,
          status: 'started',
          details: JSON.stringify(action),
        },
      })

      // Execute based on provider
      let result
      switch (action.provider) {
        case 'aws':
          result = await this.executeAWSAction(action)
          break
        case 'azure':
          result = await this.executeAzureAction(action)
          break
        case 'gcp':
          result = await this.executeGCPAction(action)
          break
        default:
          throw new Error(`Unsupported provider: ${action.provider}`)
      }

      // Log successful completion
      await prisma.workflowLog.create({
        data: {
          actionId: action.id,
          status: 'completed',
          details: JSON.stringify(result),
        },
      })

      // Send success notification
      await this.sendSuccessNotification(action, result)

      return result
    } catch (error) {
      // Log the error
      await prisma.workflowLog.create({
        data: {
          actionId: action.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          details: JSON.stringify(action),
        },
      })

      // Send failure notification
      await this.sendFailureNotification(action, error)

      // Attempt rollback if supported
      await this.rollbackAction(action)

      throw error
    }
  }

  private async executeAWSAction(action: WorkflowAction) {
    switch (action.type) {
      case 'resize':
        return this.awsClient.resizeInstance(
          action.resourceId,
          action.parameters
        )
      case 'commitment':
        return this.awsClient.adjustReservedInstances(
          action.resourceId,
          action.parameters
        )
      default:
        throw new Error(`Unsupported AWS action type: ${action.type}`)
    }
  }

  private async executeAzureAction(action: WorkflowAction) {
    switch (action.type) {
      case 'resize':
        return this.azureClient.resizeVM(
          action.resourceId,
          action.parameters
        )
      case 'commitment':
        return this.azureClient.adjustReservations(
          action.resourceId,
          action.parameters
        )
      default:
        throw new Error(`Unsupported Azure action type: ${action.type}`)
    }
  }

  private async executeGCPAction(action: WorkflowAction) {
    switch (action.type) {
      case 'resize':
        return this.gcpClient.resizeInstance(
          action.resourceId,
          action.parameters
        )
      case 'commitment':
        return this.gcpClient.adjustCommitments(
          action.resourceId,
          action.parameters
        )
      default:
        throw new Error(`Unsupported GCP action type: ${action.type}`)
    }
  }

  private async rollbackAction(action: WorkflowAction) {
    try {
      // Store original state before modification
      const originalState = await this.getResourceState(action)
      
      // Attempt to restore original state
      switch (action.provider) {
        case 'aws':
          await this.awsClient.restoreState(action.resourceId, originalState)
          break
        case 'azure':
          await this.azureClient.restoreState(action.resourceId, originalState)
          break
        case 'gcp':
          await this.gcpClient.restoreState(action.resourceId, originalState)
          break
      }

      // Log successful rollback
      await prisma.workflowLog.create({
        data: {
          actionId: action.id,
          status: 'rolled_back',
          details: JSON.stringify({ originalState }),
        },
      })
    } catch (rollbackError) {
      // Log rollback failure
      await prisma.workflowLog.create({
        data: {
          actionId: action.id,
          status: 'rollback_failed',
          error: rollbackError instanceof Error ? rollbackError.message : 'Unknown error',
        },
      })
    }
  }

  private async getResourceState(action: WorkflowAction) {
    switch (action.provider) {
      case 'aws':
        return this.awsClient.getResourceState(action.resourceId)
      case 'azure':
        return this.azureClient.getResourceState(action.resourceId)
      case 'gcp':
        return this.gcpClient.getResourceState(action.resourceId)
      default:
        throw new Error(`Unsupported provider: ${action.provider}`)
    }
  }

  private async sendSuccessNotification(action: WorkflowAction, result: any) {
    const message = `✅ Workflow action completed successfully:
      Action: ${action.type}
      Provider: ${action.provider}
      Resource: ${action.resourceId}
      Result: ${JSON.stringify(result)}`

    await Promise.all([
      sendSlackNotification(message),
      sendEmailNotification({
        subject: 'Workflow Action Completed',
        body: message,
      }),
    ])
  }

  private async sendFailureNotification(action: WorkflowAction, error: any) {
    const message = `❌ Workflow action failed:
      Action: ${action.type}
      Provider: ${action.provider}
      Resource: ${action.resourceId}
      Error: ${error instanceof Error ? error.message : 'Unknown error'}`

    await Promise.all([
      sendSlackNotification(message),
      sendEmailNotification({
        subject: 'Workflow Action Failed',
        body: message,
      }),
    ])
  }
} 