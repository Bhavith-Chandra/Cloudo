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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface EmissionsData {
  date: string
  aws: number
  azure: number
  gcp: number
  total: number
}

export function CarbonEmissionsChart() {
  const [timeRange, setTimeRange] = useState('30d')
  const [emissionsData, setEmissionsData] = useState<EmissionsData[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchEmissionsData = async () => {
      try {
        const response = await fetch(`/api/carbon-footprint/emissions?timeRange=${timeRange}`)
        if (!response.ok) throw new Error('Failed to fetch emissions data')
        const data = await response.json()
        setEmissionsData(data)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch emissions data',
          variant: 'destructive',
        })
      }
    }

    fetchEmissionsData()
  }, [timeRange, toast])

  const chartData = {
    labels: emissionsData.map(item => item.date),
    datasets: [
      {
        label: 'AWS',
        data: emissionsData.map(item => item.aws),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Azure',
        data: emissionsData.map(item => item.azure),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'GCP',
        data: emissionsData.map(item => item.gcp),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Total',
        data: emissionsData.map(item => item.total),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderWidth: 2,
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
        text: 'Carbon Emissions by Cloud Provider',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'CO₂e (kg)',
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Emissions Trend</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="1y">Last year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  )
} 