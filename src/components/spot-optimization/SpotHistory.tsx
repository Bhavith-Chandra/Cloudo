import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface SpotHistory {
  id: string;
  provider: string;
  instanceType: string;
  region: string;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'interrupted' | 'completed';
  savings: number;
  reason: string | null;
}

export function SpotHistory() {
  const [history, setHistory] = useState<SpotHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const { toast } = useToast();

  useEffect(() => {
    fetchHistory();
  }, [timeRange]);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/spot/history?timeRange=${timeRange}`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch spot instance history',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading history...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Spot Instance History</CardTitle>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Instance Type</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Savings</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.provider}</TableCell>
                  <TableCell>{item.instanceType}</TableCell>
                  <TableCell>{item.region}</TableCell>
                  <TableCell>
                    {new Date(item.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {item.endTime
                      ? new Date(item.endTime).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        item.status === 'running'
                          ? 'success'
                          : item.status === 'interrupted'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${item.savings.toFixed(2)}</TableCell>
                  <TableCell>{item.reason || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 