import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, AlertCircle, CheckCircle2, XCircle, Brain, Zap, Leaf } from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  confidence: number;
}

interface OptimizationRecommendation {
  id: string;
  title: string;
  description: string;
  impact: {
    cost: number;
    performance: number;
    carbon: number;
  };
  confidence: number;
  status: 'pending' | 'applied' | 'failed';
  explanation: string;
}

interface AIPrediction {
  timestamp: string;
  predicted: number;
  actual: number;
  accuracy: number;
}

export function AIOptimizationCore() {
  const [metrics, setMetrics] = useState<OptimizationMetric[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchOptimizationData();
  }, []);

  const fetchOptimizationData = async () => {
    try {
      const [metricsRes, recommendationsRes, predictionsRes] = await Promise.all([
        fetch('/api/ai-optimization/metrics'),
        fetch('/api/ai-optimization/recommendations'),
        fetch('/api/ai-optimization/predictions'),
      ]);

      if (!metricsRes.ok || !recommendationsRes.ok || !predictionsRes.ok) {
        throw new Error('Failed to fetch optimization data');
      }

      const [metricsData, recommendationsData, predictionsData] = await Promise.all([
        metricsRes.json(),
        recommendationsRes.json(),
        predictionsRes.json(),
      ]);

      setMetrics(metricsData);
      setRecommendations(recommendationsData);
      setPredictions(predictionsData);
    } catch (error) {
      toast.error('Failed to load optimization data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/ai-optimization/apply/${recommendationId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to apply recommendation');
      }

      const result = await response.json();
      toast.success(result.message);
      fetchOptimizationData();
    } catch (error) {
      toast.error('Failed to apply recommendation');
      console.error(error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'applied':
        return <Badge variant="success">Applied</Badge>;
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
        <h1 className="text-3xl font-bold">AI Optimization Core</h1>
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-sm text-muted-foreground">
            Accuracy: {predictions[predictions.length - 1]?.accuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="accuracy">Accuracy</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Optimization</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${metrics.find(m => m.name === 'cost')?.current.toFixed(2)}
                </div>
                <Progress
                  value={metrics.find(m => m.name === 'cost')?.confidence}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Performance</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.find(m => m.name === 'performance')?.current.toFixed(1)}%
                </div>
                <Progress
                  value={metrics.find(m => m.name === 'performance')?.confidence}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carbon Reduction</CardTitle>
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics.find(m => m.name === 'carbon')?.current.toFixed(1)}%
                </div>
                <Progress
                  value={metrics.find(m => m.name === 'carbon')?.confidence}
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Optimization Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8884d8"
                      name="Predicted"
                    />
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke="#82ca9d"
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommendations.map((recommendation) => (
                    <TableRow key={recommendation.id}>
                      <TableCell>
                        <div className="font-medium">{recommendation.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {recommendation.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>Cost: ${recommendation.impact.cost.toFixed(2)}</div>
                          <div>Performance: {recommendation.impact.performance}%</div>
                          <div>Carbon: {recommendation.impact.carbon}%</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Progress value={recommendation.confidence} />
                      </TableCell>
                      <TableCell>{getStatusBadge(recommendation.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApplyRecommendation(recommendation.id)}
                          disabled={recommendation.status === 'applied'}
                        >
                          Apply
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="accuracy">
          <Card>
            <CardHeader>
              <CardTitle>AI Accuracy Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Prediction Accuracy</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {predictions[predictions.length - 1]?.accuracy.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Last 30 days average
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Model Confidence</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {metrics.reduce((acc, m) => acc + m.confidence, 0) / metrics.length}%
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Overall confidence
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={predictions}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timestamp" />
                      <YAxis domain={[95, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="accuracy"
                        stroke="#8884d8"
                        name="Accuracy"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 