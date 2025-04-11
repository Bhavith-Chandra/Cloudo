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
import { Progress } from '@/components/ui/progress'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

interface SecurityScoreData {
  date: string
  score: number
  critical: number
  high: number
  medium: number
  low: number
}

export function SecurityScore() {
  const [scoreData, setScoreData] = useState<SecurityScoreData[]>([])
  const [currentScore, setCurrentScore] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSecurityScore = async () => {
      try {
        const response = await fetch('/api/security-compliance/score')
        if (!response.ok) throw new Error('Failed to fetch security score')
        const data = await response.json()
        setScoreData(data.history)
        setCurrentScore(data.currentScore)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch security score',
          variant: 'destructive',
        })
      }
    }

    fetchSecurityScore()
  }, [toast])

  const chartData = {
    labels: scoreData.map(item => item.date),
    datasets: [
      {
        label: 'Security Score',
        data: scoreData.map(item => item.score),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
        text: 'Security Score Trend',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score',
        },
      },
    },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">{currentScore}</div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>
          <Progress value={currentScore} className="h-2" />
          <div className="h-[200px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 