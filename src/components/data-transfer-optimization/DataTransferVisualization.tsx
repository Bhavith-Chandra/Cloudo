import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sankey } from 'react-vis';
import { useToast } from '@/components/ui/use-toast';

interface DataFlow {
  source: string;
  target: string;
  value: number;
  cost: number;
}

interface VisualizationData {
  nodes: Array<{
    name: string;
    color: string;
  }>;
  links: DataFlow[];
}

export function DataTransferVisualization() {
  const [data, setData] = useState<VisualizationData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/data-transfer/visualization?timeRange=${timeRange}`);
        const visualizationData = await response.json();
        setData(visualizationData);
      } catch (error) {
        console.error('Failed to fetch visualization data:', error);
        toast({
          title: 'Error',
          description: 'Failed to fetch data flow visualization',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange, toast]);

  if (isLoading) {
    return <div>Loading visualization...</div>;
  }

  if (!data) {
    return <div>No data available</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Data Flow Visualization</CardTitle>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1d">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <div className="h-[600px]">
          <Sankey
            nodes={data.nodes.map(node => ({
              name: node.name,
              color: node.color,
            }))}
            links={data.links.map(link => ({
              source: data.nodes.findIndex(n => n.name === link.source),
              target: data.nodes.findIndex(n => n.name === link.target),
              value: link.value,
            }))}
            width={800}
            height={600}
            nodeWidth={15}
            nodePadding={10}
            layout={24}
            align="justify"
            hasVoronoi={false}
          />
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Data Flow Details</h3>
          <div className="space-y-2">
            {data.links.map((link, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <span>
                  {link.source} → {link.target}
                </span>
                <span className="font-medium">
                  {link.value.toFixed(2)} GB (${link.cost.toFixed(2)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 