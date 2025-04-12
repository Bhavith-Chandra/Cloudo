import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's cloud providers
    const providers = await prisma.cloudProvider.findMany({
      where: {
        userId: session.user.id,
      },
    });

    const clusters = [];

    // Fetch AWS EKS clusters
    const awsProvider = providers.find(p => p.name === 'AWS');
    if (awsProvider) {
      const awsClient = new AWSClient({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        region: process.env.AWS_REGION!,
      });

      const eksClusters = await awsClient.listEKSClusters();
      for (const cluster of eksClusters) {
        const metrics = await awsClient.getEKSClusterMetrics(cluster.name);
        clusters.push({
          id: `aws-${cluster.name}`,
          name: cluster.name,
          provider: 'AWS',
          status: cluster.status,
          nodes: metrics.nodes,
          pods: metrics.pods,
          cpuUtilization: metrics.cpuUtilization,
          memoryUtilization: metrics.memoryUtilization,
          cost: metrics.cost,
          costEfficiency: metrics.costEfficiency,
        });
      }
    }

    // Fetch Azure AKS clusters
    const azureProvider = providers.find(p => p.name === 'Azure');
    if (azureProvider) {
      const azureClient = new AzureClient({
        clientId: process.env.AZURE_CLIENT_ID!,
        clientSecret: process.env.AZURE_CLIENT_SECRET!,
        tenantId: process.env.AZURE_TENANT_ID!,
        subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
      });

      const aksClusters = await azureClient.listAKSClusters();
      for (const cluster of aksClusters) {
        const metrics = await azureClient.getAKSClusterMetrics(cluster.name);
        clusters.push({
          id: `azure-${cluster.name}`,
          name: cluster.name,
          provider: 'Azure',
          status: cluster.status,
          nodes: metrics.nodes,
          pods: metrics.pods,
          cpuUtilization: metrics.cpuUtilization,
          memoryUtilization: metrics.memoryUtilization,
          cost: metrics.cost,
          costEfficiency: metrics.costEfficiency,
        });
      }
    }

    // Fetch GCP GKE clusters
    const gcpProvider = providers.find(p => p.name === 'GCP');
    if (gcpProvider) {
      const gcpClient = new GCPClient({
        projectId: process.env.GCP_PROJECT_ID!,
        credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
      });

      const gkeClusters = await gcpClient.listGKEClusters();
      for (const cluster of gkeClusters) {
        const metrics = await gcpClient.getGKEClusterMetrics(cluster.name);
        clusters.push({
          id: `gcp-${cluster.name}`,
          name: cluster.name,
          provider: 'GCP',
          status: cluster.status,
          nodes: metrics.nodes,
          pods: metrics.pods,
          cpuUtilization: metrics.cpuUtilization,
          memoryUtilization: metrics.memoryUtilization,
          cost: metrics.cost,
          costEfficiency: metrics.costEfficiency,
        });
      }
    }

    return NextResponse.json(clusters);
  } catch (error) {
    console.error('Error fetching Kubernetes clusters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Kubernetes clusters' },
      { status: 500 }
    );
  }
} 