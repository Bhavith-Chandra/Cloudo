import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import PDFDocument from 'pdfkit'

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

    // Create PDF document
    const doc = new PDFDocument()
    const chunks: Uint8Array[] = []

    doc.on('data', chunk => chunks.push(chunk))

    // Add content to PDF
    doc.fontSize(20).text('Migration Plan', { align: 'center' })
    doc.moveDown()

    // Source Environment
    doc.fontSize(16).text('Source Environment')
    doc.fontSize(12)
    doc.text(`Type: ${plan.source.type}`)
    doc.text(`Compute: ${plan.source.resources.compute} vCPUs`)
    doc.text(`Storage: ${plan.source.resources.storage} TB`)
    doc.text(`Network: ${plan.source.resources.network} Gbps`)
    doc.moveDown()

    // Target Environment
    doc.fontSize(16).text('Target Environment')
    doc.fontSize(12)
    doc.text(`Provider: ${plan.target.type}`)
    doc.text(`Region: ${plan.target.region}`)
    doc.text(`Strategy: ${plan.target.strategy}`)
    doc.moveDown()

    // Timeline
    doc.fontSize(16).text('Migration Timeline')
    doc.fontSize(12)
    doc.text(`Assessment: ${new Date(plan.timeline.assessment).toLocaleDateString()}`)
    doc.text(`Planning: ${new Date(plan.timeline.planning).toLocaleDateString()}`)
    doc.text(`Migration: ${new Date(plan.timeline.migration).toLocaleDateString()}`)
    doc.text(`Optimization: ${new Date(plan.timeline.optimization).toLocaleDateString()}`)
    doc.moveDown()

    // Cost Estimate
    doc.fontSize(16).text('Cost Estimate')
    doc.fontSize(12)
    doc.text(`Upfront Cost: $${plan.costEstimate.upfront.toLocaleString()}`)
    doc.text(`Monthly Cost: $${plan.costEstimate.monthly.toLocaleString()}`)
    doc.text(`Potential Savings: $${plan.costEstimate.savings.toLocaleString()}`)

    // Finalize PDF
    doc.end()

    // Wait for PDF to be generated
    await new Promise(resolve => {
      doc.on('end', resolve)
    })

    // Combine chunks into a single buffer
    const pdfBuffer = Buffer.concat(chunks)

    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="migration-plan-${plan.id}.pdf"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export migration plan' },
      { status: 500 }
    )
  }
} 