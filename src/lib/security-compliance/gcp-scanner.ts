import { GCPClient } from '@/lib/cloud/gcp'
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

export async function scanGCPResources(): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = []
  const gcpClient = new GCPClient()

  try {
    // Check Cloud Storage bucket public access
    const buckets = await gcpClient.listStorageBuckets()
    for (const bucket of buckets) {
      const publicAccess = await gcpClient.checkBucketPublicAccess(bucket.name)
      if (publicAccess) {
        findings.push({
          id: `gcp-storage-public-${bucket.name}`,
          title: 'Public Cloud Storage Bucket',
          description: `Cloud Storage bucket ${bucket.name} is publicly accessible`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'gcp',
            name: 'GCP',
          },
          resource: {
            id: bucket.name,
            name: bucket.name,
          },
          remediationSteps: [
            'Enable bucket public access prevention',
            'Review and update bucket IAM policies',
            'Use signed URLs for temporary access',
          ],
        })
      }
    }

    // Check IAM roles for excessive permissions
    const roles = await gcpClient.listIAMRoles()
    for (const role of roles) {
      const hasExcessivePermissions = role.permissions.some(permission => 
        permission.includes('*') || 
        permission.includes('admin') ||
        permission.includes('owner')
      )
      if (hasExcessivePermissions) {
        findings.push({
          id: `gcp-iam-excessive-${role.name}`,
          title: 'Excessive IAM Role',
          description: `IAM role ${role.name} has excessive permissions`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'gcp',
            name: 'GCP',
          },
          resource: {
            id: role.name,
            name: role.name,
          },
          remediationSteps: [
            'Review and update IAM role permissions',
            'Implement least privilege principle',
            'Use predefined roles instead of custom roles',
          ],
        })
      }
    }

    // Check Firewall rules for overly permissive rules
    const firewallRules = await gcpClient.listFirewallRules()
    for (const rule of firewallRules) {
      const hasOverlyPermissiveRules = 
        rule.sourceRanges.includes('0.0.0.0/0') && 
        (rule.ports.includes('0-65535') || rule.ports.includes('all'))
      if (hasOverlyPermissiveRules) {
        findings.push({
          id: `gcp-firewall-permissive-${rule.name}`,
          title: 'Overly Permissive Firewall Rule',
          description: `Firewall rule ${rule.name} has overly permissive rules`,
          severity: 'critical',
          status: 'open',
          provider: {
            id: 'gcp',
            name: 'GCP',
          },
          resource: {
            id: rule.name,
            name: rule.name,
          },
          remediationSteps: [
            'Review and update firewall rules',
            'Restrict access to specific IP ranges',
            'Use specific port ranges instead of all ports',
          ],
        })
      }
    }

    // Check Audit Logging status
    const auditLogs = await gcpClient.getAuditLogSettings()
    if (!auditLogs.enabled) {
      findings.push({
        id: 'gcp-audit-log-disabled',
        title: 'Audit Logging Not Enabled',
        description: 'Audit logging is not enabled',
        severity: 'high',
        status: 'open',
        provider: {
          id: 'gcp',
          name: 'GCP',
        },
        resource: {
          id: 'audit-log',
          name: 'Audit Log',
        },
        remediationSteps: [
          'Enable audit logging',
          'Configure log retention period',
          'Set up log export to BigQuery',
        ],
      })
    }

    // Check for unencrypted disks
    const disks = await gcpClient.listDisks()
    for (const disk of disks) {
      if (!disk.encryptionEnabled) {
        findings.push({
          id: `gcp-disk-unencrypted-${disk.name}`,
          title: 'Unencrypted Disk',
          description: `Disk ${disk.name} is not encrypted`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'gcp',
            name: 'GCP',
          },
          resource: {
            id: disk.name,
            name: disk.name,
          },
          remediationSteps: [
            'Enable disk encryption',
            'Use Google-managed encryption keys',
            'Consider using customer-managed encryption keys',
          ],
        })
      }
    }

    return findings
  } catch (error) {
    console.error('Error scanning GCP resources:', error)
    return []
  }
} 