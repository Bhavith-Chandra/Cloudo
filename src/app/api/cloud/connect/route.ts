import { NextResponse } from 'next/server';
import { CloudConnectionService } from '@/lib/cloud-connection';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const cloudService = CloudConnectionService.getInstance();

    let result;
    switch (body.provider) {
      case 'AWS':
        result = await cloudService.connectAWS(
          body.accessKey,
          body.secretKey,
          body.accountName,
          session.user.id
        );
        break;
      case 'Azure':
        result = await cloudService.connectAzure(
          body.tenantId,
          body.clientId,
          body.clientSecret,
          body.accountName,
          session.user.id
        );
        break;
      case 'GCP':
        result = await cloudService.connectGCP(
          body.projectId,
          body.clientId,
          body.clientSecret,
          body.accountName,
          session.user.id
        );
        break;
      default:
        return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Cloud connection error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to connect cloud account' },
      { status: 500 }
    );
  }
} 