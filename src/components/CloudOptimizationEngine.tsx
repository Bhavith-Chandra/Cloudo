'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CostOverview } from './dashboard/CostOverview';
import { CostBreakdown } from './dashboard/CostBreakdown';
import { CostTrends } from './dashboard/CostTrends';
import { ExportControls } from './dashboard/ExportControls';
import { RoleBasedView } from './dashboard/RoleBasedView';

export const CloudOptimizationEngine: React.FC = () => {
  const { data: session } = useSession();
  const [timeRange, setTimeRange] = useState('7d');
  const [filters, setFilters] = useState({
    providers: ['aws', 'azure', 'gcp'],
    departments: [],
    teams: [],
    projects: []
  });
  const [viewType, setViewType] = useState<'executive' | 'technical'>('executive');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
        </div>
        <RoleBasedView viewType={viewType} onViewTypeChange={setViewType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostOverview
          timeRange={timeRange}
          filters={filters}
          viewType={viewType}
        />
        <CostBreakdown
          timeRange={timeRange}
          filters={filters}
          viewType={viewType}
        />
      </div>

      <CostTrends
        timeRange={timeRange}
        filters={filters}
        viewType={viewType}
      />

      <ExportControls
        timeRange={timeRange}
        filters={filters}
        viewType={viewType}
      />
    </div>
  );
}; 