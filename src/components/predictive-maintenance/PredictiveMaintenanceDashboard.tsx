import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, XCircle, Activity, Zap, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HealthMetric {
  id: string;
  resourceId: string;
  provider: string;
  metricType: string;
  value: number;
  threshold: number;
  status: string;
  timestamp: string;
}

interface PredictiveMaintenance {
  id: string;
  resourceId: string;
  provider: string;
  resourceType: string;
  prediction: {
    riskScore: number;
    estimatedFailureTime: string;
    factors: string[];
  };
  status: string;
  severity: string;
  confidence: number;
  estimatedImpact: {
    cost: number;
    downtime: number;
  };
  preventiveActions: {
    type: string;
    description: string;
    estimatedTime: string;
    cost: number;
  }[];
}

export function PredictiveMaintenanceDashboard() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [predictions, setPredictions] = useState<PredictiveMaintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const [metricsRes, predictionsRes] = await Promise.all([
        fetch('/api/predictive-maintenance/metrics'),
        fetch('/api/predictive-maintenance/predictions'),
      ]);

      if (!metricsRes.ok || !predictionsRes.ok) {
        throw new Error('Failed to fetch maintenance data');
      }

      const [metricsData, predictionsData] = await Promise.all([
        metricsRes.json(),
        predictionsRes.json(),
      ]);

      setMetrics(metricsData);
      setPredictions(predictionsData);
    } catch (error) {
      toast.error('Failed to load maintenance data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAction = async (maintenanceId: string, action: any) => {
    try {
      const response = await fetch(`/api/predictive-maintenance/actions/${maintenanceId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error('Failed to execute action');
      }

      toast.success('Maintenance action executed successfully');
      fetchMaintenanceData();
    } catch (error) {
      toast.error('Failed to execute maintenance action');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'warning':
        return <Badge variant="warning">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Predictive Maintenance</h1>
        <div className="flex items-center space-x-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="metrics">Health Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Predictions</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictions.filter(p => p.severity === 'critical').length}
                </div>
                <Progress
                  value={predictions.filter(p => p.severity === 'critical').length * 20}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prevented Outages</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {predictions.filter(p => p.status === 'resolved').length}
                </div>
                <Progress
                  value={predictions.filter(p => p.status === 'resolved').length * 20}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${predictions.reduce((acc, p) => acc + p.estimatedImpact.cost, 0).toFixed(2)}
                </div>
                <Progress
                  value={predictions.reduce((acc, p) => acc + p.estimatedImpact.cost, 0) / 1000}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Health Metrics Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      name="Metric Value"
                    />
                    <Line
                      type="monotone"
                      dataKey="threshold"
                      stroke="#82ca9d"
                      name="Threshold"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Prediction</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {predictions.map((prediction) => (
                    <TableRow key={prediction.id}>
                      <TableCell>
                        <div className="font-medium">{prediction.resourceId}</div>
                        <div className="text-sm text-muted-foreground">
                          {prediction.resourceType}
                        </div>
                      </TableCell>
                      <TableCell>{prediction.provider}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>Risk Score: {prediction.prediction.riskScore}%</div>
                          <div className="text-sm text-muted-foreground">
                            Estimated Failure: {new Date(prediction.prediction.estimatedFailureTime).toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(prediction.severity)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>Cost: ${prediction.estimatedImpact.cost}</div>
                          <div>Downtime: {prediction.estimatedImpact.downtime}h</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          {prediction.preventiveActions.map((action, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleExecuteAction(prediction.id, action)}
                            >
                              {action.type}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics">
          <Card>
            <CardHeader>
              <CardTitle>Health Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Metric</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Threshold</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.map((metric) => (
                    <TableRow key={metric.id}>
                      <TableCell>
                        <div className="font-medium">{metric.resourceId}</div>
                        <div className="text-sm text-muted-foreground">
                          {metric.provider}
                        </div>
                      </TableCell>
                      <TableCell>{metric.metricType}</TableCell>
                      <TableCell>{metric.value.toFixed(2)}</TableCell>
                      <TableCell>{metric.threshold.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(metric.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 