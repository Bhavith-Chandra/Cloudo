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
  Legend
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

interface CostTrendsProps {
  timeRange: string;
  filters: {
    providers: string[];
    departments: string[];
    teams: string[];
    projects: string[];
  };
  viewType: 'executive' | 'technical';
}

export const CostTrends: React.FC<CostTrendsProps> = ({
  timeRange,
  filters,
  viewType
}) => {
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState<any>(null);

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const response = await fetch('/api/costs/trends', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeRange,
            filters,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trend data');
        }

        const data = await response.json();
        setTrendData(data);
      } catch (error) {
        console.error('Error fetching trend data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendData();
  }, [timeRange, filters]);

  if (loading) {
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
    labels: trendData?.dates || [],
    datasets: [
      {
        label: 'AWS',
        data: trendData?.aws || [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Azure',
        data: trendData?.azure || [],
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'GCP',
        data: trendData?.gcp || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
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
        text: 'Cost Trends Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cost ($)',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Line data={chartData} options={options} />
    </div>
  );
}; 