import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await prisma.migrationMetrics.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!metrics) {
      // Return default metrics if none exist
      return NextResponse.json({
        totalPlans: 0,
        activeMigrations: 0,
        completedMigrations: 0,
        costSavings: 0,
        timeline: [],
      })
    }

    return NextResponse.json({
      totalPlans: metrics.totalPlans,
      activeMigrations: metrics.activeMigrations,
      completedMigrations: metrics.completedMigrations,
      costSavings: metrics.costSavings,
      timeline: metrics.timeline,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch migration metrics' },
      { status: 500 }
    )
  }
} 