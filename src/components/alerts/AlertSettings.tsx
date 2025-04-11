import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AlertSettings {
  channels: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
  thresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  preferences: {
    notifyOnCritical: boolean;
    notifyOnHigh: boolean;
    notifyOnMedium: boolean;
    notifyOnLow: boolean;
  };
}

export default function AlertSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<AlertSettings>({
    channels: {
      email: true,
      slack: false,
      inApp: true,
    },
    thresholds: {
      critical: 1.0,
      high: 0.5,
      medium: 0.3,
      low: 0.2,
    },
    preferences: {
      notifyOnCritical: true,
      notifyOnHigh: true,
      notifyOnMedium: false,
      notifyOnLow: false,
    },
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/alerts/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: AlertSettings) => {
    try {
      const response = await fetch('/api/alerts/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (response.ok) {
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Alert Settings</h2>
      
      {/* Notification Channels */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.channels.email}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  channels: { ...settings.channels, email: e.target.checked },
                });
              }}
              className="mr-2"
            />
            Email Notifications
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.channels.slack}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  channels: { ...settings.channels, slack: e.target.checked },
                });
              }}
              className="mr-2"
            />
            Slack Notifications
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.channels.inApp}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  channels: { ...settings.channels, inApp: e.target.checked },
                });
              }}
              className="mr-2"
            />
            In-App Notifications
          </label>
        </div>
      </div>

      {/* Alert Thresholds */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Alert Thresholds</h3>
        <div className="space-y-4">
          <div>
            <label className="block mb-2">Critical Threshold (%)</label>
            <input
              type="number"
              value={settings.thresholds.critical * 100}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  thresholds: {
                    ...settings.thresholds,
                    critical: parseFloat(e.target.value) / 100,
                  },
                });
              }}
              className="w-full p-2 border rounded"
              min="0"
              max="1000"
              step="1"
            />
          </div>
          <div>
            <label className="block mb-2">High Threshold (%)</label>
            <input
              type="number"
              value={settings.thresholds.high * 100}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  thresholds: {
                    ...settings.thresholds,
                    high: parseFloat(e.target.value) / 100,
                  },
                });
              }}
              className="w-full p-2 border rounded"
              min="0"
              max="1000"
              step="1"
            />
          </div>
          <div>
            <label className="block mb-2">Medium Threshold (%)</label>
            <input
              type="number"
              value={settings.thresholds.medium * 100}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  thresholds: {
                    ...settings.thresholds,
                    medium: parseFloat(e.target.value) / 100,
                  },
                });
              }}
              className="w-full p-2 border rounded"
              min="0"
              max="1000"
              step="1"
            />
          </div>
          <div>
            <label className="block mb-2">Low Threshold (%)</label>
            <input
              type="number"
              value={settings.thresholds.low * 100}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  thresholds: {
                    ...settings.thresholds,
                    low: parseFloat(e.target.value) / 100,
                  },
                });
              }}
              className="w-full p-2 border rounded"
              min="0"
              max="1000"
              step="1"
            />
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.preferences.notifyOnCritical}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    notifyOnCritical: e.target.checked,
                  },
                });
              }}
              className="mr-2"
            />
            Notify on Critical Alerts
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.preferences.notifyOnHigh}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    notifyOnHigh: e.target.checked,
                  },
                });
              }}
              className="mr-2"
            />
            Notify on High Alerts
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.preferences.notifyOnMedium}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    notifyOnMedium: e.target.checked,
                  },
                });
              }}
              className="mr-2"
            />
            Notify on Medium Alerts
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.preferences.notifyOnLow}
              onChange={(e) => {
                updateSettings({
                  ...settings,
                  preferences: {
                    ...settings.preferences,
                    notifyOnLow: e.target.checked,
                  },
                });
              }}
              className="mr-2"
            />
            Notify on Low Alerts
          </label>
        </div>
      </div>
    </div>
  );
} 