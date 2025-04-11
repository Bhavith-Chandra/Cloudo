import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ResourceRecommendation {
  id: string;
  type: 'rightsizing' | 'termination' | 'storage_optimization';
  title: string;
  description: string;
  resourceId: string;
  provider: 'aws' | 'azure' | 'gcp';
  service: string;
  currentCost: number;
  estimatedSavings: number;
  confidenceScore: number;
  impact: 'high' | 'medium' | 'low';
  implementationComplexity: 'easy' | 'medium' | 'hard';
  explanation: string;
  metrics: {
    cpuUtilization: number;
    memoryUtilization: number;
    storageUtilization: number;
    networkUtilization: number;
  };
}

interface ResourcePrediction {
  date: string;
  predictedUtilization: number;
  confidenceInterval: [number, number];
}

export default function ResourceOptimizationEngine() {
  const [recommendations, setRecommendations] = useState<ResourceRecommendation[]>([]);
  const [predictions, setPredictions] = useState<ResourcePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedProvider, setSelectedProvider] = useState<'all' | 'aws' | 'azure' | 'gcp'>('all');
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');

  useEffect(() => {
    fetchRecommendations();
    fetchPredictions();
  }, [selectedTimeframe, selectedProvider, selectedResourceType]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/resource-optimization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          provider: selectedProvider,
          resourceType: selectedResourceType,
        }),
      });
      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/resource-optimization/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          provider: selectedProvider,
          resourceType: selectedResourceType,
        }),
      });
      const data = await response.json();
      setPredictions(data.predictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const handleAction = async (recommendationId: string, action: 'approve' | 'schedule' | 'reject') => {
    try {
      const response = await fetch('/api/resource-optimization/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recommendationId,
          action,
        }),
      });
      if (response.ok) {
        fetchRecommendations();
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const chartData = {
    labels: predictions.map((p) => p.date),
    datasets: [
      {
        label: 'Predicted Utilization',
        data: predictions.map((p) => p.predictedUtilization),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Confidence Interval',
        data: predictions.map((p) => p.confidenceInterval[1]),
        borderColor: 'rgba(75, 192, 192, 0.2)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Resource Optimization Engine</h2>
        
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Timeframe
            </label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cloud Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as any)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Providers</option>
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">GCP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resource Type
            </label>
            <select
              value={selectedResourceType}
              onChange={(e) => setSelectedResourceType(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="all">All Resources</option>
              <option value="vm">Virtual Machines</option>
              <option value="storage">Storage</option>
              <option value="database">Databases</option>
            </select>
          </div>
        </div>

        {/* Resource Utilization Chart */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Resource Utilization Trends</h3>
          <div className="bg-white p-4 rounded-lg shadow">
            <Line data={chartData} />
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <h3 className="text-lg font-medium mb-4">Optimization Recommendations</h3>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-medium">{rec.title}</h4>
                      <p className="text-gray-600 mt-1">{rec.description}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {rec.explanation}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ${rec.estimatedSavings.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        Confidence: {rec.confidenceScore}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-4">
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      {rec.impact} impact
                    </span>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                      {rec.implementationComplexity} to implement
                    </span>
                  </div>
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700">
                      Resource Metrics:
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                      <div>
                        <span className="text-sm text-gray-500">CPU</span>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{ width: `${rec.metrics.cpuUtilization}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Memory</span>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-green-600 h-2.5 rounded-full"
                            style={{ width: `${rec.metrics.memoryUtilization}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Storage</span>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-yellow-600 h-2.5 rounded-full"
                            style={{ width: `${rec.metrics.storageUtilization}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Network</span>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-red-600 h-2.5 rounded-full"
                            style={{ width: `${rec.metrics.networkUtilization}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end space-x-2">
                    <button
                      onClick={() => handleAction(rec.id, 'approve')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleAction(rec.id, 'schedule')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Schedule
                    </button>
                    <button
                      onClick={() => handleAction(rec.id, 'reject')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 