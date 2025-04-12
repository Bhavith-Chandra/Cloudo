import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, XCircle, Activity, Zap, Clock, Cloud, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface Workload {
  id: string;
  name: string;
  type: string;
  sourceProvider: string;
  targetProvider: string;
  status: string;
  compatibilityScore: number;
  estimatedCost: number;
  estimatedSavings: number;
  migrationTime: number;
  risks: string[];
  lastUpdated: string;
}

interface Migration {
  id: string;
  workloadId: string;
  status: string;
  progress: number;
  startTime: string;
  endTime: string | null;
  cost: number;
  savings: number;
  logs: string[];
}

export function WorkloadPortabilityDashboard() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchWorkloadPortabilityData();
  }, []);

  const fetchWorkloadPortabilityData = async () => {
    try {
      const [workloadsRes, migrationsRes] = await Promise.all([
        fetch('/api/workload-portability/workloads'),
        fetch('/api/workload-portability/migrations'),
      ]);

      if (!workloadsRes.ok || !migrationsRes.ok) {
        throw new Error('Failed to fetch workload portability data');
      }

      const [workloadsData, migrationsData] = await Promise.all([
        workloadsRes.json(),
        migrationsRes.json(),
      ]);

      setWorkloads(workloadsData);
      setMigrations(migrationsData);
    } catch (error) {
      toast.error('Failed to load workload portability data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMigration = async (workloadId: string) => {
    try {
      const response = await fetch(`/api/workload-portability/migrations/${workloadId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to start migration');
      }

      toast.success('Migration started successfully');
      fetchWorkloadPortabilityData();
    } catch (error) {
      toast.error('Failed to start migration');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return <Badge variant="success">Ready</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
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
        <h1 className="text-3xl font-bold">Workload Portability</h1>
        <div className="flex items-center space-x-2">
          <Cloud className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="workloads">Workloads</TabsTrigger>
          <TabsTrigger value="migrations">Migrations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Migration Success Rate</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.5%</div>
                <Progress value={99.5} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${workloads.reduce((acc, w) => acc + w.estimatedSavings, 0).toFixed(2)}
                </div>
                <Progress
                  value={workloads.reduce((acc, w) => acc + w.estimatedSavings, 0) / 1000}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Migrations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {migrations.filter(m => m.status === 'in_progress').length}
                </div>
                <Progress
                  value={migrations.filter(m => m.status === 'in_progress').length * 20}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Migration Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={migrations}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="startTime" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      stroke="#8884d8"
                      name="Progress"
                    />
                    <Line
                      type="monotone"
                      dataKey="savings"
                      stroke="#82ca9d"
                      name="Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workloads">
          <Card>
            <CardHeader>
              <CardTitle>Workloads</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Compatibility</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workloads.map((workload) => (
                    <TableRow key={workload.id}>
                      <TableCell>
                        <div className="font-medium">{workload.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {workload.type}
                        </div>
                      </TableCell>
                      <TableCell>{workload.type}</TableCell>
                      <TableCell>{workload.sourceProvider}</TableCell>
                      <TableCell>{workload.targetProvider}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{workload.compatibilityScore}%</div>
                          <Progress value={workload.compatibilityScore} className="w-full" />
                        </div>
                      </TableCell>
                      <TableCell>${workload.estimatedSavings.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(workload.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStartMigration(workload.id)}
                        >
                          Start Migration
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migrations">
          <Card>
            <CardHeader>
              <CardTitle>Migrations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Workload</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Savings</TableHead>
                    <TableHead>Logs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {migrations.map((migration) => (
                    <TableRow key={migration.id}>
                      <TableCell>
                        <div className="font-medium">
                          {workloads.find(w => w.id === migration.workloadId)?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(migration.startTime).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(migration.status)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{migration.progress}%</div>
                          <Progress value={migration.progress} className="w-full" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {migration.endTime
                          ? `${Math.round(
                              (new Date(migration.endTime).getTime() -
                                new Date(migration.startTime).getTime()) /
                                60000
                            )}m`
                          : 'In Progress'}
                      </TableCell>
                      <TableCell>${migration.savings.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Logs
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Migration Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Provider Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={workloads}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="sourceProvider" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="estimatedSavings"
                            stroke="#8884d8"
                            name="Savings"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Workload Types</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={workloads}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="type" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="compatibilityScore"
                            stroke="#82ca9d"
                            name="Compatibility"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 