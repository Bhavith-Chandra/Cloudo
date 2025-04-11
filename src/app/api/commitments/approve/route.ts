import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CommitmentService } from '@/lib/commitment/commitment-service';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { commitmentId, userId } = await req.json();
    if (!commitmentId || !userId) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    const commitmentService = new CommitmentService();
    await commitmentService.approveCommitment(commitmentId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving commitment:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 