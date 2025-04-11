import { Metadata } from 'next'
import { CarbonEmissionsChart } from '@/components/carbon-footprint/CarbonEmissionsChart'
import { EmissionsBreakdown } from '@/components/carbon-footprint/EmissionsBreakdown'
import { SustainabilityRecommendations } from '@/components/carbon-footprint/SustainabilityRecommendations'
import { ExportButton } from '@/components/carbon-footprint/ExportButton'

export const metadata: Metadata = {
  title: 'Carbon Footprint | Cloudo',
  description: 'Track and optimize your cloud carbon emissions',
}

export default function CarbonFootprintPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carbon Footprint</h1>
          <p className="text-muted-foreground">
            Track and optimize your cloud carbon emissions
          </p>
        </div>
        <ExportButton />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CarbonEmissionsChart />
        <EmissionsBreakdown />
      </div>

      <SustainabilityRecommendations />
    </div>
  )
} 