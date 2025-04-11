import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Progress } from '@/components/ui/progress';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface ResourceData {
  type: string;
  total: number;
  used: number;
  utilization: number;
  cost: number;
}

interface ResourceUtilizationProps {
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

export function ResourceUtilization({ data, timeRange }: ResourceUtilizationProps) {
  // Mock data for demonstration
  const resourceData: ResourceData[] = [
    {
      type: 'CPU',
      total: 100,
      used: 65,
      utilization: 65,
      cost: 15000,
    },
    {
      type: 'Memory',
      total: 500,
      used: 300,
      utilization: 60,
      cost: 10000,
    },
    {
      type: 'Storage',
      total: 1000,
      used: 450,
      utilization: 45,
      cost: 8000,
    },
    {
      type: 'Network',
      total: 200,
      used: 80,
      utilization: 40,
      cost: 5000,
    },
  ];

  const chartData = {
    labels: resourceData.map(item => item.type),
    datasets: [
      {
        data: resourceData.map(item => item.utilization),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Resource Utilization by Type',
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Doughnut data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {resourceData.map((resource) => (
              <div key={resource.type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{resource.type}</span>
                  <span className="text-sm text-muted-foreground">
                    {resource.used} / {resource.total} ({resource.utilization}%)
                  </span>
                </div>
                <Progress value={resource.utilization} className="h-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-medium">${resource.cost.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Efficiency Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {resourceData.map((resource) => (
              <div key={resource.type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{resource.type}</span>
                  <span className={`text-sm ${
                    resource.utilization > 80 ? 'text-red-600' :
                    resource.utilization < 30 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {resource.utilization > 80 ? 'Overutilized' :
                     resource.utilization < 30 ? 'Underutilized' :
                     'Optimal'}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {resource.utilization > 80 ? 
                    'Consider scaling up resources to prevent performance issues' :
                   resource.utilization < 30 ?
                    'Consider rightsizing or consolidating resources to reduce costs' :
                    'Resource utilization is within optimal range'}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 