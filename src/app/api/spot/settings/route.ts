import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's spot instance settings
    const settings = await prisma.spotSettings.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        autoApproval: false,
        maxRiskTolerance: 50,
        minSavingsThreshold: 20,
        fallbackStrategy: 'on-demand',
        notificationPreferences: {
          email: true,
          slack: false,
          webhook: false,
        },
        excludedInstanceTypes: [],
        excludedRegions: [],
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching spot instance settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await req.json();

    // Update or create settings
    await prisma.spotSettings.upsert({
      where: {
        userId: session.user.id,
      },
      update: settings,
      create: {
        userId: session.user.id,
        ...settings,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving spot instance settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 