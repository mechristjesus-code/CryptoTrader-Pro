import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Eye, EyeOff, Settings, Trash2, Plus } from 'lucide-react';

interface Widget {
  id: string;
  type: 'portfolio' | 'bots' | 'market' | 'opportunities' | 'sentiment' | 'performance';
  title: string;
  visible: boolean;
  size: 'small' | 'medium' | 'large';
}

const DEFAULT_WIDGETS: Widget[] = [
  { id: '1', type: 'portfolio', title: 'Portfolio Value', visible: true, size: 'medium' },
  { id: '2', type: 'bots', title: 'Active Bots', visible: true, size: 'small' },
  { id: '3', type: 'market', title: 'Market Overview', visible: true, size: 'large' },
  { id: '4', type: 'opportunities', title: 'AI Opportunities', visible: true, size: 'medium' },
  { id: '5', type: 'sentiment', title: 'Market Sentiment', visible: true, size: 'small' },
  { id: '6', type: 'performance', title: 'Performance', visible: true, size: 'medium' },
];

export default function DashboardWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [editMode, setEditMode] = useState(false);

  // Fetch data
  const { data: dashboardStats } = trpc.bots.getDashboardStats.useQuery();
  const { data: portfolioMetrics } = trpc.bots.getPortfolioMetrics.useQuery();
  const { data: opportunities } = trpc.aiBot.getOpportunitiesForDashboard.useQuery({ limit: 3 });
  const { data: sentiment } = trpc.aiBot.getMarketSentiment.useQuery();
  const { data: marketOverview } = trpc.market.getOverview.useQuery();

  const toggleWidget = (id: string) => {
    setWidgets(
      widgets.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w))
    );
  };

  const removeWidget = (id: string) => {
    setWidgets(widgets.filter((w) => w.id !== id));
  };

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: Date.now().toString(),
      type,
      title: type.charAt(0).toUpperCase() + type.slice(1),
      visible: true,
      size: 'medium',
    };
    setWidgets([...widgets, newWidget]);
  };

  const renderWidget = (widget: Widget) => {
    if (!widget.visible) return null;

    const sizeClass = {
      small: 'col-span-1',
      medium: 'col-span-1 md:col-span-2',
      large: 'col-span-1 md:col-span-3',
    }[widget.size];

    const baseCard = (
      <Card className={`relative ${editMode ? 'border-dashed border-primary' : ''}`}>
        {editMode && (
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleWidget(widget.id)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeWidget(widget.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
        <CardHeader>
          <CardTitle className="text-base">{widget.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderWidgetContent(widget.type)}
        </CardContent>
      </Card>
    );

    return (
      <div key={widget.id} className={sizeClass}>
        {baseCard}
      </div>
    );
  };

  const renderWidgetContent = (type: Widget['type']) => {
    const stats = dashboardStats?.data;
    const portfolio = portfolioMetrics?.data;

    switch (type) {
      case 'portfolio':
        return (
          <div className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">${portfolio?.totalValue?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today</p>
              <p className={`text-lg font-semibold ${portfolio && portfolio.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolio && portfolio.dayChangePercent >= 0 ? '+' : ''}
                {portfolio?.dayChangePercent?.toFixed(2)}%
              </p>
            </div>
          </div>
        );

      case 'bots':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Active</span>
              <span className="font-bold">{stats?.activeBots || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Total</span>
              <span className="font-bold">{stats?.totalBots || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Win Rate</span>
              <span className="font-bold">{stats?.avgWinRate || '0'}%</span>
            </div>
          </div>
        );

      case 'market':
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">BTC</p>
                <p className="font-semibold">${marketOverview?.data?.btc?.price}</p>
              </div>
              <Badge variant="outline">{marketOverview?.data?.btc?.change24h}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">ETH</p>
                <p className="font-semibold">${marketOverview?.data?.eth?.price}</p>
              </div>
              <Badge variant="outline">{marketOverview?.data?.eth?.change24h}</Badge>
            </div>
          </div>
        );

      case 'opportunities':
        return (
          <div className="space-y-2">
            {opportunities?.data?.slice(0, 3).map((opp: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-2 bg-secondary rounded">
                <span className="text-sm font-medium">{opp.symbol}</span>
                <Badge variant={opp.action === 'buy' ? 'default' : 'secondary'}>
                  {opp.confidence}%
                </Badge>
              </div>
            ))}
          </div>
        );

      case 'sentiment':
        return (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Overall</span>
              <Badge
                variant={
                  sentiment?.data?.overall === 'bullish'
                    ? 'default'
                    : sentiment?.data?.overall === 'bearish'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {sentiment?.data?.overall?.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Score</p>
              <p className="text-lg font-bold">{sentiment?.data?.score?.toFixed(1)}</p>
            </div>
          </div>
        );

      case 'performance':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Realized P&L</span>
              <span className="font-bold text-green-600">${portfolio?.realizedPnL?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Unrealized P&L</span>
              <span className="font-bold text-blue-600">${portfolio?.unrealizedPnL?.toLocaleString() || '0'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Sharpe Ratio</span>
              <span className="font-bold">{portfolio?.sharpeRatio?.toFixed(2)}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Dashboard Widgets</h2>
        <Button
          onClick={() => setEditMode(!editMode)}
          variant={editMode ? 'default' : 'outline'}
        >
          <Settings className="h-4 w-4 mr-2" />
          {editMode ? 'Done Editing' : 'Customize'}
        </Button>
      </div>

      {/* Edit Mode - Add Widgets */}
      {editMode && (
        <Card className="bg-secondary/50">
          <CardHeader>
            <CardTitle className="text-base">Add Widgets</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {['portfolio', 'bots', 'market', 'opportunities', 'sentiment', 'performance'].map(
              (type) => (
                <Button
                  key={type}
                  size="sm"
                  variant="outline"
                  onClick={() => addWidget(type as Widget['type'])}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-max">
        {widgets.map((widget) => renderWidget(widget))}
      </div>
    </div>
  );
}
