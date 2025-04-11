import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useSession } from 'next-auth/react';
import { CostOverview } from './CostOverview';
import { SavingsAnalysis } from './SavingsAnalysis';
import { ResourceUtilization } from './ResourceUtilization';
import { ChargebackReport } from './ChargebackReport';
import { ExportDialog } from './ExportDialog';

interface DashboardData {
  totalCost: number;
  savings: number;
  utilization: number;
  chargeback: {
    department: string;
    cost: number;
    percentage: number;
  }[];
}

export function FinOpsDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch(`/api/finops/dashboard?timeRange=${selectedTimeRange}`);
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch dashboard data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedTimeRange, toast]);

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch(`/api/finops/export?format=${format}&timeRange=${selectedTimeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finops-report-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export report',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">FinOps Dashboard</h1>
        <div className="flex gap-4">
          <Button onClick={() => setShowExportDialog(true)}>
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Cost Overview</TabsTrigger>
          <TabsTrigger value="savings">Savings Analysis</TabsTrigger>
          <TabsTrigger value="utilization">Resource Utilization</TabsTrigger>
          {session?.user?.role === 'admin' && (
            <TabsTrigger value="chargeback">Chargeback</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          <CostOverview data={data} timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="savings">
          <SavingsAnalysis data={data} timeRange={selectedTimeRange} />
        </TabsContent>

        <TabsContent value="utilization">
          <ResourceUtilization data={data} timeRange={selectedTimeRange} />
        </TabsContent>

        {session?.user?.role === 'admin' && (
          <TabsContent value="chargeback">
            <ChargebackReport data={data} timeRange={selectedTimeRange} />
          </TabsContent>
        )}
      </Tabs>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        onExport={handleExport}
      />
    </div>
  );
} 