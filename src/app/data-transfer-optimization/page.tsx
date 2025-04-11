import { Metadata } from 'next'
import { DataTransferVisualization } from '@/components/data-transfer-optimization/DataTransferVisualization'
import { DataTransferMetrics } from '@/components/data-transfer-optimization/DataTransferMetrics'

export const metadata: Metadata = {
  title: 'Data Transfer Optimization | Cloudo',
  description: 'Optimize your cloud data transfer costs and performance',
}

export default function DataTransferOptimizationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Data Transfer Optimization</h1>
        <p className="text-muted-foreground">
          Analyze and optimize your cloud data transfer costs and performance
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <DataTransferMetrics />
        <DataTransferVisualization />
      </div>
    </div>
  )
} 