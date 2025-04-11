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
    const timeRange = searchParams.get('timeRange') || '30d';

    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Fetch cost data
    const costs = await prisma.cost.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch resource utilization data
    const utilization = await prisma.resourceUtilization.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Fetch chargeback data
    const chargeback = await prisma.chargeback.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        department: true,
      },
    });

    // Calculate totals and averages
    const totalCost = costs.reduce((sum, cost) => sum + cost.amount, 0);
    const totalSavings = costs.reduce((sum, cost) => sum + (cost.optimizedAmount || 0), 0);
    const averageUtilization = utilization.reduce((sum, util) => sum + util.percentage, 0) / utilization.length;

    // Group chargeback by department
    const departmentChargeback = chargeback.reduce((acc, item) => {
      const department = item.department.name;
      if (!acc[department]) {
        acc[department] = 0;
      }
      acc[department] += item.amount;
      return acc;
    }, {} as Record<string, number>);

    // Calculate percentages
    const totalChargeback = Object.values(departmentChargeback).reduce((sum, amount) => sum + amount, 0);
    const chargebackWithPercentage = Object.entries(departmentChargeback).map(([department, cost]) => ({
      department,
      cost,
      percentage: (cost / totalChargeback) * 100,
    }));

    return NextResponse.json({
      totalCost,
      savings: totalSavings,
      utilization: averageUtilization,
      chargeback: chargebackWithPercentage,
    });
  } catch (error) {
    console.error('Error fetching FinOps dashboard data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 