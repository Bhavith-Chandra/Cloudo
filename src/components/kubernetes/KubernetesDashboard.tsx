import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Chart } from '@/components/ui/chart';
import { Loader2, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ClusterMetrics {
  id: string;
  name: string;
  provider: 'AWS' | 'Azure' | 'GCP';
  status: string;
  nodes: number;
  pods: number;
  cpuUtilization: number;
  memoryUtilization: number;
  cost: number;
  costEfficiency: number;
}

interface PodMetrics {
  id: string;
  name: string;
  namespace: string;
  status: string;
  cpuRequest: number;
  cpuLimit: number;
  memoryRequest: number;
  memoryLimit: number;
  cpuUsage: number;
  memoryUsage: number;
  cost: number;
  recommendations: {
    type: 'rightsize' | 'scale' | 'schedule';
    description: string;
    estimatedSavings: number;
  }[];
}

interface NamespaceMetrics {
  id: string;
  name: string;
  pods: number;
  cpuUsage: number;
  memoryUsage: number;
  cost: number;
  costEfficiency: number;
  complianceStatus: string;
}

export function KubernetesDashboard() {
  const [clusters, setClusters] = useState<ClusterMetrics[]>([]);
  const [pods, setPods] = useState<PodMetrics[]>([]);
  const [namespaces, setNamespaces] = useState<NamespaceMetrics[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClusterMetrics();
  }, []);

  const fetchClusterMetrics = async () => {
    try {
      const response = await fetch('/api/kubernetes/clusters');
      if (!response.ok) throw new Error('Failed to fetch cluster metrics');
      const data = await response.json();
      setClusters(data);
      if (data.length > 0) {
        setSelectedCluster(data[0].id);
        fetchPodMetrics(data[0].id);
        fetchNamespaceMetrics(data[0].id);
      }
    } catch (error) {
      toast.error('Failed to load cluster metrics');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPodMetrics = async (clusterId: string) => {
    try {
      const response = await fetch(`/api/kubernetes/pods?clusterId=${clusterId}`);
      if (!response.ok) throw new Error('Failed to fetch pod metrics');
      const data = await response.json();
      setPods(data);
    } catch (error) {
      toast.error('Failed to load pod metrics');
      console.error(error);
    }
  };

  const fetchNamespaceMetrics = async (clusterId: string) => {
    try {
      const response = await fetch(`/api/kubernetes/namespaces?clusterId=${clusterId}`);
      if (!response.ok) throw new Error('Failed to fetch namespace metrics');
      const data = await response.json();
      setNamespaces(data);
    } catch (error) {
      toast.error('Failed to load namespace metrics');
      console.error(error);
    }
  };

  const handleOptimizePod = async (podId: string, recommendation: any) => {
    try {
      const response = await fetch('/api/kubernetes/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          podId,
          recommendation,
        }),
      });

      if (!response.ok) throw new Error('Failed to optimize pod');
      
      const result = await response.json();
      toast.success(`Optimized pod, estimated savings: $${result.estimatedSavings}/month`);
      fetchPodMetrics(selectedCluster);
    } catch (error) {
      toast.error('Failed to optimize pod');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'running':
        return <Badge variant="success">Running</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Kubernetes Optimization</h1>
        <Select
          value={selectedCluster}
          onValueChange={(value) => {
            setSelectedCluster(value);
            fetchPodMetrics(value);
            fetchNamespaceMetrics(value);
          }}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select cluster" />
          </SelectTrigger>
          <SelectContent>
            {clusters.map((cluster) => (
              <SelectItem key={cluster.id} value={cluster.id}>
                {cluster.name} ({cluster.provider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pods">Pods</TabsTrigger>
          <TabsTrigger value="namespaces">Namespaces</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clusters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clusters.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pods.length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${clusters.reduce((sum, cluster) => sum + cluster.cost, 0).toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average CPU Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clusters.reduce((sum, cluster) => sum + cluster.cpuUtilization, 0) / clusters.length}%
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Cluster Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  type="pie"
                  data={{
                    labels: clusters.map((c) => c.name),
                    datasets: [
                      {
                        data: clusters.map((c) => c.cost),
                      },
                    ],
                  }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  type="bar"
                  data={{
                    labels: clusters.map((c) => c.name),
                    datasets: [
                      {
                        label: 'CPU',
                        data: clusters.map((c) => c.cpuUtilization),
                      },
                      {
                        label: 'Memory',
                        data: clusters.map((c) => c.memoryUtilization),
                      },
                    ],
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pods">
          <Card>
            <CardHeader>
              <CardTitle>Pod Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CPU Usage</TableHead>
                    <TableHead>Memory Usage</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pods.map((pod) => (
                    <TableRow key={pod.id}>
                      <TableCell>{pod.name}</TableCell>
                      <TableCell>{pod.namespace}</TableCell>
                      <TableCell>{getStatusBadge(pod.status)}</TableCell>
                      <TableCell>{pod.cpuUsage}%</TableCell>
                      <TableCell>{pod.memoryUsage}%</TableCell>
                      <TableCell>${pod.cost.toFixed(2)}</TableCell>
                      <TableCell>
                        {pod.recommendations.map((rec, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="mr-2"
                            onClick={() => handleOptimizePod(pod.id, rec)}
                          >
                            {rec.type}
                          </Button>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="namespaces">
          <Card>
            <CardHeader>
              <CardTitle>Namespace Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Pods</TableHead>
                    <TableHead>CPU Usage</TableHead>
                    <TableHead>Memory Usage</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Cost Efficiency</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {namespaces.map((ns) => (
                    <TableRow key={ns.id}>
                      <TableCell>{ns.name}</TableCell>
                      <TableCell>{ns.pods}</TableCell>
                      <TableCell>{ns.cpuUsage}%</TableCell>
                      <TableCell>{ns.memoryUsage}%</TableCell>
                      <TableCell>${ns.cost.toFixed(2)}</TableCell>
                      <TableCell>{ns.costEfficiency}%</TableCell>
                      <TableCell>
                        {ns.complianceStatus === 'compliant' ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pods
                    .filter((pod) => pod.recommendations.length > 0)
                    .map((pod) => (
                      <div key={pod.id} className="border rounded-lg p-4">
                        <div className="font-medium">{pod.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {pod.namespace}
                        </div>
                        <div className="mt-2 space-y-2">
                          {pod.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{rec.type}</div>
                                <div className="text-sm text-muted-foreground">
                                  {rec.description}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  ${rec.estimatedSavings}/month
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleOptimizePod(pod.id, rec)}
                                >
                                  Apply
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Scaling</CardTitle>
              </CardHeader>
              <CardContent>
                <Chart
                  type="line"
                  data={{
                    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                    datasets: [
                      {
                        label: 'Current Usage',
                        data: [65, 59, 80, 81, 56, 55, 40],
                      },
                      {
                        label: 'Predicted Usage',
                        data: [70, 65, 85, 85, 60, 60, 45],
                        borderDash: [5, 5],
                      },
                    ],
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 