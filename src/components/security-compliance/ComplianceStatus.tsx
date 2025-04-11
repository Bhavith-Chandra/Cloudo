import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface ComplianceFramework {
  name: string
  status: 'compliant' | 'non-compliant' | 'partial'
  lastAssessment: string
  controls: {
    total: number
    passed: number
    failed: number
  }
}

export function ComplianceStatus() {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchComplianceStatus = async () => {
      try {
        const response = await fetch('/api/security-compliance/compliance')
        if (!response.ok) throw new Error('Failed to fetch compliance status')
        const data = await response.json()
        setFrameworks(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch compliance status',
          variant: 'destructive',
        })
      }
    }

    fetchComplianceStatus()
  }, [toast])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800'
      case 'non-compliant':
        return 'bg-red-100 text-red-800'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compliance Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {frameworks.map((framework) => (
            <div
              key={framework.name}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{framework.name}</h3>
                  <Badge className={getStatusColor(framework.status)}>
                    {framework.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Last assessed: {new Date(framework.lastAssessment).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">
                  {framework.controls.passed} / {framework.controls.total} controls passed
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.round((framework.controls.passed / framework.controls.total) * 100)}% compliance
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 