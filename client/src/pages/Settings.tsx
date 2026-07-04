import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/_core/hooks/useAuth';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Key, Bell, Palette } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: {
      dealCompleted: true,
      lossThreshold: true,
      botError: true,
      marketAlert: true,
    },
    dataRefresh: '5',
    riskLevel: 'medium',
  });

  const handleSaveSettings = () => {
    toast.success('Settings saved successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="api">API Keys</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div>
                  <Label>Default Risk Level</Label>
                  <Select value={settings.riskLevel} onValueChange={(v) => setSettings({...settings, riskLevel: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Refresh Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.dataRefresh}
                    onChange={(e) => setSettings({...settings, dataRefresh: e.target.value})}
                  />
                </div>
                <Button onClick={handleSaveSettings}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Deal Completed</Label>
                    <p className="text-sm text-muted-foreground">Notify when a bot completes a trade</p>
                  </div>
                  <Switch
                    checked={settings.notifications.dealCompleted}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, dealCompleted: v}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Loss Threshold</Label>
                    <p className="text-sm text-muted-foreground">Notify when bot hits loss limit</p>
                  </div>
                  <Switch
                    checked={settings.notifications.lossThreshold}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, lossThreshold: v}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bot Error</Label>
                    <p className="text-sm text-muted-foreground">Notify when a bot encounters an error</p>
                  </div>
                  <Switch
                    checked={settings.notifications.botError}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, botError: v}
                    })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Market Alert</Label>
                    <p className="text-sm text-muted-foreground">Notify on significant market movements</p>
                  </div>
                  <Switch
                    checked={settings.notifications.marketAlert}
                    onCheckedChange={(v) => setSettings({
                      ...settings,
                      notifications: {...settings.notifications, marketAlert: v}
                    })}
                  />
                </div>
                <Button onClick={handleSaveSettings}>Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" /> API Credentials
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>3Commas API Key</Label>
                  <Input type="password" placeholder="••••••••••" />
                </div>
                <div>
                  <Label>Cryptohopper API Key</Label>
                  <Input type="password" placeholder="••••••••••" />
                </div>
                <div>
                  <Label>Kraken API Key</Label>
                  <Input type="password" placeholder="••••••••••" />
                </div>
                <Button onClick={handleSaveSettings}>Update API Keys</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" /> Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Theme</Label>
                  <Select value={settings.theme} onValueChange={(v) => setSettings({...settings, theme: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleSaveSettings}>Save Appearance</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

