import React, { useState } from 'react';

interface SidebarProps {
  selectedView: string;
  onViewChange: (view: string) => void;
  selectedFilters: {
    providers: string[];
    departments: string[];
    teams: string[];
    projects: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export default function Sidebar({
  selectedView,
  onViewChange,
  selectedFilters,
  onFiltersChange,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (category: string, value: string) => {
    const newFilters = { ...selectedFilters };
    const index = newFilters[category].indexOf(value);
    if (index === -1) {
      newFilters[category].push(value);
    } else {
      newFilters[category].splice(index, 1);
    }
    onFiltersChange(newFilters);
  };

  return (
    <div className="lg:w-64 bg-white shadow-lg">
      {/* Mobile menu button */}
      <div className="lg:hidden p-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Sidebar content */}
      <div
        className={`${
          isOpen ? 'block' : 'hidden'
        } lg:block fixed lg:static lg:inset-0 z-20`}
      >
        <div className="p-4 space-y-6">
          {/* View Selection */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">View Type</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  value="technical"
                  checked={selectedView === 'technical'}
                  onChange={(e) => onViewChange(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Technical</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="viewType"
                  value="executive"
                  checked={selectedView === 'executive'}
                  onChange={(e) => onViewChange(e.target.value)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-900">Executive</span>
              </label>
            </div>
          </div>

          {/* Cloud Providers Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Cloud Providers
            </h3>
            <div className="space-y-2">
              {['AWS', 'Azure', 'GCP'].map((provider) => (
                <label key={provider} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.providers.includes(provider)}
                    onChange={() => handleFilterChange('providers', provider)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">{provider}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Departments Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Departments
            </h3>
            <div className="space-y-2">
              {['Engineering', 'Marketing', 'Finance', 'Operations'].map(
                (dept) => (
                  <label key={dept} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.departments.includes(dept)}
                      onChange={() => handleFilterChange('departments', dept)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">{dept}</span>
                  </label>
                )
              )}
            </div>
          </div>

          {/* Teams Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Teams</h3>
            <div className="space-y-2">
              {['Frontend', 'Backend', 'DevOps', 'QA'].map((team) => (
                <label key={team} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFilters.teams.includes(team)}
                    onChange={() => handleFilterChange('teams', team)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">{team}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Projects Filter */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Projects</h3>
            <div className="space-y-2">
              {['Project A', 'Project B', 'Project C', 'Project D'].map(
                (project) => (
                  <label key={project} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedFilters.projects.includes(project)}
                      onChange={() => handleFilterChange('projects', project)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">{project}</span>
                  </label>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 