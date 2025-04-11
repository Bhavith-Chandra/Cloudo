import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface Recommendation {
  id: string;
  functionId: string;
  type: string;
  currentValue: number;
  recommendedValue: number;
  estimatedSavings: number;
  confidence: number;
  status: string;
}

export function ServerlessRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await fetch('/api/serverless/recommendations');
        const data = await response.json();
        setRecommendations(data);
      } catch (error) {
        console.error('Failed to fetch recommendations:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch serverless recommendations',
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
      const response = await fetch(`/api/serverless/recommendations/${recommendationId}/apply`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Recommendation applied successfully',
        });
        // Refresh recommendations
        const updatedResponse = await fetch('/api/serverless/recommendations');
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
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium">
                      {recommendation.type.charAt(0).toUpperCase() + recommendation.type.slice(1)} Optimization
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Current: {recommendation.currentValue} → Recommended: {recommendation.recommendedValue}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Estimated Savings: ${recommendation.estimatedSavings.toFixed(2)}
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
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 