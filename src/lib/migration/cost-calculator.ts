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

interface CostEstimate {
  upfront: number
  monthly: number
  savings: number
}

// Cloud provider pricing (example rates, should be updated with actual rates)
const PRICING = {
  aws: {
    compute: 0.1, // per vCPU per hour
    storage: 0.023, // per GB per month
    network: 0.09, // per GB
  },
  azure: {
    compute: 0.12, // per vCPU per hour
    storage: 0.02, // per GB per month
    network: 0.087, // per GB
  },
  gcp: {
    compute: 0.095, // per vCPU per hour
    storage: 0.02, // per GB per month
    network: 0.12, // per GB
  },
}

// Strategy multipliers for cost estimation
const STRATEGY_MULTIPLIERS = {
  'lift-and-shift': 1.0,
  replatform: 1.2,
  refactor: 1.5,
}

export async function calculateMigrationCost(
  source: MigrationSource,
  target: MigrationTarget
): Promise<CostEstimate> {
  const targetPricing = PRICING[target.type]
  const strategyMultiplier = STRATEGY_MULTIPLIERS[target.strategy]

  // Calculate monthly costs
  const computeCost = source.resources.compute * targetPricing.compute * 24 * 30
  const storageCost = source.resources.storage * 1024 * targetPricing.storage
  const networkCost = source.resources.network * targetPricing.network

  const monthlyCost = (computeCost + storageCost + networkCost) * strategyMultiplier

  // Calculate upfront costs (e.g., migration tools, training)
  const upfrontCost = monthlyCost * 0.1 // 10% of monthly cost

  // Calculate potential savings (compared to on-premises)
  let savings = 0
  if (source.type === 'on-premises') {
    // Assuming on-premises costs are 30% higher than cloud
    const onPremisesCost = monthlyCost * 1.3
    savings = onPremisesCost - monthlyCost
  }

  return {
    upfront: Math.round(upfrontCost),
    monthly: Math.round(monthlyCost),
    savings: Math.round(savings),
  }
} 