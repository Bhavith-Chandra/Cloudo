import { AWSClient } from '@/lib/cloud/aws'
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

export async function scanAWSResources(): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = []
  const awsClient = new AWSClient()

  try {
    // Check S3 bucket public access
    const buckets = await awsClient.listS3Buckets()
    for (const bucket of buckets) {
      const publicAccess = await awsClient.checkS3PublicAccess(bucket.name)
      if (publicAccess) {
        findings.push({
          id: `aws-s3-public-${bucket.name}`,
          title: 'Public S3 Bucket',
          description: `S3 bucket ${bucket.name} is publicly accessible`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'aws',
            name: 'AWS',
          },
          resource: {
            id: bucket.name,
            name: bucket.name,
          },
          remediationSteps: [
            'Enable S3 bucket public access blocking',
            'Review and update bucket policy',
            'Consider using pre-signed URLs for temporary access',
          ],
        })
      }
    }

    // Check IAM roles for excessive permissions
    const roles = await awsClient.listIAMRoles()
    for (const role of roles) {
      const policies = await awsClient.getIAMRolePolicies(role.name)
      const hasExcessivePermissions = policies.some(policy => 
        policy.includes('*') || 
        policy.includes('Allow') && !policy.includes('Deny')
      )
      if (hasExcessivePermissions) {
        findings.push({
          id: `aws-iam-excessive-${role.name}`,
          title: 'Excessive IAM Role Permissions',
          description: `IAM role ${role.name} has excessive permissions`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'aws',
            name: 'AWS',
          },
          resource: {
            id: role.name,
            name: role.name,
          },
          remediationSteps: [
            'Review and update IAM role policies',
            'Implement least privilege principle',
            'Use AWS IAM Access Analyzer for policy recommendations',
          ],
        })
      }
    }

    // Check Security Groups for overly permissive rules
    const securityGroups = await awsClient.listSecurityGroups()
    for (const group of securityGroups) {
      const rules = await awsClient.getSecurityGroupRules(group.id)
      const hasOverlyPermissiveRules = rules.some(rule => 
        rule.ipRange === '0.0.0.0/0' && 
        (rule.portRange.start === 0 || rule.portRange.end === 65535)
      )
      if (hasOverlyPermissiveRules) {
        findings.push({
          id: `aws-sg-permissive-${group.id}`,
          title: 'Overly Permissive Security Group',
          description: `Security group ${group.name} has overly permissive rules`,
          severity: 'critical',
          status: 'open',
          provider: {
            id: 'aws',
            name: 'AWS',
          },
          resource: {
            id: group.id,
            name: group.name,
          },
          remediationSteps: [
            'Review and update security group rules',
            'Restrict access to specific IP ranges',
            'Use specific port ranges instead of all ports',
          ],
        })
      }
    }

    // Check CloudTrail logging status
    const trails = await awsClient.listCloudTrails()
    if (trails.length === 0) {
      findings.push({
        id: 'aws-cloudtrail-disabled',
        title: 'CloudTrail Not Enabled',
        description: 'CloudTrail logging is not enabled',
        severity: 'high',
        status: 'open',
        provider: {
          id: 'aws',
          name: 'AWS',
        },
        resource: {
          id: 'cloudtrail',
          name: 'CloudTrail',
        },
        remediationSteps: [
          'Enable CloudTrail logging',
          'Configure log file validation',
          'Set up log file encryption',
        ],
      })
    }

    // Check for unencrypted EBS volumes
    const volumes = await awsClient.listEBSVolumes()
    for (const volume of volumes) {
      if (!volume.encrypted) {
        findings.push({
          id: `aws-ebs-unencrypted-${volume.id}`,
          title: 'Unencrypted EBS Volume',
          description: `EBS volume ${volume.id} is not encrypted`,
          severity: 'high',
          status: 'open',
          provider: {
            id: 'aws',
            name: 'AWS',
          },
          resource: {
            id: volume.id,
            name: volume.id,
          },
          remediationSteps: [
            'Enable EBS volume encryption',
            'Create encrypted snapshots',
            'Consider using AWS KMS for key management',
          ],
        })
      }
    }

    return findings
  } catch (error) {
    console.error('Error scanning AWS resources:', error)
    return []
  }
} 