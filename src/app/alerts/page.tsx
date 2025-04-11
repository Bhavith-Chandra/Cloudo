import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import AlertSettings from '@/components/alerts/AlertSettings';
import AnomalyHistory from '@/components/alerts/AnomalyHistory';

export default async function AlertsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Alerts & Anomalies</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Alert Settings</h2>
              <AlertSettings />
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Anomaly History</h2>
              <AnomalyHistory />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 