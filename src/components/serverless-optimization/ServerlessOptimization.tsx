import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerlessFunctions } from './ServerlessFunctions';
import { ServerlessMetrics } from './ServerlessMetrics';
import { ServerlessRecommendations } from './ServerlessRecommendations';
import { ServerlessAudit } from './ServerlessAudit';
import { useToast } from '@/components/ui/use-toast';

export function ServerlessOptimization() {
  const [activeTab, setActiveTab] = useState('functions');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyRecommendations = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement recommendation application logic
      toast({
        title: 'Success',
        description: 'Serverless recommendations applied successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply serverless recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Serverless Optimization</h1>
        <Button 
          onClick={handleApplyRecommendations}
          disabled={isLoading}
        >
          {isLoading ? 'Applying...' : 'Apply Recommendations'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="functions">Functions</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="functions">
          <ServerlessFunctions />
        </TabsContent>

        <TabsContent value="metrics">
          <ServerlessMetrics />
        </TabsContent>

        <TabsContent value="recommendations">
          <ServerlessRecommendations />
        </TabsContent>

        <TabsContent value="audit">
          <ServerlessAudit />
        </TabsContent>
      </Tabs>
    </div>
  );
} 