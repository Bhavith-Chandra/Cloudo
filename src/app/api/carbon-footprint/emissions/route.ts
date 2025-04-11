import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateEmissions } from '@/lib/carbon-footprint/calculator'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
      default:
        startDate.setDate(endDate.getDate() - 30)
    }

    // Fetch resource usage data
    const resourceUsage = await prisma.resourceUsage.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        provider: true,
        region: true,
      },
    })

    // Calculate emissions for each day
    const emissionsByDay = resourceUsage.reduce((acc, usage) => {
      const date = usage.timestamp.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = {
          date,
          aws: 0,
          azure: 0,
          gcp: 0,
          total: 0,
        }
      }

      const emissions = calculateEmissions(usage)
      acc[date][usage.provider.name.toLowerCase()] += emissions
      acc[date].total += emissions

      return acc
    }, {} as Record<string, { date: string; aws: number; azure: number; gcp: number; total: number }>)

    // Convert to array and sort by date
    const emissionsData = Object.values(emissionsByDay).sort((a, b) =>
      a.date.localeCompare(b.date)
    )

    return NextResponse.json(emissionsData)
  } catch (error) {
    console.error('Error fetching emissions data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch emissions data' },
      { status: 500 }
    )
  }
} 