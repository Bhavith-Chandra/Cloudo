import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { simulateSpotInstance } from '@/lib/spot/analysis';

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { provider, instanceType, region, duration, riskTolerance } = await req.json();
    if (!provider || !instanceType || !region || !duration || !riskTolerance) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const analysis = await simulateSpotInstance(
      provider,
      instanceType,
      region,
      duration,
      riskTolerance
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Error simulating spot instance:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 