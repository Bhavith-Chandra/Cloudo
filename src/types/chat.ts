export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  data?: {
    type: 'chart' | 'table' | 'action';
    payload: any;
  };
}

export interface ActionRequest {
  provider: 'AWS' | 'Azure' | 'GCP';
  resourceId: string;
  action: 'stop' | 'resize' | 'delete' | 'schedule';
  parameters?: Record<string, any>;
}

export interface CostData {
  provider: 'AWS' | 'Azure' | 'GCP';
  timeRange: 'last_7_days' | 'last_30_days' | 'last_90_days';
  granularity: 'daily' | 'weekly' | 'monthly';
  data: {
    date: string;
    cost: number;
    service?: string;
    region?: string;
  }[];
}

export interface ResourceUtilization {
  provider: 'AWS' | 'Azure' | 'GCP';
  resourceType: 'EC2' | 'S3' | 'Lambda' | 'VM' | 'Storage' | 'Functions';
  data: {
    id: string;
    name: string;
    utilization: number;
    cost: number;
    status: string;
  }[];
}

export interface OptimizationResult {
  resourceId: string;
  action: 'stop' | 'resize' | 'delete' | 'schedule';
  estimatedSavings: number;
  before: Record<string, any>;
  after: Record<string, any>;
} 