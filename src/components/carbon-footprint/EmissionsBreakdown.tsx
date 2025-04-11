import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface BreakdownData {
  provider: string
  service: string
  region: string
  emissions: number
  percentage: number
  cost: number
}

export function EmissionsBreakdown() {
  const [breakdownData, setBreakdownData] = useState<BreakdownData[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchBreakdownData = async () => {
      try {
        const response = await fetch('/api/carbon-footprint/breakdown')
        if (!response.ok) throw new Error('Failed to fetch breakdown data')
        const data = await response.json()
        setBreakdownData(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch emissions breakdown',
          variant: 'destructive',
        })
      }
    }

    fetchBreakdownData()
  }, [toast])

  const totalEmissions = breakdownData.reduce((sum, item) => sum + item.emissions, 0)
  const totalCost = breakdownData.reduce((sum, item) => sum + item.cost, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Emissions Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Total Emissions</div>
            <div className="text-2xl font-bold">{totalEmissions.toFixed(2)} kg CO₂e</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm font-medium text-muted-foreground">Associated Cost</div>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Region</TableHead>
              <TableHead className="text-right">Emissions (kg CO₂e)</TableHead>
              <TableHead className="text-right">Percentage</TableHead>
              <TableHead className="text-right">Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdownData.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.provider}</TableCell>
                <TableCell>{item.service}</TableCell>
                <TableCell>{item.region}</TableCell>
                <TableCell className="text-right">{item.emissions.toFixed(2)}</TableCell>
                <TableCell className="text-right">{item.percentage.toFixed(1)}%</TableCell>
                <TableCell className="text-right">${item.cost.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 