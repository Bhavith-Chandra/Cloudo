import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'

interface MigrationSource {
  type: 'aws' | 'azure' | 'gcp' | 'on-premises'
  region?: string
  resources: {
    compute: number
    storage: number
    network: number
  }
}

interface MigrationTarget {
  type: 'aws' | 'azure' | 'gcp'
  region: string
  strategy: 'lift-and-shift' | 'replatform' | 'refactor'
}

interface MigrationPlan {
  source: MigrationSource
  target: MigrationTarget
  timeline: {
    assessment: string
    planning: string
    migration: string
    optimization: string
  }
  costEstimate: {
    upfront: number
    monthly: number
    savings: number
  }
}

export function MigrationWizard() {
  const [step, setStep] = useState(1)
  const [source, setSource] = useState<MigrationSource>({
    type: 'on-premises',
    resources: {
      compute: 0,
      storage: 0,
      network: 0,
    },
  })
  const [target, setTarget] = useState<MigrationTarget>({
    type: 'aws',
    region: 'us-east-1',
    strategy: 'lift-and-shift',
  })
  const { toast } = useToast()

  const handleSourceChange = (type: MigrationSource['type']) => {
    setSource(prev => ({ ...prev, type }))
  }

  const handleResourceChange = (resource: keyof MigrationSource['resources'], value: string) => {
    setSource(prev => ({
      ...prev,
      resources: {
        ...prev.resources,
        [resource]: parseInt(value) || 0,
      },
    }))
  }

  const handleTargetChange = (field: keyof MigrationTarget, value: string) => {
    setTarget(prev => ({ ...prev, [field]: value }))
  }

  const generatePlan = async () => {
    try {
      const response = await fetch('/api/migration/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ source, target }),
      })

      if (!response.ok) throw new Error('Failed to generate migration plan')

      const plan: MigrationPlan = await response.json()
      toast({
        title: 'Migration Plan Generated',
        description: 'Your migration plan has been created successfully',
      })
      // TODO: Store plan in database and update UI
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate migration plan',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Migration Planning Wizard</CardTitle>
        <Progress value={(step / 3) * 100} className="mt-4" />
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Source Environment</h3>
              <Tabs defaultValue="on-premises" onValueChange={handleSourceChange}>
                <TabsList>
                  <TabsTrigger value="on-premises">On-Premises</TabsTrigger>
                  <TabsTrigger value="aws">AWS</TabsTrigger>
                  <TabsTrigger value="azure">Azure</TabsTrigger>
                  <TabsTrigger value="gcp">GCP</TabsTrigger>
                </TabsList>
                <TabsContent value="on-premises" className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Compute Resources (vCPUs)</Label>
                      <Input
                        type="number"
                        value={source.resources.compute}
                        onChange={e => handleResourceChange('compute', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Storage (TB)</Label>
                      <Input
                        type="number"
                        value={source.resources.storage}
                        onChange={e => handleResourceChange('storage', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Network Bandwidth (Gbps)</Label>
                      <Input
                        type="number"
                        value={source.resources.network}
                        onChange={e => handleResourceChange('network', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Target Environment</h3>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Cloud Provider</Label>
                  <Select
                    value={target.type}
                    onValueChange={value => handleTargetChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aws">AWS</SelectItem>
                      <SelectItem value="azure">Azure</SelectItem>
                      <SelectItem value="gcp">GCP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select
                    value={target.region}
                    onValueChange={value => handleTargetChange('region', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                      <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                      <SelectItem value="eu-west-1">EU (Ireland)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Migration Strategy</Label>
                  <Select
                    value={target.strategy}
                    onValueChange={value => handleTargetChange('strategy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lift-and-shift">Lift and Shift</SelectItem>
                      <SelectItem value="replatform">Replatform</SelectItem>
                      <SelectItem value="refactor">Refactor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Review and Generate Plan</h3>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Source Environment</h4>
                <p>Type: {source.type}</p>
                <p>Compute: {source.resources.compute} vCPUs</p>
                <p>Storage: {source.resources.storage} TB</p>
                <p>Network: {source.resources.network} Gbps</p>
              </div>
              <div className="rounded-lg border p-4">
                <h4 className="font-medium">Target Environment</h4>
                <p>Provider: {target.type}</p>
                <p>Region: {target.region}</p>
                <p>Strategy: {target.strategy}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Previous
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={generatePlan}>Generate Plan</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 