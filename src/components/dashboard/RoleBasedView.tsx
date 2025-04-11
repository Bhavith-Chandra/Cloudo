import React from 'react';
import CostOverview from './CostOverview';
import CostBreakdown from './CostBreakdown';
import CostTrends from './CostTrends';
import ExportControls from './ExportControls';

interface RoleBasedViewProps {
  timeRange: string;
  filters: {
    providers: string[];
    departments: string[];
    teams: string[];
    projects: string[];
  };
  viewType: 'executive' | 'technical';
}

export const RoleBasedView: React.FC<RoleBasedViewProps> = ({
  timeRange,
  filters,
  viewType
}) => {
  return (
    <div className="space-y-6">
      <CostOverview
        timeRange={timeRange}
        filters={filters}
        viewType={viewType}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CostBreakdown
          timeRange={timeRange}
          filters={filters}
          viewType={viewType}
        />
        <CostTrends
          timeRange={timeRange}
          filters={filters}
          viewType={viewType}
        />
      </div>

      {viewType === 'technical' && (
        <ExportControls
          timeRange={timeRange}
          filters={filters}
        />
      )}
    </div>
  );
}; 