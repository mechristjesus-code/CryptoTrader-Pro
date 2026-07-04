import DashboardLayout from "@/components/DashboardLayout";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Bell, Webhook } from "lucide-react";

export function AlertsAutomationContent() {
  const [symbol, setSymbol] = useState("BTC");
  const [price, setPrice] = useState("");
  const [alertType, setAlertType] = useState("above");
  const [webhookUrl, setWebhookUrl] = useState("");

  const createPriceAlert = trpc.alerts.createPriceAlert.useMutation();
  const createWebhook = trpc.alerts.createWebhook.useMutation();
  const listAlerts = trpc.alerts.listAlerts.useQuery({ limit: 20, offset: 0 });
  const listWebhooks = trpc.alerts.listWebhooks.useQuery();
  const alertStats = trpc.alerts.getAlertStats.useQuery();

  const handleCreatePriceAlert = async () => {
    if (!symbol || !price) return;
    await createPriceAlert.mutateAsync({
      symbol,
      price: parseFloat(price),
      type: alertType as "above" | "below",
    });
    setPrice("");
    listAlerts.refetch();
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl) return;
    await createWebhook.mutateAsync({
      url: webhookUrl,
      events: ["price_alert", "order_filled", "bot_signal"],
    });
    setWebhookUrl("");
    listWebhooks.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Alert Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.data?.priceAlerts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Indicator Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.data?.indicatorAlerts || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.data?.webhooks || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scheduled Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.data?.scheduledTasks || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Create Alerts & Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle>Create Alerts & Automations</CardTitle>
          <CardDescription>Set up price alerts, webhooks, and scheduled tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="price" className="space-y-4">
            <TabsList>
              <TabsTrigger value="price">Price Alert</TabsTrigger>
              <TabsTrigger value="indicator">Indicator Alert</TabsTrigger>
              <TabsTrigger value="webhook">Webhook</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled Task</TabsTrigger>
            </TabsList>

            <TabsContent value="price" className="space-y-4">
              <p className="text-sm text-gray-600">
                Get notified when a cryptocurrency price goes above or below a specified level.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  placeholder="Symbol (BTC, ETH)"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                />
                <Input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="above">Above</SelectItem>
                    <SelectItem value="below">Below</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreatePriceAlert} disabled={createPriceAlert.isPending}>
                {createPriceAlert.isPending ? "Creating..." : "Create Price Alert"}
              </Button>
            </TabsContent>

            <TabsContent value="indicator" className="space-y-4">
              <p className="text-sm text-gray-600">
                Alert when technical indicators cross specified thresholds.
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Input placeholder="Symbol" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Indicator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsi">RSI</SelectItem>
                    <SelectItem value="macd">MACD</SelectItem>
                    <SelectItem value="bb">Bollinger Bands</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Threshold" />
              </div>
              <Button>Create Indicator Alert</Button>
            </TabsContent>

            <TabsContent value="webhook" className="space-y-4">
              <p className="text-sm text-gray-600">
                Send alerts to external services via webhooks for custom integrations.
              </p>
              <div className="space-y-4">
                <Input
                  placeholder="Webhook URL (https://...)"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Events to trigger:</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked /> Price Alerts
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked /> Order Filled
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked /> Bot Signals
                    </label>
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateWebhook} disabled={createWebhook.isPending}>
                {createWebhook.isPending ? "Creating..." : "Create Webhook"}
              </Button>
            </TabsContent>

            <TabsContent value="scheduled" className="space-y-4">
              <p className="text-sm text-gray-600">
                Automate tasks to run on a schedule (daily, weekly, monthly).
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Task Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portfolio_snapshot">Portfolio Snapshot</SelectItem>
                    <SelectItem value="archive_trades">Archive Trades</SelectItem>
                    <SelectItem value="generate_report">Generate Report</SelectItem>
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button>Create Scheduled Task</Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {listAlerts.data && (
        <Card>
          <CardHeader>
            <CardTitle>Active Alerts</CardTitle>
            <CardDescription>Your price and indicator alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listAlerts.data.priceAlerts?.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium">{alert.symbol}</p>
                    <p className="text-sm text-gray-600">
                      Alert when price goes {alert.type} ${alert.price}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                    Active
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Webhooks */}
      {listWebhooks.data && (
        <Card>
          <CardHeader>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Configured webhook endpoints</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {listWebhooks.data.map((webhook) => (
                <div key={webhook.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <p className="font-medium text-sm break-all">{webhook.url}</p>
                    <p className="text-xs text-gray-600">Secret: {webhook.secret}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    webhook.status === 'active' ? 'bg-green-100 text-green-800' :
                    webhook.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {webhook.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AlertsAutomation() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Alerts & Automation
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Set up price alerts and webhooks</p>
        </div>
        <AlertsAutomationContent />
      </div>
    </DashboardLayout>
  );
}
