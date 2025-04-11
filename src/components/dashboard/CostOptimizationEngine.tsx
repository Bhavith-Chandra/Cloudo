import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import DashboardLayout from './DashboardLayout';

export default function CostOptimizationEngine() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session) {
      setIsLoading(false);
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return <DashboardLayout />;
} 