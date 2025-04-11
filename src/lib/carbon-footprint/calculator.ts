interface ResourceUsage {
  provider: {
    name: string
  }
  region: {
    name: string
    carbonIntensity: number
  }
  service: string
  instanceType?: string
  vcpuHours: number
  memoryGBHours: number
  storageGBHours: number
  networkGB: number
}

// Carbon intensity factors (gCO2e/kWh) for different regions
// Source: Cloud Carbon Footprint methodology
const CARBON_INTENSITY_FACTORS = {
  aws: {
    'us-east-1': 0.415, // Virginia
    'us-west-2': 0.142, // Oregon
    'eu-west-1': 0.233, // Ireland
    'ap-southeast-1': 0.408, // Singapore
  },
  azure: {
    'eastus': 0.415,
    'westus2': 0.142,
    'northeurope': 0.233,
    'southeastasia': 0.408,
  },
  gcp: {
    'us-east1': 0.415,
    'us-west2': 0.142,
    'europe-west1': 0.233,
    'asia-southeast1': 0.408,
  },
}

// Energy consumption factors (kWh)
const ENERGY_FACTORS = {
  compute: {
    vcpu: 0.00065, // kWh per vCPU-hour
    memory: 0.000392, // kWh per GB-hour
  },
  storage: {
    ssd: 0.00065, // kWh per GB-hour
    hdd: 0.00065, // kWh per GB-hour
  },
  network: {
    transfer: 0.001, // kWh per GB
  },
}

export function calculateEmissions(usage: ResourceUsage): number {
  const provider = usage.provider.name.toLowerCase()
  const region = usage.region.name.toLowerCase()
  const carbonIntensity = usage.region.carbonIntensity || 
    CARBON_INTENSITY_FACTORS[provider as keyof typeof CARBON_INTENSITY_FACTORS]?.[region] || 
    0.3 // Default value if not found

  // Calculate energy consumption
  const computeEnergy = 
    (usage.vcpuHours * ENERGY_FACTORS.compute.vcpu) +
    (usage.memoryGBHours * ENERGY_FACTORS.compute.memory)

  const storageEnergy = usage.storageGBHours * ENERGY_FACTORS.storage.ssd
  const networkEnergy = usage.networkGB * ENERGY_FACTORS.network.transfer

  const totalEnergy = computeEnergy + storageEnergy + networkEnergy

  // Calculate emissions (convert to kg CO2e)
  const emissions = (totalEnergy * carbonIntensity) / 1000

  return emissions
}

export function getGreenRegions(provider: string): string[] {
  const regions = CARBON_INTENSITY_FACTORS[provider as keyof typeof CARBON_INTENSITY_FACTORS] || {}
  return Object.entries(regions)
    .filter(([_, intensity]) => intensity < 0.2)
    .map(([region]) => region)
}

export function getEmissionsReductionPotential(
  currentRegion: string,
  targetRegion: string,
  provider: string
): number {
  const currentIntensity = 
    CARBON_INTENSITY_FACTORS[provider as keyof typeof CARBON_INTENSITY_FACTORS]?.[currentRegion] || 0.3
  const targetIntensity = 
    CARBON_INTENSITY_FACTORS[provider as keyof typeof CARBON_INTENSITY_FACTORS]?.[targetRegion] || 0.3

  return ((currentIntensity - targetIntensity) / currentIntensity) * 100
} 