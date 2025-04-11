import { CloudProvider, CostData, CostBreakdown } from '@/types';
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function calculateCostBreakdown(data: CostData[]): CostBreakdown {
  const breakdown: CostBreakdown = {
    byService: {},
    byRegion: {},
    byProject: {},
  };

  data.forEach((item) => {
    // By service
    breakdown.byService[item.service] = (breakdown.byService[item.service] || 0) + item.cost;

    // By region
    breakdown.byRegion[item.region] = (breakdown.byRegion[item.region] || 0) + item.cost;

    // By project
    if (item.tags?.project) {
      breakdown.byProject[item.tags.project] = (breakdown.byProject[item.tags.project] || 0) + item.cost;
    }
  });

  return breakdown;
}

export function getProviderIcon(provider: CloudProvider): string {
  switch (provider) {
    case 'aws':
      return 'aws-icon';
    case 'azure':
      return 'azure-icon';
    case 'gcp':
      return 'gcp-icon';
    default:
      return 'cloud-icon';
  }
}

export function getProviderColor(provider: CloudProvider): string {
  switch (provider) {
    case 'aws':
      return '#FF9900';
    case 'azure':
      return '#0078D4';
    case 'gcp':
      return '#4285F4';
    default:
      return '#666666';
  }
}

export function calculateCostChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

export function formatCostChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

export function getCostChangeColor(change: number): string {
  if (change > 0) return 'text-red-500';
  if (change < 0) return 'text-green-500';
  return 'text-gray-500';
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 