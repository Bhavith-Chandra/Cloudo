import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

interface DepartmentData {
  id: string;
  name: string;
  cost: number;
  percentage: number;
  projects: {
    id: string;
    name: string;
    cost: number;
    percentage: number;
  }[];
}

interface ChargebackReportProps {
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

export function ChargebackReport({ data, timeRange }: ChargebackReportProps) {
  const { toast } = useToast();

  // Mock data for demonstration
  const departmentData: DepartmentData[] = [
    {
      id: '1',
      name: 'Engineering',
      cost: 25000,
      percentage: 40,
      projects: [
        { id: '1-1', name: 'Frontend', cost: 10000, percentage: 40 },
        { id: '1-2', name: 'Backend', cost: 15000, percentage: 60 },
      ],
    },
    {
      id: '2',
      name: 'Marketing',
      cost: 15000,
      percentage: 24,
      projects: [
        { id: '2-1', name: 'Campaigns', cost: 10000, percentage: 66.67 },
        { id: '2-2', name: 'Analytics', cost: 5000, percentage: 33.33 },
      ],
    },
    {
      id: '3',
      name: 'Operations',
      cost: 12000,
      percentage: 19.2,
      projects: [
        { id: '3-1', name: 'Infrastructure', cost: 8000, percentage: 66.67 },
        { id: '3-2', name: 'Support', cost: 4000, percentage: 33.33 },
      ],
    },
    {
      id: '4',
      name: 'Finance',
      cost: 10000,
      percentage: 16,
      projects: [
        { id: '4-1', name: 'Reporting', cost: 6000, percentage: 60 },
        { id: '4-2', name: 'Analysis', cost: 4000, percentage: 40 },
      ],
    },
  ];

  const chartData = {
    labels: departmentData.map(item => item.name),
    datasets: [
      {
        data: departmentData.map(item => item.cost),
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
        text: 'Cost Allocation by Department',
      },
    },
  };

  const handleExport = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/finops/chargeback/export/${departmentId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chargeback-report-${departmentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export chargeback report',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cost Allocation Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Pie data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Department Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentData.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">{department.name}</TableCell>
                    <TableCell>${department.cost.toLocaleString()}</TableCell>
                    <TableCell>{department.percentage}%</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(department.id)}
                      >
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Project Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          {departmentData.map((department) => (
            <div key={department.id} className="mb-6">
              <h3 className="text-lg font-semibold mb-2">{department.name}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {department.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>{project.name}</TableCell>
                      <TableCell>${project.cost.toLocaleString()}</TableCell>
                      <TableCell>{project.percentage}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 