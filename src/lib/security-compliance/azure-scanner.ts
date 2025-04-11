import { AzureClient } from '@/lib/cloud/azure'
import { prisma } from '@/lib/db'

interface SecurityFinding {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'
  provider: {
    id: string
    name: string
  }
  resource: {
    id: string
    name: string
  }
  remediationSteps: string[]
}

export async function scanAzureResources(): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = []
  const azureClient = new AzureClient()

  try {
    // Check Storage Account public access
    const storageAccounts = await azureClient.listStorageAccounts()
    for (const account of storageAccounts) {
      const publicAccess = await azureClient.checkStoragePublicAccess(account.name)
      if (publicAccess) {
        findings.push({
          id: `azure-storage-public-${account.name}`,
          title: 'Public Storage Account',
          description: `Storage account ${account.name} is publicly accessible`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'azure',
            name: 'Azure',
          },
          resource: {
            id: account.name,
            name: account.name,
          },
          remediationSteps: [
            'Enable storage account public access blocking',
            'Review and update network rules',
            'Use SAS tokens for temporary access',
          ],
        })
      }
    }

    // Check Role Assignments for excessive permissions
    const roleAssignments = await azureClient.listRoleAssignments()
    for (const assignment of roleAssignments) {
      const hasExcessivePermissions = assignment.roleDefinitionName.includes('Owner') ||
        assignment.roleDefinitionName.includes('Contributor')
      if (hasExcessivePermissions) {
        findings.push({
          id: `azure-rbac-excessive-${assignment.id}`,
          title: 'Excessive Role Assignment',
          description: `Role assignment ${assignment.id} has excessive permissions`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'azure',
            name: 'Azure',
          },
          resource: {
            id: assignment.id,
            name: assignment.id,
          },
          remediationSteps: [
            'Review and update role assignments',
            'Implement least privilege principle',
            'Use Azure Policy for access control',
          ],
        })
      }
    }

    // Check Network Security Groups for overly permissive rules
    const nsgs = await azureClient.listNetworkSecurityGroups()
    for (const nsg of nsgs) {
      const rules = await azureClient.getNSGRules(nsg.name)
      const hasOverlyPermissiveRules = rules.some(rule => 
        rule.sourceAddressPrefix === '*' && 
        (rule.destinationPortRange === '*' || rule.destinationPortRange === '0-65535')
      )
      if (hasOverlyPermissiveRules) {
        findings.push({
          id: `azure-nsg-permissive-${nsg.name}`,
          title: 'Overly Permissive NSG',
          description: `Network Security Group ${nsg.name} has overly permissive rules`,
          severity: 'critical',
          status: 'open',
          provider: {
            id: 'azure',
            name: 'Azure',
          },
          resource: {
            id: nsg.name,
            name: nsg.name,
          },
          remediationSteps: [
            'Review and update NSG rules',
            'Restrict access to specific IP ranges',
            'Use specific port ranges instead of all ports',
          ],
        })
      }
    }

    // Check Activity Log status
    const activityLog = await azureClient.getActivityLogSettings()
    if (!activityLog.enabled) {
      findings.push({
        id: 'azure-activity-log-disabled',
        title: 'Activity Log Not Enabled',
        description: 'Activity Log is not enabled',
        severity: 'high',
        status: 'open',
        provider: {
          id: 'azure',
          name: 'Azure',
        },
        resource: {
          id: 'activity-log',
          name: 'Activity Log',
        },
        remediationSteps: [
          'Enable Activity Log',
          'Configure log retention period',
          'Set up log analytics workspace',
        ],
      })
    }

    // Check for unencrypted disks
    const disks = await azureClient.listDisks()
    for (const disk of disks) {
      if (!disk.encryptionEnabled) {
        findings.push({
          id: `azure-disk-unencrypted-${disk.name}`,
          title: 'Unencrypted Disk',
          description: `Disk ${disk.name} is not encrypted`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'azure',
            name: 'Azure',
          },
          resource: {
            id: disk.name,
            name: disk.name,
          },
          remediationSteps: [
            'Enable disk encryption',
            'Use Azure Disk Encryption',
            'Consider using Azure Key Vault for key management',
          ],
        })
      }
    }

    return findings
  } catch (error) {
    console.error('Error scanning Azure resources:', error)
    return []
  }
} 