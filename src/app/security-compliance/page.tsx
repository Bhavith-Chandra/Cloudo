import { Metadata } from 'next'
import { SecurityFindings } from '@/components/security-compliance/SecurityFindings'
import { ComplianceStatus } from '@/components/security-compliance/ComplianceStatus'
import { SecurityScore } from '@/components/security-compliance/SecurityScore'
import { RemediationActions } from '@/components/security-compliance/RemediationActions'

export const metadata: Metadata = {
  title: 'Security & Compliance | Cloudo',
  description: 'Monitor and optimize your cloud security posture',
}

export default function SecurityCompliancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Security & Compliance</h1>
        <p className="text-muted-foreground">
          Monitor and optimize your cloud security posture
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <SecurityScore />
        <ComplianceStatus />
      </div>

      <SecurityFindings />
      <RemediationActions />
    </div>
  )
} 