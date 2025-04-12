import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { AWSClient } from '@/lib/cloud/aws';
import { AzureClient } from '@/lib/cloud/azure';
import { GCPClient } from '@/lib/cloud/gcp';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { action } = await request.json();

    // Get the maintenance record
    const maintenance = await prisma.predictiveMaintenance.findUnique({
      where: { id },
      include: {
        provider: true,
      },
    });

    if (!maintenance) {
      return NextResponse.json(
        { error: 'Maintenance record not found' },
        { status: 404 }
      );
    }

    // Initialize the appropriate cloud client
    let client;
    switch (maintenance.provider) {
      case 'AWS':
        client = new AWSClient({
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          region: process.env.AWS_REGION!,
        });
        break;
      case 'Azure':
        client = new AzureClient({
          clientId: process.env.AZURE_CLIENT_ID!,
          clientSecret: process.env.AZURE_CLIENT_SECRET!,
          tenantId: process.env.AZURE_TENANT_ID!,
          subscriptionId: process.env.AZURE_SUBSCRIPTION_ID!,
        });
        break;
      case 'GCP':
        client = new GCPClient({
          projectId: process.env.GCP_PROJECT_ID!,
          credentials: JSON.parse(process.env.GCP_CREDENTIALS!),
        });
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported cloud provider' },
          { status: 400 }
        );
    }

    // Execute the maintenance action
    const result = await client.executeMaintenanceAction(
      maintenance.resourceId,
      action
    );

    // Create maintenance action record
    await prisma.maintenanceAction.create({
      data: {
        userId: 'system', // Replace with actual user ID
        maintenanceId: id,
        actionType: action.type,
        status: 'completed',
        executedAt: new Date(),
        cost: action.cost,
        savings: maintenance.estimatedImpact.cost,
        logs: result,
      },
    });

    // Update maintenance status
    await prisma.predictiveMaintenance.update({
      where: { id },
      data: {
        status: 'resolved',
      },
    });

    return NextResponse.json({
      message: 'Maintenance action executed successfully',
      result,
    });
  } catch (error) {
    console.error('Error executing maintenance action:', error);
    return NextResponse.json(
      { error: 'Failed to execute maintenance action' },
      { status: 500 }
    );
  }
} 