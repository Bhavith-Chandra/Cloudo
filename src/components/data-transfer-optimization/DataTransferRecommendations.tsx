import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Recommendation {
  id: string;
  type: string;
  description: string;
  currentCost: number;
  estimatedSavings: number;
  implementation: string;
  confidence: number;
  status: string;
}

export function DataTransferRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/data-transfer/recommendations');
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch optimization recommendations',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [toast]);

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      const response = await fetch(`/api/data-transfer/recommendations/${recommendationId}/apply`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recommendation applied successfully',
        });
        // Refresh recommendations
        const updatedResponse = await fetch('/api/data-transfer/recommendations');
        const updatedData = await updatedResponse.json();
        setRecommendations(updatedData);
      } else {
        throw new Error('Failed to apply recommendation');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply recommendation',
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
        <CardTitle>Optimization Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.length === 0 ? (
            <p>No recommendations available</p>
          ) : (
            <div className="space-y-4">
              {recommendations.map((recommendation) => (
                <div
                  key={recommendation.id}
                  className="flex flex-col space-y-4 p-4 border rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {recommendation.type}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {recommendation.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        Current Cost: ${recommendation.currentCost.toFixed(2)}
                      </p>
                      <p className="text-sm text-green-600 font-medium">
                        Estimated Savings: ${recommendation.estimatedSavings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Implementation: {recommendation.implementation}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {recommendation.confidence}%
                      </p>
                    </div>
                    <Button
                      onClick={() => handleApplyRecommendation(recommendation.id)}
                      disabled={recommendation.status === 'applied'}
                    >
                      {recommendation.status === 'applied' ? 'Applied' : 'Apply'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 