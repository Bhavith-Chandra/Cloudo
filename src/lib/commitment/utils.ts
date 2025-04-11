export function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;

  return variance;
}

export function calculateSavingsPercentage(
  onDemandCost: number,
  commitmentCost: number
): number {
  if (onDemandCost === 0) return 0;
  return ((onDemandCost - commitmentCost) / onDemandCost) * 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getCommitmentTypeLabel(type: string): string {
  switch (type) {
    case 'reserved':
      return 'Reserved Instance';
    case 'savings_plan':
      return 'Savings Plan';
    default:
      return type;
  }
}

export function getPaymentOptionLabel(option: string): string {
  switch (option) {
    case 'all_upfront':
      return 'All Upfront';
    case 'partial_upfront':
      return 'Partial Upfront';
    case 'no_upfront':
      return 'No Upfront';
    default:
      return option;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending_approval':
      return 'bg-yellow-100 text-yellow-800';
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
} 