declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    AWS_ACCESS_KEY_ID?: string;
    AWS_SECRET_ACCESS_KEY?: string;
    AZURE_CLIENT_ID?: string;
    AZURE_CLIENT_SECRET?: string;
    AZURE_TENANT_ID?: string;
    GCP_PROJECT_ID?: string;
    GCP_CLIENT_EMAIL?: string;
    GCP_PRIVATE_KEY?: string;
  }
} 