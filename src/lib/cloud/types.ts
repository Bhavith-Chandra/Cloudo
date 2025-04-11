export interface CloudCredentials {
  provider: 'aws' | 'azure' | 'gcp';
  credentials: Record<string, string>;
}

export interface ResourceMetadata {
  id: string;
  name: string;
  type: string;
  region: string;
  tags: Record<string, string>;
  provider: 'aws' | 'azure' | 'gcp';
  createdAt: Date;
  lastModified: Date;
}

export interface ResourceMetrics {
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  networkIn: number;
  networkOut: number;
  timestamp: Date;
}

export interface ResourceGroup {
  id: string;
  name: string;
  resources: ResourceMetadata[];
  metrics: ResourceMetrics;
}

export interface OptimizationRecommendation {
  resourceId: string;
  resourceType: string;
  provider: 'aws' | 'azure' | 'gcp';
  recommendation: string;
  potentialSavings: number;
  confidence: number;
  createdAt: Date;
}

export interface CloudProvider {
  listResources(): Promise<ResourceMetadata[]>;
  applyTags(resourceId: string, tags: Record<string, string>): Promise<void>;
  getResourceMetrics(resourceId: string, startTime: Date, endTime: Date): Promise<ResourceMetrics[]>;
} 