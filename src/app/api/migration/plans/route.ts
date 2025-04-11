import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateMigrationCost } from '@/lib/migration/cost-calculator'
import { generateMigrationTimeline } from '@/lib/migration/timeline-generator'

export async function GET() {
  try {
    const plans = await prisma.migrationPlan.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(plans)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch migration plans' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { source, target } = body

    // Calculate cost estimates
    const costEstimate = await calculateMigrationCost(source, target)

    // Generate migration timeline
    const timeline = generateMigrationTimeline(source, target)

    // Create migration plan
    const plan = await prisma.migrationPlan.create({
      data: {
        name: `Migration from ${source.type} to ${target.type}`,
        source: source,
        target: target,
        status: 'draft',
        costEstimate: costEstimate,
        timeline: timeline,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create migration plan' },
      { status: 500 }
    )
  }
} 