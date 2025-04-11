import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { userId, provider, status } = await req.json();
    if (!userId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const where: any = {
      userId,
    };

    if (provider !== 'all') {
      where.provider = provider;
    }

    if (status !== 'all') {
      where.status = status;
    }

    const history = await prisma.commitment.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching commitment history:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 