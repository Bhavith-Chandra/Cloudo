import { useEffect, useState } from 'react';
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
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CostOverviewProps {
  timeRange: string;
  filters: {
    providers: string[];
    departments: string[];
    teams: string[];
    projects: string[];
  };
}

export default function CostOverview({ timeRange, filters }: CostOverviewProps) {
  const [costData, setCostData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCostData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/costs/overview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeRange,
            filters,
          }),
        });
        const data = await response.json();
        setCostData(data);
      } catch (error) {
        console.error('Error fetching cost data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCostData();
  }, [timeRange, filters]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const chartData = {
    labels: costData?.dates || [],
    datasets: [
      {
        label: 'AWS',
        data: costData?.aws || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Azure',
        data: costData?.azure || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'GCP',
        data: costData?.gcp || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Cloud Cost Trends',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: number) => `$${value.toLocaleString()}`,
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Total Cost</h3>
          <p className="text-2xl font-semibold text-gray-900">
            ${costData?.totalCost?.toLocaleString() || '0'}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Cost Change</h3>
          <p
            className={`text-2xl font-semibold ${
              costData?.costChange >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {costData?.costChange >= 0 ? '+' : ''}
            {costData?.costChange?.toFixed(2)}%
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Forecasted Cost</h3>
          <p className="text-2xl font-semibold text-gray-900">
            ${costData?.forecastedCost?.toLocaleString() || '0'}
          </p>
        </div>
      </div>
      <div className="h-96">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
} 