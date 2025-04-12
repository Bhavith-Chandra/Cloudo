import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

interface ActionRequest {
  provider: 'AWS' | 'Azure' | 'GCP';
  resourceId: string;
  action: 'stop' | 'resize' | 'delete' | 'schedule';
  parameters?: Record<string, any>;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const action = await request.json() as ActionRequest;

    // Get user's cloud providers
    const providers = await prisma.cloudProvider.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Check if user has access to the requested provider
    const hasAccess = providers.some(p => p.name === action.provider);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied to provider' },
        { status: 403 }
      );
    }

    let result;
    switch (action.provider) {
      case 'AWS': {
        const client = new AWSClient({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION!,
        });

        switch (action.action) {
          case 'stop':
            result = await client.stopInstance(action.resourceId);
            break;
          case 'resize':
            result = await client.resizeInstance(
              action.resourceId,
              action.parameters?.instanceType
            );
            break;
          case 'delete':
            result = await client.deleteInstance(action.resourceId);
            break;
          case 'schedule':
            result = await client.scheduleInstance(
              action.resourceId,
              action.parameters?.schedule
            );
            break;
        }
        break;
      }
      case 'Azure': {
        const client = new AzureClient({
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          tenantId: process.env.AZURE_TENANT_ID!,
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
        });

        switch (action.action) {
          case 'stop':
            result = await client.stopVM(action.resourceId);
            break;
          case 'resize':
            result = await client.resizeVM(
              action.resourceId,
              action.parameters?.vmSize
            );
            break;
          case 'delete':
            result = await client.deleteVM(action.resourceId);
            break;
          case 'schedule':
            result = await client.scheduleVM(
              action.resourceId,
              action.parameters?.schedule
            );
            break;
        }
        break;
      }
      case 'GCP': {
        const client = new GCPClient({
          projectId: process.env.GCP_PROJECT_ID!,
          credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
        });

        switch (action.action) {
          case 'stop':
            result = await client.stopInstance(action.resourceId);
            break;
          case 'resize':
            result = await client.resizeInstance(
              action.resourceId,
              action.parameters?.machineType
            );
            break;
          case 'delete':
            result = await client.deleteInstance(action.resourceId);
            break;
          case 'schedule':
            result = await client.scheduleInstance(
              action.resourceId,
              action.parameters?.schedule
            );
            break;
        }
        break;
      }
    }

    // Log the action
    await prisma.actionLog.create({
      data: {
        userId: session.user.id,
        provider: action.provider,
        resourceId: action.resourceId,
        action: action.action,
        parameters: action.parameters,
        result: result,
        timestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('Error executing action:', error);
    return NextResponse.json(
      { error: 'Failed to execute action' },
      { status: 500 }
    );
  }
} 