interface MigrationSource {
  type: 'aws' | 'azure' | 'gcp' | 'on-premises'
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

interface MigrationTimeline {
  assessment: string
  planning: string
  migration: string
  optimization: string
}

// Base durations in days for each phase
const BASE_DURATIONS = {
  assessment: 14,
  planning: 21,
  migration: 30,
  optimization: 14,
}

// Strategy multipliers for timeline estimation
const STRATEGY_MULTIPLIERS = {
  'lift-and-shift': 1.0,
  replatform: 1.5,
  refactor: 2.0,
}

// Resource multipliers for timeline estimation
const RESOURCE_MULTIPLIERS = {
  compute: 0.1, // per 100 vCPUs
  storage: 0.05, // per 100 TB
  network: 0.02, // per 10 Gbps
}

export function generateMigrationTimeline(
  source: MigrationSource,
  target: MigrationTarget
): MigrationTimeline {
  const strategyMultiplier = STRATEGY_MULTIPLIERS[target.strategy]

  // Calculate resource-based duration adjustments
  const computeAdjustment = Math.ceil(source.resources.compute / 100) * RESOURCE_MULTIPLIERS.compute
  const storageAdjustment = Math.ceil(source.resources.storage / 100) * RESOURCE_MULTIPLIERS.storage
  const networkAdjustment = Math.ceil(source.resources.network / 10) * RESOURCE_MULTIPLIERS.network

  const resourceMultiplier = 1 + computeAdjustment + storageAdjustment + networkAdjustment

  // Calculate final durations
  const assessmentDuration = Math.ceil(BASE_DURATIONS.assessment * resourceMultiplier)
  const planningDuration = Math.ceil(BASE_DURATIONS.planning * resourceMultiplier * strategyMultiplier)
  const migrationDuration = Math.ceil(BASE_DURATIONS.migration * resourceMultiplier * strategyMultiplier)
  const optimizationDuration = Math.ceil(BASE_DURATIONS.optimization * resourceMultiplier)

  // Generate timeline with dates
  const startDate = new Date()
  const assessmentEnd = new Date(startDate)
  assessmentEnd.setDate(assessmentEnd.getDate() + assessmentDuration)

  const planningEnd = new Date(assessmentEnd)
  planningEnd.setDate(planningEnd.getDate() + planningDuration)

  const migrationEnd = new Date(planningEnd)
  migrationEnd.setDate(migrationEnd.getDate() + migrationDuration)

  const optimizationEnd = new Date(migrationEnd)
  optimizationEnd.setDate(optimizationEnd.getDate() + optimizationDuration)

  return {
    assessment: assessmentEnd.toISOString(),
    planning: planningEnd.toISOString(),
    migration: migrationEnd.toISOString(),
    optimization: optimizationEnd.toISOString(),
  }
} 