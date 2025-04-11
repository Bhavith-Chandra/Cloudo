import { CloudProvider } from '@/types';

export function validateCloudProvider(provider: string): provider is CloudProvider {
  return ['aws', 'azure', 'gcp'].includes(provider);
}

export function validateAWSCredentials(credentials: any): boolean {
  if (!credentials) return false;
  return (
    typeof credentials.accessKeyId === 'string' &&
    typeof credentials.secretAccessKey === 'string' &&
    typeof credentials.region === 'string'
  );
}

export function validateAzureCredentials(credentials: any): boolean {
  if (!credentials) return false;
  return (
    typeof credentials.clientId === 'string' &&
    typeof credentials.clientSecret === 'string' &&
    typeof credentials.tenantId === 'string' &&
    typeof credentials.subscriptionId === 'string'
  );
}

export function validateGCPCredentials(credentials: any): boolean {
  if (!credentials) return false;
  return (
    typeof credentials.projectId === 'string' &&
    typeof credentials.privateKey === 'string' &&
    typeof credentials.clientEmail === 'string'
  );
}

export function validateTimeRange(
  startDate: string | undefined,
  endDate: string | undefined
): boolean {
  if (!startDate || !endDate) return false;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
  if (start > end) return false;

  // Maximum time range of 1 year
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (end.getTime() - start.getTime() > oneYearInMs) return false;

  return true;
}

export function validateCostRecord(data: any): boolean {
  if (!data) return false;

  return (
    typeof data.provider === 'string' &&
    validateCloudProvider(data.provider) &&
    typeof data.service === 'string' &&
    typeof data.region === 'string' &&
    typeof data.cost === 'number' &&
    data.cost >= 0 &&
    data.timestamp instanceof Date &&
    (!data.tags || typeof data.tags === 'object')
  );
}

export function validateUserData(data: any): boolean {
  if (!data) return false;

  return (
    typeof data.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    typeof data.name === 'string' &&
    data.name.length >= 2 &&
    typeof data.password === 'string' &&
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/.test(data.password) &&
    (!data.role || ['admin', 'user'].includes(data.role))
  );
}

export function validatePaginationParams(
  page: number,
  limit: number
): boolean {
  return (
    typeof page === 'number' &&
    page > 0 &&
    typeof limit === 'number' &&
    limit > 0 &&
    limit <= 100
  );
}

export function validateTags(tags: any): boolean {
  if (!tags) return true;

  if (typeof tags !== 'object') return false;

  for (const [key, value] of Object.entries(tags)) {
    if (typeof key !== 'string' || typeof value !== 'string') {
      return false;
    }
  }

  return true;
}

export function validateFilterParams(params: any): boolean {
  if (!params) return true;

  const validKeys = ['provider', 'service', 'region', 'department', 'team', 'project'];
  
  for (const key of Object.keys(params)) {
    if (!validKeys.includes(key)) {
      return false;
    }
  }

  return true;
} 