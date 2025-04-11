import { CostExplorerClient, GetCostAndUsageCommand } from "@aws-sdk/client-cost-explorer";
import { CostManagementClient } from "@azure/arm-costmanagement";
import { BillingClient } from "@google-cloud/billing";
import { encrypt, decrypt } from "./encryption";
import { prisma } from "./prisma";

export class CloudConnectionService {
  private static instance: CloudConnectionService;

  private constructor() {}

  public static getInstance(): CloudConnectionService {
    if (!CloudConnectionService.instance) {
      CloudConnectionService.instance = new CloudConnectionService();
    }
    return CloudConnectionService.instance;
  }

  // AWS Connection
  async connectAWS(accessKey: string, secretKey: string, accountName: string, userId: string) {
    try {
      const client = new CostExplorerClient({
        region: "us-east-1",
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secretKey,
        },
      });

      // Test connection
      await client.send(
        new GetCostAndUsageCommand({
          TimePeriod: {
            Start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
            End: new Date().toISOString().split("T")[0],
          },
          Granularity: "DAILY",
          Metrics: ["BlendedCost"],
        })
      );

      // Store credentials
      const encryptedAccessKey = await encrypt(accessKey);
      const encryptedSecretKey = await encrypt(secretKey);

      const account = await prisma.cloudAccount.create({
        data: {
          userId,
          provider: "AWS",
          name: accountName,
          credentials: {
            create: {
              accessKey: encryptedAccessKey,
              secretKey: encryptedSecretKey,
            },
          },
        },
      });

      return account;
    } catch (error) {
      throw new Error(`AWS connection failed: ${error.message}`);
    }
  }

  // Azure Connection
  async connectAzure(tenantId: string, clientId: string, clientSecret: string, accountName: string, userId: string) {
    try {
      const client = new CostManagementClient({
        tenantId,
        clientId,
        clientSecret,
      });

      // Test connection
      await client.usageDetails.list({
        scope: `/subscriptions/${clientId}`,
      });

      // Store credentials
      const encryptedClientId = await encrypt(clientId);
      const encryptedClientSecret = await encrypt(clientSecret);

      const account = await prisma.cloudAccount.create({
        data: {
          userId,
          provider: "Azure",
          name: accountName,
          credentials: {
            create: {
              accessKey: encryptedClientId,
              secretKey: encryptedClientSecret,
            },
          },
        },
      });

      return account;
    } catch (error) {
      throw new Error(`Azure connection failed: ${error.message}`);
    }
  }

  // GCP Connection
  async connectGCP(projectId: string, clientId: string, clientSecret: string, accountName: string, userId: string) {
    try {
      const client = new BillingClient({
        projectId,
        credentials: {
          client_id: clientId,
          client_secret: clientSecret,
        },
      });

      // Test connection
      await client.listBillingAccounts();

      // Store credentials
      const encryptedClientId = await encrypt(clientId);
      const encryptedClientSecret = await encrypt(clientSecret);

      const account = await prisma.cloudAccount.create({
        data: {
          userId,
          provider: "GCP",
          name: accountName,
          credentials: {
            create: {
              accessKey: encryptedClientId,
              secretKey: encryptedClientSecret,
            },
          },
        },
      });

      return account;
    } catch (error) {
      throw new Error(`GCP connection failed: ${error.message}`);
    }
  }

  // Fetch cost data
  async fetchCostData(accountId: string, startDate: Date, endDate: Date) {
    const account = await prisma.cloudAccount.findUnique({
      where: { id: accountId },
      include: { credentials: true },
    });

    if (!account || !account.credentials) {
      throw new Error("Account not found or credentials missing");
    }

    const decryptedAccessKey = await decrypt(account.credentials.accessKey);
    const decryptedSecretKey = await decrypt(account.credentials.secretKey);

    switch (account.provider) {
      case "AWS":
        return this.fetchAWSCostData(decryptedAccessKey, decryptedSecretKey, startDate, endDate);
      case "Azure":
        return this.fetchAzureCostData(decryptedAccessKey, decryptedSecretKey, startDate, endDate);
      case "GCP":
        return this.fetchGCPCostData(decryptedAccessKey, decryptedSecretKey, startDate, endDate);
      default:
        throw new Error("Unsupported cloud provider");
    }
  }

  private async fetchAWSCostData(accessKey: string, secretKey: string, startDate: Date, endDate: Date) {
    const client = new CostExplorerClient({
      region: "us-east-1",
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });

    const response = await client.send(
      new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split("T")[0],
          End: endDate.toISOString().split("T")[0],
        },
        Granularity: "DAILY",
        Metrics: ["BlendedCost"],
        GroupBy: [
          {
            Type: "DIMENSION",
            Key: "SERVICE",
          },
        ],
      })
    );

    return response.ResultsByTime?.map((result) => ({
      date: result.TimePeriod?.Start,
      service: result.Groups?.[0]?.Keys?.[0],
      amount: parseFloat(result.Groups?.[0]?.Metrics?.BlendedCost?.Amount || "0"),
      currency: result.Groups?.[0]?.Metrics?.BlendedCost?.Unit || "USD",
    }));
  }

  private async fetchAzureCostData(clientId: string, clientSecret: string, startDate: Date, endDate: Date) {
    // Implementation for Azure cost data fetching
    // Similar structure to AWS implementation
  }

  private async fetchGCPCostData(clientId: string, clientSecret: string, startDate: Date, endDate: Date) {
    // Implementation for GCP cost data fetching
    // Similar structure to AWS implementation
  }
} 