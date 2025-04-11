import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SpotRecommendations } from './SpotRecommendations';
import { SpotSimulation } from './SpotSimulation';
import { SpotHistory } from './SpotHistory';
import { SpotSettings } from './SpotSettings';
import { useToast } from '@/components/ui/use-toast';

export function SpotOptimization() {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleApplyRecommendations = async () => {
    try {
      setIsLoading(true);
      // TODO: Implement recommendation application logic
      toast({
        title: 'Success',
        description: 'Spot instance recommendations applied successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to apply spot instance recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Spot Instance Optimization</h1>
        <Button 
          onClick={handleApplyRecommendations}
          disabled={isLoading}
        >
          {isLoading ? 'Applying...' : 'Apply Recommendations'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="simulation">Simulation</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <SpotRecommendations />
        </TabsContent>

        <TabsContent value="simulation">
          <SpotSimulation />
        </TabsContent>

        <TabsContent value="history">
          <SpotHistory />
        </TabsContent>

        <TabsContent value="settings">
          <SpotSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
} 