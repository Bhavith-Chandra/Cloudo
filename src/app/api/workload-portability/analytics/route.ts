import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface Migration {
  status: string;
  startTime: Date;
  endTime: Date | null;
  workload: {
    sourceProvider: string;
    targetProvider: string;
  };
}

interface Workload {
  sourceProvider: string;
  targetProvider: string;
  estimatedSavings: number;
}

interface WorkloadRisk {
  severity: string;
  impact: string;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return new NextResponse('Missing analytics type', { status: 400 });
    }

    let analytics;

    switch (type) {
      case 'success_rate':
        analytics = await getSuccessRateAnalytics();
        break;
      case 'cost_savings':
        analytics = await getCostSavingsAnalytics();
        break;
      case 'migration_time':
        analytics = await getMigrationTimeAnalytics();
        break;
      case 'risk_distribution':
        analytics = await getRiskDistributionAnalytics();
        break;
      default:
        return new NextResponse('Invalid analytics type', { status: 400 });
    }

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching migration analytics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

async function getSuccessRateAnalytics() {
  const migrations = await prisma.migration.findMany();
  
  const total = migrations.length;
  const successful = migrations.filter((m: Migration) => m.status === 'completed').length;
  const failed = migrations.filter((m: Migration) => m.status === 'failed').length;
  
  return {
    successRate: total > 0 ? (successful / total) * 100 : 0,
    total,
    successful,
    failed,
  };
}

async function getCostSavingsAnalytics() {
  const workloads = await prisma.workload.findMany();
  
  const totalSavings = workloads.reduce((acc: number, w: Workload) => acc + w.estimatedSavings, 0);
  const averageSavings = workloads.length > 0 ? totalSavings / workloads.length : 0;
  
  return {
    totalSavings,
    averageSavings,
    savingsByProvider: workloads.reduce((acc: Record<string, number>, w: Workload) => {
      const key = `${w.sourceProvider}->${w.targetProvider}`;
      acc[key] = (acc[key] || 0) + w.estimatedSavings;
      return acc;
    }, {}),
  };
}

async function getMigrationTimeAnalytics() {
  const migrations = await prisma.migration.findMany({
    where: {
      endTime: {
        not: null,
      },
    },
  });
  
  const times = migrations.map((m: Migration) => {
    const start = new Date(m.startTime).getTime();
    const end = new Date(m.endTime!).getTime();
    return (end - start) / 1000 / 60; // Convert to minutes
  });
  
  const averageTime = times.length > 0
    ? times.reduce((acc: number, t: number) => acc + t, 0) / times.length
    : 0;
  
  return {
    averageTime,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
    timeByProvider: migrations.reduce((acc: Record<string, number>, m: Migration) => {
      const key = `${m.workload.sourceProvider}->${m.workload.targetProvider}`;
      const time = (new Date(m.endTime!).getTime() - new Date(m.startTime).getTime()) / 1000 / 60;
      acc[key] = (acc[key] || 0) + time;
      return acc;
    }, {}),
  };
}

async function getRiskDistributionAnalytics() {
  const risks = await prisma.workloadRisk.findMany();
  
  return {
    totalRisks: risks.length,
    risksBySeverity: risks.reduce((acc: Record<string, number>, r: WorkloadRisk) => {
      acc[r.severity] = (acc[r.severity] || 0) + 1;
      return acc;
    }, {}),
    risksByImpact: risks.reduce((acc: Record<string, number>, r: WorkloadRisk) => {
      acc[r.impact] = (acc[r.impact] || 0) + 1;
      return acc;
    }, {}),
  };
} 