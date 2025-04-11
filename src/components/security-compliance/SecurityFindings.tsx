import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

interface SecurityFinding {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'in_progress' | 'resolved'
  provider: string
  resource: string
  lastDetected: string
  remediationSteps: string[]
}

export function SecurityFindings() {
  const [findings, setFindings] = useState<SecurityFinding[]>([])
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const { toast } = useToast()

  useEffect(() => {
    const fetchFindings = async () => {
      try {
        const response = await fetch('/api/security-compliance/findings')
        if (!response.ok) throw new Error('Failed to fetch security findings')
        const data = await response.json()
        setFindings(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch security findings',
          variant: 'destructive',
        })
      }
    }

    fetchFindings()
  }, [toast])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'in_progress':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      default:
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredFindings = findings.filter(
    finding => selectedSeverity === 'all' || finding.severity === selectedSeverity
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Security Findings</CardTitle>
        <div className="flex items-center space-x-2">
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Last Detected</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFindings.map((finding) => (
              <TableRow key={finding.id}>
                <TableCell>{getStatusIcon(finding.status)}</TableCell>
                <TableCell className="font-medium">{finding.title}</TableCell>
                <TableCell>
                  <Badge className={getSeverityColor(finding.severity)}>
                    {finding.severity}
                  </Badge>
                </TableCell>
                <TableCell>{finding.provider}</TableCell>
                <TableCell>{finding.resource}</TableCell>
                <TableCell>
                  {new Date(finding.lastDetected).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Handle remediation action
                    }}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 