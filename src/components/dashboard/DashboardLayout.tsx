import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Sidebar from './Sidebar';
import CostOverview from './CostOverview';
import CostBreakdown from './CostBreakdown';
import CostTrends from './CostTrends';
import ExportControls from './ExportControls';
import RoleBasedView from './RoleBasedView';

export default function DashboardLayout() {
  const { data: session } = useSession();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedView, setSelectedView] = useState('technical');
  const [selectedFilters, setSelectedFilters] = useState({
    providers: ['AWS', 'Azure', 'GCP'],
    departments: [],
    teams: [],
    projects: [],
  });

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <Sidebar
          selectedView={selectedView}
          onViewChange={setSelectedView}
          selectedFilters={selectedFilters}
          onFiltersChange={setSelectedFilters}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 lg:mb-0">
              Multi-Cloud Cost Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <ExportControls />
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">Last Year</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Cost Overview */}
            <div className="lg:col-span-2">
              <CostOverview
                timeRange={selectedTimeRange}
                filters={selectedFilters}
              />
            </div>

            {/* Cost Breakdown */}
            <div className="lg:col-span-1">
              <CostBreakdown
                timeRange={selectedTimeRange}
                filters={selectedFilters}
                viewType={selectedView}
              />
            </div>

            {/* Cost Trends */}
            <div className="lg:col-span-1">
              <CostTrends
                timeRange={selectedTimeRange}
                filters={selectedFilters}
                viewType={selectedView}
              />
            </div>
          </div>

          {/* Role-Based Detailed View */}
          <RoleBasedView
            viewType={selectedView}
            timeRange={selectedTimeRange}
            filters={selectedFilters}
          />
        </main>
      </div>
    </div>
  );
} 