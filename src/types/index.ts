export type CloudProvider = 'aws' | 'azure' | 'gcp';

export interface CloudCredentials {
  provider: CloudProvider;
  credentials: {
    [key: string]: string;
  };
}

export interface CostData {
  id: string;
  provider: CloudProvider;
  service: string;
  region: string;
  cost: number;
  timestamp: Date;
  tags?: {
    [key: string]: string;
  };
}

export interface CostBreakdown {
  byService: {
    [service: string]: number;
  };
  byRegion: {
    [region: string]: number;
  };
  byProject: {
    [project: string]: number;
  };
}

export interface CostTrend {
  date: string;
  cost: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  user: User;
  expires: string;
}

export interface DashboardFilters {
  timeRange: '7d' | '30d' | '90d' | '1y';
  providers?: CloudProvider[];
  departments?: string[];
  teams?: string[];
  projects?: string[];
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }[];
} 