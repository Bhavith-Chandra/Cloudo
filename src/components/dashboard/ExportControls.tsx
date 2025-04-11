import React from 'react';

interface ExportControlsProps {
  timeRange: string;
  filters: {
    providers: string[];
    departments: string[];
    teams: string[];
    projects: string[];
  };
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  timeRange,
  filters
}) => {
  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const response = await fetch('/api/costs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeRange,
          filters,
          format,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cost-report-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Export Data</h3>
      <div className="flex space-x-4">
        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Export PDF
        </button>
        <button
          onClick={() => handleExport('csv')}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}; 