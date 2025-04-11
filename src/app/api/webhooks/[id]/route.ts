import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.webhook.delete({
      where: {
        id: params.id,
      },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const statusSchema = z.object({
      status: z.enum(['active', 'inactive']),
    })
    const { status } = statusSchema.parse(body)

    const webhook = await prisma.webhook.update({
      where: {
        id: params.id,
      },
      data: {
        status,
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error('Error updating webhook:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
} 