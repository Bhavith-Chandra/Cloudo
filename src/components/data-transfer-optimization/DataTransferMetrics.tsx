import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricData {
  timestamp: string;
  totalTransfer: number;
  crossRegionTransfer: number;
  egressTransfer: number;
  cost: number;
}

export function DataTransferMetrics() {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/data-transfer/metrics?timeRange=${timeRange}`);
        const data = await response.json();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data transfer metrics',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [timeRange, toast]);

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  const chartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Total Transfer (GB)',
        data: metrics.map(m => m.totalTransfer),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Cross-Region Transfer (GB)',
        data: metrics.map(m => m.crossRegionTransfer),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
      {
        label: 'Egress Transfer (GB)',
        data: metrics.map(m => m.egressTransfer),
        borderColor: 'rgb(255, 159, 64)',
        tension: 0.1,
      },
      {
        label: 'Cost ($)',
        data: metrics.map(m => m.cost),
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Data Transfer Metrics',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Transfer Metrics</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <Line data={chartData} options={chartOptions} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Total Transfer</h3>
            <p className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.totalTransfer, 0).toFixed(2)} GB
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Cross-Region Transfer</h3>
            <p className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.crossRegionTransfer, 0).toFixed(2)} GB
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Egress Transfer</h3>
            <p className="text-2xl font-bold">
              {metrics.reduce((sum, m) => sum + m.egressTransfer, 0).toFixed(2)} GB
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="text-sm font-medium">Total Cost</h3>
            <p className="text-2xl font-bold">
              ${metrics.reduce((sum, m) => sum + m.cost, 0).toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 