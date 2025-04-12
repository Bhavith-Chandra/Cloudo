export interface Pod {
  name: string;
  namespace: string;
  status: string;
  cpuUsage: number;
  memoryUsage: number;
  cpuRequests?: number;
  cpuLimits?: number;
  memoryRequests?: number;
  memoryLimits?: number;
  replicas: number;
  costPerReplica: number;
}

export interface PodRecommendation {
  type: 'CPU' | 'Memory' | 'Replicas';
  severity: 'low' | 'medium' | 'high';
  message: string;
  current: string;
  suggested: string;
  estimatedSavings: number;
}

export interface OptimizedPod extends Pod {
  recommendations: PodRecommendation[];
} 