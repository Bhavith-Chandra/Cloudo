import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface SpotRecommendation {
  id: string;
  provider: string;
  instanceType: string;
  region: string;
  currentType: string;
  savings: number;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  status: 'pending' | 'approved' | 'rejected';
}

export function SpotRecommendations() {
  const [recommendations, setRecommendations] = useState<SpotRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/spot/recommendations');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch spot instance recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const response = await fetch(`/api/spot/recommendations/${id}/approve`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recommendation approved successfully',
        });
        fetchRecommendations();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve recommendation',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (id: string) => {
    try {
      const response = await fetch(`/api/spot/recommendations/${id}/reject`, {
        method: 'POST',
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recommendation rejected successfully',
        });
        fetchRecommendations();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject recommendation',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading recommendations...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spot Instance Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Instance Type</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Current Type</TableHead>
              <TableHead>Savings</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recommendations.map((recommendation) => (
              <TableRow key={recommendation.id}>
                <TableCell>{recommendation.provider}</TableCell>
                <TableCell>{recommendation.instanceType}</TableCell>
                <TableCell>{recommendation.region}</TableCell>
                <TableCell>{recommendation.currentType}</TableCell>
                <TableCell>${recommendation.savings.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      recommendation.riskLevel === 'low'
                        ? 'success'
                        : recommendation.riskLevel === 'medium'
                        ? 'warning'
                        : 'destructive'
                    }
                  >
                    {recommendation.riskLevel}
                  </Badge>
                </TableCell>
                <TableCell>{recommendation.confidence}%</TableCell>
                <TableCell>
                  {recommendation.status === 'pending' && (
                    <div className="space-x-2">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(recommendation.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(recommendation.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {recommendation.status === 'approved' && (
                    <Badge variant="success">Approved</Badge>
                  )}
                  {recommendation.status === 'rejected' && (
                    <Badge variant="destructive">Rejected</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 