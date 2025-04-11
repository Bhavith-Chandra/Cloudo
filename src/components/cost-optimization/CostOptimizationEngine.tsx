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

interface Recommendation {
  id: string;
  type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'storage_optimization';
  title: string;
  description: string;
  estimatedSavings: number;
  confidenceScore: number;
  impact: 'high' | 'medium' | 'low';
  affectedResources: string[];
  implementationComplexity: 'easy' | 'medium' | 'hard';
  explanation: string;
}

interface CostPrediction {
  date: string;
  predictedCost: number;
  confidenceInterval: [number, number];
}

export default function CostOptimizationEngine() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [predictions, setPredictions] = useState<CostPrediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [simulationInput, setSimulationInput] = useState({
    newDeployments: 0,
    expectedGrowth: 0,
    plannedChanges: '',
  });

  useEffect(() => {
    fetchRecommendations();
    fetchPredictions();
  }, [selectedTimeframe]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cost-optimization/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
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
      const response = await fetch('/api/cost-optimization/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          simulationInput,
        }),
      });
      const data = await response.json();
      setPredictions(data.predictions);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/cost-optimization/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeframe: selectedTimeframe,
          simulationInput,
        }),
      });
      const data = await response.json();
      setPredictions(data.predictions);
      setRecommendations(data.updatedRecommendations);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = {
    labels: predictions.map((p) => p.date),
    datasets: [
      {
        label: 'Predicted Cost',
        data: predictions.map((p) => p.predictedCost),
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
        <h2 className="text-2xl font-bold mb-4">AI Cost Optimization Engine</h2>
        
        {/* Timeframe Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Analysis Timeframe
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

        {/* Simulation Inputs */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Simulation Parameters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Deployments
              </label>
              <input
                type="number"
                value={simulationInput.newDeployments}
                onChange={(e) =>
                  setSimulationInput({
                    ...simulationInput,
                    newDeployments: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Expected Growth (%)
              </label>
              <input
                type="number"
                value={simulationInput.expectedGrowth}
                onChange={(e) =>
                  setSimulationInput({
                    ...simulationInput,
                    expectedGrowth: parseInt(e.target.value),
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Planned Changes
              </label>
              <input
                type="text"
                value={simulationInput.plannedChanges}
                onChange={(e) =>
                  setSimulationInput({
                    ...simulationInput,
                    plannedChanges: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          <button
            onClick={runSimulation}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
          >
            Run Simulation
          </button>
        </div>

        {/* Cost Predictions Chart */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">Cost Predictions</h3>
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
                      Affected Resources:
                    </h5>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {rec.affectedResources.map((resource) => (
                        <span
                          key={resource}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800"
                        >
                          {resource}
                        </span>
                      ))}
                    </div>
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