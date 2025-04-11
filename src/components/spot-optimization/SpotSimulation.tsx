import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/components/ui/use-toast';

interface SimulationResult {
  estimatedSavings: number;
  riskOfInterruption: number;
  confidence: number;
  recommendedRegions: string[];
}

export function SpotSimulation() {
  const [provider, setProvider] = useState('aws');
  const [instanceType, setInstanceType] = useState('');
  const [region, setRegion] = useState('');
  const [duration, setDuration] = useState(24);
  const [riskTolerance, setRiskTolerance] = useState(50);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSimulate = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/spot/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          instanceType,
          region,
          duration,
          riskTolerance,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to run simulation',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spot Instance Simulation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Cloud Provider</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws">AWS</SelectItem>
                  <SelectItem value="azure">Azure</SelectItem>
                  <SelectItem value="gcp">GCP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instanceType">Instance Type</Label>
              <Input
                id="instanceType"
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                placeholder="e.g., t3.large"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g., us-east-1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={1}
                max={720}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Risk Tolerance</Label>
            <Slider
              value={[riskTolerance]}
              onValueChange={([value]) => setRiskTolerance(value)}
              min={0}
              max={100}
              step={1}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          <Button onClick={handleSimulate} disabled={isLoading}>
            {isLoading ? 'Simulating...' : 'Run Simulation'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Estimated Savings</Label>
                <div className="text-2xl font-bold text-green-600">
                  ${result.estimatedSavings.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Risk of Interruption</Label>
                <div className="text-2xl font-bold text-red-600">
                  {result.riskOfInterruption}%
                </div>
              </div>

              <div className="space-y-2">
                <Label>Confidence</Label>
                <div className="text-2xl font-bold text-blue-600">
                  {result.confidence}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Recommended Regions</Label>
              <div className="flex flex-wrap gap-2">
                {result.recommendedRegions.map((region) => (
                  <span
                    key={region}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md"
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 