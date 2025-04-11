import { Metadata } from 'next'
import { MigrationWizard } from '@/components/migration/MigrationWizard'
import { MigrationPlans } from '@/components/migration/MigrationPlans'
import { MigrationDashboard } from '@/components/migration/MigrationDashboard'

export const metadata: Metadata = {
  title: 'Migration Planning | Cloudo',
  description: 'Plan and optimize your cloud migration strategy',
}

export default function MigrationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Migration Planning</h1>
        <p className="text-muted-foreground">
          Plan and optimize your cloud migration strategy
        </p>
      </div>

      <MigrationDashboard />
      <MigrationWizard />
      <MigrationPlans />
    </div>
  )
} 