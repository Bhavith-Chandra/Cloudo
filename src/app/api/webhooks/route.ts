import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const webhookSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string()),
  status: z.enum(['active', 'inactive']).default('active'),
})

export async function GET() {
  try {
    const webhooks = await prisma.webhook.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(webhooks)
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = webhookSchema.parse(body)

    const webhook = await prisma.webhook.create({
      data: {
        ...validatedData,
        secret: crypto.randomUUID(),
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error('Error creating webhook:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid webhook data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 }
    )
  }
} 