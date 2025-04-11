import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.migrationPlan.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch migration plan' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const plan = await prisma.migrationPlan.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete migration plan' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    const plan = await prisma.migrationPlan.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        status,
      },
    })

    return NextResponse.json(plan)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update migration plan' },
      { status: 500 }
    )
  }
} 