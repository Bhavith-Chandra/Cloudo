'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface MigrationMetrics {
  totalPlans: number
  activeMigrations: number
  completedMigrations: number
  costSavings: number
  timeline: {
    date: string
    plans: number
    migrations: number
  }[]
}

export function MigrationDashboard() {
  const [metrics, setMetrics] = useState<MigrationMetrics>({
    totalPlans: 0,
    activeMigrations: 0,
    completedMigrations: 0,
    costSavings: 0,
    timeline: [],
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/migration/metrics')
        if (!response.ok) throw new Error('Failed to fetch migration metrics')
        const data = await response.json()
        setMetrics(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch migration metrics',
          variant: 'destructive',
        })
      }
    }

    fetchMetrics()
  }, [toast])

  const chartData = {
    labels: metrics.timeline.map(item => item.date),
    datasets: [
      {
        label: 'Migration Plans',
        data: metrics.timeline.map(item => item.plans),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Active Migrations',
        data: metrics.timeline.map(item => item.migrations),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Migration Activity',
      },
    },
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalPlans}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Migrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.activeMigrations}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Migrations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.completedMigrations}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.costSavings.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Migration Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 