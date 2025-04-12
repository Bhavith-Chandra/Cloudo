import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';
import { Pod, OptimizedPod } from '@/types/kubernetes';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const clusterId = searchParams.get('clusterId');
    const namespace = searchParams.get('namespace');

    if (!clusterId) {
      return NextResponse.json({ error: 'Cluster ID is required' }, { status: 400 });
    }

    // Get user's cloud provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { cloudProvider: true },
    });

    if (!user?.cloudProvider) {
      return NextResponse.json({ error: 'No cloud provider configured' }, { status: 400 });
    }

    let pods: Pod[] = [];

    // Fetch pods based on cloud provider
    switch (user.cloudProvider.name) {
      case 'AWS':
        const awsClient = new AWSClient({
          accessKeyId: user.cloudProvider.credentials.accessKeyId,
          secretAccessKey: user.cloudProvider.credentials.secretAccessKey,
          region: user.cloudProvider.region,
        });
        pods = await awsClient.getEKSPods(clusterId, namespace);
        break;

      case 'Azure':
        const azureClient = new AzureClient({
          subscriptionId: user.cloudProvider.credentials.subscriptionId,
          clientId: user.cloudProvider.credentials.clientId,
          clientSecret: user.cloudProvider.credentials.clientSecret,
          tenantId: user.cloudProvider.credentials.tenantId,
        });
        pods = await azureClient.getAKSPods(clusterId, namespace);
        break;

      case 'GCP':
        const gcpClient = new GCPClient({
          projectId: user.cloudProvider.credentials.projectId,
          clientEmail: user.cloudProvider.credentials.clientEmail,
          privateKey: user.cloudProvider.credentials.privateKey,
        });
        pods = await gcpClient.getGKEPods(clusterId, namespace);
        break;

      default:
        return NextResponse.json({ error: 'Unsupported cloud provider' }, { status: 400 });
    }

    // Analyze pods and generate recommendations
    const optimizedPods: OptimizedPod[] = pods.map(pod => {
      const recommendations: PodRecommendation[] = [];

      // CPU optimization
      if (pod.cpuUsage < 0.3 && pod.cpuRequests) {
        const suggestedCpu = Math.max(pod.cpuUsage * 1.2, 0.1);
        recommendations.push({
          type: 'CPU',
          severity: 'medium',
          message: 'CPU requests can be reduced',
          current: `${pod.cpuRequests} cores`,
          suggested: `${suggestedCpu.toFixed(2)} cores`,
          estimatedSavings: (pod.cpuRequests - suggestedCpu) * pod.replicas * pod.costPerReplica,
        });
      }

      // Memory optimization
      if (pod.memoryUsage < 0.4 && pod.memoryRequests) {
        const suggestedMemory = Math.max(pod.memoryUsage * 1.2, 0.1);
        recommendations.push({
          type: 'Memory',
          severity: 'medium',
          message: 'Memory requests can be reduced',
          current: `${pod.memoryRequests} GB`,
          suggested: `${suggestedMemory.toFixed(2)} GB`,
          estimatedSavings: (pod.memoryRequests - suggestedMemory) * pod.replicas * pod.costPerReplica,
        });
      }

      // Replica optimization
      if (pod.cpuUsage < 0.2 && pod.memoryUsage < 0.2 && pod.replicas > 1) {
        const suggestedReplicas = Math.max(Math.ceil(pod.replicas * 0.5), 1);
        recommendations.push({
          type: 'Replicas',
          severity: 'high',
          message: 'Number of replicas can be reduced',
          current: `${pod.replicas}`,
          suggested: `${suggestedReplicas}`,
          estimatedSavings: (pod.replicas - suggestedReplicas) * pod.costPerReplica,
        });
      }

      return {
        ...pod,
        recommendations,
      };
    });

    return NextResponse.json(optimizedPods);
  } catch (error) {
    console.error('Error fetching pods:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pods' },
      { status: 500 }
    );
  }
} 