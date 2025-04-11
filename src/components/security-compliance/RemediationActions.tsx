import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

interface RemediationAction {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  provider: string
  resource: string
  automated: boolean
  steps: string[]
}

export function RemediationActions() {
  const [actions, setActions] = useState<RemediationAction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRemediationActions = async () => {
      try {
        const response = await fetch('/api/security-compliance/remediation')
        if (!response.ok) throw new Error('Failed to fetch remediation actions')
        const data = await response.json()
        setActions(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch remediation actions',
          variant: 'destructive',
        })
      }
    }

    fetchRemediationActions()
  }, [toast])

  const handleRemediate = async (action: RemediationAction) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/security-compliance/remediate/${action.id}`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to execute remediation')

      const updatedAction = await response.json()
      setActions(actions.map(a => a.id === action.id ? updatedAction : a))

      toast({
        title: 'Success',
        description: 'Remediation action completed successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to execute remediation',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Remediation Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {actions.map((action) => (
            <div
              key={action.id}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{action.title}</h3>
                  {getStatusIcon(action.status)}
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>{action.provider}</span>
                  <span>•</span>
                  <span>{action.resource}</span>
                  {action.automated && (
                    <>
                      <span>•</span>
                      <span className="text-green-600">Automated</span>
                    </>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => handleRemediate(action)}
                disabled={action.status !== 'pending' || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {action.status === 'pending' ? 'Remediate' : 'View Details'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 