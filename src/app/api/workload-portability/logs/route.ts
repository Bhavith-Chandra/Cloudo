import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const migrationId = searchParams.get('migrationId');

    if (!migrationId) {
      return new NextResponse('Missing migration ID', { status: 400 });
    }

    const logs = await prisma.migrationLog.findMany({
      where: {
        migrationId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching migration logs:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { migrationId, message } = body;

    if (!migrationId || !message) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const log = await prisma.migrationLog.create({
      data: {
        migrationId,
        message,
        timestamp: new Date(),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    console.error('Error creating migration log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new NextResponse('Missing log ID', { status: 400 });
    }

    await prisma.migrationLog.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting migration log:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 