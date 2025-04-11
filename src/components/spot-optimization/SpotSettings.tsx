import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

interface SpotSettings {
  autoApproval: boolean;
  maxRiskTolerance: number;
  minSavingsThreshold: number;
  fallbackStrategy: 'on-demand' | 'reserved' | 'none';
  notificationPreferences: {
    email: boolean;
    slack: boolean;
    webhook: boolean;
  };
  excludedInstanceTypes: string[];
  excludedRegions: string[];
}

export function SpotSettings() {
  const [settings, setSettings] = useState<SpotSettings>({
    autoApproval: false,
    maxRiskTolerance: 50,
    minSavingsThreshold: 20,
    fallbackStrategy: 'on-demand',
    notificationPreferences: {
      email: true,
      slack: false,
      webhook: false,
    },
    excludedInstanceTypes: [],
    excludedRegions: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/spot/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch spot instance settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/spot/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Spot Instance Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="autoApproval">Auto-approval</Label>
              <Switch
                id="autoApproval"
                checked={settings.autoApproval}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, autoApproval: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxRiskTolerance">Maximum Risk Tolerance (%)</Label>
              <Input
                id="maxRiskTolerance"
                type="number"
                value={settings.maxRiskTolerance}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxRiskTolerance: Number(e.target.value),
                  })
                }
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minSavingsThreshold">
                Minimum Savings Threshold (%)
              </Label>
              <Input
                id="minSavingsThreshold"
                type="number"
                value={settings.minSavingsThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minSavingsThreshold: Number(e.target.value),
                  })
                }
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fallbackStrategy">Fallback Strategy</Label>
              <Select
                value={settings.fallbackStrategy}
                onValueChange={(value: 'on-demand' | 'reserved' | 'none') =>
                  setSettings({ ...settings, fallbackStrategy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fallback strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on-demand">On-Demand Instances</SelectItem>
                  <SelectItem value="reserved">Reserved Instances</SelectItem>
                  <SelectItem value="none">No Fallback</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notification Preferences</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email"
                    checked={settings.notificationPreferences.email}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notificationPreferences: {
                          ...settings.notificationPreferences,
                          email: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="slack"
                    checked={settings.notificationPreferences.slack}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notificationPreferences: {
                          ...settings.notificationPreferences,
                          slack: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="slack">Slack</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="webhook"
                    checked={settings.notificationPreferences.webhook}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notificationPreferences: {
                          ...settings.notificationPreferences,
                          webhook: checked,
                        },
                      })
                    }
                  />
                  <Label htmlFor="webhook">Webhook</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="excludedInstanceTypes">
                Excluded Instance Types (comma-separated)
              </Label>
              <Input
                id="excludedInstanceTypes"
                value={settings.excludedInstanceTypes.join(', ')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    excludedInstanceTypes: e.target.value
                      .split(',')
                      .map((type) => type.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., t3.large, m5.xlarge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excludedRegions">
                Excluded Regions (comma-separated)
              </Label>
              <Input
                id="excludedRegions"
                value={settings.excludedRegions.join(', ')}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    excludedRegions: e.target.value
                      .split(',')
                      .map((region) => region.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., us-east-1, eu-west-1"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 