import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SavingsData {
  category: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  percentage: number;
}

interface SavingsAnalysisProps {
  data: {
    totalCost: number;
    savings: number;
    utilization: number;
    chargeback: {
      department: string;
      cost: number;
      percentage: number;
    }[];
  } | null;
  timeRange: string;
}

export function SavingsAnalysis({ data, timeRange }: SavingsAnalysisProps) {
  // Mock data for demonstration
  const savingsData: SavingsData[] = [
    {
      category: 'Compute',
      currentCost: 25000,
      optimizedCost: 20000,
      savings: 5000,
      percentage: 20,
    },
    {
      category: 'Storage',
      currentCost: 15000,
      optimizedCost: 12000,
      savings: 3000,
      percentage: 20,
    },
    {
      category: 'Network',
      currentCost: 8000,
      optimizedCost: 6000,
      savings: 2000,
      percentage: 25,
    },
    {
      category: 'Database',
      currentCost: 12000,
      optimizedCost: 10000,
      savings: 2000,
      percentage: 16.67,
    },
  ];

  const chartData = {
    labels: savingsData.map(item => item.category),
    datasets: [
      {
        label: 'Current Cost',
        data: savingsData.map(item => item.currentCost),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Optimized Cost',
        data: savingsData.map(item => item.optimizedCost),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
        text: 'Cost Comparison by Category',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Savings by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Savings Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Current Cost</TableHead>
                <TableHead>Optimized Cost</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead>Savings %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingsData.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell>${item.currentCost.toLocaleString()}</TableCell>
                  <TableCell>${item.optimizedCost.toLocaleString()}</TableCell>
                  <TableCell className="text-green-600">
                    ${item.savings.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-green-600">
                    {item.percentage}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>Total</TableCell>
                <TableCell>
                  ${savingsData.reduce((sum, item) => sum + item.currentCost, 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  ${savingsData.reduce((sum, item) => sum + item.optimizedCost, 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-green-600">
                  ${savingsData.reduce((sum, item) => sum + item.savings, 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-green-600">
                  {((savingsData.reduce((sum, item) => sum + item.savings, 0) /
                    savingsData.reduce((sum, item) => sum + item.currentCost, 0)) * 100).toFixed(2)}%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 