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

interface DisasterRecoveryPlan {
  id: string;
  name: string;
  status: string;
  rto: number;
  rpo: number;
  cost: number;
  confidence: number;
  sourceProvider: string;
  targetProvider: string;
  sourceRegion: string;
  targetRegion: string;
  lastTested: string | null;
  nextTest: string | null;
}

interface DisasterRecoveryRisk {
  id: string;
  resourceId: string;
  provider: string;
  riskType: string;
  riskScore: number;
  probability: number;
  impact: string;
  timeframe: string;
  factors: string[];
  mitigation: string[];
  status: string;
}

interface DisasterRecoveryTest {
  id: string;
  status: string;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  successRate: number | null;
  dataRecovery: number | null;
  rtoAchieved: number | null;
  rpoAchieved: number | null;
  cost: number | null;
}

export function DisasterRecoveryDashboard() {
  const [plans, setPlans] = useState<DisasterRecoveryPlan[]>([]);
  const [risks, setRisks] = useState<DisasterRecoveryRisk[]>([]);
  const [tests, setTests] = useState<DisasterRecoveryTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchDisasterRecoveryData();
  }, []);

  const fetchDisasterRecoveryData = async () => {
    try {
      const [plansRes, risksRes, testsRes] = await Promise.all([
        fetch('/api/disaster-recovery/plans'),
        fetch('/api/disaster-recovery/risks'),
        fetch('/api/disaster-recovery/tests'),
      ]);

      if (!plansRes.ok || !risksRes.ok || !testsRes.ok) {
        throw new Error('Failed to fetch disaster recovery data');
      }

      const [plansData, risksData, testsData] = await Promise.all([
        plansRes.json(),
        risksRes.json(),
        testsRes.json(),
      ]);

      setPlans(plansData);
      setRisks(risksData);
      setTests(testsData);
    } catch (error) {
      toast.error('Failed to load disaster recovery data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteTest = async (planId: string) => {
    try {
      const response = await fetch(`/api/disaster-recovery/tests/${planId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to execute test');
      }

      toast.success('Disaster recovery test started successfully');
      fetchDisasterRecoveryData();
    } catch (error) {
      toast.error('Failed to execute disaster recovery test');
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
        <h1 className="text-3xl font-bold">Disaster Recovery</h1>
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
          <TabsTrigger value="plans">Recovery Plans</TabsTrigger>
          <TabsTrigger value="risks">Risk Assessment</TabsTrigger>
          <TabsTrigger value="tests">Recovery Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {risks.filter(r => r.impact === 'critical').length}
                </div>
                <Progress
                  value={risks.filter(r => r.impact === 'critical').length * 20}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recovery Plans</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plans.length}</div>
                <Progress
                  value={plans.filter(p => p.status === 'active').length * 20}
                  className="mt-2"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Test Success Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tests.length > 0
                    ? `${Math.round(
                        (tests.reduce((acc, t) => acc + (t.successRate || 0), 0) /
                          tests.length) *
                          100
                      )}%`
                    : 'N/A'}
                </div>
                <Progress
                  value={
                    tests.length > 0
                      ? (tests.reduce((acc, t) => acc + (t.successRate || 0), 0) /
                          tests.length) *
                        100
                      : 0
                  }
                  className="mt-2"
                />
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Risk Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={risks}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timeframe" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="riskScore"
                      stroke="#8884d8"
                      name="Risk Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="probability"
                      stroke="#82ca9d"
                      name="Probability"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>RTO/RPO</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Test</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {plan.sourceRegion} → {plan.targetRegion}
                        </div>
                      </TableCell>
                      <TableCell>{plan.sourceProvider}</TableCell>
                      <TableCell>{plan.targetProvider}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>RTO: {plan.rto}m</div>
                          <div>RPO: {plan.rpo}m</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(plan.status)}</TableCell>
                      <TableCell>
                        {plan.lastTested
                          ? new Date(plan.lastTested).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteTest(plan.id)}
                        >
                          Run Test
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle>Risk Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Resource</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Risk Type</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Timeframe</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {risks.map((risk) => (
                    <TableRow key={risk.id}>
                      <TableCell>
                        <div className="font-medium">{risk.resourceId}</div>
                        <div className="text-sm text-muted-foreground">
                          {risk.riskType}
                        </div>
                      </TableCell>
                      <TableCell>{risk.provider}</TableCell>
                      <TableCell>{risk.riskType}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{risk.riskScore.toFixed(1)}</div>
                          <Progress value={risk.riskScore} className="w-full" />
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(risk.impact)}</TableCell>
                      <TableCell>{risk.timeframe}</TableCell>
                      <TableCell>{getStatusBadge(risk.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Recovery Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Success Rate</TableHead>
                    <TableHead>Data Recovery</TableHead>
                    <TableHead>RTO/RPO Achieved</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test) => (
                    <TableRow key={test.id}>
                      <TableCell>
                        <div className="font-medium">
                          {plans.find((p) => p.id === test.id)?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(test.startTime).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(test.status)}</TableCell>
                      <TableCell>
                        {test.duration ? `${test.duration}m` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {test.successRate
                          ? `${(test.successRate * 100).toFixed(1)}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {test.dataRecovery
                          ? `${(test.dataRecovery * 100).toFixed(1)}%`
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>RTO: {test.rtoAchieved || 'N/A'}m</div>
                          <div>RPO: {test.rpoAchieved || 'N/A'}m</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {test.cost ? `$${test.cost.toFixed(2)}` : 'N/A'}
                      </TableCell>
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