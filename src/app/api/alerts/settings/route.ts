import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.alertSettings.findUnique({
      where: { userId: session.user.id },
    });

    if (!settings) {
      // Return default settings if none exist
      return NextResponse.json({
        channels: {
          email: true,
          slack: false,
          inApp: true,
        },
        thresholds: {
          critical: 1.0,
          high: 0.5,
          medium: 0.3,
          low: 0.2,
        },
        preferences: {
          notifyOnCritical: true,
          notifyOnHigh: true,
          notifyOnMedium: false,
          notifyOnLow: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const settings = await prisma.alertSettings.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error updating alert settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 