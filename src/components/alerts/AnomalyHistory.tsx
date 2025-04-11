import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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

interface Anomaly {
  id: string;
  timestamp: Date;
  provider: string;
  service: string;
  project?: string;
  cost: number;
  expectedCost: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rootCause?: string;
  status: 'active' | 'resolved' | 'ignored';
}

export default function AnomalyHistory() {
  const { data: session } = useSession();
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('30d');

  useEffect(() => {
    fetchAnomalies();
  }, [selectedProvider, selectedService, selectedSeverity, timeRange]);

  const fetchAnomalies = async () => {
    try {
      const response = await fetch(
        `/api/anomalies?provider=${selectedProvider}&service=${selectedService}&severity=${selectedSeverity}&timeRange=${timeRange}`
      );
      const data = await response.json();
      setAnomalies(data);
    } catch (error) {
      console.error('Error fetching anomalies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const chartData = {
    labels: anomalies.map((a) => new Date(a.timestamp).toLocaleDateString()),
    datasets: [
      {
        label: 'Actual Cost',
        data: anomalies.map((a) => a.cost),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Expected Cost',
        data: anomalies.map((a) => a.expectedCost),
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Anomaly History</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cloud Provider
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
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
            Service
          </label>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Services</option>
            <option value="ec2">EC2</option>
            <option value="s3">S3</option>
            <option value="rds">RDS</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Severity
          </label>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Time Range
          </label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Cost Trend Chart */}
      <div className="mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <Line data={chartData} />
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {anomalies.map((anomaly) => (
          <div
            key={anomaly.id}
            className="bg-white p-4 rounded-lg shadow"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium">
                  {anomaly.service} - {anomaly.provider}
                </h3>
                <p className="text-gray-600 mt-1">
                  {anomaly.rootCause || 'No root cause identified'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {new Date(anomaly.timestamp).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  ${anomaly.cost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  Expected: ${anomaly.expectedCost.toLocaleString()}
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(
                    anomaly.severity
                  )}`}
                >
                  {anomaly.severity.toUpperCase()}
                </span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{
                    width: `${Math.min(anomaly.deviation * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Deviation: {(anomaly.deviation * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 