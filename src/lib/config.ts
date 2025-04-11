interface Config {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    port: number;
    baseUrl: string;
  };
  auth: {
    secret: string;
    expiresIn: string;
    refreshTokenExpiresIn: string;
  };
  database: {
    url: string;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  azure: {
    clientId: string;
    clientSecret: string;
    tenantId: string;
    subscriptionId: string;
  };
  gcp: {
    projectId: string;
    privateKey: string;
    clientEmail: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
  };
  metrics: {
    enabled: boolean;
    port: number;
    path: string;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  rateLimit: {
    enabled: boolean;
    window: number;
    max: number;
  };
}

const config: Config = {
  app: {
    name: process.env.APP_NAME || 'Cloudo',
    version: process.env.APP_VERSION || '1.0.0',
    environment: (process.env.NODE_ENV as Config['app']['environment']) || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },
  auth: {
    secret: process.env.AUTH_SECRET || 'your-secret-key',
    expiresIn: process.env.AUTH_EXPIRES_IN || '1h',
    refreshTokenExpiresIn: process.env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/cloudo',
  },
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
  },
  azure: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    tenantId: process.env.AZURE_TENANT_ID || '',
    subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || '',
  },
  gcp: {
    projectId: process.env.GOOGLE_CLOUD_PROJECT || '',
    privateKey: process.env.GOOGLE_CLOUD_PRIVATE_KEY || '',
    clientEmail: process.env.GOOGLE_CLOUD_CLIENT_EMAIL || '',
  },
  logging: {
    level: (process.env.LOG_LEVEL as Config['logging']['level']) || 'info',
    format: (process.env.LOG_FORMAT as Config['logging']['format']) || 'text',
  },
  metrics: {
    enabled: process.env.METRICS_ENABLED === 'true',
    port: parseInt(process.env.METRICS_PORT || '9090', 10),
    path: process.env.METRICS_PATH || '/metrics',
  },
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true',
    ttl: parseInt(process.env.CACHE_TTL || '60000', 10),
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED === 'true',
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '60', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};

export function validateConfig(): void {
  const requiredEnvVars = [
    'DATABASE_URL',
    'AUTH_SECRET',
  ];

  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
  }
}

export default config; 